---
title: 使用线程同时运行代码
---

在大多数当前操作系统中，已执行程序的代码在  _进程_  中运行，操作系统将同时管理多个进程。在程序内部，你还可以有独立运行的部分。运行这些独立部分的功能称为  _线程_ 。例如，Web 服务器可以有多个线程，以便它可以同时响应多个请求。

将程序中的计算拆分为多个线程以同时运行多个任务可以提高性能，但它也增加了复杂性。因为线程可以同时运行，对于不同线程上代码各部分运行的顺序没有固有的保证。这可能导致问题，例如：

- 竞争条件，线程以不一致的顺序访问数据或资源
- 死锁，两个线程相互等待，阻止两个线程继续
- 仅在某些情况下发生的错误，难以可靠地复现和修复

Rust 试图减轻使用线程的负面影响，但在多线程上下文中编程仍然需要仔细思考，并且需要与单线程程序不同的代码结构。

编程语言以几种不同的方式实现线程，许多操作系统提供编程语言可以调用的 API 来创建新线程。Rust 标准库使用线程实现的 _1:1_ 模型，即程序每个语言线程使用一个操作系统线程。有些 crate 实现了线程的其他模型，对 1:1 模型做出不同的权衡。（Rust 的异步系统，我们将在下一章看到，也提供了另一种并发方法。）

### 使用 `spawn` 创建新线程

要创建新线程，我们调用 `thread::spawn` 函数并向它传递一个闭包（我们在第13章讨论过闭包），其中包含我们想要在新线程中运行的代码。清单 16-1 中的示例从主线程打印一些文本，从新生成的线程打印其他文本。

**清单 16-1**：创建一个新线程，在主线程打印其他内容时打印一个东西

```rust
use std::thread;
use std::time::Duration;

fn main() {
    thread::spawn(|| {
        for i in 1..10 {
            println!("hi number {i} from the spawned thread!");
            thread::sleep(Duration::from_millis(1));
        }
    });

    for i in 1..5 {
        println!("hi number {i} from the main thread!");
        thread::sleep(Duration::from_millis(1));
    }
}
```

注意，当 Rust 程序的主线程完成时，所有生成的线程都会被关闭，无论它们是否已完成运行。此程序的输出可能每次都有点不同，但它看起来类似于以下内容：

```text
hi number 1 from the main thread!
hi number 1 from the spawned thread!
hi number 2 from the main thread!
hi number 2 from the spawned thread!
hi number 3 from the main thread!
hi number 3 from the spawned thread!
hi number 4 from the main thread!
hi number 4 from the spawned thread!
hi number 5 from the spawned thread!
```

对 `thread::sleep` 的调用强制线程停止执行一小段时间，允许另一个线程运行。线程可能会轮流执行，但这不能保证：它取决于操作系统如何调度线程。在这次运行中，主线程先打印，即使生成线程中的打印语句在代码中先出现。而且即使我们告诉生成线程打印到 `i` 为 `9`，它在主线程关闭之前只打印到 `5`。

如果你运行此代码并且只看到主线程的输出，或者没有看到任何重叠，请尝试增加范围中的数字，为操作系统在线程之间切换创造更多机会。

### 等待所有线程完成

清单 16-1 中的代码不仅由于主线程结束而大部分时候过早停止生成线程，而且因为对线程运行顺序没有保证，我们也不能保证生成线程会运行！

我们可以通过将 `thread::spawn` 的返回值保存在变量中来解决生成线程不运行或过早结束的问题。`thread::spawn` 的返回类型是 `JoinHandle<T>`。`JoinHandle<T>` 是一个拥有的值，当我们在其上调用 `join` 方法时，它将等待其线程完成。清单 16-2 展示了如何使用我们在清单 16-1 中创建的线程的 `JoinHandle<T>`，以及如何调用 `join` 以确保生成线程在 `main` 退出之前完成。

**清单 16-2**：从 `thread::spawn` 保存 `JoinHandle<T>` 以确保线程运行到完成

```rust
use std::thread;
use std::time::Duration;

fn main() {
    let handle = thread::spawn(|| {
        for i in 1..10 {
            println!("hi number {i} from the spawned thread!");
            thread::sleep(Duration::from_millis(1));
        }
    });

    for i in 1..5 {
        println!("hi number {i} from the main thread!");
        thread::sleep(Duration::from_millis(1));
    }

    handle.join().unwrap();
}
```

在句柄上调用 `join` 会阻塞当前运行的线程，直到句柄表示的线程终止。_阻塞_ 线程意味着该线程被阻止执行工作或退出。因为我们将对 `join` 的调用放在主线程的 `for` 循环之后，运行清单 16-2 应该会产生类似于以下的输出：

```text
hi number 1 from the main thread!
hi number 2 from the main thread!
hi number 1 from the spawned thread!
hi number 3 from the main thread!
hi number 2 from the spawned thread!
hi number 4 from the main thread!
hi number 3 from the spawned thread!
hi number 4 from the spawned thread!
hi number 5 from the spawned thread!
hi number 6 from the spawned thread!
hi number 7 from the spawned thread!
hi number 8 from the spawned thread!
hi number 9 from the spawned thread!
```

两个线程继续交替，但主线程因为调用 `handle.join()` 而等待，直到生成线程完成才结束。

但让我们看看当我们将 `handle.join()` 移到 `main` 中的 `for` 循环之前会发生什么，像这样：

```rust
use std::thread;
use std::time::Duration;

fn main() {
    let handle = thread::spawn(|| {
        for i in 1..10 {
            println!("hi number {i} from the spawned thread!");
            thread::sleep(Duration::from_millis(1));
        }
    });

    handle.join().unwrap();

    for i in 1..5 {
        println!("hi number {i} from the main thread!");
        thread::sleep(Duration::from_millis(1));
    }
}
```

主线程将等待生成线程完成，然后运行它的 `for` 循环，因此输出将不再交错，如下所示：

```text
hi number 1 from the spawned thread!
hi number 2 from the spawned thread!
hi number 3 from the spawned thread!
hi number 4 from the spawned thread!
hi number 5 from the spawned thread!
hi number 6 from the spawned thread!
hi number 7 from the spawned thread!
hi number 8 from the spawned thread!
hi number 9 from the spawned thread!
hi number 1 from the main thread!
hi number 2 from the main thread!
hi number 3 from the main thread!
hi number 4 from the main thread!
```

`join` 的调用位置等小细节会影响线程是否同时运行。

### 在线程中使用 `move` 闭包

我们经常会将 `move` 关键字与传递给 `thread::spawn` 的闭包一起使用，因为闭包将取得它从环境中使用的值的所有权，从而将这些值的所有权从一个线程转移到另一个线程。在 ["捕获引用或移动所有权"][capture] 中，我们在闭包的上下文中讨论了 `move`。现在我们将更多地关注 `move` 和 `thread::spawn` 之间的交互。

注意在清单 16-1 中，我们传递给 `thread::spawn` 的闭包不接受任何参数：我们在生成线程的代码中没有使用主线程中的任何数据。要在生成线程中使用主线程中的数据，生成线程的闭包必须捕获它需要的值。清单 16-3 展示了尝试在主线程中创建一个向量并在生成线程中使用它。然而，这还不会奏效，你马上会看到。

**清单 16-3**：尝试在主线程创建的另一个线程中使用向量

```rust
use std::thread;

fn main() {
    let v = vec![1, 2, 3];

    let handle = thread::spawn(|| {
        println!("Here's a vector: {v:?}");
    });

    handle.join().unwrap();
}
```

闭包使用 `v`，因此它将捕获 `v` 并使其成为闭包环境的一部分。因为 `thread::spawn` 在新线程中运行此闭包，我们应该能够在该新线程中访问 `v`。但当我们编译此示例时，我们得到以下错误：

```console
$ cargo run
   Compiling threads v0.1.0 (file:///projects/threads)
error[E0373]: closure may outlive the current function, but it borrows `v`, which is owned by the current function
 --> src/main.rs:6:32
  |
6 |     let handle = thread::spawn(|| {
  |                                ^^ may outlive borrowed value `v`
7 |         println!("Here's a vector: {v:?}");
  |                                     - `v` is borrowed here
  |
note: function requires argument type to outlive `'static`
 --> src/main.rs:6:18
  |
6 |       let handle = thread::spawn(|| {
  |  __________________^
7 | |         println!("Here's a vector: {v:?}");
8 | |     });
  | |______^
help: to force the closure to take ownership of `v` (and any other referenced variables), use the `move` keyword
  |
6 |     let handle = thread::spawn(move || {
  |                                ++++

For more information about this error, try `rustc --explain E0373`.
error: could not compile `threads` (bin "threads") due to 1 previous error
```

Rust _推断_ 如何捕获 `v`，因为 `println!` 只需要对 `v` 的引用，闭包试图借用 `v`。然而，有一个问题：Rust 无法判断生成线程将运行多长时间，因此它不知道对 `v` 的引用是否始终有效。

清单 16-4 提供了一个更有可能对 `v` 的引用无效的场景。

**清单 16-4**：一个带有闭包的线程，试图从主线程捕获对 `v` 的引用，该主线程释放 `v`

```rust
use std::thread;

fn main() {
    let v = vec![1, 2, 3];

    let handle = thread::spawn(|| {
        println!("Here's a vector: {v:?}");
    });

    drop(v); // oh no!

    handle.join().unwrap();
}
```

如果 Rust 允许我们运行此代码，有可能生成线程会立即被放入后台而完全不运行。生成线程内部有对 `v` 的引用，但主线程立即释放 `v`，使用我们在第15章讨论的 `drop` 函数。然后，当生成线程开始执行时，`v` 不再有效，因此对它的引用也无效。哦不！

要修复清单 16-3 中的编译器错误，我们可以使用错误消息的建议：

```text
help: to force the closure to take ownership of `v` (and any other referenced variables), use the `move` keyword
  |
6 |     let handle = thread::spawn(move || {
  |                                ++++
```

通过在闭包之前添加 `move` 关键字，我们强制闭包取得它正在使用的值的所有权，而不是允许 Rust 推断它应该借用这些值。清单 16-3 中所示的修改，如清单 16-5 所示，将按我们的意图编译并运行。

**清单 16-5**：使用 `move` 关键字强制闭包取得它使用的值的所有权

```rust
use std::thread;

fn main() {
    let v = vec![1, 2, 3];

    let handle = thread::spawn(move || {
        println!("Here's a vector: {v:?}");
    });

    handle.join().unwrap();
}
```

我们可能很想尝试使用 `move` 闭包来修复清单 16-4 中的代码，其中主线程调用 `drop`。然而，这个修复不会奏效，因为清单 16-4 试图做的事情因不同的原因而被禁止。如果我们向闭包添加 `move`，我们会将 `v` 移动到闭包的环境中，我们就不再能在主线程中对其调用 `drop`。相反，我们会得到这个编译器错误：

```console
$ cargo run
   Compiling threads v0.1.0 (file:///projects/threads)
error[E0382]: use of moved value: `v`
 --> src/main.rs:10:10
  |
4 |     let v = vec![1, 2, 3];
  |         - move occurs because `v` has type `Vec<i32>`, which does not implement the `Copy` trait
5 |
6 |     let handle = thread::spawn(move || {
  |                                -------- `v` is moved into the closure here
7 |         println!("Here's a vector: {v:?}");
  |                                     - variable moved due to use in closure
8 |     });
9 |
10 |     drop(v); // oh no!
  |          ^ value used here after move

For more information about this error, try `rustc --explain E0382`.
error: could not compile `threads` (bin "threads") due to 1 previous error
```

Rust 的所有权规则再次拯救了我们！我们从清单 16-3 中的代码得到了一个错误，因为 Rust 是保守的，只是为线程借用 `v`，这意味着主线程理论上可以使生成线程的引用无效。通过告诉 Rust 将 `v` 的所有权移动到生成线程，我们保证主线程不会再使用 `v`。如果我们以相同的方式更改清单 16-4，那么当我们尝试在主线程中使用 `v` 时，我们就违反了所有权规则。`move` 关键字覆盖了 Rust 保守的借用默认；它不允许我们违反所有权规则。

现在我们已经介绍了什么是线程以及线程 API 提供的方法，让我们看看可以使用线程的一些情况。

[capture]: /rust-book/ch13-01-closures/#捕获引用或移动所有权
