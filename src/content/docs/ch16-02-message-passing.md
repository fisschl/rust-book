---
title: 使用消息传递在线程间传输数据
---

确保安全并发的一种越来越流行的方法是消息传递，其中线程或 actor 通过相互发送包含数据的消息进行通信。这里是 [Go 语言文档](https://golang.org/doc/effective_go.html#concurrency) 中的一个口号："不要通过共享内存来通信；相反，通过通信来共享内存。"

为了实现消息发送并发，Rust 的标准库提供了通道的实现。_通道_ 是一种通用的编程概念，数据通过它从一个线程发送到另一个线程。

你可以将编程中的通道想象成单向的水道，如溪流或河流。如果你把橡皮鸭之类的东西放入河流，它会顺流而下到达水道的尽头。

通道有两个部分：发送端和接收端。发送端是你将橡皮鸭放入河流的上游位置，接收端是橡皮鸭最终到达的下游位置。代码的一部分在发送端调用方法来发送你想要发送的数据，另一部分检查接收端以查看到达的消息。如果发送端或接收端被释放，通道就被称为  _关闭_ 。

在这里，我们将逐步编写一个程序，其中一个线程生成值并通过通道发送它们，另一个线程接收这些值并打印出来。我们将使用通道在线程之间发送简单的值来说明这个功能。一旦你熟悉了这个技术，你就可以在任何需要相互通信的线程中使用通道，比如聊天系统或一个系统中，许多线程执行计算的一部分并将部分结果发送给一个线程来聚合结果。

首先，在清单 16-6 中，我们将创建一个通道但不对它做任何操作。注意这还不会编译，因为 Rust 无法判断我们想要通过通道发送什么类型的值。

**清单 16-6**：创建一个通道并将两部分分别赋值给 `tx` 和 `rx`

```rust
use std::sync::mpsc;

fn main() {
    let (tx, rx) = mpsc::channel();
}
```

我们使用 `mpsc::channel` 函数创建一个新通道；`mpsc` 代表 _multiple producer, single consumer_。简而言之，Rust 标准库实现通道的方式意味着一个通道可以有多个产生值的 _发送_ 端，但只有一个消费这些值的 _接收_ 端。想象一下多条溪流汇入一条大河：发送到任何一条溪流的所有东西最终都会在末尾的一条河中。我们现在从单个生产者开始，但当我们让这个示例工作时，我们会添加多个生产者。

`mpsc::channel` 函数返回一个元组，第一个元素是发送端——发送器，第二个元素是接收端——接收器。`tx` 和 `rx` 这两个缩写传统上在许多领域分别用于表示 _transmitter_ 和 _receiver_，因此我们这样命名变量以指示每一端。我们使用带有模式的 `let` 语句来解构元组；我们将在第19章讨论在 `let` 语句中使用模式和解构。现在，要知道以这种方式使用 `let` 语句是提取 `mpsc::channel` 返回的元组各个部分的便捷方法。

让我们将发送端移动到生成的线程中，并让它发送一个字符串，以便生成线程与主线程通信，如清单 16-7 所示。这就像在河流上游放一只橡皮鸭或从一个线程向另一个线程发送聊天消息。

**清单 16-7**：将 `tx` 移动到生成的线程并发送 `"hi"`

```rust
use std::sync::mpsc;
use std::thread;

fn main() {
    let (tx, rx) = mpsc::channel();

    thread::spawn(move || {
        let val = String::from("hi");
        tx.send(val).unwrap();
    });
}
```

同样，我们使用 `thread::spawn` 创建一个新线程，然后使用 `move` 将 `tx` 移入闭包，以便生成线程拥有 `tx`。生成线程需要拥有发送器才能通过通道发送消息。

发送器有一个 `send` 方法，它接受我们想要发送的值。`send` 方法返回 `Result<T, E>` 类型，因此如果接收器已经被释放并且没有地方发送值，发送操作将返回错误。在这个例子中，我们在出错时调用 `unwrap` 来 panic。但在实际应用程序中，我们会正确处理它：返回第9章来回顾正确的错误处理策略。

在清单 16-8 中，我们将在主线程中从接收器获取值。这就像从河流尽头的水中获取橡皮鸭或接收聊天消息。

**清单 16-8**：在主线程中接收值 `"hi"` 并打印它

```rust
use std::sync::mpsc;
use std::thread;

fn main() {
    let (tx, rx) = mpsc::channel();

    thread::spawn(move || {
        let val = String::from("hi");
        tx.send(val).unwrap();
    });

    let received = rx.recv().unwrap();
    println!("Got: {received}");
}
```

接收器有两个有用的方法：`recv` 和 `try_recv`。我们使用的是 `recv`，是 _receive_ 的缩写，它会阻塞主线程的执行并等待直到有值通过通道发送下来。一旦有值被发送，`recv` 就会在 `Result<T, E>` 中返回它。当发送器关闭时，`recv` 将返回一个错误以表示不再有值到来。

`try_recv` 方法不会阻塞，而是会立即返回一个 `Result<T, E>`：如果有消息可用则返回持有消息的 `Ok` 值，如果这次没有消息则返回 `Err` 值。如果此线程在等待消息时有其他工作要做，使用 `try_recv` 很有用：我们可以编写一个循环，每隔一段时间调用 `try_recv`，如果有消息就处理它，否则做一会儿其他工作再检查。

我们在这个例子中使用 `recv` 是为了简单；主线程除了等待消息没有其他工作要做，因此阻塞主线程是合适的。

当我们运行清单 16-8 中的代码时，我们会看到从主线程打印的值：

```text
Got: hi
```

完美！

### 通过通道转移所有权

所有权规则在消息发送中起着至关重要的作用，因为它们帮助你编写安全的并发代码。防止并发编程中的错误是在整个 Rust 程序中考虑所有权的优势。让我们做一个实验来展示通道和所有权如何协同工作以防止问题：我们将在生成线程中尝试在通过通道发送 `val` 值 _之后_ 使用它。尝试编译清单 16-9 中的代码，看看为什么不允许这段代码。

**清单 16-9**：尝试在通过通道发送 `val` 后使用它

```rust
use std::sync::mpsc;
use std::thread;

fn main() {
    let (tx, rx) = mpsc::channel();

    thread::spawn(move || {
        let val = String::from("hi");
        tx.send(val).unwrap();
        println!("val is {val}");
    });

    let received = rx.recv().unwrap();
    println!("Got: {received}");
}
```

在这里，我们在通过 `tx.send` 将 `val` 发送到通道后尝试打印 `val`。允许这样做将是一个坏主意：一旦值被发送到另一个线程，该线程可能会在我们尝试再次使用该值之前修改或释放它。潜在的，另一个线程的修改可能由于不一致或不存在的数据而导致错误或意外结果。然而，如果我们尝试编译清单 16-9 中的代码，Rust 会给出一个错误：

```console
$ cargo run
   Compiling message-passing v0.1.0 (file:///projects/message-passing)
error[E0382]: borrow of moved value: `val`
  --> src/main.rs:10:27
   |
 8 |         let val = String::from("hi");
   |             --- move occurs because `val` has type `String`, which does not implement the `Copy` trait
 9 |         tx.send(val).unwrap();
   |                 --- value moved here
10 |         println!("val is {val}");
   |                           ^^^ value borrowed here after move
   |
   = note: this error originates in the macro `$crate::format_args_nl` which comes from the expansion of the macro `println` (in Nightly builds, run with -Z macro-backtrace for more info)

For more information about this error, try `rustc --explain E0382`.
error: could not compile `message-passing` (bin "message-passing") due to 1 previous error
```

我们的并发错误导致了编译时错误。`send` 函数取得其参数的所有权，当值被移动时，接收器取得它的所有权。这阻止了我们在发送后意外再次使用该值；所有权系统检查一切都正常。

### 发送多个值

清单 16-8 中的代码编译并运行了，但它没有清楚地向我们展示两个独立的线程正在通过通道相互通信。

在清单 16-10 中，我们做了一些修改，将证明清单 16-8 中的代码正在并发运行：生成线程现在将发送多条消息，并在每条消息之间暂停一秒。

**清单 16-10**：发送多条消息并在每条之间暂停

```rust
use std::sync::mpsc;
use std::thread;
use std::time::Duration;

fn main() {
    let (tx, rx) = mpsc::channel();

    thread::spawn(move || {
        let vals = vec![
            String::from("hi"),
            String::from("from"),
            String::from("the"),
            String::from("thread"),
        ];

        for val in vals {
            tx.send(val).unwrap();
            thread::sleep(Duration::from_secs(1));
        }
    });

    for received in rx {
        println!("Got: {received}");
    }
}
```

这次，生成线程有一个字符串向量，我们想要发送到主线程。我们迭代它们，逐个发送，并通过调用 `thread::sleep` 函数并在每条消息之间暂停一秒，使用 `Duration` 值。

在主线程中，我们不再显式调用 `recv` 函数：相反，我们将 `rx` 视为迭代器。对于接收到的每个值，我们打印它。当通道关闭时，迭代将结束。

运行清单 16-10 中的代码时，你应该会看到以下输出，每行之间有一秒的暂停：

```text
Got: hi
Got: from
Got: the
Got: thread
```

因为主线程的 `for` 循环中没有任何暂停或延迟的代码，我们可以知道主线程正在等待接收来自生成线程的值。

### 创建多个生产者

之前我们提到 `mpsc` 是 _multiple producer, single consumer_ 的缩写。让我们使用 `mpsc` 并扩展清单 16-10 中的代码，创建多个线程，它们都向同一个接收器发送值。我们可以通过克隆发送器来做到这一点，如清单 16-11 所示。

**清单 16-11**：从多个生产者发送多条消息

```rust
use std::sync::mpsc;
use std::thread;
use std::time::Duration;

fn main() {
    let (tx, rx) = mpsc::channel();

    let tx1 = tx.clone();
    thread::spawn(move || {
        let vals = vec![
            String::from("hi"),
            String::from("from"),
            String::from("the"),
            String::from("thread"),
        ];

        for val in vals {
            tx1.send(val).unwrap();
            thread::sleep(Duration::from_secs(1));
        }
    });

    thread::spawn(move || {
        let vals = vec![
            String::from("more"),
            String::from("messages"),
            String::from("for"),
            String::from("you"),
        ];

        for val in vals {
            tx.send(val).unwrap();
            thread::sleep(Duration::from_secs(1));
        }
    });

    for received in rx {
        println!("Got: {received}");
    }
}
```

这次，在创建第一个生成线程之前，我们在发送器上调用 `clone`。这将给我们一个新的发送器，我们可以传递给第一个生成线程。我们将原始发送器传递给第二个生成线程。这给了我们两个线程，每个都向一个接收器发送不同的消息。

运行代码时，你的输出应该看起来像这样：

```text
Got: hi
Got: more
Got: from
Got: messages
Got: for
Got: the
Got: thread
Got: you
```

你可能会看到不同的顺序，具体取决于你的系统。这就是并发既有趣又困难的地方。如果你尝试使用 `thread::sleep`，在不同的线程中给它不同的值，每次运行都会更加不确定，每次都会创建不同的输出。

现在我们已经了解了通道是如何工作的，让我们看看另一种并发方法。
