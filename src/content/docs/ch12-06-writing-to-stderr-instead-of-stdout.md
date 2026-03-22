---
title: 12.6. 向 stderr 而不是 stdout 写入
---

## 将错误重定向到标准错误

目前，我们使用 `println!` 宏将所有输出发送到终端。在大多数终端中，有两种输出： _标准输出_ （`stdout`）用于一般信息， _标准错误_ （`stderr`）用于错误消息。这种区分使用户能够选择将程序的成功输出定向到文件，但仍将错误消息打印到屏幕。

`println!` 宏只能打印到标准输出，所以我们必须使用其他方法来打印到标准错误。

### 检查错误写入的位置

首先，让我们观察 `minigrep` 打印的内容当前是如何写入标准输出的，包括我们想要写入标准错误而不是标准输出的任何错误消息。我们将通过重定向标准输出流到文件来做到这一点，同时故意造成一个错误。我们不会重定向标准错误流，所以发送到标准错误的任何内容将继续显示在屏幕上。

命令行程序应该将错误消息发送到标准错误流，这样即使我们将标准输出流重定向到文件，我们仍然可以在屏幕上看到错误消息。我们的程序目前表现不佳：我们即将看到它将错误消息输出保存到文件中！

为了演示这种行为，我们将使用 `>` 和文件路径 *output.txt* 运行程序，我们想要将标准输出流重定向到该文件。我们不传递任何参数，这应该会导致错误：

```console
$ cargo run > output.txt
```

`>` 语法告诉 shell 将标准输出的内容写入 *output.txt* 而不是屏幕。我们没有看到我们期望的错误消息打印到屏幕上，所以这意味着它一定最终进入了文件。这是 *output.txt* 包含的内容：

```text
Problem parsing arguments: not enough arguments
```

是的，我们的错误消息正在打印到标准输出。像这样的错误消息打印到标准错误会更有用，这样只有来自成功运行的数据才会进入文件。我们将改变这一点。

### 将错误打印到标准错误

我们将使用**清单 12-24**中的代码来改变错误消息的打印方式。由于我们在本章前面进行的重构，所有打印错误消息的代码都在一个函数 `main` 中。标准库提供了 `eprintln!` 宏，它打印到标准错误流，所以让我们将调用 `println!` 打印错误的两个地方改为使用 `eprintln!`。

**清单 12-24**：使用 `eprintln!` 将错误消息写入标准错误而不是标准输出（文件名：*src/main.rs*）

```rust
fn main() {
    let args: Vec<String> = env::args().collect();

    let config = Config::build(&args).unwrap_or_else(|err| {
        eprintln!("Problem parsing arguments: {err}");
        process::exit(1);
    });

    if let Err(e) = run(config) {
        eprintln!("Application error: {e}");
        process::exit(1);
    }
}
```

现在让我们再次以相同的方式运行程序，不带任何参数并重定向标准输出：

```console
$ cargo run > output.txt
Problem parsing arguments: not enough arguments
```

现在我们在屏幕上看到了错误，*output.txt* 中没有任何内容，这正是我们期望的命令行程序的行为。

让我们再次运行程序，使用不会导致错误的参数，但仍将标准输出重定向到文件，如下所示：

```console
$ cargo run -- to poem.txt > output.txt
```

我们不会看到任何输出到终端，*output.txt* 将包含我们的结果：

*文件名：output.txt*

```text
Are you nobody, too?
How dreary to be somebody!
```

这证明我们现在将标准输出用于成功输出，并将标准错误用于错误输出。

## 总结

本章回顾了你到目前为止学到的一些主要概念，并介绍了如何在 Rust 中执行常见的 I/O 操作。通过使用命令行参数、文件、环境变量和用于打印错误的 `eprintln!` 宏，你现在准备好编写命令行应用程序了。结合前几章中的概念，你的代码将组织良好，在适当的数据结构中有效地存储数据，优雅地处理错误，并经过良好的测试。

接下来，我们将探索一些受函数式语言影响的 Rust 特性：闭包和迭代器。
