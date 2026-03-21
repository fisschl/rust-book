---
title: 更多 Futures 内容
---

### 将控制权交还给运行时

回想一下在[我们的第一个异步程序部分][ch17-01-first]，在每个等待点，Rust 给运行时一个机会来暂停任务，如果正在等待的 future 还没有准备好，就切换到另一个任务。反过来也是成立的：Rust *只* 在等待点暂停 async 代码块并将控制权交还给运行时。等待点之间的一切都是同步的。

这意味着如果你在 async 代码块中没有等待点的情况下做一大堆工作，那个 future 将阻塞其他 futures 取得进展。你有时会听到这被称为一个 future *饿死* 其他 futures。在某些情况下，这可能不是什么大问题。然而，如果你正在做某种昂贵的设置或长时间运行的工作，或者你有一个将继续无限期地做某个特定任务的 future，你需要考虑何时何地将控制权交还给运行时。

让我们模拟一个长时间运行的操作来说明饿死问题，然后探讨如何解决它。清单 17-14 引入了一个 `slow` 函数。

**清单 17-14**：使用 `thread::sleep` 来模拟慢速操作

```rust
fn slow(duration: std::time::Duration) {
    std::thread::sleep(duration);
}
```

这段代码使用 `std::thread::sleep` 而不是 `trpl::sleep`，这样调用 `slow` 会将当前线程阻塞若干毫秒。我们可以使用 `slow` 来代表现实世界中既长时间运行又阻塞的操作。

在清单 17-15 中，我们使用 `slow` 在一对 futures 中模拟这种 CPU 密集型工作。

**清单 17-15**：调用 `slow` 函数来模拟慢速操作

```rust
fn main() {
    trpl::block_on(async {
        let fut1 = async {
            println!("'a' started.");
            slow(std::time::Duration::from_millis(30));
            println!("'a' ran for 30ms");
            slow(std::time::Duration::from_millis(10));
            println!("'a' ran for 10ms");
            slow(std::time::Duration::from_millis(20));
            println!("'a' ran for 20ms");
            println!("'a' finished.");
        };
        
        let fut2 = async {
            println!("'b' started.");
            slow(std::time::Duration::from_millis(75));
            println!("'b' ran for 75ms");
            slow(std::time::Duration::from_millis(10));
            println!("'b' ran for 10ms");
            slow(std::time::Duration::from_millis(15));
            println!("'b' ran for 15ms");
            slow(std::time::Duration::from_millis(350));
            println!("'b' ran for 350ms");
        };
        
        trpl::select(fut1, fut2).await;
    });
}
```

每个 future 只在执行了一堆慢速操作后才将控制权交还给运行时。如果你运行这段代码，你会看到这个输出：

```text
'a' started.
'a' ran for 30ms
'a' ran for 10ms
'a' ran for 20ms
'b' started.
'b' ran for 75ms
'b' ran for 10ms
'b' ran for 15ms
'b' ran for 350ms
'a' finished.
```

就像在清单 17-5 中我们使用 `trpl::select` 来竞争获取两个 URL 的 futures 一样，一旦 `a` 完成，`select` 仍然会完成。然而，两个 futures 中对 `slow` 的调用之间没有交错。`a` future 一直执行它的所有工作直到 `trpl::sleep` 调用被等待，然后 `b` future 执行它的所有工作直到它自己的 `trpl::sleep` 调用被等待，最后 `a` future 完成。为了让两个 futures 在它们的慢速任务之间都能取得进展，我们需要等待点，这样我们才能将控制权交还给运行时。这意味着我们需要可以等待的东西！

我们已经在清单 17-15 中看到了这种切换的发生：如果我们移除了 `a` future 末尾的 `trpl::sleep`，它会在 `b` future 运行 *任何* 代码之前就完成。让我们尝试使用 `trpl::sleep` 函数作为起点，让操作让出执行权，如清单 17-16 所示。

**清单 17-16**：使用 `trpl::sleep` 让操作切换进展

```rust
fn main() {
    trpl::block_on(async {
        let fut1 = async {
            println!("'a' started.");
            slow(std::time::Duration::from_millis(30));
            println!("'a' ran for 30ms");
            trpl::sleep(std::time::Duration::from_millis(1)).await;
            slow(std::time::Duration::from_millis(10));
            println!("'a' ran for 10ms");
            trpl::sleep(std::time::Duration::from_millis(1)).await;
            slow(std::time::Duration::from_millis(20));
            println!("'a' ran for 20ms");
            println!("'a' finished.");
        };
        
        let fut2 = async {
            println!("'b' started.");
            slow(std::time::Duration::from_millis(75));
            println!("'b' ran for 75ms");
            trpl::sleep(std::time::Duration::from_millis(1)).await;
            slow(std::time::Duration::from_millis(10));
            println!("'b' ran for 10ms");
            trpl::sleep(std::time::Duration::from_millis(1)).await;
            slow(std::time::Duration::from_millis(15));
            println!("'b' ran for 15ms");
            trpl::sleep(std::time::Duration::from_millis(1)).await;
        };
        
        trpl::select(fut1, fut2).await;
    });
}
```

我们在每次调用 `slow` 之间添加了带有等待点的 `trpl::sleep` 调用。现在两个 futures 的工作是交错的：

```text
'a' started.
'a' ran for 30ms
'b' started.
'b' ran for 75ms
'a' ran for 10ms
'b' ran for 10ms
'a' ran for 20ms
'b' ran for 15ms
'a' finished.
```

`a` future 在将控制权交给 `b` 之前仍然运行了一会儿，因为它在调用任何 `trpl::sleep` 之前先调用了 `slow`，但之后 futures 每次遇到等待点就会来回交换。在这种情况下，我们在每次调用 `slow` 之后都这样做，但我们可以以对我们最有意义的方式来分解工作。

我们在这里并不真的想 *睡眠*：我们想尽快取得进展。我们只需要将控制权交还给运行时。我们可以直接使用 `trpl::yield_now` 函数来做到这一点。在清单 17-17 中，我们将所有那些 `trpl::sleep` 调用替换为 `trpl::yield_now`。

**清单 17-17**：使用 `yield_now` 让操作切换进展

```rust
fn main() {
    trpl::block_on(async {
        let fut1 = async {
            println!("'a' started.");
            slow(std::time::Duration::from_millis(30));
            println!("'a' ran for 30ms");
            trpl::yield_now().await;
            slow(std::time::Duration::from_millis(10));
            println!("'a' ran for 10ms");
            trpl::yield_now().await;
            slow(std::time::Duration::from_millis(20));
            println!("'a' ran for 20ms");
            println!("'a' finished.");
        };
        
        let fut2 = async {
            println!("'b' started.");
            slow(std::time::Duration::from_millis(75));
            println!("'b' ran for 75ms");
            trpl::yield_now().await;
            slow(std::time::Duration::from_millis(10));
            println!("'b' ran for 10ms");
            trpl::yield_now().await;
            slow(std::time::Duration::from_millis(15));
            println!("'b' ran for 15ms");
            trpl::yield_now().await;
        };
        
        trpl::select(fut1, fut2).await;
    });
}
```

这段代码既更清楚地表达了实际意图，又可能比使用 `sleep` 快得多，因为 `sleep` 使用的计时器通常对它们能有多细粒度有限制。例如，我们使用的 `sleep` 版本即使我们传递一纳秒的 `Duration`，也总是会睡眠至少一毫秒。再说一次，现代计算机是 *快* 的：在一毫秒内可以做很多事情！

这意味着 async 即使对于 CPU 密集型任务也很有用，这取决于你的程序还在做什么，因为它提供了一个有用的工具来构建程序不同部分之间的关系（但要付出 async 状态机开销的成本）。这是 *协作式多任务* 的一种形式，每个 future 都有能力通过等待点决定何时交出控制权。因此，每个 future 也有责任避免阻塞太长时间。在一些基于 Rust 的嵌入式操作系统中，这是 *唯一* 的多任务类型！

在现实世界的代码中，你当然通常不会在每一行都交替函数调用和等待点。虽然以这种方式让出控制权相对便宜，但这不是免费的。在很多情况下，试图分解一个 CPU 密集型任务可能会让它明显变慢，所以有时让操作短暂阻塞对 *整体* 性能更好。总是要测量，看看你代码的实际性能瓶颈在哪里。不过，如果你 *确实* 看到很多你预期会并发发生的工作实际上是以串行方式发生的，底层的动态是需要记住的！

### 构建我们自己的异步抽象

我们还可以将 futures 组合在一起创建新模式。例如，我们可以用我们已经拥有的异步构建块构建一个 `timeout` 函数。完成后，结果将是另一个构建块，我们可以用它来创建更多的异步抽象。

清单 17-18 展示了我们期望这个 `timeout` 如何与慢速 future 一起工作。

**清单 17-18**：使用我们想象的 `timeout` 来运行带有时间限制的慢速操作

```rust
fn main() {
    trpl::block_on(async {
        let slow = async {
            trpl::sleep(std::time::Duration::from_secs(5)).await;
            "Finally finished!"
        };
        
        match timeout(slow, std::time::Duration::from_secs(2)).await {
            Ok(message) => println!("Succeeded with: {}", message),
            Err(duration) => println!("Failed after {} seconds", duration.as_secs()),
        }
    });
}
```

让我们来实现它！首先，让我们考虑 `timeout` 的 API：

- 它本身需要是一个异步函数，这样我们才能等待它。
- 它的第一个参数应该是一个要运行的 future。我们可以让它泛型化，让它可以与任何 future 一起工作。
- 它的第二个参数将是最大等待时间。如果我们使用 `Duration`，那会让它很容易传递给 `trpl::sleep`。
- 它应该返回一个 `Result`。如果 future 成功完成，`Result` 将是 `Ok`，其中包含 future 产生的值。如果超时先到期，`Result` 将是 `Err`，其中包含超时等待的持续时间。

清单 17-19 展示了这个声明。

**清单 17-19**：定义 `timeout` 的签名

```rust
async fn timeout<F, T>(future_to_try: F, max_time: std::time::Duration) -> Result<T, std::time::Duration>
where
    F: std::future::Future<Output = T>,
{
    // 实现将在这里
}
```

这满足了我们的类型目标。现在让我们考虑我们需要的 *行为*：我们想将传入的 future 与持续时间进行竞争。我们可以使用 `trpl::sleep` 从持续时间创建一个计时器 future，并使用 `trpl::select` 来运行这个计时器与调用者传入的 future。

在清单 17-20 中，我们通过匹配等待 `trpl::select` 的结果来实现 `timeout`。

**清单 17-20**：用 `select` 和 `sleep` 定义 `timeout`

```rust
async fn timeout<F, T>(future_to_try: F, max_time: std::time::Duration) -> Result<T, std::time::Duration>
where
    F: std::future::Future<Output = T>,
{
    let timer = trpl::sleep(max_time);
    match trpl::select(future_to_try, timer).await {
        trpl::Either::Left((output, _)) => Ok(output),
        trpl::Either::Right(_) => Err(max_time),
    }
}
```

`trpl::select` 的实现是不公平的：它总是按照参数传递的顺序轮询参数（其他 `select` 实现会随机选择先轮询哪个参数）。因此，我们将 `future_to_try` 作为第一个参数传递给 `select`，这样即使 `max_time` 是非常短的持续时间，它也有机会完成。如果 `future_to_try` 先完成，`select` 将返回带有 `future_to_try` 输出的 `Left`。如果计时器先完成，`select` 将返回带有计时器输出 `()` 的 `Right`。

如果 `future_to_try` 成功并且我们得到 `Left(output)`，我们返回 `Ok(output)`。如果睡眠计时器先到期，我们得到 `Right(())`，我们用 `_` 忽略 `()` 并返回 `Err(max_time)`。

这样，我们就有了一个由另外两个异步助手构建的、可以工作的 `timeout`。如果我们运行我们的代码，它会在超时后打印失败模式：

```text
Failed after 2 seconds
```

因为 futures 可以与其他 futures 组合，你可以使用较小的异步构建块构建真正强大的工具。例如，你可以使用相同的方法将超时与重试结合起来，进而将它们与网络调用等操作一起使用。

在实践中，你通常会直接使用 `async` 和 `await`，其次使用 `select` 等函数和 `join!` 等宏来控制最外层 futures 的执行方式。

我们现在已经看到了多种同时处理多个 futures 的方法。接下来，我们将看看如何随着时间的推移用 *streams* 来处理一系列 futures。

[ch17-01-first]: /rust-book/ch17-01-futures-and-syntax
