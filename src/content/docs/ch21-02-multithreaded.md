---
title: 21.2. 从单线程到多线程服务器
---

目前，服务器将依次处理每个请求，这意味着它在第一个连接处理完成之前不会处理第二个连接。如果服务器收到越来越多的请求，这种串行执行将变得越来越不理想。如果服务器收到一个需要很长时间才能处理的请求，后续请求将不得不等待，直到长时间请求完成，即使新请求可以快速处理。我们需要修复这个问题，但首先让我们看看这个问题的实际表现。

## 模拟慢速请求

我们将看看处理缓慢的请求如何影响对我们当前服务器实现的其他请求。清单 21-10 实现了对 */sleep* 的处理，使用模拟的慢速响应，这将导致服务器在响应之前休眠五秒钟。

**清单 21-10**：通过休眠五秒钟来模拟慢速请求

```rust
use std::{
    fs,
    io::{BufReader, prelude::*},
    net::{TcpListener, TcpStream},
    thread,
    time::Duration,
};

fn main() {
    let listener = TcpListener::bind("127.0.0.1:7878").unwrap();

    for stream in listener.incoming() {
        let stream = stream.unwrap();

        handle_connection(stream);
    }
}

fn handle_connection(mut stream: TcpStream) {
    let buf_reader = BufReader::new(&stream);
    let request_line = buf_reader.lines().next().unwrap().unwrap();

    let (status_line, filename) = match &request_line[..] {
        "GET / HTTP/1.1" => ("HTTP/1.1 200 OK", "hello.html"),
        "GET /sleep HTTP/1.1" => {
            thread::sleep(Duration::from_secs(5));
            ("HTTP/1.1 200 OK", "hello.html")
        }
        _ => ("HTTP/1.1 404 NOT FOUND", "404.html"),
    };

    let contents = fs::read_to_string(filename).unwrap();
    let length = contents.len();

    let response =
        format!("{status_line}\r\nContent-Length: {length}\r\n\r\n{contents}");

    stream.write_all(response.as_bytes()).unwrap();
}
```

我们现在从 `if` 切换到了 `match`，因为我们有三种情况。我们需要显式匹配 `request_line` 的切片来针对字符串字面值进行模式匹配；`match` 不像相等方法那样自动进行引用和解引用。

第一个分支与清单 21-9 中的 `if` 块相同。第二个分支匹配对 */sleep* 的请求。当接收到该请求时，服务器将在渲染成功的 HTML 页面之前休眠五秒钟。第三个分支与清单 21-9 中的 `else` 块相同。

你可以看到我们的服务器有多么原始：真正的库会以更简洁的方式处理多个请求的识别！

使用 `cargo run` 启动服务器。然后，打开两个浏览器窗口：一个用于 *http://127.0.0.1:7878*，另一个用于 *http://127.0.0.1:7878/sleep*。如果你像以前那样几次输入 */* URI，你会看到它快速响应。但是如果你输入 */sleep* 然后加载 */*，你会看到 */* 等待，直到 `sleep` 休眠完它的整整五秒钟才加载。

我们可以使用多种技术来避免请求在慢速请求后面积压，包括像我们在第 17 章中使用的那样使用 async；我们将要实现的是线程池。

## 使用线程池提高吞吐量

*线程池* 是一组已生成并准备好处理任务的线程。当程序收到新任务时，它会将线程池中的一个线程分配给该任务，该线程将处理该任务。线程池中的剩余线程可用于处理第一个线程正在处理时进入的任何其他任务。当第一个线程完成处理其任务时，它将返回到空闲线程池，准备处理新任务。线程池允许你并发处理连接，提高服务器的吞吐量。

我们将线程池中的线程数限制为一个小数目，以保护我们免受 DoS 攻击；如果我们的程序在请求进来时为每个请求创建一个新线程，有人向我们的服务器发出 1000 万个请求可能会通过耗尽我们服务器的所有资源并使请求处理陷入停顿而造成严重破坏。

因此，我们不会生成无限数量的线程，而是让固定数量的线程在池中等待。进来的请求被发送到池中进行处理。池将维护一个传入请求的队列。池中的每个线程都会从这个队列中弹出一个请求，处理该请求，然后向队列请求另一个请求。通过这样的设计，我们可以并发处理最多 *`N`* 个请求，其中 *`N`* 是线程数。如果每个线程都在响应一个长时间运行的请求，后续请求仍然可以在队列中积压，但我们已经达到了在达到这一点之前可以处理的长时间运行请求的数量。

这种技术只是提高 Web 服务器吞吐量的众多方法之一。你可能探索的其他选项包括 fork/join 模型、单线程异步 I/O 模型和多线程异步 I/O 模型。如果你对这个主题感兴趣，你可以阅读更多关于其他解决方案并尝试实现它们；使用像 Rust 这样的低级语言，所有这些选项都是可能的。

在我们开始实现线程池之前，让我们谈谈使用线程池应该是什么样子。当你尝试设计代码时，首先编写客户端接口可以帮助指导你的设计。编写代码的 API，使其按照你想要调用它的方式结构化；然后，在该结构中实现功能，而不是先实现功能再设计公共 API。

类似于我们在第 12 章的项目中使用测试驱动开发一样，我们将在这里使用编译器驱动开发。我们将编写调用我们想要的功能的代码，然后我们将查看编译器的错误来确定接下来应该更改什么以使代码工作。在我们这样做之前，我们将先探索我们不打算用作起点的技术。

### 为每个请求生成一个线程

首先，让我们探索一下如果我们的代码确实为每个连接创建一个新线程，它会是什么样子。如前所述，这不是我们的最终计划，因为可能存在生成无限数量线程的问题，但它是首先让多线程服务器工作的一个起点。然后，我们将添加线程池作为改进，对比这两个解决方案会更容易。

清单 21-11 展示了在 `for` 循环中生成一个新线程来处理每个流所需对 `main` 的更改。

**清单 21-11**：为每个流生成一个新线程

```rust
use std::{
    fs,
    io::{BufReader, prelude::*},
    net::{TcpListener, TcpStream},
    thread,
    time::Duration,
};

fn main() {
    let listener = TcpListener::bind("127.0.0.1:7878").unwrap();

    for stream in listener.incoming() {
        let stream = stream.unwrap();

        thread::spawn(|| {
            handle_connection(stream);
        });
    }
}

fn handle_connection(mut stream: TcpStream) {
    let buf_reader = BufReader::new(&stream);
    let request_line = buf_reader.lines().next().unwrap().unwrap();

    let (status_line, filename) = match &request_line[..] {
        "GET / HTTP/1.1" => ("HTTP/1.1 200 OK", "hello.html"),
        "GET /sleep HTTP/1.1" => {
            thread::sleep(Duration::from_secs(5));
            ("HTTP/1.1 200 OK", "hello.html")
        }
        _ => ("HTTP/1.1 404 NOT FOUND", "404.html"),
    };

    let contents = fs::read_to_string(filename).unwrap();
    let length = contents.len();

    let response =
        format!("{status_line}\r\nContent-Length: {length}\r\n\r\n{contents}");

    stream.write_all(response.as_bytes()).unwrap();
}
```

如你在第 16 章中学到的，`thread::spawn` 将创建一个新线程，然后在新线程中运行闭包中的代码。如果你运行这段代码并在浏览器中加载 */sleep*，然后在另外两个浏览器标签页中加载 */*，你确实会看到对 */* 的请求不必等待 */sleep* 完成。然而，正如我们提到的，这最终会压垮系统，因为你将无限制地创建新线程。

你可能还记得第 17 章，这正是 async 和 await 真正发光的情况！在我们构建线程池时请记住这一点，并思考使用 async 时情况会有何不同或相同。

### 创建有限数量的线程

我们希望我们的线程池以类似、熟悉的方式工作，以便从线程切换到线程池不需要对使用我们 API 的代码进行大的更改。清单 21-12 展示了我们想要使用的 `ThreadPool` 结构体的假设接口，而不是 `thread::spawn`。

**清单 21-12**：我们理想的 `ThreadPool` 接口

```rust
use std::{
    fs,
    io::{BufReader, prelude::*},
    net::{TcpListener, TcpStream},
    thread,
    time::Duration,
};

fn main() {
    let listener = TcpListener::bind("127.0.0.1:7878").unwrap();
    let pool = ThreadPool::new(4);

    for stream in listener.incoming() {
        let stream = stream.unwrap();

        pool.execute(|| {
            handle_connection(stream);
        });
    }
}

fn handle_connection(mut stream: TcpStream) {
    let buf_reader = BufReader::new(&stream);
    let request_line = buf_reader.lines().next().unwrap().unwrap();

    let (status_line, filename) = match &request_line[..] {
        "GET / HTTP/1.1" => ("HTTP/1.1 200 OK", "hello.html"),
        "GET /sleep HTTP/1.1" => {
            thread::sleep(Duration::from_secs(5));
            ("HTTP/1.1 200 OK", "hello.html")
        }
        _ => ("HTTP/1.1 404 NOT FOUND", "404.html"),
    };

    let contents = fs::read_to_string(filename).unwrap();
    let length = contents.len();

    let response =
        format!("{status_line}\r\nContent-Length: {length}\r\n\r\n{contents}");

    stream.write_all(response.as_bytes()).unwrap();
}
```

我们使用 `ThreadPool::new` 创建一个具有可配置线程数的新线程池，在本例中是四个。然后，在 `for` 循环中，`pool.execute` 具有与 `thread::spawn` 类似的接口，因为它接受一个池应该为每个流运行的闭包。我们需要实现 `pool.execute`，使其接受闭包并将其交给池中的一个线程运行。这段代码还不能编译，但我们会尝试编译，以便编译器可以指导我们如何修复它。

### 使用编译器驱动开发构建 `ThreadPool`

在 *src/main.rs* 中进行清单 21-12 中的更改，然后让我们使用 `cargo check` 的编译器错误来驱动我们的开发。这是我们得到的第一个错误：

```console
$ cargo check
    Checking hello v0.1.0 (file:///projects/hello)
error[E0433]: failed to resolve: use of undeclared crate or module `ThreadPool`
  --> src/main.rs:10:16
   |
10 |     let pool = ThreadPool::new(4);
   |                ^^^^^^^^^^^^^^^ use of undeclared crate or module `ThreadPool`

For more information about this error, try `rustc --explain E0433`.
error: could not compile `hello` (bin "hello") due to 1 previous error
```

太好了！这个错误告诉我们需要一个 `ThreadPool` 类型或模块，所以我们现在来构建它。我们的 `ThreadPool` 实现将独立于我们的 Web 服务器所做的工作类型。所以，让我们将 `hello` crate 从二进制 crate 切换为库 crate 来保存我们的 `ThreadPool` 实现。在我们切换到库 crate 后，我们还可以将单独的线程池库用于我们想要使用线程池完成的任何工作，而不仅仅是用于提供 Web 请求。

创建一个 *src/lib.rs* 文件，包含以下内容，这是目前我们可以拥有的最简单的 `ThreadPool` 结构体定义：

```rust
pub struct ThreadPool;
```

然后，编辑 *main.rs* 文件，通过将以下代码添加到 *src/main.rs* 的顶部，从库 crate 将 `ThreadPool` 引入作用域：

```rust
use hello::ThreadPool;
```

这段代码仍然无法工作，但让我们再次检查它以获得我们需要解决的下一个错误：

```console
$ cargo check
    Checking hello v0.1.0 (file:///projects/hello)
error[E0599]: no function or associated item named `new` found for struct `ThreadPool` in the current scope
  --> src/main.rs:12:28
   |
12 |     let pool = ThreadPool::new(4);
   |                            ^^^ function or associated item not found in `ThreadPool`

For more information about this error, try `rustc --explain E0599`.
error: could not compile `hello` (bin "hello") due to 1 previous error
```

这个错误表明接下来我们需要为 `ThreadPool` 创建一个名为 `new` 的关联函数。我们还知道 `new` 需要有一个参数，可以接受 `4` 作为参数，并且应该返回一个 `ThreadPool` 实例。让我们实现最简单的 `new` 函数，它将具有以下特征：

```rust
pub struct ThreadPool;

impl ThreadPool {
    pub fn new(size: usize) -> ThreadPool {
        ThreadPool
    }
}
```

我们选择 `usize` 作为 `size` 参数的类型，因为我们知道负数线程没有意义。我们还知道我们将在线程集合中使用这个 `4` 作为元素的数量，这就是 `usize` 类型的用途，如第 3 章的[整数类型][integer-types]一节所述。

让我们再次检查代码：

```console
$ cargo check
    Checking hello v0.1.0 (file:///projects/hello)
error[E0599]: no method named `execute` found for struct `ThreadPool` in the current scope
  --> src/main.rs:17:14
   |
17 |         pool.execute(|| {
   |              ^^^^^^^ method not found in `ThreadPool`

For more information about this error, try `rustc --explain E0599`.
error: could not compile `hello` (bin "hello")) due to 1 previous error
```

现在错误发生是因为我们在 `ThreadPool` 上没有 `execute` 方法。回想一下在[创建有限数量的线程](#创建有限数量的线程)一节中，我们决定我们的线程池应该有一个类似于 `thread::spawn` 的接口。此外，我们将实现 `execute` 函数，使其接受给定的闭包并将其交给池中的一个空闲线程运行。

我们将在 `ThreadPool` 上定义 `execute` 方法，以接受闭包作为参数。回想一下在第 13 章的[将捕获的值移出闭包][moving-out-of-closures]一节中，我们可以使用三种不同的 trait 接受闭包作为参数：`Fn`、`FnMut` 和 `FnOnce`。我们需要决定在这里使用哪种闭包。我们知道我们最终会做类似于标准库 `thread::spawn` 实现的事情，因此我们可以查看 `thread::spawn` 的签名对其参数有什么约束。文档向我们展示了以下内容：

```rust
pub fn spawn<F, T>(f: F) -> JoinHandle<T>
    where
        F: FnOnce() -> T,
        F: Send + 'static,
        T: Send + 'static,
```

这里的 `F` 类型参数是我们关心的；`T` 类型参数与返回值相关，我们不关心它。我们可以看到 `spawn` 在 `F` 上使用 `FnOnce` 作为 trait bound。这可能也是我们要的，因为我们最终会将 `execute` 中得到的参数传递给 `spawn`。我们可以进一步确信 `FnOnce` 是我们想要使用的 trait，因为运行请求的线程只会执行该请求的闭包一次，这与 `FnOnce` 中的 `Once` 相匹配。

`F` 类型参数还有 trait bound `Send` 和生命周期 bound `'static`，这些在我们的情况下很有用：我们需要 `Send` 将闭包从一个线程传输到另一个线程，需要 `'static` 因为我们不知道线程执行需要多长时间。让我们在 `ThreadPool` 上创建一个 `execute` 方法，它将接受具有这些约束的泛型参数类型 `F`：

```rust
pub struct ThreadPool;

impl ThreadPool {
    pub fn new(size: usize) -> ThreadPool {
        ThreadPool
    }

    pub fn execute<F>(&self, f: F)
    where
        F: FnOnce() + Send + 'static,
    {
    }
}
```

我们仍然在 `FnOnce` 后面使用 `()`，因为这个 `FnOnce` 表示一个不带参数并返回单元类型 `()` 的闭包。就像函数定义一样，可以从签名中省略返回类型，但即使我们没有参数，我们仍然需要括号。

这又是 `execute` 方法的最简单实现：它什么都不做，但我们只是试图让我们的代码编译。让我们再次检查它：

```console
$ cargo check
    Checking hello v0.1.0 (file:///projects/hello)
    Finished dev [unoptimized + debuginfo] target(s) in 0.32s
```

它编译了！但请注意，如果你尝试 `cargo run` 并在浏览器中发出请求，你会在浏览器中看到我们在本章开头看到的错误。我们的库实际上还没有调用传递给 `execute` 的闭包！

> 注意：关于具有严格编译器的语言（如 Haskell 和 Rust），你可能会听到一句俗语是"如果代码编译了，它就能工作"。但这句话并非普遍正确。我们的项目编译了，但它绝对什么都不做！如果我们正在构建一个真正的、完整的项目，这将是一个很好的时机来开始编写单元测试，以检查代码编译了 *并且* 具有我们想要的行为。

考虑一下：如果我们要执行一个 future 而不是闭包，这里会有什么不同？

#### 在 `new` 中验证线程数量

我们没有对 `new` 和 `execute` 的参数做任何事情。让我们用我们想要的行为来实现这些函数的主体。首先，让我们想想 `new`。之前我们为 `size` 参数选择了一个无符号类型，因为具有负数个线程的池没有意义。然而，具有零个线程的池也没有意义，但零是一个完全有效的 `usize`。我们将在返回 `ThreadPool` 实例之前添加代码来检查 `size` 是否大于零，如果接收到零，我们将使用 `assert!` 宏让程序 panic，如清单 21-13 所示。

**清单 21-13**：如果 `size` 为零，实现 `ThreadPool::new` 以 panic

```rust
pub struct ThreadPool;

impl ThreadPool {
    /// Create a new ThreadPool.
    ///
    /// The size is the number of threads in the pool.
    ///
    /// # Panics
    ///
    /// The `new` function will panic if the size is zero.
    pub fn new(size: usize) -> ThreadPool {
        assert!(size > 0);

        ThreadPool
    }

    pub fn execute<F>(&self, f: F)
    where
        F: FnOnce() + Send + 'static,
    {
    }
}
```

我们还为 `ThreadPool` 添加了一些文档注释。请注意，我们遵循了良好的文档实践，通过添加一个部分来指出我们的函数可能在什么情况下 panic，如第 14 章所述。尝试运行 `cargo doc --open` 并点击 `ThreadPool` 结构体，看看为 `new` 生成的文档是什么样子！

除了像我们现在这样添加 `assert!` 宏，我们可以将 `new` 改为 `build` 并返回一个 `Result`，就像我们在清单 12-9 的 I/O 项目中使用 `Config::build` 一样。但我们在这种情况下决定，尝试创建没有任何线程的线程池应该是一个不可恢复的错误。如果你雄心勃勃，尝试编写一个名为 `build` 的函数，具有以下签名，以与 `new` 函数进行比较：

```rust
pub fn build(size: usize) -> Result<ThreadPool, PoolCreationError> {
```

#### 创建存储线程的空间

现在我们有了知道在池中存储有效线程数量的方法，我们可以在返回结构体之前在 `ThreadPool` 结构体中创建这些线程并存储它们。但是我们如何"存储"一个线程呢？让我们再看一下 `thread::spawn` 签名：

```rust
pub fn spawn<F, T>(f: F) -> JoinHandle<T>
    where
        F: FnOnce() -> T,
        F: Send + 'static,
        T: Send + 'static,
```

`spawn` 函数返回一个 `JoinHandle<T>`，其中 `T` 是闭包返回的类型。让我们也尝试使用 `JoinHandle`，看看会发生什么。在我们的情况下，传递给线程池的闭包将处理连接并且不返回任何内容，因此 `T` 将是单元类型 `()`。

清单 21-14 中的代码可以编译，但它还没有创建任何线程。我们更改了 `ThreadPool` 的定义，使其保存一个 `thread::JoinHandle<()>` 实例的向量，用 `size` 的容量初始化向量，设置一个 `for` 循环来运行一些代码来创建线程，并返回一个包含它们的 `ThreadPool` 实例。

**清单 21-14**：为 `ThreadPool` 创建一个向量来保存线程

```rust
use std::thread;

pub struct ThreadPool {
    threads: Vec<thread::JoinHandle<()>>,
}

impl ThreadPool {
    /// Create a new ThreadPool.
    ///
    /// The size is the number of threads in the pool.
    ///
    /// # Panics
    ///
    /// The `new` function will panic if the size is zero.
    pub fn new(size: usize) -> ThreadPool {
        assert!(size > 0);

        let mut threads = Vec::with_capacity(size);

        for _ in 0..size {
            // create some threads and store them in the vector
        }

        ThreadPool { threads }
    }

    pub fn execute<F>(&self, f: F)
    where
        F: FnOnce() + Send + 'static,
    {
    }
}
```

我们在库 crate 中将 `std::thread` 引入作用域，因为我们在 `ThreadPool` 中向量的项目中使用 `thread::JoinHandle` 作为类型。

一旦接收到有效的大小，我们的 `ThreadPool` 就会创建一个可以保存 `size` 个元素的新向量。`with_capacity` 函数执行与 `Vec::new` 相同的任务，但有一个重要的区别：它预先在向量中分配空间。因为我们知道需要在向量中存储 `size` 个元素，所以预先进行这种分配比使用在插入元素时调整自身大小的 `Vec::new` 稍微更有效率。

当你再次运行 `cargo check` 时，它应该会成功。

#### 从 `ThreadPool` 向线程发送代码

我们在清单 21-14 的 `for` 循环中留下了一条关于创建线程的注释。在这里，我们将看看我们实际上是如何创建线程的。标准库提供了 `thread::spawn` 作为创建线程的一种方式，`thread::spawn` 期望在创建线程时立即获得线程应该运行的一些代码。然而，在我们的情况下，我们想要创建线程并让它们 *等待* 我们稍后发送的代码。标准库的线程实现不包含任何这样做的方法；我们必须手动实现它。

我们将通过引入 `ThreadPool` 和线程之间的新数据结构来实现这种行为，该结构将管理这种新行为。我们将这个数据结构称为 *Worker*，这是池化实现中的一个常用术语。`Worker` 获取需要运行的代码并在其线程中运行代码。

想象一下在餐厅厨房工作的人员：工人们等待顾客下的订单进来，然后他们负责接收这些订单并完成它们。

我们不再在线程池中存储 `JoinHandle<()>` 实例的向量，而是存储 `Worker` 结构体的实例。每个 `Worker` 将存储一个 `JoinHandle<()>` 实例。然后，我们将在 `Worker` 上实现一个方法，该方法将接受一个要运行的闭包代码并将其发送到已经在运行的线程执行。我们还将给每个 `Worker` 一个 `id`，以便我们在日志记录或调试时能够区分池中不同 `Worker` 实例。

以下是我们创建 `ThreadPool` 时将发生的新过程。我们将在以这种方式设置好 `Worker` 之后实现将闭包发送到线程的代码：

1. 定义一个 `Worker` 结构体，它保存一个 `id` 和一个 `JoinHandle<()>`。
2. 将 `ThreadPool` 更改为保存一个 `Worker` 实例的向量。
3. 定义一个 `Worker::new` 函数，它接受一个 `id` 数字并返回一个 `Worker` 实例，该实例保存 `id` 和一个用空闭包生成的线程。
4. 在 `ThreadPool::new` 中，使用 `for` 循环计数器生成一个 `id`，用该 `id` 创建一个新的 `Worker`，并将 `Worker` 存储在向量中。

如果你想挑战一下，在查看清单 21-15 中的代码之前，尝试自己实现这些更改。

准备好了吗？这是清单 21-15，展示了进行上述修改的一种方法。

**清单 21-15**：修改 `ThreadPool` 以保存 `Worker` 实例而不是直接保存线程

```rust
use std::thread;

pub struct ThreadPool {
    workers: Vec<Worker>,
}

impl ThreadPool {
    /// Create a new ThreadPool.
    ///
    /// The size is the number of threads in the pool.
    ///
    /// # Panics
    ///
    /// The `new` function will panic if the size is zero.
    pub fn new(size: usize) -> ThreadPool {
        assert!(size > 0);

        let mut workers = Vec::with_capacity(size);

        for id in 0..size {
            workers.push(Worker::new(id));
        }

        ThreadPool { workers }
    }

    pub fn execute<F>(&self, f: F)
    where
        F: FnOnce() + Send + 'static,
    {
    }
}

struct Worker {
    id: usize,
    thread: thread::JoinHandle<()>,
}

impl Worker {
    fn new(id: usize) -> Worker {
        let thread = thread::spawn(|| {});

        Worker { id, thread }
    }
}
```

我们将 `ThreadPool` 上的字段名从 `threads` 改为 `workers`，因为它现在保存的是 `Worker` 实例而不是 `JoinHandle<()>` 实例。我们在 `for` 循环中使用计数器作为 `Worker::new` 的参数，我们将每个新 `Worker` 存储在名为 `workers` 的向量中。

外部代码（如我们 *src/main.rs* 中的服务器）不需要知道在 `ThreadPool` 中使用 `Worker` 结构体的实现细节，因此我们将 `Worker` 结构体及其 `new` 函数设为私有。`Worker::new` 函数使用我们给它的 `id`，并存储一个通过使用空闭包生成新线程创建的 `JoinHandle<()>` 实例。

> 注意：如果操作系统因为系统资源不足而无法创建线程，`thread::spawn` 将会 panic。这将导致我们的整个服务器 panic，即使某些线程的创建可能成功。为了简单起见，这种行为是可以的，但在生产环境的线程池实现中，你可能会想要使用 [`std::thread::Builder`][builder] 及其返回 `Result` 的 [`spawn`][builder-spawn] 方法。

这段代码将编译并将存储我们指定为 `ThreadPool::new` 参数的数量的 `Worker` 实例。但是我们 *仍然* 没有在 `execute` 中处理我们得到的闭包。让我们看看接下来如何做到这一点。

#### 通过通道向线程发送请求

我们要解决的下一个问题是传递给 `thread::spawn` 的闭包什么都不做。目前，我们在 `execute` 方法中得到我们想要执行的闭包。但我们需要在创建 `ThreadPool` 期间创建每个 `Worker` 时给 `thread::spawn` 一个要运行的闭包。

我们希望我们刚刚创建的 `Worker` 结构体从保存在 `ThreadPool` 中的队列中获取要运行的代码，并将该代码发送到其线程运行。

我们在第 16 章中学到的通道——一种在两个线程之间通信的简单方式——非常适合这个用例。我们将使用一个通道来作为任务的队列，`execute` 会将作业从 `ThreadPool` 发送到 `Worker` 实例，`Worker` 会将作业发送到其线程。以下是计划：

1. `ThreadPool` 将创建一个通道并持有发送者。
2. 每个 `Worker` 将持有接收者。
3. 我们将创建一个新的 `Job` 结构体，它将保存我们想要通过通道发送的闭包。
4. `execute` 方法将通过发送者发送它想要执行的作业。
5. 在其线程中，`Worker` 将循环其接收者并执行它接收到的任何作业的闭包。

让我们从在 `ThreadPool::new` 中创建一个通道并在 `ThreadPool` 实例中保存发送者开始，如清单 21-16 所示。`Job` 结构体现在不保存任何内容，但它将是我们通过通道发送的项目的类型。

**清单 21-16**：修改 `ThreadPool` 以存储传输 `Job` 实例的通道的发送者

```rust
use std::{sync::mpsc, thread};

pub struct ThreadPool {
    workers: Vec<Worker>,
    sender: mpsc::Sender<Job>,
}

struct Job;

impl ThreadPool {
    /// Create a new ThreadPool.
    ///
    /// The size is the number of threads in the pool.
    ///
    /// # Panics
    ///
    /// The `new` function will panic if the size is zero.
    pub fn new(size: usize) -> ThreadPool {
        assert!(size > 0);

        let (sender, receiver) = mpsc::channel();

        let mut workers = Vec::with_capacity(size);

        for id in 0..size {
            workers.push(Worker::new(id));
        }

        ThreadPool { workers, sender }
    }

    pub fn execute<F>(&self, f: F)
    where
        F: FnOnce() + Send + 'static,
    {
    }
}

struct Worker {
    id: usize,
    thread: thread::JoinHandle<()>,
}

impl Worker {
    fn new(id: usize) -> Worker {
        let thread = thread::spawn(|| {});

        Worker { id, thread }
    }
}
```

在 `ThreadPool::new` 中，我们创建新通道并让池持有发送者。这将成功编译。

让我们尝试在创建通道时将接收者传递给每个 `Worker`。我们知道我们想在 `Worker` 实例生成的线程中使用接收者，因此我们将在闭包中引用 `receiver` 参数。清单 21-17 中的代码还不能完全编译。

**清单 21-17**：将接收者传递给每个 `Worker`

```rust
use std::{sync::mpsc, thread};

pub struct ThreadPool {
    workers: Vec<Worker>,
    sender: mpsc::Sender<Job>,
}

struct Job;

impl ThreadPool {
    /// Create a new ThreadPool.
    ///
    /// The size is the number of threads in the pool.
    ///
    /// # Panics
    ///
    /// The `new` function will panic if the size is zero.
    pub fn new(size: usize) -> ThreadPool {
        assert!(size > 0);

        let (sender, receiver) = mpsc::channel();

        let mut workers = Vec::with_capacity(size);

        for id in 0..size {
            workers.push(Worker::new(id, receiver));
        }

        ThreadPool { workers, sender }
    }

    pub fn execute<F>(&self, f: F)
    where
        F: FnOnce() + Send + 'static,
    {
    }
}

struct Worker {
    id: usize,
    thread: thread::JoinHandle<()>,
}

impl Worker {
    fn new(id: usize, receiver: mpsc::Receiver<Job>) -> Worker {
        let thread = thread::spawn(|| {
            receiver;
        });

        Worker { id, thread }
    }
}
```

我们做了一些小的、直接的更改：我们将接收者传入 `Worker::new`，然后在闭包中使用它。

当我们尝试检查这段代码时，我们得到这个错误：

```console
$ cargo check
    Checking hello v0.1.0 (file:///projects/hello)
error[E0382]: use of moved value: `receiver`
    --> src/lib.rs:26:42
     |
21   |         let (sender, receiver) = mpsc::channel();
     |                      -------- move occurs because `receiver` has type `std::sync::mpsc::Receiver<Job>`, which does not implement the `Copy` trait
...
26   |             workers.push(Worker::new(id, receiver));
     |                                          ^^^^^^^^ value moved here, in previous iteration of loop
     |
help: consider cloning the value if the performance cost is acceptable
     |
26   |             workers.push(Worker::new(id, receiver.clone()));
     |                                          ++++++++

For more information about this, try `rustc --explain E0382`.
error: could not compile `hello` (lib) due to 1 previous error
```

代码试图将 `receiver` 传递给多个 `Worker` 实例。这行不通，正如你从第 16 章回忆的那样：Rust 提供的通道实现是多 *生产者*、单 *消费者*。这意味着我们不能简单地克隆通道的消费端来修复这段代码。我们也不想将消息多次发送给多个消费者；我们想要一个消息列表，有多个 `Worker` 实例，以便每个消息只被处理一次。

此外，从通道队列中取出作业涉及修改 `receiver`，因此线程需要一种安全的方式来共享和修改 `receiver`；否则，我们可能会遇到竞争条件（如第 16 章所述）。

回想一下第 16 章讨论的线程安全智能指针：要跨多个线程共享所有权并允许线程修改值，我们需要使用 `Arc<Mutex<T>>`。`Arc` 类型将让多个 `Worker` 实例拥有接收者，`Mutex` 将确保一次只有一个 `Worker` 从接收者获取作业。清单 21-18 展示了我们需要做的更改。

**清单 21-18**：使用 `Arc` 和 `Mutex` 在 `Worker` 实例之间共享接收者

```rust
use std::{
    sync::{Arc, Mutex, mpsc},
    thread,
};

pub struct ThreadPool {
    workers: Vec<Worker>,
    sender: mpsc::Sender<Job>,
}

struct Job;

impl ThreadPool {
    /// Create a new ThreadPool.
    ///
    /// The size is the number of threads in the pool.
    ///
    /// # Panics
    ///
    /// The `new` function will panic if the size is zero.
    pub fn new(size: usize) -> ThreadPool {
        assert!(size > 0);

        let (sender, receiver) = mpsc::channel();

        let receiver = Arc::new(Mutex::new(receiver));

        let mut workers = Vec::with_capacity(size);

        for id in 0..size {
            workers.push(Worker::new(id, Arc::clone(&receiver)));
        }

        ThreadPool { workers, sender }
    }

    pub fn execute<F>(&self, f: F)
    where
        F: FnOnce() + Send + 'static,
    {
    }
}

struct Worker {
    id: usize,
    thread: thread::JoinHandle<()>,
}

impl Worker {
    fn new(id: usize, receiver: Arc<Mutex<mpsc::Receiver<Job>>>) -> Worker {
        let thread = thread::spawn(|| {
            receiver;
        });

        Worker { id, thread }
    }
}
```

在 `ThreadPool::new` 中，我们将接收者放入 `Arc` 和 `Mutex` 中。对于每个新 `Worker`，我们克隆 `Arc` 以增加引用计数，以便 `Worker` 实例可以共享接收者的所有权。

通过这些更改，代码编译了！我们正在取得进展！

#### 实现 `execute` 方法

让我们最终在 `ThreadPool` 上实现 `execute` 方法。我们还将把 `Job` 从结构体更改为类型别名，用于保存 `execute` 接收的闭包类型的 trait 对象。如第 20 章的[类型同义词和类型别名][type-aliases]一节所述，类型别名允许我们使长类型更短以便于使用。看看清单 21-19。

**清单 21-19**：创建一个 `Job` 类型别名，用于保存每个闭包的 `Box`，然后将作业发送到通道

```rust
use std::{
    sync::{Arc, Mutex, mpsc},
    thread,
};

pub struct ThreadPool {
    workers: Vec<Worker>,
    sender: mpsc::Sender<Job>,
}

type Job = Box<dyn FnOnce() + Send + 'static>;

impl ThreadPool {
    /// Create a new ThreadPool.
    ///
    /// The size is the number of threads in the pool.
    ///
    /// # Panics
    ///
    /// The `new` function will panic if the size is zero.
    pub fn new(size: usize) -> ThreadPool {
        assert!(size > 0);

        let (sender, receiver) = mpsc::channel();

        let receiver = Arc::new(Mutex::new(receiver));

        let mut workers = Vec::with_capacity(size);

        for id in 0..size {
            workers.push(Worker::new(id, Arc::clone(&receiver)));
        }

        ThreadPool { workers, sender }
    }

    pub fn execute<F>(&self, f: F)
    where
        F: FnOnce() + Send + 'static,
    {
        let job = Box::new(f);

        self.sender.send(job).unwrap();
    }
}

struct Worker {
    id: usize,
    thread: thread::JoinHandle<()>,
}

impl Worker {
    fn new(id: usize, receiver: Arc<Mutex<mpsc::Receiver<Job>>>) -> Worker {
        let thread = thread::spawn(|| {
            receiver;
        });

        Worker { id, thread }
    }
}
```

使用我们在 `execute` 中得到的闭包创建一个新的 `Job` 实例后，我们将该作业发送到通道的发送端。我们在发送失败的情况下对 `send` 调用 `unwrap`。这可能发生，例如，如果我们停止所有线程执行，意味着接收端已停止接收新消息。目前，我们无法停止线程执行：只要池存在，我们的线程就会继续执行。我们使用 `unwrap` 的原因是我们知道失败情况不会发生，但编译器不知道。

但我们还没有完成！在 `Worker` 中，传递给 `thread::spawn` 的闭包仍然只是 *引用* 通道的接收端。相反，我们需要闭包永远循环，向通道的接收端请求作业并在获得作业时运行它。让我们将清单 21-20 中所示的更改应用到 `Worker::new`。

**清单 21-20**：在 `Worker` 实例的线程中接收和执行作业

```rust
use std::{
    sync::{Arc, Mutex, mpsc},
    thread,
};

pub struct ThreadPool {
    workers: Vec<Worker>,
    sender: mpsc::Sender<Job>,
}

type Job = Box<dyn FnOnce() + Send + 'static>;

impl ThreadPool {
    /// Create a new ThreadPool.
    ///
    /// The size is the number of threads in the pool.
    ///
    /// # Panics
    ///
    /// The `new` function will panic if the size is zero.
    pub fn new(size: usize) -> ThreadPool {
        assert!(size > 0);

        let (sender, receiver) = mpsc::channel();

        let receiver = Arc::new(Mutex::new(receiver));

        let mut workers = Vec::with_capacity(size);

        for id in 0..size {
            workers.push(Worker::new(id, Arc::clone(&receiver)));
        }

        ThreadPool { workers, sender }
    }

    pub fn execute<F>(&self, f: F)
    where
        F: FnOnce() + Send + 'static,
    {
        let job = Box::new(f);

        self.sender.send(job).unwrap();
    }
}

struct Worker {
    id: usize,
    thread: thread::JoinHandle<()>,
}

impl Worker {
    fn new(id: usize, receiver: Arc<Mutex<mpsc::Receiver<Job>>>) -> Worker {
        let thread = thread::spawn(move || {
            loop {
                let job = receiver.lock().unwrap().recv().unwrap();

                println!("Worker {id} got a job; executing.");

                job();
            }
        });

        Worker { id, thread }
    }
}
```

在这里，我们首先对 `receiver` 调用 `lock` 以获取互斥锁，然后我们对任何错误调用 `unwrap` 以 panic。如果互斥锁处于 *被污染* 状态，获取锁可能会失败，这可能在其他线程持有锁时 panic 而不是释放锁时发生。在这种情况下，调用 `unwrap` 让这个线程 panic 是正确的做法。随意将这个 `unwrap` 改为一个对你有意义的错误消息的 `expect`。

如果我们获得了互斥锁上的锁，我们调用 `recv` 以从通道接收一个 `Job`。最终的 `unwrap` 也绕过这里的任何错误，如果持有发送者的线程已经关闭，可能会发生这些错误，类似于如果接收者关闭，`send` 方法返回 `Err` 的方式。

对 `recv` 的调用会阻塞，因此如果还没有作业，当前线程将等待直到作业可用。`Mutex<T>` 确保一次只有一个 `Worker` 线程试图请求作业。

我们的线程池现在处于工作状态！给它一个 `cargo run` 并发一些请求：

```console
$ cargo run
   Compiling hello v0.1.0 (file:///projects/hello)
warning: field `workers` is never read
 --> src/lib.rs:7:5
  |
6 | pub struct ThreadPool {
  |            ---------- field in this struct
7 |     workers: Vec<Worker>,
  |     ^^^^^^^
  |
  = note: `#[warn(dead_code)]` on by default

warning: fields `id` and `thread` are never read
  --> src/lib.rs:48:5
   |
47 | struct Worker {
   |        ------ fields in this struct
48 |     id: usize,
   |     ^^
49 |     thread: thread::JoinHandle<()>,
   |        ^^^^^^

warning: `hello` (lib) generated 2 warnings
    Finished `dev` profile [unoptimized + debuginfo] target(s) in 4.91s
     Running `target/debug/hello`
Worker 0 got a job; executing.
Worker 2 got a job; executing.
Worker 1 got a job; executing.
Worker 3 got a job; executing.
Worker 0 got a job; executing.
Worker 2 got a job; executing.
Worker 1 got a job; executing.
Worker 3 got a job; executing.
Worker 0 got a job; executing.
Worker 2 got a job; executing.
```

成功！我们现在有一个线程池，异步执行连接。创建的线程永远不会超过四个，因此如果服务器收到很多请求，我们的系统不会过载。如果我们向 */sleep* 发出请求，服务器将能够通过让另一个线程运行它们来服务其他请求。

> 注意：如果你在多个浏览器窗口中同时打开 */sleep*，它们可能会在五秒钟的间隔内一个接一个地加载。一些 Web 浏览器出于缓存原因顺序执行同一请求的多个实例。这种限制不是由我们的 Web 服务器引起的。

现在是暂停并考虑如果我们使用 futures 而不是闭包来完成要做的工作，清单 21-18、21-19 和 21-20 中的代码会有什么不同的好时机。什么类型会改变？方法签名会有什么不同（如果有的话）？代码的哪些部分会保持不变？

在学习了第 17 章和第 19 章的 `while let` 循环之后，你可能想知道为什么我们没有像清单 21-21 所示那样编写 `Worker` 线程代码。

**清单 21-21**：使用 `while let` 的 `Worker::new` 的替代实现

```rust
use std::{
    sync::{Arc, Mutex, mpsc},
    thread,
};

pub struct ThreadPool {
    workers: Vec<Worker>,
    sender: mpsc::Sender<Job>,
}

type Job = Box<dyn FnOnce() + Send + 'static>;

impl ThreadPool {
    /// Create a new ThreadPool.
    ///
    /// The size is the number of threads in the pool.
    ///
    /// # Panics
    ///
    /// The `new` function will panic if the size is zero.
    pub fn new(size: usize) -> ThreadPool {
        assert!(size > 0);

        let (sender, receiver) = mpsc::channel();

        let receiver = Arc::new(Mutex::new(receiver));

        let mut workers = Vec::with_capacity(size);

        for id in 0..size {
            workers.push(Worker::new(id, Arc::clone(&receiver)));
        }

        ThreadPool { workers, sender }
    }

    pub fn execute<F>(&self, f: F)
    where
        F: FnOnce() + Send + 'static,
    {
        let job = Box::new(f);

        self.sender.send(job).unwrap();
    }
}

struct Worker {
    id: usize,
    thread: thread::JoinHandle<()>,
}

impl Worker {
    fn new(id: usize, receiver: Arc<Mutex<mpsc::Receiver<Job>>>) -> Worker {
        let thread = thread::spawn(move || {
            while let Ok(job) = receiver.lock().unwrap().recv() {
                println!("Worker {id} got a job; executing.");

                job();
            }
        });

        Worker { id, thread }
    }
}
```

这段代码可以编译和运行，但不会产生期望的线程行为：慢速请求仍然会导致其他请求等待被处理。原因有点微妙：`Mutex` 结构体没有公共的 `unlock` 方法，因为锁的所有权基于 `lock` 方法返回的 `LockResult<MutexGuard<T>>` 中 `MutexGuard<T>` 的生命周期。在编译时，借用检查器可以强制执行规则，即除非我们持有锁，否则不能访问由 `Mutex` 保护的资源。然而，如果我们不注意 `MutexGuard<T>` 的生命周期，这种实现也可能导致锁被持有超过预期的时间。

清单 21-20 中使用 `let job = receiver.lock().unwrap().recv().unwrap();` 的代码之所以有效，是因为使用 `let`，等号右侧表达式中使用的任何临时值在 `let` 语句结束时立即被丢弃。然而，`while let`（和 `if let` 和 `match`）直到关联块结束时才丢弃临时值。在清单 21-21 中，锁在对 `job()` 的调用期间保持持有，意味着其他 `Worker` 实例无法接收作业。

[type-aliases]: /rust-book/ch20-03-advanced-types#类型同义词和类型别名
[integer-types]: /rust-book/ch03-02-data-types#整数类型
[moving-out-of-closures]: /rust-book/ch13-01-closures#将捕获的值移出闭包
[builder]: https://doc.rust-lang.org/std/thread/struct.Builder.html
[builder-spawn]: https://doc.rust-lang.org/std/thread/struct.Builder.html#method.spawn