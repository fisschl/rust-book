---
title: 3.1. 变量与可变性
---

正如在["使用变量存储值"][storing-values-with-variables]部分中提到的，默认情况下变量是不可变的。这是 Rust 给你的众多提示之一，让你以利用 Rust 提供的安全和简单并发性的方式编写代码。但是，你仍然可以选择使变量可变。让我们探讨 Rust 如何以及为什么鼓励你支持不可变性，以及为什么有时你可能想要选择不使用它。

当一个变量是不可变的，一旦一个值绑定到一个名称，你就不能改变该值。为了说明这一点，在你的 *projects* 目录中使用 `cargo new variables` 生成一个名为 *variables* 的新项目。

然后，在你新的 *variables* 目录中，打开 *src/main.rs* 并将其代码替换为以下代码，这暂时还不能编译：

*文件名：src/main.rs*

```rust
fn main() {
    let x = 5;
    println!("The value of x is: {x}");
    x = 6;
    println!("The value of x is: {x}");
}
```

保存并使用 `cargo run` 运行程序。你应该会收到关于不可变性错误的错误消息，如以下输出所示：

```console
$ cargo run
   Compiling variables v0.1.0 (file:///projects/variables)
error[E0384]: cannot assign twice to immutable variable `x`
 --> src/main.rs:4:5
  |
2 |     let x = 5;
  |         - first assignment to `x`
3 |     println!("The value of x is: {x}");
4 |     x = 6;
  |     ^^^^^ cannot assign twice to immutable variable
  |
help: consider making this binding mutable
  |
2 |     let mut x = 5;
  |         +++

For more information about this error, try `rustc --explain E0384`.
error: could not compile `variables` (bin "variables") due to 1 previous error
```

这个例子展示了编译器如何帮助你发现程序中的错误。编译器错误可能令人沮丧，但实际上它们只意味着你的程序还没有安全地做你想让它做的事情；它们并*不*意味着你不是一个好的程序员！有经验的 Rustaceans 仍然会得到编译器错误。

你收到错误消息 `` cannot assign twice to immutable variable `x` `` 是因为你试图给不可变的 `x` 变量分配第二个值。

重要的是，当我们试图更改被指定为不可变的值时，我们会得到编译时错误，因为这种情况可能导致 bug。如果我们代码的一部分假设一个值永远不会改变，而我们代码的另一部分改变了该值，那么代码的第一部分可能无法按设计工作。这种 bug 的原因在事后可能很难追踪，特别是当第二段代码只*有时*改变该值时。Rust 编译器保证，当你声明一个值不会改变时，它真的不会改变，所以你不必自己跟踪它。因此，你的代码更容易推理。

但可变性非常有用，可以使代码更方便编写。虽然变量默认是不可变的，但你可以通过在变量名前添加 `mut` 来使它们可变，就像你在[第2章][storing-values-with-variables]中所做的那样。添加 `mut` 还通过表明代码的其他部分将更改此变量的值，向将来阅读代码的人传达了意图。

例如，让我们将 *src/main.rs* 更改为以下内容：

*文件名：src/main.rs*

```rust
fn main() {
    let mut x = 5;
    println!("The value of x is: {x}");
    x = 6;
    println!("The value of x is: {x}");
}
```

当我们现在运行程序时，我们得到：

```console
$ cargo run
   Compiling variables v0.1.0 (file:///projects/variables)
    Finished `dev` profile [unoptimized + debuginfo] target(s) in 0.30s
     Running `target/debug/variables`
The value of x is: 5
The value of x is: 6
```

当使用 `mut` 时，我们被允许将绑定到 `x` 的值从 `5` 更改为 `6`。最终，决定是否使用可变性取决于你，取决于你认为在特定情况下什么最清晰。

### 声明常量

与不可变变量一样，*常量*是绑定到名称且不允许更改的值，但常量和变量之间存在一些差异。

首先，你不允许对常量使用 `mut`。常量不仅是默认不可变的——它们总是不可变的。你使用 `const` 关键字而不是 `let` 关键字来声明常量，并且值的类型*必须*被注解。我们将在下一节 ["数据类型"][data-types] 中介绍类型和类型注解，所以现在就别担心细节了。只要知道你必须始终注解类型。

常量可以在任何范围内声明，包括全局范围，这使它们对代码的许多部分需要知道的值很有用。

最后一个区别是常量只能设置为常量表达式，而不是只能在运行时计算的值的结果。

以下是常量声明的示例：

```rust
const THREE_HOURS_IN_SECONDS: u32 = 60 * 60 * 3;
```

常量的名称是 `THREE_HOURS_IN_SECONDS`，其值设置为 60（一分钟的秒数）乘以 60（一小时的分钟数）乘以 3（我们想要在这个程序中计算的小时数）的结果。Rust 对常量的命名约定是使用全大写字母，单词之间用下划线分隔。编译器能够在编译时评估一组有限的操作，这让我们选择以一种更容易理解和验证的方式写出这个值，而不是将这个常量设置为值 10,800。有关声明常量时可以使用哪些操作的更多信息，请参阅 [Rust 参考手册中关于常量求值的部分][const-eval]。

常量在程序运行的整个时间内都有效，在声明它们的范围内。这个属性使常量对应用程序域中多个程序部分可能需要知道的值很有用，例如游戏中任何玩家允许赚取的最大分数，或光速。

将程序中使用的硬编码值命名为常量有助于向将来维护代码的人传达该值的意义。如果将来需要更新硬编码值，它还有助于只需要在代码中的一个地方进行更改。

### 遮蔽（Shadowing）

正如你在[第2章][comparing-the-guess-to-the-secret-number]的猜数字游戏教程中看到的，你可以声明一个与先前变量同名的新变量。Rustaceans 说第一个变量被第二个变量*遮蔽*，这意味着当你使用该变量的名称时，编译器将看到第二个变量。实际上，第二个变量遮蔽了第一个，占据了对该变量名称的任何使用，直到它本身被遮蔽或作用域结束。我们可以通过使用相同的变量名称并重复使用 `let` 关键字来遮蔽一个变量，如下所示：

*文件名：src/main.rs*

```rust
fn main() {
    let x = 5;

    let x = x + 1;

    {
        let x = x * 2;
        println!("The value of x in the inner scope is: {x}");
    }

    println!("The value of x is: {x}");
}
```

这个程序首先将 `x` 绑定到值 `5`。然后，它通过重复 `let x =` 创建一个新变量 `x`，取原始值并加上 `1`，这样 `x` 的值就是 `6`。然后，在使用花括号创建的内部作用域内，第三个 `let` 语句也遮蔽 `x` 并创建一个新变量，将前一个值乘以 `2`，使 `x` 的值为 `12`。当该作用域结束时，内部遮蔽结束，`x` 恢复为 `6`。当我们运行这个程序时，它将输出以下内容：

```console
$ cargo run
   Compiling variables v0.1.0 (file:///projects/variables)
    Finished `dev` profile [unoptimized + debuginfo] target(s) in 0.31s
     Running `target/debug/variables`
The value of x in the inner scope is: 12
The value of x is: 6
```

遮蔽与将变量标记为 `mut` 不同，因为如果我们不小心尝试在不使用 `let` 关键字的情况下重新赋值给此变量，我们将得到编译时错误。通过使用 `let`，我们可以在一个值上执行一些转换，但在这些转换完成后使变量不可变。

`mut` 和遮蔽之间的另一个区别是，因为当我们再次使用 `let` 关键字时，我们实际上是在创建一个新变量，所以我们可以更改值的类型但重用相同的名称。例如，假设我们的程序要求用户通过输入空格字符来显示他们想要在某些文本之间有多少空格，然后我们希望将该输入存储为一个数字：

```rust
fn main() {
    let spaces = "   ";
    let spaces = spaces.len();
}
```

第一个 `spaces` 变量是字符串类型，第二个 `spaces` 变量是数字类型。因此，遮蔽使我们不必想出不同的名称，例如 `spaces_str` 和 `spaces_num`；相反，我们可以重用更简单的 `spaces` 名称。然而，如果我们尝试在这里使用 `mut`，如这里所示，我们将得到编译时错误：

```rust
fn main() {
    let mut spaces = "   ";
    spaces = spaces.len();
}
```

错误说我们不能改变变量的类型：

```console
$ cargo run
   Compiling variables v0.1.0 (file:///projects/variables)
error[E0308]: mismatched types
 --> src/main.rs:3:14
  |
2 |     let mut spaces = "   ";
  |                      ----- expected due to this value
3 |     spaces = spaces.len();
  |              ^^^^^^^^^^^^ expected `&str`, found `usize`

For more information about this error, try `rustc --explain E0308`.
error: could not compile `variables` (bin "variables") due to 1 previous error
```

现在我们已经探讨了变量如何工作，让我们看看它们可以拥有的更多数据类型。

[comparing-the-guess-to-the-secret-number]: /rust-book/ch02-00-guessing-game-tutorial#比较猜测与秘密数字
[data-types]: /rust-book/ch03-02-data-types
[storing-values-with-variables]: /rust-book/ch02-00-guessing-game-tutorial#使用变量存储值
[const-eval]: ../reference/const_eval.html
