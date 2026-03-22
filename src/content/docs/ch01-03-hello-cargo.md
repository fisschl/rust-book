---
title: 1.3. Hello, Cargo!
---

Cargo 是 Rust 的构建系统和包管理器。大多数 Rustaceans 使用这个工具来管理他们的 Rust 项目，因为 Cargo 为你处理了很多任务，比如构建你的代码、下载你的代码依赖的库以及构建那些库。（我们将你的代码需要的库称为 *依赖*。）

最简单的 Rust 程序，比如我们迄今为止编写的程序，没有任何依赖。如果我们用 Cargo 构建 "Hello, world!" 项目，它将只使用 Cargo 中处理构建代码的部分。当你编写更复杂的 Rust 程序时，你会添加依赖，如果你使用 Cargo 启动项目，添加依赖会容易得多。

因为绝大多数 Rust 项目都使用 Cargo，本书其余部分假设你也使用 Cargo。如果你在["安装"][installation]部分讨论了官方安装程序，Cargo 会随 Rust 一起安装。如果你通过其他方式安装了 Rust，在终端中输入以下内容检查 Cargo 是否已安装：

```console
$ cargo --version
```

如果你看到版本号，说明你已安装！如果你看到错误，比如 `command not found`，请查看你安装方法的文档，以确定如何单独安装 Cargo。

## 使用 Cargo 创建项目

让我们使用 Cargo 创建一个新项目，看看它与我们原来的 "Hello, world!" 项目有何不同。导航回你的 *projects* 目录（或你决定存储代码的任何地方）。然后，在任何操作系统上，运行以下命令：

```console
$ cargo new hello_cargo
$ cd hello_cargo
```

第一个命令创建了一个名为 *hello_cargo* 的新目录和项目。我们将项目命名为 *hello_cargo*，Cargo 在同名目录中创建其文件。

进入 *hello_cargo* 目录并列出文件。你会看到 Cargo 为我们生成了两个文件和一个目录：一个 *Cargo.toml* 文件和一个包含 *main.rs* 文件的 *src* 目录。

它还初始化了一个新的 Git 仓库以及一个 *.gitignore* 文件。如果你在现有的 Git 仓库中运行 `cargo new`，Git 文件将不会被生成；你可以使用 `cargo new --vcs=git` 覆盖此行为。

> 注意：Git 是一种常见的版本控制系统。你可以通过使用 `--vcs` 标志来更改 `cargo new` 以使用不同的版本控制系统或不使用版本控制系统。运行 `cargo new --help` 查看可用选项。

在你选择的文本编辑器中打开 *Cargo.toml*。它应该看起来类似于清单 1-2 中的代码。

**清单 1-2**：`cargo new` 生成的 *Cargo.toml* 内容（文件名：*Cargo.toml*）

```toml
[package]
name = "hello_cargo"
version = "0.1.0"
edition = "2024"

[dependencies]
```

这个文件采用 [_TOML_][toml]（_Tom's Obvious, Minimal Language_）格式，这是 Cargo 的配置格式。

第一行 `[package]` 是一个节标题，表示以下语句正在配置一个包。随着我们向此文件添加更多信息，我们将添加其他节。

接下来的三行设置了 Cargo 编译程序所需的配置信息：名称、版本和要使用的 Rust edition。我们将在[附录 E][appendix-e] 中讨论 `edition` 键。

最后一行 `[dependencies]` 是列出项目任何依赖项的节的开始。在 Rust 中，代码包被称为 *crates*。这个项目不需要任何其他 crates，但我们在第 2 章的第一个项目中会需要，所以那时我们会使用这个依赖项节。

现在打开 *src/main.rs* 看看：

*文件名: src/main.rs*

```rust
fn main() {
    println!("Hello, world!");
}
```

Cargo 为你生成了一个 "Hello, world!" 程序，就像我们写的清单 1-1 一样！到目前为止，我们的项目与 Cargo 生成的项目之间的区别在于，Cargo 将代码放在 *src* 目录中，而我们在顶层目录中有一个 *Cargo.toml* 配置文件。

Cargo 期望你的源文件位于 *src* 目录中。顶层项目目录仅用于 README 文件、许可证信息、配置文件以及任何与代码无关的其他内容。使用 Cargo 帮助你组织项目。万物有其位，各就其位。

如果你启动了一个不使用 Cargo 的项目，就像我们用 "Hello, world!" 项目那样，你可以将其转换为使用 Cargo 的项目。将项目代码移动到 *src* 目录中并创建一个适当的 *Cargo.toml* 文件。获取该 *Cargo.toml* 文件的一个简单方法是运行 `cargo init`，它会自动为你创建。

## 构建和运行 Cargo 项目

现在让我们看看使用 Cargo 构建和运行 "Hello, world!" 程序时有什么不同！从你的 *hello_cargo* 目录中，通过输入以下命令来构建你的项目：

```console
$ cargo build
   Compiling hello_cargo v0.1.0 (file:///projects/hello_cargo)
    Finished dev [unoptimized + debuginfo] target(s) in 2.85 secs
```

此命令在 *target/debug/hello_cargo*（或 Windows 上的 *target\debug\hello_cargo.exe*）而不是当前目录中创建可执行文件。因为默认构建是调试构建，Cargo 将二进制文件放在名为 *debug* 的目录中。你可以使用以下命令运行可执行文件：

```console
$ ./target/debug/hello_cargo # 或在 Windows 上使用 .\target\debug\hello_cargo.exe
Hello, world!
```

如果一切顺利，`Hello, world!` 应该会打印到终端。第一次运行 `cargo build` 还会导致 Cargo 在顶层创建一个名为 *Cargo.lock* 的新文件。这个文件跟踪项目中依赖项的确切版本。这个项目没有依赖项，所以文件有点稀疏。你永远不需要手动更改这个文件；Cargo 为你管理其内容。

我们刚刚用 `cargo build` 构建了一个项目，并用 `./target/debug/hello_cargo` 运行了它，但我们也可以使用 `cargo run` 在一个命令中编译代码然后运行生成的可执行文件：

```console
$ cargo run
    Finished dev [unoptimized + debuginfo] target(s) in 0.0 secs
     Running `target/debug/hello_cargo`
Hello, world!
```

使用 `cargo run` 比必须记住运行 `cargo build` 然后使用二进制文件的完整路径更方便，所以大多数开发人员使用 `cargo run`。

注意，这次我们没有看到表明 Cargo 正在编译 `hello_cargo` 的输出。Cargo 发现文件没有更改，所以她没有重新构建，只是运行了二进制文件。如果你修改了源代码，Cargo 会在运行之前重新构建项目，你会看到以下输出：

```console
$ cargo run
   Compiling hello_cargo v0.1.0 (file:///projects/hello_cargo)
    Finished dev [unoptimized + debuginfo] target(s) in 0.33 secs
     Running `target/debug/hello_cargo`
Hello, world!
```

Cargo 还提供了一个名为 `cargo check` 的命令。此命令快速检查你的代码以确保它能编译，但不生成可执行文件：

```console
$ cargo check
   Checking hello_cargo v0.1.0 (file:///projects/hello_cargo)
    Finished dev [unoptimized + debuginfo] target(s) in 0.32 secs
```

为什么不想要可执行文件呢？通常，`cargo check` 比 `cargo build` 快得多，因为它跳过了生成可执行文件的步骤。如果你在编写代码时不断检查你的工作，使用 `cargo check` 会加快让你知道项目是否仍在编译的过程！因此，许多 Rustaceans 在编写程序时定期运行 `cargo check` 以确保它能编译。然后，当他们准备使用可执行文件时，他们运行 `cargo build`。

让我们回顾一下我们目前学到的关于 Cargo 的知识：

- 我们可以使用 `cargo new` 创建项目。
- 我们可以使用 `cargo build` 构建项目。
- 我们可以使用 `cargo run` 一步构建并运行项目。
- 我们可以使用 `cargo check` 构建项目而不生成二进制文件以检查错误。
- Cargo 不会将构建结果保存在与代码相同的目录中，而是将其存储在 *target/debug* 目录中。

使用 Cargo 的另一个优点是，无论你使用哪种操作系统，命令都是相同的。所以，在这一点上，我们将不再提供 Linux 和 macOS 与 Windows 的特定说明。

## 发布构建

当你的项目最终准备好发布时，你可以使用 `cargo build --release` 来用优化编译它。此命令将在 *target/release* 而不是 *target/debug* 中创建可执行文件。优化使你的 Rust 代码运行得更快，但打开优化会延长编译程序所需的时间。这就是为什么有两个不同的配置文件：一个用于开发，当你想要快速频繁地重新构建时；另一个用于构建你将给用户的最终程序，它不会被反复重新构建，并且会尽可能快地运行。如果你在对代码的运行时间进行基准测试，请务必运行 `cargo build --release` 并对 *target/release* 中的可执行文件进行基准测试。


## 利用 Cargo 的惯例

对于简单的项目，Cargo 相比仅使用 `rustc` 并没有提供太多价值，但随着你的程序变得更复杂，它将证明其价值。一旦程序增长到多个文件或需要一个依赖项，让 Cargo 协调构建会容易得多。

尽管 `hello_cargo` 项目很简单，但它现在使用了很多你在 Rust 职业生涯其余部分会用到的真正工具。事实上，要在任何现有项目上工作，你可以使用以下命令使用 Git 检出代码，切换到该项目的目录，然后构建：

```console
$ git clone example.org/someproject
$ cd someproject
$ cargo build
```

有关 Cargo 的更多信息，请查看[其文档][cargo]。

## 小结

你已经在 Rust 之旅中迈出了良好的一步！在本章中，你学会了如何：

- 使用 `rustup` 安装最新稳定版本的 Rust。
- 更新到较新的 Rust 版本。
- 打开本地安装的文档。
- 直接使用 `rustc` 编写和运行 "Hello, world!" 程序。
- 使用 Cargo 的惯例创建和运行新项目。

现在是构建一个更实质性的程序来熟悉阅读和编写 Rust 代码的好时机。所以，在第 2 章，我们将构建一个猜数字游戏程序。如果你宁愿先学习 Rust 中常见编程概念的工作原理，请参阅第 3 章，然后返回第 2 章。

[installation]: /rust-book/ch01-01-installation
[toml]: https://toml.io
[appendix-e]: /rust-book/appendix-05-editions
[cargo]: https://doc.rust-lang.org/cargo/
