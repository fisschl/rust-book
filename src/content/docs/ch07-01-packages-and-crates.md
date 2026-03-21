---
title: "包和 crate"
---

我们要介绍的模块系统的第一部分是包和 crate。

*crate* 是 Rust 编译器一次考虑的最小代码量。即使你运行 `rustc` 而不是 `cargo` 并传递一个源代码文件（就像我们在第 1 章的["Rust 程序基础"][basics]中一直做的那样），编译器也会认为该文件是一个 crate。crate 可以包含模块，而模块可以定义在与 crate 一起编译的其他文件中，我们将在接下来的章节中看到。

crate 可以有两种形式之一：二进制 crate 或库 crate。*二进制 crate* 是可以编译为可执行文件的程序，你可以运行它，例如命令行程序或服务器。每个二进制 crate 必须有一个名为 `main` 的函数，它定义了可执行文件运行时发生的事情。迄今为止我们创建的所有 crate 都是二进制 crate。

*库 crate* 没有 `main` 函数，它们不会编译为可执行文件。相反，它们定义了旨在与多个项目共享的功能。例如，我们在 [第 2 章][rand] 使用的 `rand` crate 提供了生成随机数的功能。大多数时候，当 Rust 爱好者说"crate"时，他们指的是库 crate，他们使用"crate"一词与"库"这一通用编程概念互换。

*crate 根*是 Rust 编译器从其开始编译的源文件，它构成了你的 crate 的根模块（我们将在["用模块控制作用域和隐私"][modules]中深入解释模块）。

*包*是一个或多个 crate 的捆绑包，提供一组功能。包包含一个描述如何构建这些 crate 的 *Cargo.toml* 文件。Cargo 实际上是一个包，包含你用来构建代码的命令行工具的二进制 crate。Cargo 包还包含二进制 crate 依赖的库 crate。其他项目可以依赖 Cargo 库 crate 来使用 Cargo 命令行工具使用的相同逻辑。

一个包可以包含任意数量的二进制 crate，但最多只能有一个库 crate。一个包必须包含至少一个 crate，无论是库 crate 还是二进制 crate。

让我们看看创建包时会发生什么。首先，我们输入命令 `cargo new my-project`：

```console
$ cargo new my-project
     Created binary (application) `my-project` package
$ ls my-project
Cargo.toml
src
$ ls my-project/src
main.rs
```

运行 `cargo new my-project` 后，我们使用 `ls` 查看 Cargo 创建的内容。在 *my-project* 目录中，有一个 *Cargo.toml* 文件，这给了我们一个包。还有一个包含 *main.rs* 的 *src* 目录。在你的文本编辑器中打开 *Cargo.toml*，注意没有提到 *src/main.rs*。Cargo 遵循一个约定，即 *src/main.rs* 是与包同名的二进制 crate 的 crate 根。同样，Cargo 知道如果包目录包含 *src/lib.rs*，则该包包含一个与包同名的库 crate，而 *src/lib.rs* 是其 crate 根。Cargo 将 crate 根文件传递给 `rustc` 来构建库或二进制文件。

在这里，我们有一个只包含 *src/main.rs* 的包，意味着它只包含一个名为 `my-project` 的二进制 crate。如果一个包包含 *src/main.rs* 和 *src/lib.rs*，它就有两个 crate：一个二进制 crate 和一个库 crate，两者都与包同名。一个包可以通过将文件放在 *src/bin* 目录中来拥有多个二进制 crate：每个文件将是一个单独的二进制 crate。

[basics]: /rust-book/ch01-03-hello-cargo/
[rand]: /rust-book/ch02-00-guessing-game-tutorial/
[modules]: /rust-book/ch07-02-defining-modules-to-control-scope-and-privacy/
