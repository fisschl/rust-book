---
title: 17.5. Async 的 Traits 深入解析
---

在本章中，我们以各种方式使用了 `Future`、`Stream` 和 `StreamExt` trait。不过到目前为止，我们避免深入讨论它们是如何工作的或它们如何组合在一起，这对于你日常的 Rust 工作来说是可以的。但有时，你会遇到需要了解这些 trait 的更多细节的情况，还有 `Pin` 类型和 `Unpin` trait。在本节中，我们将深入挖掘足以在这些场景中提供帮助的内容，仍然将 *真正* 的深入探讨留给其他文档。

### `Future` Trait

让我们从仔细看看 `Future` trait 是如何工作的开始。以下是 Rust 定义它的方式：

```rust
use std::pin::Pin;
use std::task::{Context, Poll};

pub trait Future {
    type Output;

    fn poll(self: Pin<&mut Self>, cx: &mut Context<'_>) -> Poll<Self::Output>;
}
```

那个 trait 定义包含了许多新类型，还有一些我们以前没见过的语法，所以让我们逐段地讲解这个定义。

首先，`Future` 的关联类型 `Output` 表示 future 解析到的值。这类似于 `Iterator` trait 的 `Item` 关联类型。其次，`Future` 有 `poll` 方法，它接受一个特殊的 `Pin` 引用作为它的 `self` 参数和一个对 `Context` 类型的可变引用，并返回一个 `Poll<Self::Output>`。我们稍后会更多地讨论 `Pin` 和 `Context`。现在，让我们专注于方法返回的内容，`Poll` 类型：

```rust
pub enum Poll<T> {
    Ready(T),
    Pending,
}
```

这个 `Poll` 类型类似于 `Option`。它有一个包含值的变体，`Ready(T)`，和一个不包含值的变体，`Pending`。不过，`Poll` 与 `Option` 的意思完全不同！`Pending` 变体表明 future 还有工作要做，所以调用者需要稍后再次检查。`Ready` 变体表明 `Future` 已经完成了它的工作，`T` 值是可用的。

> 注意：很少需要直接调用 `poll`，但如果你确实需要，请记住对于大多数 futures，调用者不应该在 future 返回 `Ready` 后再次调用 `poll`。如果 future 在准备好后再次被轮询，许多 futures 会 panic。可以安全地再次轮询的 futures 会在它们的文档中明确说明。这类似于 `Iterator::next` 的行为方式。

当你看到使用 `await` 的代码时，Rust 在底层将它编译成对 `poll` 的调用。如果你回顾清单 17-4，我们在那里打印出单个 URL 的页面标题一旦它解析完成，Rust 将它编译成类似于（虽然不完全是）这样的东西：

```rust
match page_title(url).poll() {
    Ready(page_title) => match page_title {
        Some(title) => println!("The title for {url} was {title}"),
        None => println!("{url} had no title"),
    }
    Pending => {
        // But what goes here?
    }
}
```

当 future 仍然是 `Pending` 时，我们应该做什么？我们需要某种方式来一次又一次地再次尝试，直到 future 最终准备好。换句话说，我们需要一个循环：

```rust
let mut page_title_fut = page_title(url);
loop {
    match page_title_fut.poll() {
        Ready(value) => match page_title {
            Some(title) => println!("The title for {url} was {title}"),
            None => println!("{url} had no title"),
        }
        Pending => {
            // continue
        }
    }
}
```

如果 Rust 将它编译成完全那样的代码，每个 `await` 都将是阻塞的——这与我们追求的目标完全相反！相反，Rust 确保循环可以将控制权交给可以暂停这个 future 上的工作来处理其他 futures 然后稍后再次检查这个 future 的东西。正如我们所看到的，那个东西是异步运行时，这种调度和协调工作是它的主要工作之一。

在[使用消息传递在两个任务之间发送数据部分][ch17-02-messages]，我们描述了等待 `rx.recv`。`recv` 调用返回一个 future，等待这个 future 会轮询它。我们注意到运行时会暂停 future 直到它准备好，要么带 `Some(message)`，要么当通道关闭时带 `None`。有了我们对 `Future` trait 的更深入理解，特别是 `Future::poll`，我们可以看到它是如何工作的。当 future 返回 `Poll::Pending` 时，运行时知道 future 还没准备好。相反，当 `poll` 返回 `Poll::Ready(Some(message))` 或 `Poll::Ready(None)` 时，运行时知道 future *是* 准备好的并推进它。

运行时如何做到这一点的确切细节超出了本书的范围，但关键是看到 futures 的基本机制：运行时 *轮询* 它负责的每个 future，当 future 还没准备好时将它重新置于睡眠状态。

### `Pin` 类型和 `Unpin` Trait

回到清单 17-13，我们使用 `trpl::join!` 宏来等待三个 futures。然而，有一个集合（如向量）包含一些数量直到运行时才知道的 futures 是很常见的。让我们将清单 17-13 改为清单 17-23 中的代码，将三个 futures 放入一个向量中并调用 `trpl::join_all` 函数，这还不能编译。

**清单 17-23**：等待集合中的 futures

```rust
use std::pin::pin;

fn main() {
    trpl::block_on(async {
        let futures = vec![
            Box::pin(async { /* ... */ }),
            Box::pin(async { /* ... */ }),
            Box::pin(async { /* ... */ }),
        ];
        
        trpl::join_all(futures).await;
    });
}
```

我们将每个 future 放入一个 `Box` 中，使它们成为 *trait 对象*，就像我们在第12章的 "从 `run` 返回错误" 部分做的那样。（我们将在第18章详细讨论 trait 对象。）使用 trait 对象让我们可以将这些匿名 futures 视为相同的类型，因为它们都实现了 `Future` trait。

这可能令人惊讶。毕竟，这些 async 代码块都不返回任何东西，所以每个都会产生一个 `Future<Output = ()>`。记住 `Future` 是一个 trait，而且编译器为每个 async 代码块创建一个唯一的枚举，即使它们有相同的输出类型。就像你不能将两个不同的手写结构体放入 `Vec` 中一样，你不能混合编译器生成的枚举。

然后我们将 futures 的集合传递给 `trpl::join_all` 函数并等待结果。然而，这不能编译；以下是错误消息的相关部分。

```text
error[E0277]: `dyn Future<Output = ()>` cannot be unpinned
  --> src/main.rs:48:33
   |
48 |         trpl::join_all(futures).await;
   |                                 ^^^^^ the trait `Unpin` is not implemented for `dyn Future<Output = ()>`
   |
   = note: consider using the `pin!` macro
           consider using `Box::pin` if you need to access the pinned value outside of the current scope
   = note: required for `Box<dyn Future<Output = ()>>` to implement `Future`
note: required by a bound in `futures_util::future::join_all::JoinAll`
  --> file:///home/.cargo/registry/src/index.crates.io-1949cf8c6b5b557f/futures-util-0.3.30/src/future/join_all.rs:29:8
   |
27 | pub struct JoinAll<F>
   |            ------- required by a bound in this struct
28 | where
29 |     F: Future,
   |        ^^^^^^ required by this bound in `JoinAll`
```

这个错误消息中的注释告诉我们应该使用 `pin!` 宏来 *固定* 值，这意味着将它们放入 `Pin` 类型中，该类型保证值不会在内存中移动。错误消息说需要固定是因为 `dyn Future<Output = ()>` 需要实现 `Unpin` trait，而目前没有。

`trpl::join_all` 函数返回一个名为 `JoinAll` 的结构体。该结构体在类型 `F` 上是泛型的，它被约束为实现 `Future` trait。直接用 `await` 等待 future 会隐式地固定 future。这就是为什么我们在想要等待 futures 的地方不需要到处使用 `pin!`。

然而，这里我们不是直接等待 future。相反，我们通过将 futures 的集合传递给 `join_all` 函数来构造一个新的 future，`JoinAll`。`join_all` 的签名要求集合中项目的类型都实现 `Future` trait，而 `Box<T>` 只有当它包装的 `T` 是实现 `Unpin` trait 的 future 时才实现 `Future`。

这有很多内容需要吸收！要真正理解它，让我们进一步深入研究 `Future` trait 实际上是如何工作的，特别是围绕固定。再看一下 `Future` trait 的定义：

```rust
use std::pin::Pin;
use std::task::{Context, Poll};

pub trait Future {
    type Output;

    // Required method
    fn poll(self: Pin<&mut Self>, cx: &mut Context<'_>) -> Poll<Self::Output>;
}
```

`cx` 参数及其 `Context` 类型是运行时实际上如何知道何时检查任何给定的 future 同时仍然保持惰性的关键。再说一次，这是如何工作的细节超出了本章的范围，而且当你编写自定义 `Future` 实现时，你通常只需要考虑这一点。我们将专注于 `self` 的类型，因为这是我们第一次看到 `self` 有类型注解的方法。`self` 的类型注解与其他函数参数的类型注解的工作方式类似，但有两个关键区别：

- 它告诉 Rust `self` 必须是什么类型才能调用该方法。
- 它不能是任何类型。它被限制为在其上实现方法的类型、对该类型的引用或智能指针，或包装对该类型引用的 `Pin`。

我们将在[第18章][ch18]看到更多关于这种语法的内容。现在，知道如果我们想轮询一个 future 来检查它是 `Pending` 还是 `Ready(Output)`，我们需要一个 `Pin` 包装的指向该类型的可变引用就足够了。

`Pin` 是一个包装指针类型（如 `&`、`&mut`、`Box` 和 `Rc`）的包装器。（从技术上讲，`Pin` 适用于实现 `Deref` 或 `DerefMut` trait 的类型，但这实际上等同于只适用于引用和智能指针。）`Pin` 本身不是指针，也没有像 `Rc` 和 `Arc` 那样具有引用计数等自己的行为；它纯粹是编译器可以用来强制执行指针使用约束的工具。

回想一下 `await` 是根据对 `poll` 的调用来实现的开始解释我们之前看到的错误消息，但那是在 `Unpin` 方面，而不是 `Pin`。那么 `Pin` 与 `Unpin` 到底有什么关系，为什么 `Future` 需要 `self` 在 `Pin` 类型中才能调用 `poll`？

记得在本章早些时候，future 中的一系列等待点被编译成一个状态机，编译器确保该状态机遵循 Rust 的所有正常安全规则，包括借用和所有权。为了使这一点工作，Rust 查看在一个等待点和下一个等待点或 async 代码块结束之间需要什么数据。然后它在编译后的状态机中创建一个相应的变体。每个变体都获得它在源代码的那一部分中使用的数据的访问权限，无论是通过取得该数据的所有权还是通过获取对它可变或不可变引用。

到目前为止，一切都好：如果我们在给定的 async 代码块中搞错了所有权或引用，借用检查器会告诉我们。当我们想要移动与那个代码块对应的 future 时——比如将它推入一个数据结构中以与 `join_all` 一起用作迭代器，或者从函数中返回它——事情变得更棘手。

当我们移动一个 future——无论是通过将它推入数据结构以与 `join_all` 一起使用，还是通过从函数返回它——那实际上意味着移动 Rust 为我们创建的状态机。而且与 Rust 中大多数其他类型不同，Rust 为 async 代码块创建的 futures 最终可能在任何给定变体的字段中有对自己引用，如图 17-4 的简化说明所示。

![图 17-4：一个自引用数据类型](img/trpl17-04.svg)

**图 17-4**：一个自引用数据类型

然而，默认情况下，任何对自己有引用的对象移动都是不安全的，因为引用总是指向它们引用的东西的实际内存地址（见图 17-5）。如果你移动数据结构本身，那些内部引用将指向旧位置。然而，该内存位置现在无效了。一方面，当你对数据结构进行更改时，它的值不会被更新。另一方面——更重要的是——计算机现在可以自由地将该内存重用于其他目的！你最终可能会读到完全无关的数据。

![图 17-5：移动自引用数据类型的不安全结果](img/trpl17-05.svg)

**图 17-5**：移动自引用数据类型的不安全结果

理论上，Rust 编译器可以尝试在对象被移动时更新对该对象的每个引用，但这可能会增加很多性能开销，特别是如果需要更新整个引用网络。如果我们能确保有问题的数据结构 *不会在内存中移动*，我们就不需要更新任何引用。这正是 Rust 的借用检查器所做的：在安全的代码中，它阻止你移动任何有活动引用的项目。

`Pin` 在此基础上给了我们我们需要的确切保证。当我们通过将指向该值的指针包装在 `Pin` 中来 *固定* 一个值时，它就不能再移动了。因此，如果你有 `Pin<Box<SomeType>>`，你实际上是固定了 `SomeType` 值，*而不是* `Box` 指针。图 17-6 说明了这个过程。

![图 17-6：固定一个指向自引用 future 类型的 `Box`](img/trpl17-06.svg)

**图 17-6**：固定一个指向自引用 future 类型的 `Box`

事实上，`Box` 指针仍然可以自由移动。记住：我们关心的是确保最终被引用的数据保持在原位。如果一个指针移动，*但它指向的数据* 在同一位置，如图 17-7 所示，就没有潜在问题。（作为一个独立的练习，查看类型的文档以及 `std::pin` 模块，并尝试弄清楚你将如何用包装 `Box` 的 `Pin` 来做这件事。）关键是自引用类型本身不能移动，因为它仍然被固定。

![图 17-7：移动一个指向自引用 future 类型的 `Box`](img/trpl17-07.svg)

**图 17-7**：移动一个指向自引用 future 类型的 `Box`

然而，大多数类型在周围移动是安全的，即使它们恰好在 `Pin` 指针后面。我们只需要在具有内部引用的项目时考虑固定。原始值如数字和布尔值是安全的，因为它们显然没有任何内部引用。你在 Rust 中通常使用的大多数类型也是如此。例如，你可以移动 `Vec` 而不必担心。鉴于我们到目前为止所看到的，如果你有 `Pin<Vec<String>>`，你不得不通过 `Pin` 提供的安全但限制性的 API 来做所有事情，即使 `Vec<String>` 如果没有其他引用它的话总是安全的。我们需要一种方法来告诉编译器在这种情况下移动项目是可以的——这就是 `Unpin` 发挥作用的地方。

`Unpin` 是一个标记 trait，类似于我们在第16章看到的 `Send` 和 `Sync` trait，因此没有自己的功能。标记 trait 的存在只是为了告诉编译器使用实现给定 trait 的类型在特定上下文中是安全的。`Unpin` 通知编译器给定的类型 *不需要* 维护关于所讨论的值是否可以安全移动的任何保证。

就像 `Send` 和 `Sync` 一样，编译器自动为所有它能证明是安全的类型实现 `Unpin`。一个特殊的情况，再次类似于 `Send` 和 `Sync`，是 `Unpin` *没有*为某个类型实现的情况。这种情况的表示法是 `impl !Unpin for SomeType`，其中 `SomeType` 是 *确实* 需要维护这些保证才能在指向该类型的指针用于 `Pin` 时是安全的类型的名称。

换句话说，关于 `Pin` 和 `Unpin` 之间的关系有两件事要记住。首先，`Unpin` 是"正常"情况，`!Unpin` 是特殊情况。其次，一个类型实现 `Unpin` 还是 `!Unpin`*只*在你使用指向该类型的固定指针如 `Pin<&mut SomeType>` 时才重要。

为了具体化这一点，想想一个 `String`：它有长度和构成它的 Unicode 字符。我们可以将 `String` 包装在 `Pin` 中，如图 17-8 所示。然而，`String` 自动实现 `Unpin`，Rust 中的大多数其他类型也是如此。

![图 17-8：固定一个 `String`；虚线表示 `String` 实现了 `Unpin` trait，因此没有被固定](img/trpl17-08.svg)

**图 17-8**：固定一个 `String`；虚线表示 `String` 实现了 `Unpin` trait，因此没有被固定

因此，我们可以做一些如果 `String` 实现 `!Unpin` 将是非法的事情，比如替换内存中同一位置的另一个字符串，如图 17-9 所示。这不违反 `Pin` 契约，因为 `String` 没有任何使其移动不安全的内部引用。这正是它实现 `Unpin` 而不是 `!Unpin` 的原因。

![图 17-9：在内存中用完全不同的 `String` 替换 `String`](img/trpl17-09.svg)

**图 17-9**：在内存中用完全不同的 `String` 替换 `String`

现在我们知道足够多来理解从清单 17-23 开始的 `join_all` 调用报告的错误了。我们最初尝试将由 async 代码块产生的 futures 移入 `Vec<Box<dyn Future<Output = ()>>>`，但正如我们所看到的，这些 futures 可能有内部引用，所以它们不会自动实现 `Unpin`。一旦我们固定它们，我们就可以将产生的 `Pin` 类型传递到 `Vec` 中，确信 futures 中的底层数据*不会*被移动。清单 17-24 展示了如何通过在每个三个 futures 定义的地方调用 `pin!` 宏并调整 trait 对象类型来修复代码。

**清单 17-24**：固定 futures 以启用将它们移入向量

```rust
use std::pin::pin;

fn main() {
    trpl::block_on(async {
        let futures: Vec<std::pin::Pin<_>> = vec![
            pin!(async { /* ... */ }),
            pin!(async { /* ... */ }),
            pin!(async { /* ... */ }),
        ];
        
        trpl::join_all(futures).await;
    });
}
```

这个例子现在可以编译和运行了，我们可以在运行时从向量中添加或移除 futures 并连接它们。

`Pin` 和 `Unpin` 主要对构建低级库或在你自己构建运行时时很重要，而不是对日常的 Rust 代码。然而，当你在错误消息中看到这些 trait 时，现在你对如何修复代码有了更好的了解！

> 注意：这种 `Pin` 和 `Unpin` 的组合使得在 Rust 中安全地实现一整类复杂类型成为可能，否则由于它们是自引用的，实现起来会很有挑战性。需要 `Pin` 的类型在今天最常出现在 async Rust 中，但偶尔你也会在其他上下文中看到它们。
>
> `Pin` 和 `Unpin` 如何工作以及它们需要维护的规则的详细信息在 `std::pin` 的 API 文档中有广泛的介绍，所以如果你想了解更多，那是一个很好的起点。
>
> 如果你想更详细地了解底层工作原理，请参阅[《Rust 异步编程》][async-book]的[第2章][async-book-ch2]和[第4章][async-book-ch4]。

### `Stream` Trait

现在你已经对 `Future`、`Pin` 和 `Unpin` trait 有了更深入的理解，我们可以将注意力转向 `Stream` trait。正如你在本章早些时候学到的，streams 类似于异步迭代器。然而，与 `Iterator` 和 `Future` 不同，`Stream` 在撰写本文时标准库中没有定义，但生态系统中有一个来自 `futures` crate 的非常通用的定义。

让我们在看看 `Stream` trait 可能如何将它们合并在一起之前，先回顾一下 `Iterator` 和 `Future` trait 的定义。从 `Iterator`，我们有序列的概念：它的 `next` 方法提供一个 `Option<Self::Item>`。从 `Future`，我们有随时间准备就绪的概念：它的 `poll` 方法提供一个 `Poll<Self::Output>`。为了表示随时间变得准备好的项目序列，我们定义了一个 `Stream` trait，将这些特性结合在一起：

```rust
use std::pin::Pin;
use std::task::{Context, Poll};

trait Stream {
    type Item;

    fn poll_next(
        self: Pin<&mut Self>,
        cx: &mut Context<'_>
    ) -> Poll<Option<Self::Item>>;
}
```

`Stream` trait 定义了一个名为 `Item` 的关联类型，用于 stream 产生的项目类型。这类似于 `Iterator`，可能有零到多个项目，与 `Future` 不同，`Future` 总是有一个单一的 `Output`，即使它是单元类型 `()`。

`Stream` 还定义了一个获取这些项目的方法。我们称它为 `poll_next`，以明确它以与 `Future::poll` 相同的方式轮询，并以与 `Iterator::next` 相同的方式产生项目序列。它的返回类型结合了 `Poll` 和 `Option`。外部类型是 `Poll`，因为它必须像 future 一样检查准备就绪情况。内部类型是 `Option`，因为它需要发出是否有更多消息的信号，就像迭代器一样。

非常类似于这个定义的东西最终可能会成为 Rust 标准库的一部分。在此期间，它是大多数运行时工具包的一部分，所以你可以依赖它，接下来我们介绍的所有内容通常都适用！

然而，在我们在本章早些时候[Streams：按序列排列的 Futures 部分][ch17-04]的示例中，我们没有使用 `poll_next` *或* `Stream`，而是使用了 `next` 和 `StreamExt`。我们*当然*可以手工编写我们自己的 `Stream` 状态机，直接通过 `poll_next` API 来工作，就像我们可以直接通过 `poll` 方法来处理 futures 一样。然而，使用 `await` 要好得多，`StreamExt` trait 提供了 `next` 方法，让我们可以这样做：

```rust
pub trait StreamExt: Stream {
    fn next(&mut self) -> Next<'_, Self>
    where
        Self: Unpin;
}
```

> 注意：我们在本章早些时候使用的实际定义看起来与这个略有不同，因为它支持尚未支持在 trait 中使用异步函数的 Rust 版本。因此，它看起来像这样：
>
> ```rust
> fn next(&mut self) -> Next<'_, Self> where Self: Unpin;
> ```
>
> 那个 `Next` 类型是一个实现 `Future` 的 `struct`，并允许我们用 `Next<'_, Self>` 命名对 `self` 的引用的生命周期，这样 `await` 就可以与这个方法一起工作。

`StreamExt` trait 也是所有可用于 streams 的有趣方法的所在。`StreamExt` 自动为每个实现 `Stream` 的类型实现，但这些 trait 是分开定义的，以让社区能够在不影响基础 trait 的情况下迭代便利 API。

在 `trpl` crate 使用的 `StreamExt` 版本中，该 trait 不仅定义了 `next` 方法，还提供了一个 `next` 的默认实现，正确处理调用 `Stream::poll_next` 的细节。这意味着即使你只需要编写自己的流式数据类型，你也 *只需要* 实现 `Stream`，然后使用你的数据类型的任何人都可以自动使用 `StreamExt` 及其方法。

关于这些 trait 的低级细节我们就介绍到这里。总结一下，让我们考虑 futures（包括 streams）、tasks 和 threads 如何结合在一起！

[ch17-02-messages]: /rust-book/ch17-02-concurrency-with-async
[ch18]: /rust-book/ch18-00-oop
[async-book]: https://rust-lang.github.io/async-book/
[async-book-ch2]: https://rust-lang.github.io/async-book/02_execution/01_chapter.html
[async-book-ch4]: https://rust-lang.github.io/async-book/04_pinning/01_chapter.html
[ch17-04]: /rust-book/ch17-04-streams
