---
title: 函数
---

函数在 Rust 代码中随处可见。你已经看到了语言中最重要的函数之一：`main` 函数，它是许多程序的入口点。你也看到了 `fn` 关键字，它允许你声明新函数。

Rust 代码使用*蛇形命名法*（snake case）作为函数和变量名称的常规风格，其中所有字母都是小写，下划线分隔单词。这里有一个包含函数定义示例的程序：

*文件名：src/main.rs*

```rust
fn main() {
    println!("Hello, world!");

    another_function();
}

fn another_function() {
    println!("Another function.");
}
```

我们在 Rust 中通过输入 `fn`，后跟函数名和一组括号来定义一个函数。花括号告诉编译器函数体的开始和结束位置。

我们可以通过输入函数名后跟一组括号来调用我们定义的任何函数。因为 `another_function` 在程序中定义，所以它可以从 `main` 函数内部调用。注意，我们在源代码中将 `another_function` 定义在 `main` 函数*之后*；我们也可以将它定义在之前。Rust 不关心你在哪里定义函数，只关心它们在某个调用者可以看到的范围内被定义。

让我们启动一个名为 *functions* 的新二进制项目来进一步探索函数。将 `another_function` 示例放在 *src/main.rs* 中并运行它。你应该会看到以下输出：

```console
$ cargo run
   Compiling functions v0.1.0 (file:///projects/functions)
    Finished `dev` profile [unoptimized + debuginfo] target(s) in 0.28s
     Running `target/debug/functions`
Hello, world!
Another function.
```

这些行按照它们出现在 `main` 函数中的顺序执行。首先打印"Hello, world!"消息，然后调用 `another_function` 并打印它的消息。

### 参数

我们可以定义函数具有*参数*，参数是函数签名的一部分的特殊变量。当函数有参数时，你可以为这些参数提供具体值。从技术上讲，具体值被称为*实参*，但在日常对话中，人们倾向于将*形参*和*实参*这两个词互换使用，无论是指函数定义中的变量还是调用函数时传入的具体值。

在这个 `another_function` 的版本中，我们添加了一个参数：

*文件名：src/main.rs*

```rust
fn main() {
    another_function(5);
}

fn another_function(x: i32) {
    println!("The value of x is: {x}");
}
```

尝试运行这个程序；你应该会得到以下输出：

```console
$ cargo run
   Compiling functions v0.1.0 (file:///projects/functions)
    Finished `dev` profile [unoptimized + debuginfo] target(s) in 1.21s
     Running `target/debug/functions`
The value of x is: 5
```

`another_function` 的声明有一个名为 `x` 的参数。`x` 的类型被指定为 `i32`。当我们将 `5` 传递给 `another_function` 时，`println!` 宏将 `5` 放在格式字符串中包含 `x` 的花括号对的位置。

在函数签名中，你*必须*声明每个参数的类型。这是 Rust 设计中的刻意决定：要求在函数定义中提供类型注解意味着编译器几乎不需要你在代码的其他地方使用它们来弄清楚你指的是什么类型。如果编译器知道函数期望的类型，它还能够提供更有帮助的错误消息。

在定义多个参数时，用逗号分隔参数声明，如下所示：

*文件名：src/main.rs*

```rust
fn main() {
    print_labeled_measurement(5, 'h');
}

fn print_labeled_measurement(value: i32, unit_label: char) {
    println!("The measurement is: {value}{unit_label}");
}
```

这个示例创建了一个名为 `print_labeled_measurement` 的函数，有两个参数。第一个参数名为 `value`，类型是 `i32`。第二个参数名为 `unit_label`，类型是 `char`。然后函数打印包含 `value` 和 `unit_label` 的文本。

让我们尝试运行这段代码。将当前 *functions* 项目的 *src/main.rs* 文件中的程序替换为先前的示例，并使用 `cargo run` 运行它：

```console
$ cargo run
   Compiling functions v0.1.0 (file:///projects/functions)
    Finished `dev` profile [unoptimized + debuginfo] target(s) in 0.31s
     Running `target/debug/functions`
The measurement is: 5h
```

因为我们用 `5` 作为 `value` 的值，`'h'` 作为 `unit_label` 的值调用函数，所以程序输出包含这些值。

### 语句和表达式

函数体由一系列语句组成，可选地以表达式结尾。到目前为止，我们涵盖的函数都没有包含结尾表达式，但你已经看到表达式作为语句的一部分。因为 Rust 是一种基于表达式的语言，所以理解这一点很重要。其他语言没有相同的区别，所以让我们看看语句和表达式是什么，以及它们的区别如何影响函数体。

- *语句*是执行某些操作但不返回值的指令。
- *表达式*计算结果为一个值。

让我们看一些例子。

我们实际上已经使用过语句和表达式。使用 `let` 关键字创建变量并给变量赋值是一个语句。在清单 3-1 中，`let y = 6;` 是一个语句。

**清单 3-1**：包含一个语句的 `main` 函数声明（文件名：*src/main.rs*）

```rust
fn main() {
    let y = 6;
}
```

函数定义也是语句；前面的整个示例本身就是一个语句。（正如我们很快会看到的，调用函数不是语句，尽管。）

语句不返回值。因此，你不能将 `let` 语句赋值给另一个变量，如下面的代码尝试做的那样；你会得到一个错误：

*文件名：src/main.rs*

```rust
fn main() {
    let x = (let y = 6);
}
```

当你运行这个程序时，你会得到如下错误：

```console
$ cargo run
   Compiling functions v0.1.0 (file:///projects/functions)
error: expected expression, found `let` statement
 --> src/main.rs:2:14
  |
2 |     let x = (let y = 6);
  |              ^^^
  |
  = note: only supported directly in conditions of `if` and `while` expressions

warning: unnecessary parentheses around assigned value
 --> src/main.rs:2:13
  |
2 |     let x = (let y = 6);
  |             ^         ^
  |
  = note: `#[warn(unused_parens)]` on by default
help: remove these parentheses
  |
2 -     let x = (let y = 6);
2 +     let x = let y = 6;
  |

warning: `functions` (bin "functions") generated 1 warning
error: could not compile `functions` (bin "functions") due to 1 previous error; 1 warning emitted
```

`let y = 6` 语句不返回值，所以没有什么可以绑定到 `x`。这与 C 和 Ruby 等其他语言中发生的情况不同，在这些语言中，赋值返回赋值的值。在这些语言中，你可以写 `x = y = 6`，让 `x` 和 `y` 都具有值 `6`；在 Rust 中情况并非如此。

表达式计算为一个值，并构成你在 Rust 中编写的大部分代码。考虑一个数学运算，例如 `5 + 6`，它是一个计算为值 `11` 的表达式。表达式可以是语句的一部分：在清单 3-1 中，语句 `let y = 6;` 中的 `6` 是一个计算为值 `6` 的表达式。调用函数是一个表达式。调用宏是一个表达式。用花括号创建的新作用域块是一个表达式，例如：

*文件名：src/main.rs*

```rust
fn main() {
    let y = {
        let x = 3;
        x + 1
    };

    println!("The value of y is: {y}");
}
```

这个表达式：

```rust
{
    let x = 3;
    x + 1
}
```

是一个块，在这种情况下，它计算为 `4`。该值作为 `let` 语句的一部分绑定到 `y`。注意 `x + 1` 这一行末尾没有分号，这与你到目前为止看到的大多数行不同。表达式不包括结尾分号。如果你在表达式末尾添加分号，你将它变成了语句，然后它就不会返回值了。在接下来探索函数返回值和表达式时请记住这一点。

### 带返回值的函数

函数可以将值返回给调用它们的代码。我们不命名返回值，但必须在箭头（`->`）之后声明它们的类型。在 Rust 中，函数的返回值与函数体块中最终表达式的值同义。你可以使用 `return` 关键字并指定一个值来提前从函数返回，但大多数函数隐式返回最后一个表达式。这里是一个返回值的函数示例：

*文件名：src/main.rs*

```rust
fn five() -> i32 {
    5
}

fn main() {
    let x = five();

    println!("The value of x is: {x}");
}
```

`five` 函数中没有函数调用、宏，甚至没有 `let` 语句——只有数字 `5` 本身。这在 Rust 中是一个完全有效的函数。注意也指定了函数的返回类型，为 `-> i32`。尝试运行这段代码；输出应该如下所示：

```console
$ cargo run
   Compiling functions v0.1.0 (file:///projects/functions)
    Finished `dev` profile [unoptimized + debuginfo] target(s) in 0.30s
     Running `target/debug/functions`
The value of x is: 5
```

`five` 中的 `5` 是函数的返回值，这就是为什么返回类型是 `i32`。让我们更详细地研究这一点。有两个重要的地方：首先，`let x = five();` 这一行表明我们正在使用函数的返回值来初始化变量。因为函数 `five` 返回一个 `5`，所以这一行与下面相同：

```rust
let x = 5;
```

其次，`five` 函数没有参数并定义了返回值的类型，但函数体只是一个没有分号的 `5`，因为它是我们想要返回的值的表达式。

让我们看另一个例子：

*文件名：src/main.rs*

```rust
fn main() {
    let x = plus_one(5);

    println!("The value of x is: {x}");
}

fn plus_one(x: i32) -> i32 {
    x + 1
}
```

运行这段代码将打印 `The value of x is: 6`。但是如果我们在包含 `x + 1` 的行末尾放置一个分号，将它从表达式变成语句，会发生什么呢？

*文件名：src/main.rs*

```rust
fn main() {
    let x = plus_one(5);

    println!("The value of x is: {x}");
}

fn plus_one(x: i32) -> i32 {
    x + 1;
}
```

编译这段代码会产生一个错误，如下所示：

```console
$ cargo run
   Compiling functions v0.1.0 (file:///projects/functions)
error[E0308]: mismatched types
 --> src/main.rs:7:24
  |
7 | fn plus_one(x: i32) -> i32 {
  |    --------            ^^^ expected `i32`, found `()`
  |    |
  |    implicitly returns `()` as its body has no tail or `return` expression
8 |     x + 1;
  |          - help: remove this semicolon to return this value

For more information about this error, try `rustc --explain E0308`.
error: could not compile `functions` (bin "functions") due to 1 previous error
```

主要错误消息 `mismatched types` 揭示了这段代码的核心问题。函数 `plus_one` 的定义表明它将返回一个 `i32`，但语句不计算为值，这由 `()` 表示，即单元类型。因此，没有返回任何内容，这与函数定义相矛盾并导致错误。在此输出中，Rust 提供了一条可能有助于纠正此问题的消息：它建议删除分号，这将修复错误。
