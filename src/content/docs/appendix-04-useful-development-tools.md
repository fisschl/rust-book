---
title: 22.4. D. 有用的开发工具
---

在本附录中，我们讨论 Rust 项目提供的一些有用的开发工具。我们将介绍自动格式化、快速应用警告修复的方法、一个静态分析工具以及与 IDE 的集成。

## 使用 `rustfmt` 自动格式化

`rustfmt` 工具根据社区代码样式重新格式化你的代码。许多协作项目使用 `rustfmt` 来防止在编写 Rust 时使用哪种样式的争论：每个人都使用该工具格式化他们的代码。

Rust 安装默认包含 `rustfmt`，因此你的系统上应该已经有 `rustfmt` 和 `cargo-fmt` 程序。这两个命令类似于 `rustc` 和 `cargo`，`rustfmt` 允许更细粒度的控制，而 `cargo-fmt` 理解使用 Cargo 的项目的约定。要格式化任何 Cargo 项目，请输入以下命令：

```console
$ cargo fmt
```

运行此命令会重新格式化当前 crate 中的所有 Rust 代码。这应该只改变代码样式，而不会改变代码语义。有关 `rustfmt` 的更多信息，请参见[其文档][rustfmt]。

## 使用 `rustfix` 修复代码

`rustfix` 工具包含在 Rust 安装中，可以自动修复编译器警告，这些警告具有明确的纠正问题的方法，很可能正是你想要的。你可能以前见过编译器警告。例如，考虑这段代码：

```rust
fn main() {
    let mut x = 42;
    println!("{x}");
}
```

在这里，我们将变量 `x` 定义为可变的，但实际上从未改变它。Rust 会警告我们：

```console
$ cargo build
   Compiling myprogram v0.1.0 (file:///projects/myprogram)
warning: variable does not need to be mutable
 --> src/main.rs:2:9
  |
2 |     let mut x = 0;
  |         ----^
  |         |
  |         help: remove this `mut`
  |
  = note: `#[warn(unused_mut)]` on by default
```

警告建议我们删除 `mut` 关键字。我们可以通过运行命令 `cargo fix` 使用 `rustfix` 工具自动应用该建议：

```console
$ cargo fix
    Checking myprogram v0.1.0 (file:///projects/myprogram)
      Fixing src/main.rs (1 fix)
    Finished dev [unoptimized + debuginfo] target(s) in 0.59s
```

当我们再次查看 *src/main.rs* 时，会看到 `cargo fix` 已更改代码：

```rust
fn main() {
    let x = 42;
    println!("{x}");
}
```

变量 `x` 现在是不可变的，警告不再出现。

你也可以使用 `cargo fix` 命令在不同 Rust 版本之间转换代码。版本在[附录 E][editions]中介绍。

## 使用 Clippy 进行更多静态分析

Clippy 工具是一组静态分析规则，用于分析你的代码，以便你可以捕获常见错误并改进你的 Rust 代码。Clippy 包含在标准 Rust 安装中。

要在任何 Cargo 项目上运行 Clippy 的静态分析，请输入以下命令：

```console
$ cargo clippy
```

例如，假设你编写了一个使用数学常数（如 pi）的近似值的程序，就像这个程序所做的那样：

```rust
fn main() {
    let x = 3.1415;
    let r = 8.0;
    println!("the area of the circle is {}", x * r * r);
}
```

在此项目上运行 `cargo clippy` 会产生以下错误：

```text
error: approximate value of `f{32, 64}::consts::PI` found
 --> src/main.rs:2:13
  |
2 |     let x = 3.1415;
  |             ^^^^^^
  |
  = note: `#[deny(clippy::approx_constant)]` on by default
  = help: consider using the constant directly
  = help: for further information visit https://rust-lang.github.io/rust-clippy/master/index.html#approx_constant
```

此错误让你知道 Rust 已经定义了更精确的 `PI` 常量，如果你使用该常量而不是近似值，你的程序会更正确。然后你会更改代码以使用 `PI` 常量。

以下代码不会导致 Clippy 出现任何错误或警告：

```rust
fn main() {
    let x = std::f64::consts::PI;
    let r = 8.0;
    println!("the area of the circle is {}", x * r * r);
}
```

有关 Clippy 的更多信息，请参见[其文档][clippy]。

## 使用 `rust-analyzer` 进行 IDE 集成

为了帮助进行 IDE 集成，Rust 社区推荐使用 [`rust-analyzer`][rust-analyzer]。这个工具是一组以编译器为中心的实用程序，使用[语言服务器协议][lsp]，这是 IDE 和编程语言相互通信的规范。不同的客户端可以使用 `rust-analyzer`，例如[用于 Visual Studio Code 的 Rust analyzer 插件][vscode]。

访问 `rust-analyzer` 项目的[主页][rust-analyzer]获取安装说明，然后在你的特定 IDE 中安装语言服务器支持。你的 IDE 将获得自动完成、跳转到定义和内联错误等功能。

[rustfmt]: https://github.com/rust-lang/rustfmt
[editions]: /rust-book/appendix-05-editions
[clippy]: https://github.com/rust-lang/rust-clippy
[rust-analyzer]: https://rust-analyzer.github.io
[lsp]: http://langserver.org/
[vscode]: https://marketplace.visualstudio.com/items?itemName=rust-lang.rust-analyzer