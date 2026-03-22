---
title: 16.3. 共享状态并发
---

消息传递是处理并发的一种好方法，但它不是唯一的方法。另一种方法是让多个线程访问相同的共享数据。再次考虑 Go 语言文档中的口号部分："不要通过共享内存来通信。"

通过共享内存来通信会是什么样子？此外，为什么消息传递的爱好者会警告不要使用内存共享？

在某种程度上，任何编程语言中的通道都类似于单一所有权，因为一旦你通过通道转移一个值，你就不应该再使用该值。共享内存并发类似于多重所有权：多个线程可以同时访问同一个内存位置。正如你在第15章中看到的，智能指针使多重所有权成为可能，多重所有权会增加复杂性，因为这些不同的所有者需要管理。Rust 的类型系统和所有权规则极大地帮助了正确地进行这种管理。例如，让我们看看互斥锁，共享内存中更常见的并发原语之一。

### 使用互斥锁控制访问

_互斥锁_ 是 _mutual exclusion_ 的缩写，即互斥锁在任何给定时间只允许一个线程访问某些数据。要访问互斥锁中的数据，线程必须首先通过请求获取互斥锁的锁来发出它想要访问的信号。_锁_ 是互斥锁的一部分数据结构，它跟踪谁当前对数据有独占访问权。因此，互斥锁被描述为通过锁定系统 _守护_ 它持有的数据。

互斥锁有难以使用的名声，因为你必须记住两条规则：

1. 在使用数据之前，你必须尝试获取锁。
2. 当你完成对互斥锁守护的数据的使用时，你必须解锁数据，以便其他线程可以获取锁。

对于互斥锁的现实世界比喻，想象一个只有一个麦克风的会议讨论小组。在讨论小组成员发言之前，他们必须请求或示意他们想要使用麦克风。当他们得到麦克风时，他们可以想讲多久就讲多久，然后将麦克风交给下一个请求发言的讨论小组成员。如果讨论小组成员在讲完时忘记交出麦克风，其他人就无法发言。如果共享麦克风的管理出错，讨论小组将无法按计划进行！

互斥锁的管理可能非常棘手，这就是为什么很多人对通道如此热情。然而，多亏了 Rust 的类型系统和所有权规则，你不会搞错锁定和解锁。

#### `Mutex<T>` 的 API

作为如何使用互斥锁的示例，让我们从在单线程上下文中使用互斥锁开始，如清单 16-12 所示。

**清单 16-12**：在单线程上下文中探索 `Mutex<T>` 的 API 以简化问题

```rust
use std::sync::Mutex;

fn main() {
    let m = Mutex::new(5);

    {
        let mut num = m.lock().unwrap();
        *num = 6;
    }

    println!("m = {m:?}");
}
```

与许多类型一样，我们使用关联函数 `new` 创建 `Mutex<T>`。要访问互斥锁内部的数据，我们使用 `lock` 方法来获取锁。此调用将阻塞当前线程，使其无法做任何工作，直到轮到它拥有锁。

如果另一个持有锁的线程 panic，对 `lock` 的调用将失败。在这种情况下，没有人能够获得锁，因此我们选择 `unwrap` 并让这个线程 panic，如果我们处于那种情况。

在我们获取锁之后，我们可以将返回值（在此例中名为 `num`）视为对互斥锁内部数据的可变引用。类型系统确保我们在使用 `m` 中的值之前获取锁。`m` 的类型是 `Mutex<i32>`，而不是 `i32`，因此我们必须调用 `lock` 才能使用 `i32` 值。我们不能忘记；否则类型系统不会让我们访问内部的 `i32`。

对 `lock` 的调用返回一个名为 `MutexGuard` 的类型，包装在 `LockResult` 中，我们通过调用 `unwrap` 来处理它。`MutexGuard` 类型实现了 `Deref` 以指向我们的内部数据；该类型还有一个 `Drop` 实现，当 `MutexGuard` 超出作用域时自动释放锁，这发生在内部作用域的末尾。因此，我们不会冒着忘记释放锁并阻塞互斥锁被其他线程使用的风险，因为锁释放是自动发生的。

在释放锁之后，我们可以打印互斥锁的值并看到我们能够将内部的 `i32` 更改为 `6`。

#### 共享对 `Mutex<T>` 的访问

现在让我们尝试使用 `Mutex<T>` 在多个线程之间共享一个值。我们将启动 10 个线程，让它们每个将计数器值增加 1，因此计数器从 0 变为 10。清单 16-13 中的示例将有编译器错误，我们将使用该错误来了解有关使用 `Mutex<T>` 的更多信息以及 Rust 如何帮助我们正确使用它。

**清单 16-13**：十个线程，每个递增由 `Mutex<T>` 守护的计数器

```rust
use std::sync::Mutex;
use std::thread;

fn main() {
    let counter = Mutex::new(0);
    let mut handles = vec![];

    for _ in 0..10 {
        let handle = thread::spawn(move || {
            let mut num = counter.lock().unwrap();

            *num += 1;
        });
        handles.push(handle);
    }

    for handle in handles {
        handle.join().unwrap();
    }

    println!("Result: {}", *counter.lock().unwrap());
}
```

我们创建一个 `counter` 变量来保存 `Mutex<T>` 内部的 `i32`，如我们在清单 16-12 中所做的。接下来，我们通过遍历一系列数字来创建 10 个线程。我们使用 `thread::spawn` 并给所有线程相同的闭包：一个将计数器移入线程，通过调用 `lock` 方法获取 `Mutex<T>` 上的锁，然后将互斥锁中的值加 1。当线程完成运行其闭包时，`num` 将超出作用域并释放锁，以便另一个线程可以获取它。

在主线程中，我们收集所有的 join 句柄。然后，正如我们在清单 16-2 中所做的，我们在每个句柄上调用 `join` 以确保所有线程都完成。此时，主线程将获取锁并打印此程序的结果。

我们暗示过这个示例不会编译。现在让我们找出原因！

```console
$ cargo run
   Compiling shared-state v0.1.0 (file:///projects/shared-state)
error[E0382]: borrow of moved value: `counter`
  --> src/main.rs:21:29
   |
 5 |     let counter = Mutex::new(0);
   |         ------- move occurs because `counter` has type `std::sync::Mutex<i32>`, which does not implement the `Copy` trait
...
 8 |     for _ in 0..10 {
   |     -------------- inside of this loop
 9 |         let handle = thread::spawn(move || {
   |                                    ------- value moved into closure here, in previous iteration of loop
...
21 |     println!("Result: {}", *counter.lock().unwrap());
   |                             ^^^^^^^ value borrowed here after move
   |
help: consider moving the expression out of the loop so it is only moved once
   |
 8 ~     let mut value = counter.lock();
 9 ~     for _ in 0..10 {
10 |         let handle = thread::spawn(move || {
11 | ~             let mut num = value.unwrap();
   |

For more information about this error, try `rustc --explain E0382`.
error: could not compile `shared-state` (bin "shared-state") due to 1 previous error
```

错误消息指出 `counter` 值在循环的前一次迭代中被移动了。Rust 告诉我们不能将锁 `counter` 的所有权移入多个线程。让我们使用我们在第15章讨论的多重所有权方法来修复编译器错误。

#### 多线程多重所有权

在第15章中，我们通过使用智能指针 `Rc<T>` 来创建引用计数值，从而给一个值多个所有者。让我们在这里做同样的事情，看看会发生什么。我们将在清单 16-14 中将 `Mutex<T>` 包装在 `Rc<T>` 中，并在将所有权移入线程之前克隆 `Rc<T>`。

**清单 16-14**：尝试使用 `Rc<T>` 允许多个线程拥有 `Mutex<T>`

```rust
use std::rc::Rc;
use std::sync::Mutex;
use std::thread;

fn main() {
    let counter = Rc::new(Mutex::new(0));
    let mut handles = vec![];

    for _ in 0..10 {
        let counter = Rc::clone(&counter);
        let handle = thread::spawn(move || {
            let mut num = counter.lock().unwrap();

            *num += 1;
        });
        handles.push(handle);
    }

    for handle in handles {
        handle.join().unwrap();
    }

    println!("Result: {}", *counter.lock().unwrap());
}
```

我们再次编译并得到……不同的错误！编译器教会了我们很多：

```console
$ cargo run
   Compiling shared-state v0.1.0 (file:///projects/shared-state)
error[E0277]: `Rc<std::sync::Mutex<i32>>` cannot be sent between threads safely
  --> src/main.rs:11:36
   |
11 |           let handle = thread::spawn(move || {
   |                        ------------- ^------
   |                        |             |
   |  ______________________|_____________within this `{closure@src/main.rs:11:36: 11:43}`
   | |                      |
   | |                      required by a bound introduced by this call
12 | |             let mut num = counter.lock().unwrap();
13 | |
14 | |             *num += 1;
15 | |         });
   | |_________^ `Rc<std::sync::Mutex<i32>>` cannot be sent between threads safely
   |
   = help: within `{closure@src/main.rs:11:36: 11:43}`, the trait `Send` is not implemented for `Rc<std::sync::Mutex<i32>>`
note: required because it's used within this closure
  --> src/main.rs:11:36
   |
11 |         let handle = thread::spawn(move || {
   |                                    ^^^^^^^
note: required by a bound in `spawn`
  --> /rustc/1159e78c4747b02ef996e55082b704c09b970588/library/std/src/thread/mod.rs:723:1

For more information about this error, try `rustc --explain E0277`.
error: could not compile `shared-state` (bin "shared-state") due to 1 previous error
```

哇，那个错误消息很啰嗦！这是需要关注的重要部分：`` `Rc<Mutex<i32>>` cannot be sent between threads safely ``。编译器还告诉了我们原因：`` the trait `Send` is not implemented for `Rc<Mutex<i32>>` ``。我们将在下一节讨论 `Send`：它是确保我们与线程一起使用的类型适用于并发情况的 trait 之一。

不幸的是，`Rc<T>` 在线程之间共享不安全。当 `Rc<T>` 管理引用计数时，它对每次调用 `clone` 都增加计数，并在每次克隆被释放时减少计数。但它不使用任何并发原语来确保计数的更改不会被另一个线程中断。这可能导致错误的计数——微妙的错误，进而可能导致内存泄漏或值在我们用完之前被释放。我们需要的是一种完全像 `Rc<T>` 的类型，但以线程安全的方式更改引用计数。

#### 使用 `Arc<T>` 进行原子引用计数

幸运的是，`Arc<T>` _是_ 一种像 `Rc<T>` 的类型，可以安全地用于并发情况。_a_ 代表 _atomic_，意思是它是一种 _原子引用计数_ 类型。原子是另一种我们不会在这里详细介绍的并发原语：有关更多详细信息，请参阅标准库文档 [`std::sync::atomic`][atomic]。在这一点上，你只需要知道原子工作方式类似于原始类型，但可以安全地在线程之间共享。

你可能会想为什么不是所有的原始类型都是原子的，以及为什么标准库类型没有默认实现使用 `Arc<T>`。原因是线程安全会带来性能损失，你只会在真正需要时才愿意为此付出代价。如果你只是在单个线程内对值执行操作，如果你的代码不必强制执行原子提供的保证，它可以运行得更快。

让我们回到我们的示例：`Arc<T>` 和 `Rc<T>` 具有相同的 API，因此我们通过更改 `use` 行、对 `new` 的调用和对 `clone` 的调用来修复我们的程序。清单 16-15 中的代码最终将编译并运行。

**清单 16-15**：使用 `Arc<T>` 包装 `Mutex<T>` 以便能够在多个线程之间共享所有权

```rust
use std::sync::{Arc, Mutex};
use std::thread;

fn main() {
    let counter = Arc::new(Mutex::new(0));
    let mut handles = vec![];

    for _ in 0..10 {
        let counter = Arc::clone(&counter);
        let handle = thread::spawn(move || {
            let mut num = counter.lock().unwrap();

            *num += 1;
        });
        handles.push(handle);
    }

    for handle in handles {
        handle.join().unwrap();
    }

    println!("Result: {}", *counter.lock().unwrap());
}
```

此代码将打印以下内容：

```text
Result: 10
```

我们做到了！我们从 0 数到 10，这可能看起来不太令人印象深刻，但它确实教会了我们很多关于 `Mutex<T>` 和线程安全的知识。你也可以使用这个程序的结构来执行比仅仅递增计数器更复杂的操作。使用这种策略，你可以将计算分成独立的部分，将这些部分分散到各个线程，然后使用 `Mutex<T>` 让每个线程用它的部分更新最终结果。

注意，如果你正在进行简单的数值操作，标准库的 [`std::sync::atomic` 模块][atomic] 提供了比 `Mutex<T>` 更简单的类型。这些类型提供对原始类型的安全、并发、原子访问。我们选择在这个示例中使用带原始类型的 `Mutex<T>`，以便我们可以专注于 `Mutex<T>` 的工作原理。

### 比较 `RefCell<T>`/`Rc<T>` 和 `Mutex<T>`/`Arc<T>`

你可能已经注意到 `counter` 是不可变的，但我们可以获取对其内部值的可变引用；这意味着 `Mutex<T>` 提供内部可变性，就像 `Cell` 系列一样。就像我们在第15章中使用 `RefCell<T>` 来允许我们改变 `Rc<T>` 内部的内容一样，我们使用 `Mutex<T>` 来改变 `Arc<T>` 内部的内容。

另一个需要注意的细节是，当你使用 `Mutex<T>` 时，Rust 无法保护你免受所有类型的逻辑错误。回想一下在第15章，使用 `Rc<T>` 会带来创建引用循环的风险，其中两个 `Rc<T>` 值相互引用，导致内存泄漏。同样，`Mutex<T>` 也有创建 _死锁_ 的风险。这些发生在一个操作需要锁定两个资源，而两个线程各自获取了其中一个锁，导致它们永远等待对方。如果你对死锁感兴趣，尝试创建一个具有死锁的 Rust 程序；然后，研究任何语言中互斥锁的死锁缓解策略，并尝试在 Rust 中实现它们。`Mutex<T>` 和 `MutexGuard` 的标准库 API 文档提供了有用的信息。

我们将通过讨论 `Send` 和 `Sync` trait 以及如何将它们与自定义类型一起使用来结束本章。

[atomic]: https://doc.rust-lang.org/std/sync/atomic/index.html
