---
title: 17.2. 使用 Async 实现并发
---

在本节中，我们将把 async 应用于我们在第16章中使用线程处理的一些相同并发挑战。因为我们已经在那里讨论了很多关键思想，所以在本节中，我们将重点介绍线程和 futures 之间的区别。

在很多情况下，使用 async 处理并发的 API 与使用线程的 API 非常相似。在其他情况下，它们最终会有很大的不同。即使 API 在线程和 async 之间*看起来*相似，它们通常也有不同的行为——而且它们几乎总是有不同的性能特征。

### 使用 `spawn_task` 创建新任务

我们在第16章[使用 `spawn` 创建新线程部分][ch16-01]处理的第一个操作是在两个单独的线程上计数。让我们使用 async 来做同样的事情。`trpl` crate 提供了一个 `spawn_task` 函数，它看起来非常类似于 `thread::spawn` API，以及一个 `thread::sleep` API 的异步版本 `sleep` 函数。我们可以将它们一起使用来实现计数示例，如清单 17-6 所示。

**清单 17-6**：创建一个新任务来打印一件事，同时主任务打印其他内容

```rust
fn main() {
    trpl::block_on(async {
        let handle = trpl::spawn_task(async {
            for i in 1..=5 {
                println!("hi number {i} from the spawned task!");
                trpl::sleep(std::time::Duration::from_millis(500)).await;
            }
        });
        
        for i in 1..=5 {
            println!("hi number {i} from the main task!");
            trpl::sleep(std::time::Duration::from_millis(500)).await;
        }
    });
}
```

作为起点，我们用 `trpl::block_on` 设置我们的 `main` 函数，这样我们的顶级函数可以是异步的。

> 注意：从本章的这一点开始，每个示例都将包含这个与 `trpl::block_on` 完全相同的包装代码在 `main` 中，所以我们经常会跳过它，就像我们对 `main` 做的那样。记住在你的代码中包含它！

然后我们在该代码块中编写两个循环，每个循环包含一个 `trpl::sleep` 调用，它在发送下一条消息之前等待半秒钟（500 毫秒）。我们将一个循环放在 `trpl::spawn_task` 的主体中，另一个放在顶级 `for` 循环中。我们还在 `sleep` 调用后添加了一个 `await`。

这段代码的行为与基于线程的实现类似——包括当你运行它时，你可能会在终端中看到消息以不同的顺序出现：

```text
hi number 1 from the spawned task!
hi number 1 from the main task!
hi number 2 from the main task!
hi number 2 from the spawned task!
hi number 3 from the main task!
hi number 3 from the spawned task!
hi number 4 from the main task!
hi number 4 from the spawned task!
hi number 5 from the main task!
```

这个版本在主异步代码块中的 `for` 循环完成时就停止了，因为 `spawn_task` 生成的任务在 `main` 函数结束时关闭。如果你想让它一直运行到任务完成，你需要使用一个 join handle 来等待第一个任务完成。使用线程时，我们使用 `join` 方法来"阻塞"直到线程运行完成。在清单 17-7 中，我们可以使用 `await` 来做同样的事情，因为任务句柄本身是一个 future。它的 `Output` 类型是一个 `Result`，所以我们在等待它之后还要解包它。

**清单 17-7**：使用 `await` 和 join handle 来运行任务到完成

```rust
fn main() {
    trpl::block_on(async {
        let handle = trpl::spawn_task(async {
            for i in 1..=10 {
                println!("hi number {i} from the spawned task!");
                trpl::sleep(std::time::Duration::from_millis(500)).await;
            }
        });
        
        for i in 1..=5 {
            println!("hi number {i} from the main task!");
            trpl::sleep(std::time::Duration::from_millis(500)).await;
        }
        
        handle.await.unwrap();
    });
}
```

这个更新的版本会一直运行到*两个*循环都完成：

```text
hi number 1 from the spawned task!
hi number 1 from the main task!
hi number 2 from the main task!
hi number 2 from the spawned task!
hi number 3 from the main task!
hi number 3 from the spawned task!
hi number 4 from the main task!
hi number 4 from the spawned task!
hi number 5 from the main task!
hi number 6 from the spawned task!
hi number 7 from the spawned task!
hi number 8 from the spawned task!
hi number 9 from the spawned task!
hi number 10 from the spawned task!
```

到目前为止，看起来 async 和线程给我们提供了类似的结果，只是语法不同：使用 `await` 而不是在 join handle 上调用 `join`，以及等待 `sleep` 调用。

更大的区别是我们不需要生成另一个操作系统线程来做到这一点。事实上，我们甚至不需要在这里生成一个任务。因为 async 代码块编译成匿名的 futures，我们可以将每个循环放在一个 async 代码块中，并让运行时使用 `trpl::join` 函数将它们两个都运行到完成。

在第16章[等待所有线程完成部分][ch16-01-join]部分，我们展示了如何使用调用 `std::thread::spawn` 时返回的 `JoinHandle` 类型上的 `join` 方法。`trpl::join` 函数类似，但用于 futures。当你给它两个 futures 时，它会产生一个单一的新 future，其输出是一个元组，包含你传入的每个 future 在它们都*完成*后的输出。因此，在清单 17-8 中，我们使用 `trpl::join` 来等待 `fut1` 和 `fut2` 都完成。我们不等待 `fut1` 和 `fut2` 本身，而是等待由 `trpl::join` 产生的新 future。我们忽略输出，因为它只是一个包含两个单元值的元组。

**清单 17-8**：使用 `trpl::join` 等待两个匿名 futures

```rust
fn main() {
    trpl::block_on(async {
        let fut1 = async {
            for i in 1..=5 {
                println!("hi number {i} from the first task!");
                trpl::sleep(std::time::Duration::from_millis(500)).await;
            }
        };
        
        let fut2 = async {
            for i in 1..=10 {
                println!("hi number {i} from the second task!");
                trpl::sleep(std::time::Duration::from_millis(500)).await;
            }
        };
        
        trpl::join(fut1, fut2).await;
    });
}
```

当我们运行这个时，我们看到两个 futures 都运行到完成：

```text
hi number 1 from the first task!
hi number 1 from the second task!
hi number 2 from the first task!
hi number 2 from the second task!
hi number 3 from the first task!
hi number 3 from the second task!
hi number 4 from the first task!
hi number 4 from the second task!
hi number 5 from the first task!
hi number 6 from the second task!
hi number 7 from the second task!
hi number 8 from the second task!
hi number 9 from the second task!
hi number 10 from the second task!
```

现在，你每次都会看到完全相同的顺序，这与我们在清单 17-7 中使用线程和 `trpl::spawn_task` 时看到的非常不同。这是因为 `trpl::join` 函数是*公平*的，意味着它平等地检查每个 future，在它们之间交替，如果一个准备好了，就绝不让另一个抢先。使用线程时，操作系统决定检查哪个线程以及让它运行多长时间。使用 async Rust 时，运行时决定检查哪个任务。（实际上，细节变得复杂，因为 async 运行时可能会在底层使用操作系统线程作为其管理并发方式的一部分，所以保证公平性对运行时来说可能是更多的工作——但这是可能的！）运行时不必为任何给定的操作保证公平性，它们通常提供不同的 API 让你选择是否想要公平性。

尝试这些等待 futures 的变体，看看它们做了什么：

- 从任一个或两个循环周围移除 async 代码块。
- 在定义每个 async 代码块后立即等待它。
- 只将第一个循环包装在 async 代码块中，并在第二个循环体之后等待产生的 future。

作为一个额外的挑战，看看你是否能在运行代码*之前*弄清楚每种情况下的输出会是什么！

### 使用消息传递在两个任务之间发送数据

在 futures 之间共享数据也会很熟悉：我们将再次使用消息传递，但这次使用 async 版本的类型和函数。我们将采取与第16章[在线程之间传递数据部分][ch16-02]稍微不同的路径，以说明基于线程和基于 futures 的并发之间的一些关键区别。在清单 17-9 中，我们将从一个单一的 async 代码块开始——*而不是*像生成单独线程那样生成一个单独的任务。

**清单 17-9**：创建一个异步通道并将两半分配给 `tx` 和 `rx`

```rust
fn main() {
    trpl::block_on(async {
        let (tx, mut rx) = trpl::channel();
        
        tx.send(()).unwrap();
        
        let value = rx.recv().await.unwrap();
        println!("received: {:?}", value);
    });
}
```

在这里，我们使用 `trpl::channel`，这是我们在第16章与线程一起使用的多生产者、单消费者通道 API 的异步版本。异步版本的 API 与基于线程的版本只有一点点不同：它使用可变的而不是不可变的接收者 `rx`，而且它的 `recv` 方法产生一个我们需要等待的 future，而不是直接产生值。现在我们可以从发送者向接收者发送消息了。注意我们不需要生成一个单独的线程甚至一个任务；我们只需要等待 `rx.recv` 调用。

`std::mpsc::channel` 中的同步 `Receiver::recv` 方法会阻塞直到它收到消息。`trpl::Receiver::recv` 方法不会阻塞，因为它是异步的。它不会阻塞，而是将控制权交还给运行时，直到收到消息或通道的发送端关闭。相比之下，我们不等待 `send` 调用，因为它不会阻塞。它不需要阻塞，因为我们发送消息的通道是无界的。

> 注意：因为所有这个异步代码都在一个传递给 `trpl::block_on` 调用的 async 代码块中运行，其中的所有内容都可以避免阻塞。然而，代码*外部*的代码会阻塞在 `block_on` 函数返回上。这就是 `trpl::block_on` 函数的全部意义：它让你*选择*在哪里阻塞一些异步代码，从而在哪里在同步和异步代码之间转换。

注意关于这个例子的两件事。首先，消息会立即到达。其次，尽管我们在这里使用了一个 future，但还没有并发。清单中的一切都是顺序发生的，就像没有 futures 参与一样。

让我们通过在它们之间发送一系列消息并休眠来解决第一部分，如清单 17-10 所示。

**清单 17-10**：通过异步通道发送和接收多条消息，并在每条消息之间用 `await` 休眠

```rust
fn main() {
    trpl::block_on(async {
        let (tx, mut rx) = trpl::channel();
        
        let vals = vec!["hi", "from", "the", "future"];
        
        for val in vals {
            tx.send(val).unwrap();
            trpl::sleep(std::time::Duration::from_millis(500)).await;
        }
        
        while let Some(value) = rx.recv().await {
            println!("received: {}", value);
        }
    });
}
```

除了发送消息外，我们还需要接收它们。在这种情况下，因为我们知道有多少消息要进来，我们可以手动调用 `rx.recv().await` 四次。在现实世界中，不过，我们通常会等待一些*未知*数量的消息，所以我们需要继续等待，直到我们确定没有更多的消息。

在清单 16-10 中，我们使用 `for` 循环来处理从同步通道接收的所有项目。然而，Rust 目前还没有办法用*异步产生*的一系列项目来使用 `for` 循环，所以我们需要使用一个我们以前没见过的循环：`while let` 条件循环。这是我们在第6章[使用 `if let` 和 `let...else` 进行简洁控制流部分][ch06-03]看到的 `if let` 结构的循环版本。只要它指定的模式继续匹配值，循环就会继续执行。

`rx.recv` 调用产生一个 future，我们等待它。运行时会暂停 future 直到它准备好。一旦消息到达，future 将解析为 `Some(message)`，次数与消息到达的次数一样多。当通道关闭时，无论*任何*消息是否已经到达，future 都会解析为 `None` 以表明没有更多的值，因此我们应该停止轮询——也就是说，停止等待。

`while let` 循环将所有这些联系在一起。如果调用 `rx.recv().await` 的结果是 `Some(message)`，我们就可以访问消息并可以在循环体中使用它，就像我们可以用 `if let` 一样。如果结果是 `None`，循环结束。每次循环完成时，它再次遇到等待点，所以运行时会再次暂停它，直到另一条消息到达。

代码现在成功地发送和接收了所有消息。不幸的是，还有几个问题。首先，消息不是以半秒间隔到达的。它们都是同时到达的，在我们启动程序 2 秒（2,000 毫秒）后。其次，这个程序也永远不会退出！相反，它会永远等待新消息。你需要使用 <kbd>ctrl</kbd>-<kbd>C</kbd> 来关闭它。

#### 代码在单个 Async 代码块内线性执行

让我们从检查为什么消息在完整延迟后全部涌入，而不是在每次之间有延迟开始。在单个 async 代码块内，代码中 `await` 关键字出现的顺序也是程序运行时它们执行的顺序。

清单 17-10 中只有一个 async 代码块，所以其中的一切都是线性运行的。仍然没有并发。所有的 `tx.send` 调用都发生了，穿插着所有的 `trpl::sleep` 调用和它们相关的等待点。只有在那之后，`while let` 循环才能开始处理 `recv` 调用上的任何等待点。

为了获得我们想要的行为，即在每条消息之间有睡眠延迟，我们需要将 `tx` 和 `rx` 操作放在它们自己的 async 代码块中，如清单 17-11 所示。然后运行时可以使用 `trpl::join` 分别执行它们，就像在清单 17-8 中一样。我们再次等待调用 `trpl::join` 的结果，而不是等待单独的 futures。如果我们按顺序等待单独的 futures，我们最终会回到一个顺序流——这正是我们试图*不*做的。

**清单 17-11**：将 `send` 和 `recv` 分离到它们自己的 `async` 代码块中，并等待那些代码块的 futures

```rust
fn main() {
    trpl::block_on(async {
        let (tx, mut rx) = trpl::channel();
        
        let tx_fut = async move {
            let vals = vec!["hi", "from", "the", "future"];
            for val in vals {
                tx.send(val).unwrap();
                trpl::sleep(std::time::Duration::from_millis(500)).await;
            }
        };
        
        let rx_fut = async {
            while let Some(value) = rx.recv().await {
                println!("received: {}", value);
            }
        };
        
        trpl::join(tx_fut, rx_fut).await;
    });
}
```

使用清单 17-11 中的更新代码，消息以 500 毫秒的间隔打印，而不是在 2 秒后全部涌入。

#### 将所有权移入 Async 代码块

程序仍然永远不会退出，不过，因为 `while let` 循环与 `trpl::join` 交互的方式：

- 从 `trpl::join` 返回的 future 只有在传递给它的*两个* futures 都完成后才完成。
- `tx_fut` future 在发送完 `vals` 中的最后一条消息并完成休眠后才完成。
- `rx_fut` future 在 `while let` 循环结束前不会完成。
- `while let` 循环在 `rx.recv` 产生 `None` 之前不会结束。
- 只有在通道的另一端关闭后，`rx.recv` 才会返回 `None`。
- 通道只有在调用 `rx.close` 或发送端 `tx` 被丢弃时才会关闭。
- 我们在任何地方都没有调用 `rx.close`，而且 `tx` 在我们传递给 `trpl::block_on` 的最外层 async 代码块结束前不会被丢弃。
- 该代码块无法结束，因为它被阻塞在 `trpl::join` 完成上，这让我们回到这个列表的顶部。

现在，我们发送消息的 async 代码块只*借用* `tx`，因为发送消息不需要所有权，但如果我们可以将 `tx` *移动*到那个 async 代码块中，它会在那个代码块结束时被丢弃。在第13章[捕获引用或移动所有权部分][ch13-01]部分，你学习了如何在闭包中使用 `move` 关键字，正如第16章[在线程中使用 `move` 闭包部分][ch16-01-move]部分讨论的，在使用线程时我们经常需要将数据移入闭包。相同的基本动态适用于 async 代码块，所以 `move` 关键字对 async 代码块的作用与对闭包的作用相同。

在清单 17-12 中，我们将用于发送消息的代码块从 `async` 改为 `async move`。

**清单 17-12**：清单 17-11 代码的修订版，在完成后正确关闭

```rust
fn main() {
    trpl::block_on(async {
        let (tx, mut rx) = trpl::channel();
        
        let tx_fut = async move {
            let vals = vec!["hi", "from", "the", "future"];
            for val in vals {
                tx.send(val).unwrap();
                trpl::sleep(std::time::Duration::from_millis(500)).await;
            }
        };
        
        let rx_fut = async {
            while let Some(value) = rx.recv().await {
                println!("received: {}", value);
            }
        };
        
        trpl::join(tx_fut, rx_fut).await;
    });
}
```

当我们运行*这个*版本的代码时，它在最后一条消息发送和接收后优雅地关闭。接下来，让我们看看如果要向多个 future 发送数据需要改变什么。

#### 使用 `join!` 宏连接多个 Futures

这个异步通道也是一个多生产者通道，所以如果我们想从多个 futures 发送消息，我们可以在 `tx` 上调用 `clone`，如清单 17-13 所示。

**清单 17-13**：在 async 代码块中使用多个生产者

```rust
fn main() {
    trpl::block_on(async {
        let (tx, mut rx) = trpl::channel();
        
        let tx1 = tx.clone();
        let tx1_fut = async move {
            let vals = vec!["hi", "from", "the", "future"];
            for val in vals {
                tx1.send(val).unwrap();
                trpl::sleep(std::time::Duration::from_millis(500)).await;
            }
        };
        
        let tx_fut = async move {
            let vals = vec!["more", "messages", "for", "you"];
            for val in vals {
                tx.send(val).unwrap();
                trpl::sleep(std::time::Duration::from_millis(1000)).await;
            }
        };
        
        let rx_fut = async {
            while let Some(value) = rx.recv().await {
                println!("received: {}", value);
            }
        };
        
        trpl::join!(tx1_fut, tx_fut, rx_fut);
    });
}
```

首先，我们克隆 `tx`，在第一个 async 代码块外创建 `tx1`。我们将 `tx1` 移入那个代码块，就像我们之前对 `tx` 做的那样。然后，稍后，我们将原始的 `tx` 移入一个*新的* async 代码块，在那里我们以稍慢的延迟发送更多消息。我们碰巧将这个新的 async 代码块放在接收消息的 async 代码块之后，但它也可以放在它之前。关键是 futures 被等待的顺序，而不是它们被创建的顺序。

两个用于发送消息的 async 代码块都需要是 `async move` 代码块，这样 `tx` 和 `tx1` 都会在那些代码块完成时被丢弃。否则，我们会回到我们开始时的无限循环。

最后，我们从 `trpl::join` 切换到 `trpl::join!` 来处理额外的 future：`join!` 宏等待任意数量的 futures，我们在编译时知道 futures 的数量。我们将在本章后面讨论等待未知数量 futures 的集合。

现在我们看到了来自两个发送 future 的所有消息，因为发送 futures 在发送后使用稍微不同的延迟，消息也以那些不同的间隔接收：

```text
received 'hi'
received 'more'
received 'from'
received 'messages'
received 'the'
received 'future'
received 'for'
received 'you'
```

我们已经探索了如何使用消息传递在 futures 之间发送数据，代码在单个 async 代码块内如何顺序运行，如何将所有权移入 async 代码块，以及如何连接多个 futures。接下来，让我们讨论如何以及为什么告诉运行时它可以切换到另一个任务。

[ch16-01]: /rust-book/ch16-01-threads
[ch16-01-join]: /rust-book/ch16-01-threads
[ch16-02]: /rust-book/ch16-02-message-passing
[ch06-03]: /rust-book/ch06-03-if-let
[ch13-01]: /rust-book/ch13-01-closures
[ch16-01-move]: /rust-book/ch16-01-threads
