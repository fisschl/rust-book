---
title: 12.1. 接受命令行参数
---

让我们像往常一样用 `cargo new` 创建一个新项目。我们将我们的项目称为 `minigrep`，以区分你可能已经在系统上拥有的 `grep` 工具：

```console
$ cargo new minigrep
     Created binary (application) `minigrep` project
$ cd minigrep
```

第一个任务是让 `minigrep` 接受它的两个命令行参数：文件路径和要搜索的字符串。也就是说，我们希望能够使用 `cargo run` 运行我们的程序，使用两个连字符表示后面的参数是给我们的程序而不是给 `cargo` 的，一个要搜索的字符串，以及一个要搜索的文件路径，像这样：

```console
$ cargo run -- searchstring example-filename.txt
```

现在，`cargo new` 生成的程序无法处理我们给它的参数。[crates.io](https://crates.io/) 上有一些现有的库可以帮助编写接受命令行参数的程序，但因为你正在学习这个概念，让我们自己实现这个功能。

### 读取参数值

为了让 `minigrep` 能够读取我们传递给它的命令行参数的值，我们需要 Rust 标准库中提供的 `std::env::args` 函数。这个函数返回传递给 `minigrep` 的命令行参数的迭代器。我们将在第 13 章中全面介绍迭代器。现在，你只需要知道关于迭代器的两个细节：迭代器产生一系列值，我们可以在迭代器上调用 `collect` 方法将其转换为集合，例如包含迭代器产生的所有元素的 vector。

清单 12-1 中的代码允许你的 `minigrep` 程序读取传递给它的任何命令行参数，然后将值收集到 vector 中。

**清单 12-1**：将命令行参数收集到 vector 中并打印它们（*文件名：src/main.rs*）

```rust
use std::env;

fn main() {
    let args: Vec<String> = env::args().collect();
    dbg!(args);
}
```

首先，我们用 `use` 语句将 `std::env` 模块引入作用域，以便我们可以使用它的 `args` 函数。注意 `std::env::args` 函数嵌套在两个模块级别中。正如我们在第 7 章中讨论的，在期望的函数嵌套在多个模块中的情况下，我们选择将父模块引入作用域而不是函数。通过这样做，我们可以轻松使用 `std::env` 中的其他函数。这也比添加 `use std::env::args` 然后只用 `args` 调用函数更不明确，因为 `args` 很容易被误认为是在当前模块中定义的函数。

> ### `args` 函数和无效 Unicode
>
> 注意，如果任何参数包含无效 Unicode，`std::env::args` 将会 panic。如果你的程序需要接受包含无效 Unicode 的参数，请改用 `std::env::args_os`。该函数返回一个生成 `OsString` 值而不是 `String` 值的迭代器。我们选择在这里使用 `std::env::args` 以简化操作，因为 `OsString` 值因平台而异，比 `String` 值更复杂。

在 `main` 的第一行，我们调用 `env::args`，并立即使用 `collect` 将迭代器转换为包含迭代器产生的所有值的 vector。我们可以使用 `collect` 函数创建多种集合，所以我们显式注解 `args` 的类型来指定我们想要一个字符串 vector。虽然你在 Rust 中很少需要注解类型，但 `collect` 是你经常需要注解的函数之一，因为 Rust 无法推断你想要的集合类型。

最后，我们使用调试宏打印 vector。让我们先试试不带参数运行代码，然后再带两个参数运行：

```console
$ cargo run
   Compiling minigrep v0.1.0 (file:///projects/minigrep)
    Finished `dev` profile [unoptimized + debuginfo] target(s) in 0.61s
     Running `target/debug/minigrep`
[src/main.rs:5:5] args = [
    "target/debug/minigrep",
]
```

```console
$ cargo run -- needle haystack
   Compiling minigrep v0.1.0 (file:///projects/minigrep)
    Finished `dev` profile [unoptimized + debuginfo] target(s) in 1.57s
     Running `target/debug/minigrep needle haystack`
[src/main.rs:5:5] args = [
    "target/debug/minigrep",
    "needle",
    "haystack",
]
```

注意 vector 中的第一个值是 `"target/debug/minigrep"`，这是我们的二进制文件的名称。这与 C 语言中的参数列表行为相匹配，让程序在执行中使用调用它们的名称。能够在消息中打印程序名称或根据用于调用程序的命令行别名更改程序的行为通常很方便。但对于本章的目的，我们将忽略它，只保存我们需要的两个参数。

### 将参数值保存在变量中

程序目前能够访问指定为命令行参数的值。现在我们需要将两个参数的值保存在变量中，以便我们可以在程序的其余部分使用这些值。我们在清单 12-2 中这样做。

**清单 12-2**：创建变量来保存查询参数和文件路径参数（*文件名：src/main.rs*）

```rust
use std::env;

fn main() {
    let args: Vec<String> = env::args().collect();

    let query = &args[1];
    let file_path = &args[2];

    println!("Searching for {query}");
    println!("In file {file_path}");
}
```

正如我们打印 vector 时看到的，程序名称占据了 `args[0]` 中 vector 的第一个值，所以我们从索引 1 开始获取参数。`minigrep` 接受的第一个参数是我们要搜索的字符串，因此我们将第一个参数的引用放在变量 `query` 中。第二个参数将是文件路径，因此我们将第二个参数的引用放在变量 `file_path` 中。

我们临时打印这些变量的值以证明代码按我们的意图工作。让我们再次用参数 `test` 和 `sample.txt` 运行这个程序：

```console
$ cargo run -- test sample.txt
   Compiling minigrep v0.1.0 (file:///projects/minigrep)
    Finished `dev` profile [unoptimized + debuginfo] target(s) in 0.0s
     Running `target/debug/minigrep test sample.txt`
Searching for test
In file sample.txt
```

太好了，程序正在工作！我们需要的参数值正在保存到正确的变量中。稍后我们将添加一些错误处理来处理某些潜在的错误情况，例如当用户没有提供参数时；现在，我们将忽略这种情况，转而处理添加文件读取功能。
