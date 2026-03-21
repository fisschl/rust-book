---
title: Futures 和 Async 语法
---

Rust 中异步编程的关键元素是 *futures* 和 Rust 的 `async` 和 `await` 关键字。

*Future* 是一个现在可能还没准备好，但在将来的某个时间点会变得准备好的值。（这个概念出现在许多语言中，有时以其他名称如 *task* 或 *promise* 出现。）Rust 提供了一个 `Future` trait 作为构建块，这样不同的异步操作可以用不同的数据结构实现，但具有共同的接口。在 Rust 中，futures 是实现 `Future` trait 的类型。每个 future 持有关于已取得的进展以及"准备好"意味着什么的自己的信息。

你可以将 `async` 关键字应用于代码块和函数，以指定它们可以被中断和恢复。在 async 代码块或 async 函数中，你可以使用 `await` 关键字来 *等待一个 future* （即等待它变得准备好）。在 async 代码块或函数中等待 future 的任何点都是该代码块或函数可以暂停和恢复的潜在位置。检查 future 以查看其值是否可用的过程称为 *轮询*（polling）。

一些其他语言，如 C# 和 JavaScript，也使用 `async` 和 `await` 关键字进行异步编程。如果你熟悉这些语言，你可能会注意到 Rust 处理语法的方式有一些显著的差异。这是有充分理由的，正如我们将看到的！

在编写 async Rust 时，我们大部分时间使用 `async` 和 `await` 关键字。Rust 将它们编译成使用 `Future` trait 的等效代码，就像它将 `for` 循环编译成使用 `Iterator` trait 的等效代码一样。因为 Rust 提供了 `Future` trait，所以在需要时你也可以为自己的数据类型实现它。我们在本章中看到的许多函数都返回具有自己 `Future` 实现的类型。我们将在本章末尾回到 trait 的定义并深入探讨它的工作原理，但这些细节足以让我们继续前进。

这一切可能感觉有点抽象，所以让我们编写我们的第一个异步程序：一个小型网络爬虫。我们将从命令行传入两个 URL，并发地获取它们，并返回先完成的那个的结果。这个例子会有很多新语法，但不用担心——我们会解释你需要知道的一切。

## 我们的第一个异步程序

为了保持本章的重点是学习 async 而不是在生态系统的各个部分之间周旋，我们创建了 `trpl` crate（`trpl` 是 "The Rust Programming Language" 的缩写）。它重新导出了你需要的所有类型、trait 和函数，主要来自 [`futures`][futures-crate] 和 [`tokio`][tokio] crate。`futures` crate 是 Rust 异步代码实验的官方场所，实际上 `Future` trait 最初就是在这里设计的。Tokio 是当今 Rust 中最广泛使用的异步运行时，特别是对于 Web 应用程序。还有其他很棒的运行时，它们可能更适合你的目的。我们在 `trpl` 的底层使用 `tokio` crate，因为它经过了良好的测试并且被广泛使用。

在某些情况下，`trpl` 还会重命名或包装原始 API，以让你专注于本章相关的细节。如果你想了解这个 crate 做了什么，我们鼓励你查看[它的源代码][trpl-source]。你可以看到每个重新导出来自哪个 crate，我们还留下了广泛的注释解释这个 crate 做了什么。

创建一个名为 `hello-async` 的新二进制项目，并添加 `trpl` crate 作为依赖：

```console
$ cargo new hello-async
$ cd hello-async
$ cargo add trpl
```

现在我们可以使用 `trpl` 提供的各种部分来编写我们的第一个异步程序。我们将构建一个小型命令行工具，获取两个网页，从每个页面中提取 `<title>` 元素，并打印出先完成整个过程的页面的标题。

### 定义 page_title 函数

让我们从编写一个函数开始，该函数接受一个页面 URL 作为参数，向它发出请求，并返回 `<title>` 元素的文本（见清单 17-1）。

**清单 17-1**：定义一个异步函数来获取 HTML 页面的 title 元素

```rust
async fn page_title(url: &str) -> Option<String> {
    let text = trpl::get(url).await.text().await;
    Html::parse(&text)
        .select_first("title")
        .map(|title| title.inner_html())
}
```

首先，我们定义一个名为 `page_title` 的函数，并用 `async` 关键字标记它。然后我们使用 `trpl::get` 函数获取传入的 URL 并添加 `await` 关键字来等待响应。为了获取 `response` 的文本，我们调用它的 `text` 方法，并再次使用 `await` 关键字等待它。这两个步骤都是异步的。对于 `get` 函数，我们必须等待服务器发回其响应的第一部分，这将包括 HTTP 头、cookies 等等，并且可以单独从响应体传递。特别是如果体非常大，可能需要一些时间才能全部到达。因为我们必须等待响应的 *全部* 到达，所以 `text` 方法也是异步的。

我们必须显式地等待这两个 future，因为 Rust 中的 future 是 *惰性* 的：除非你使用 `await` 关键字要求它们，否则它们不会做任何事。（事实上，如果你不使用 future，Rust 会显示编译器警告。）这可能会让你想起第13章[迭代器部分][ch13-02]关于迭代器的讨论。迭代器什么也不做，除非你调用它们的 `next` 方法——无论是直接调用还是通过使用 `for` 循环或在底层使用 `next` 的 `map` 等方法。同样，future 什么也不做，除非你显式地要求它们。这种惰性允许 Rust 避免运行实际上不需要的异步代码。

> 注意：这与我们在第16章[创建新线程部分][ch16-01]使用 `thread::spawn` 时看到的行为不同，我们传递给另一个线程的闭包立即开始运行。这也与许多其他语言处理 async 的方式不同。但这对 Rust 能够提供其性能保证很重要，就像对迭代器一样。

一旦我们有了 `response_text`，我们就可以使用 `Html::parse` 将其解析为 `Html` 类型的实例。我们现在有了一个数据类型，我们可以用它来将 HTML 作为更丰富的数据结构来处理。特别是，我们可以使用 `select_first` 方法来查找给定 CSS 选择器的第一个实例。通过传入字符串 `"title"`，我们将获得文档中的第一个 `<title>` 元素（如果有的话）。因为可能没有匹配的元素，`select_first` 返回一个 `Option<ElementRef>`。最后，我们使用 `Option::map` 方法，如果 `Option` 中存在项目，它就让我们处理该项目，如果不存在就什么都不做。（我们也可以在这里使用 `match` 表达式，但 `map` 更符合惯用法。）在我们提供给 `map` 的函数体中，对 `title` 调用 `inner_html` 来获取其内容，这是一个 `String`。当一切都说完了，我们有了一个 `Option<String>`。

注意 Rust 的 `await` 关键字在你 *正在等待* 的表达式 *之后* ，而不是在它之前。也就是说，它是一个 *后缀* 关键字。如果你在其他语言中使用过 `async`，这可能与你习惯的不同，但在 Rust 中，它使得方法链更加友好。因此，我们可以将 `page_title` 的主体改为用 `await` 将 `trpl::get` 和 `text` 函数调用链接在一起，如清单 17-2 所示。

**清单 17-2**：使用 `await` 关键字进行链式调用

```rust
async fn page_title(url: &str) -> Option<String> {
    trpl::get(url).await.text().await
        .select_first("title")
        .map(|title| title.inner_html())
}
```

至此，我们成功编写了第一个异步函数！在我们在 `main` 中添加一些代码来调用它之前，让我们再谈谈我们写的内容以及它的含义。

当 Rust 看到一个用 `async` 关键字标记的 *代码块* 时，它将其编译成一个唯一的、匿名数据类型，该类型实现 `Future` trait。当 Rust 看到一个用 `async` 标记的 *函数* 时，它将其编译成一个非异步函数，其主体是一个 async 代码块。异步函数的返回类型是编译器为那个 async 代码块创建的匿名数据类型的类型。

因此，写 `async fn` 等同于写一个返回返回类型的 *future* 的函数。对编译器来说，像清单 17-1 中的 `async fn page_title` 这样的函数定义大致等同于这样定义的非异步函数：

```rust
use std::future::Future;
use trpl::Html;

fn page_title(url: &str) -> impl Future<Output = Option<String>> {
    async move {
        let text = trpl::get(url).await.text().await;
        Html::parse(&text)
            .select_first("title")
            .map(|title| title.inner_html())
    }
}
```

让我们逐个部分地看看转换后的版本：

- 它使用了我们在第10章[Trait 作为参数部分][ch10-02]讨论的 `impl Trait` 语法。
- 返回的值实现了带有 `Output` 关联类型的 `Future` trait。注意 `Output` 类型是 `Option<String>`，这与 `async fn` 版本的 `page_title` 的原始返回类型相同。
- 原始函数体中调用的所有代码都包装在一个 `async move` 代码块中。记住，代码块是表达式。整个代码块是从函数返回的表达式。
- 这个 async 代码块产生一个类型为 `Option<String>` 的值，正如刚才描述的。该值与返回类型中的 `Output` 类型匹配。这就像你见过的其他代码块一样。
- 新函数体是一个 `async move` 代码块，因为它使用了 `url` 参数。（稍后在本章中，我们会更多地讨论 `async` 与 `async move`。）

现在我们可以在 `main` 中调用 `page_title` 了。

### 使用运行时执行异步函数

首先，我们将获取单个页面的标题，如清单 17-3 所示。不幸的是，这段代码还不能编译。

**清单 17-3**：从 `main` 调用 `page_title` 函数并传入用户提供的参数

```rust
async fn main() {
    let args: Vec<String> = std::env::args().collect();
    let url = &args[1];
    match page_title(url).await {
        Some(title) => println!("The title for {url} was {title}"),
        None => println!("{url} had no title"),
    }
}
```

我们遵循在第12章[接受命令行参数部分][ch12-01]使用的相同模式来获取命令行参数。然后我们将 URL 参数传递给 `page_title` 并等待结果。因为 future 产生的值是一个 `Option<String>`，我们使用 `match` 表达式来打印不同的消息，以说明页面是否有 `<title>`。

唯一能使用 `await` 关键字的地方是在异步函数或代码块中，而 Rust 不允许我们将特殊的 `main` 函数标记为 `async`。

```text
error[E0752]: `main` function is not allowed to be `async`
 --> src/main.rs:6:1
  |
6 | async fn main() {
  | ^^^^^^^^^^^^^^^ `main` function is not allowed to be `async`
```

`main` 不能被标记为 `async` 的原因是异步代码需要一个 *运行时* ：一个管理异步代码执行细节的 Rust crate。程序的 `main` 函数可以 *初始化* 一个运行时，但它本身不是一个运行时。（我们稍后会看到为什么会这样。）每个执行异步代码的 Rust 程序至少有一个地方设置了一个执行 futures 的运行时。

大多数支持 async 的语言都会捆绑一个运行时，但 Rust 不会。相反，有许多不同的异步运行时可用，每个运行时都针对其目标用例做出了不同的权衡。例如，一个具有多个 CPU 核心和大量 RAM 的高吞吐量 Web 服务器与只有一个核心、少量 RAM 且没有堆分配能力的微控制器有着非常不同的需求。提供这些运行时的 crate 通常还提供文件或网络 I/O 等常见功能的异步版本。

在这里，以及本章的其余部分，我们将使用 `trpl` crate 中的 `block_on` 函数，它接受一个 future 作为参数，并阻塞当前线程直到这个 future 运行完成。在幕后，调用 `block_on` 使用 `tokio` crate 设置一个运行时来运行传入的 future（`trpl` crate 的 `block_on` 行为类似于其他运行时 crate 的 `block_on` 函数）。一旦 future 完成，`block_on` 就返回 future 产生的任何值。

我们可以直接将 `page_title` 返回的 future 传递给 `block_on`，一旦它完成，我们就可以像在清单 17-3 中尝试的那样匹配产生的 `Option<String>`。然而，对于本章中的大多数示例（以及现实世界中的大多数异步代码），我们将执行多个异步函数调用，所以我们改为传递一个 `async` 代码块，并显式地等待 `page_title` 调用的结果，如清单 17-4 所示。

**清单 17-4**：使用 `trpl::block_on` 等待 async 代码块

```rust
fn main() {
    let args: Vec<String> = std::env::args().collect();
    let url = &args[1];
    trpl::block_on(async {
        match page_title(url).await {
            Some(title) => println!("The title for {url} was {title}"),
            None => println!("{url} had no title"),
        }
    });
}
```

当我们运行这段代码时，我们得到了最初预期的行为：

```console
$ cargo run -- "https://www.rust-lang.org"
    Finished `dev` profile [unoptimized + debuginfo] target(s) in 0.05s
     Running `target/debug/async_await 'https://www.rust-lang.org'`
The title for https://www.rust-lang.org was
            Rust Programming Language
```

呼——我们终于有了一些可以工作的异步代码！但在我们添加代码来让两个网站竞争之前，让我们简要地将注意力转回到 futures 是如何工作的。

每个 *等待点* ——也就是说，代码使用 `await` 关键字的每个地方——代表控制权被交还给运行时的位置。为了使这一点工作，Rust 需要跟踪 async 代码块中涉及的状态，这样运行时就可以启动一些其他工作，然后在准备好再次尝试推进第一个工作时回来。这是一个看不见的状态机，就像你写的这样一个枚举来在每个等待点保存当前状态：

```rust
enum StateMachine {
    Start,
    AwaitingGet,
    AwaitingText,
    Ready,
}
```

手动编写在每个状态之间转换的代码将是乏味且容易出错的，特别是当你需要向代码添加更多功能和更多状态时。幸运的是，Rust 编译器自动为异步代码创建和管理状态机数据结构。正常的借用和所有权规则仍然适用于数据结构，而且令人高兴的是，编译器也为我们处理这些检查并提供有用的错误消息。我们将在本章稍后介绍其中的一些。

最终，必须执行这个状态机，而执行它的就是运行时。（这就是为什么你在研究运行时时可能会遇到 *执行器* 的提及：执行器是运行时负责执行异步代码的部分。）

现在你可以明白为什么编译器阻止我们在清单 17-3 中将 `main` 本身作为异步函数了。如果 `main` 是异步函数，其他东西就需要管理返回的 future 的状态机，但 `main` 是程序的起点！相反，我们在 `main` 中调用了 `trpl::block_on` 函数来设置一个运行时，并运行 `async` 代码块返回的 future 直到完成。

> 注意：一些运行时提供宏，让你 *可以* 编写 async `main` 函数。这些宏将 `async fn main() { ... }` 重写为一个普通的 `fn main`，它执行我们在清单 17-4 中手动做的相同事情：调用一个像 `trpl::block_on` 那样将 future 运行完成的函数。

现在让我们把这些部分放在一起，看看我们如何编写并发代码。

### 让两个 URL 并发竞争

在清单 17-5 中，我们用从命令行传入的两个不同的 URL 调用 `page_title`，并通过选择先完成的 future 来让它们竞争。

**清单 17-5**：为两个 URL 调用 `page_title` 以查看哪个先返回

```rust
fn main() {
    let args: Vec<String> = std::env::args().collect();
    let url_1 = &args[1];
    let url_2 = &args[2];
    
    trpl::block_on(async {
        let title_fut_1 = page_title(url_1);
        let title_fut_2 = page_title(url_2);
        
        let (url, title) = match trpl::select(title_fut_1, title_fut_2).await {
            trpl::Either::Left((title, url)) => (url, title),
            trpl::Either::Right((title, url)) => (url, title),
        };
        
        match title {
            Some(title) => println!("The title for {url} was {title}"),
            None => println!("{url} had no title"),
        }
    });
}

async fn page_title(url: &str) -> (Option<String>, &str) {
    let text = trpl::get(url).await.text().await;
    let title = Html::parse(&text)
        .select_first("title")
        .map(|title| title.inner_html());
    (title, url)
}
```

我们首先为每个用户提供的 URL 调用 `page_title`。我们将产生的 futures 保存为 `title_fut_1` 和 `title_fut_2`。记住，这些还什么都不做，因为 futures 是惰性的，我们还没有等待它们。然后我们将 futures 传递给 `trpl::select`，它返回一个值来表明传递给它的哪个 future 先完成。

> 注意：在底层，`trpl::select` 构建在 `futures` crate 中定义的一个更通用的 `select` 函数上。`futures` crate 的 `select` 函数可以做很多 `trpl::select` 函数不能做的事情，但它也有一些我们可以暂时跳过的额外复杂性。

任何一个 future 都可能合法地"获胜"，所以返回 `Result` 没有意义。相反，`trpl::select` 返回一个我们以前没见过的新类型，`trpl::Either`。`Either` 类型在某种程度上类似于 `Result`，因为它有两个变体。但与 `Result` 不同的是，`Either` 没有内置成功或失败的概念。相反，它使用 `Left` 和 `Right` 来表示"一个或另一个"：

```rust
enum Either<A, B> {
    Left(A),
    Right(B),
}
```

如果第一个参数获胜，`select` 函数返回带有该 future 输出的 `Left`；如果 *那个* 参数获胜，则返回带有第二个 future 参数输出的 `Right`。这与调用函数时参数出现的顺序匹配：第一个参数在第二个参数的左边。

我们还更新了 `page_title` 以返回传入的相同 URL。这样，如果先返回的页面没有我们可以解析的 `<title>`，我们仍然可以打印出有意义的消息。有了这些信息可用，我们通过更新 `println!` 输出来结束，以表明哪个 URL 先完成以及该 URL 的网页的 `<title>`（如果有的话）是什么。

你现在构建了一个可以工作的小型网络爬虫！选择几个 URL 并运行命令行工具。你可能会发现一些网站始终比其他网站快，而在其他情况下，更快的网站每次运行都不同。更重要的是，你已经学习了使用 futures 的基础知识，所以现在我们可以更深入地研究我们能用 async 做什么。

[futures-crate]: https://crates.io/crates/futures
[tokio]: https://tokio.rs
[trpl-source]: https://github.com/rust-lang/book/tree/main/packages/trpl
[ch13-02]: /rust-book/ch13-02-iterators
[ch16-01]: /rust-book/ch16-01-threads
[ch10-02]: /rust-book/ch10-02-traits
[ch12-01]: /rust-book/ch12-01-accepting-command-line-arguments
