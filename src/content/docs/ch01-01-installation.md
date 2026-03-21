---
title: 安装
---

第一步是安装 Rust。我们将通过 `rustup` 下载 Rust，这是一个用于管理 Rust 版本和相关工具的命令行工具。下载需要互联网连接。

> 注意：如果你因为某些原因不想使用 `rustup`，请参阅[其他 Rust 安装方法页面][otherinstall]以获取更多选项。

以下步骤安装最新稳定版本的 Rust 编译器。Rust 的稳定性保证确保书中所有能编译的示例在较新的 Rust 版本中仍然可以编译。输出可能会因版本不同而略有差异，因为 Rust 经常改进错误消息和警告。换句话说，使用这些步骤安装的任何较新稳定版本的 Rust 都应该可以正常使用本书的内容。

> ## 命令行表示法
>
> 在本章和整本书中，我们会展示一些在终端中使用的命令。需要在终端中输入的行都以 `$` 开头。你不需要输入 `$` 字符；它是命令行提示符，表示每条命令的开始。不以 `$` 开头的行通常显示前一条命令的输出。此外，PowerShell 特定的示例将使用 `>` 而不是 `$`。

## 在 Linux 或 macOS 上安装 `rustup`

如果你使用的是 Linux 或 macOS，打开终端并输入以下命令：

```console
$ curl --proto '=https' --tlsv1.2 https://sh.rustup.rs -sSf | sh
```

该命令下载一个脚本并开始安装 `rustup` 工具，它会安装最新稳定版本的 Rust。你可能会被提示输入密码。如果安装成功，会出现以下提示：

```text
Rust is installed now. Great!
```

你还需要一个 *链接器*（linker），这是 Rust 用来将其编译输出连接成一个文件的程序。你可能已经安装了。如果收到链接器错误，你应该安装一个 C 编译器，它通常会包含一个链接器。C 编译器也很有用，因为一些常见的 Rust 包依赖于 C 代码，需要一个 C 编译器。

在 macOS 上，你可以通过运行以下命令获取 C 编译器：

```console
$ xcode-select --install
```

Linux 用户通常应根据其发行版的文档安装 GCC 或 Clang。例如，如果你使用 Ubuntu，可以安装 `build-essential` 包。

## 在 Windows 上安装 `rustup`

在 Windows 上，前往 [https://www.rust-lang.org/tools/install][install] 并按照安装 Rust 的说明进行操作。在安装过程中的某个时候，你会被提示安装 Visual Studio。这提供了一个链接器和编译程序所需的本机库。如果你在这一步需要更多帮助，请参阅 [https://rust-lang.github.io/rustup/installation/windows-msvc.html][msvc]。

本书其余部分使用的命令在 *cmd.exe* 和 PowerShell 中都能工作。如果有特定的差异，我们会解释应该使用哪个。

## 故障排除

要检查 Rust 是否正确安装，打开 shell 并输入以下命令：

```console
$ rustc --version
```

你应该会看到已发布的最新稳定版本的版本号、提交哈希和提交日期，格式如下：

```text
rustc x.y.z (abcabcabc yyyy-mm-dd)
```

如果你看到了这些信息，说明你已经成功安装了 Rust！如果没有看到这些信息，请按如下方式检查 Rust 是否在你的 `%PATH%` 系统变量中。

在 Windows CMD 中，使用：

```console
> echo %PATH%
```

在 PowerShell 中，使用：

```powershell
> echo $env:Path
```

在 Linux 和 macOS 中，使用：

```console
$ echo $PATH
```

如果以上都正确但 Rust 仍然无法工作，有很多地方可以寻求帮助。在[社区页面][community]上了解如何与其他 Rustaceans（我们给自己起的一个有趣的昵称）取得联系。

## 更新和卸载

一旦通过 `rustup` 安装了 Rust，更新到新发布的版本就很容易。从你的 shell 运行以下更新脚本：

```console
$ rustup update
```

要卸载 Rust 和 `rustup`，从你的 shell 运行以下卸载脚本：

```console
$ rustup self uninstall
```


## 阅读本地文档

Rust 的安装还包括一份本地文档副本，以便你可以离线阅读。运行 `rustup doc` 在浏览器中打开本地文档。

任何时候，如果你对标准库提供的某个类型或函数不确定它的作用或如何使用，可以使用应用程序编程接口（API）文档来查找！


## 使用文本编辑器和 IDE

本书不假设你使用什么工具来编写 Rust 代码。几乎任何文本编辑器都可以胜任！然而，许多文本编辑器和集成开发环境（IDE）都内置了对 Rust 的支持。你总能在 Rust 网站的[工具页面][tools]上找到相当最新的编辑器和 IDE 列表。

## 离线使用本书

在几个示例中，我们将使用超出标准库的 Rust 包。要完成这些示例，你需要有互联网连接或提前下载这些依赖项。要提前下载依赖项，你可以运行以下命令。（我们将在后面详细解释 `cargo` 是什么以及这些命令的作用。）

```console
$ cargo new get-dependencies
$ cd get-dependencies
$ cargo add rand@0.8.5 trpl@0.2.0
```

这将缓存这些包的下载，以便你以后不需要再下载它们。一旦你运行了这个命令，就不需要保留 `get-dependencies` 文件夹。如果你运行了这个命令，你可以在本书其余部分的所有 `cargo` 命令中使用 `--offline` 标志来使用这些缓存版本，而不是尝试使用网络。

[otherinstall]: https://forge.rust-lang.org/infra/other-installation-methods.html
[install]: https://www.rust-lang.org/tools/install
[msvc]: https://rust-lang.github.io/rustup/installation/windows-msvc.html
[community]: https://www.rust-lang.org/community
[tools]: https://www.rust-lang.org/tools
