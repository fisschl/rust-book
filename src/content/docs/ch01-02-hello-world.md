---
title: Hello, world!
---

现在你已经安装了 Rust，是时候编写你的第一个 Rust 程序了。学习一门新语言时，传统上会编写一个小程序将文本 `Hello, world!` 打印到屏幕上，所以我们在这里也这样做！

> 注意：本书假设你对命令行有基本的熟悉程度。Rust 对你的编辑工具或代码存放位置没有特定要求，所以如果你更喜欢使用 IDE 而不是命令行，请随意使用你喜欢的 IDE。许多 IDE 现在都支持 Rust；查看 IDE 的文档了解详情。Rust 团队一直专注于通过 `rust-analyzer` 提供出色的 IDE 支持。更多详情请参见[附录 D][devtools]。


## 项目目录设置

你将首先创建一个目录来存放你的 Rust 代码。Rust 不关心你的代码存放在哪里，但对于本书中的练习和项目，我们建议在你的主目录中创建一个 *projects* 目录，并将所有项目放在那里。

打开终端并输入以下命令来创建 *projects* 目录，并在 *projects* 目录中创建一个用于 "Hello, world!" 项目的目录。

对于 Linux、macOS 和 Windows 上的 PowerShell，输入：

```console
$ mkdir ~/projects
$ cd ~/projects
$ mkdir hello_world
$ cd hello_world
```

对于 Windows CMD，输入：

```cmd
> mkdir "%USERPROFILE%\projects"
> cd /d "%USERPROFILE%\projects"
> mkdir hello_world
> cd hello_world
```


## Rust 程序基础

接下来，创建一个新的源文件并命名为 *main.rs*。Rust 文件总是以 *.rs* 扩展名结尾。如果你在文件名中使用多个单词，惯例是使用下划线分隔。例如，使用 *hello_world.rs* 而不是 *helloworld.rs*。

现在打开你刚刚创建的 *main.rs* 文件并输入清单 1-1 中的代码。

**清单 1-1**：一个打印 `Hello, world!` 的程序（文件名：*main.rs*）

```rust
fn main() {
    println!("Hello, world!");
}
```

保存文件并返回 *~/projects/hello_world* 目录下的终端窗口。在 Linux 或 macOS 上，输入以下命令来编译和运行文件：

```console
$ rustc main.rs
$ ./main
Hello, world!
```

在 Windows 上，输入命令 `.\main` 代替 `./main`：

```powershell
> rustc main.rs
> .\main
Hello, world!
```

无论你的操作系统是什么，字符串 `Hello, world!` 都应该打印到终端。如果你没有看到这个输出，请返回安装部分的["故障排除"][troubleshooting]部分获取帮助方法。

如果 `Hello, world!` 已经打印出来，恭喜你！你已经正式编写了一个 Rust 程序。这让你成为一名 Rust 程序员——欢迎！


## Rust 程序的解剖

让我们详细回顾一下这个 "Hello, world!" 程序。这是谜题的第一部分：

```rust
fn main() {

}
```

这几行定义了一个名为 `main` 的函数。`main` 函数是特殊的：它总是在每个可执行的 Rust 程序中第一个运行的代码。这里，第一行声明了一个名为 `main` 的函数，它没有参数也不返回任何内容。如果有参数，它们会放在括号 `()` 内。

函数体被包裹在 `{}` 中。Rust 要求在所有函数体周围使用花括号。良好的风格是将左花括号放在函数声明的同一行，并在两者之间添加一个空格。

> 注意：如果你想在 Rust 项目中坚持标准风格，你可以使用一个名为 `rustfmt` 的自动格式化工具来以特定风格格式化你的代码（更多关于 `rustfmt` 的内容参见[附录 D][devtools]）。Rust 团队已将此工具与标准 Rust 发行版一起包含，就像 `rustc` 一样，所以它应该已经安装在你的电脑上了！

`main` 函数的主体包含以下代码：

```rust
println!("Hello, world!");
```

这一行在这个小程序中完成了所有工作：它将文本打印到屏幕上。这里有三个重要的细节需要注意。

首先，`println!` 调用了一个 Rust 宏。如果它调用的是一个函数，它会被输入为 `println`（不带 `!`）。Rust 宏是一种编写生成代码以扩展 Rust 语法的方式，我们将在[第 20 章][ch20-macros]中更详细地讨论它们。目前，你只需要知道使用 `!` 意味着你在调用宏而不是普通函数，宏并不总是遵循与普通函数相同的规则。

其次，你看到了 `"Hello, world!"` 字符串。我们将这个字符串作为参数传递给 `println!`，字符串被打印到屏幕上。

第三，我们以分号 `;` 结束这一行，表示这个表达式结束，下一个表达式准备开始。大多数 Rust 代码行以分号结束。


## 编译和执行

你刚刚运行了一个新创建的程序，所以让我们检查过程中的每个步骤。

在运行 Rust 程序之前，你必须使用 Rust 编译器通过输入 `rustc` 命令并传递源文件名来编译它，像这样：

```console
$ rustc main.rs
```

如果你有 C 或 C++ 背景，你会注意到这类似于 `gcc` 或 `clang`。编译成功后，Rust 输出一个二进制可执行文件。

在 Linux、macOS 和 Windows 上的 PowerShell 中，你可以在 shell 中输入 `ls` 命令查看可执行文件：

```console
$ ls
main  main.rs
```

在 Linux 和 macOS 上，你会看到两个文件。在 Windows 上使用 PowerShell，你会看到与使用 CMD 时相同的三个文件。在 Windows 上使用 CMD，你会输入：

```cmd
> dir /B %= /B 选项表示只显示文件名 =%
main.exe
main.pdb
main.rs
```

这显示了带有 _.rs_ 扩展名的源代码文件、可执行文件（Windows 上是 _main.exe_，但其他平台上是 _main_），以及在使用 Windows 时包含调试信息的 _.pdb_ 扩展名文件。从这里，你运行 _main_ 或 _main.exe_ 文件，像这样：

```console
$ ./main # 或在 Windows 上使用 .\main
```

如果你的 _main.rs_ 是你的 "Hello, world!" 程序，这一行会将 `Hello, world!` 打印到你的终端。

如果你更熟悉动态语言，比如 Ruby、Python 或 JavaScript，你可能不习惯将编译和运行程序作为单独的步骤。Rust 是一种*预编译*语言，这意味着你可以编译一个程序并将可执行文件给别人，即使他们没有安装 Rust 也能运行它。如果你给别人一个 _.rb_、_.py_ 或 _.js_ 文件，他们需要有 Ruby、Python 或 JavaScript 实现（分别）安装。但在那些语言中，你只需要一个命令就可以编译和运行你的程序。语言设计中一切都是权衡。

仅使用 `rustc` 编译对于简单的程序来说没问题，但随着项目增长，你会想要管理所有选项并轻松分享你的代码。接下来，我们将向你介绍 Cargo 工具，它将帮助你编写真实世界的 Rust 程序。

[troubleshooting]: ch01-01-installation.html#troubleshooting
[devtools]: appendix-04-useful-development-tools.html
[ch20-macros]: ch20-05-macros.html
