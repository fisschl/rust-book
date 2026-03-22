---
title: 19.1. 模式可以用在哪些地方
---

模式在 Rust 中的许多地方都会出现，而且你一直在不知不觉中大量使用它们！本节讨论模式有效的所有地方。

## `match` 分支

如第 6 章中所述，我们在 `match` 表达式的分支中使用模式。形式上，`match` 表达式定义为关键字 `match`、要匹配的值，以及一个或多个由模式和表达式组成的匹配分支，如果值匹配该分支的模式，则运行该表达式，如下所示：

```
match VALUE {
    PATTERN => EXPRESSION,
    PATTERN => EXPRESSION,
    PATTERN => EXPRESSION,
}
```

例如，这是来自清单 6-5 的 `match` 表达式，它匹配变量 `x` 中的 `Option<i32>` 值：

```rust
match x {
    None => None,
    Some(i) => Some(i + 1),
}
```

此 `match` 表达式中的模式是每个箭头左侧的 `None` 和 `Some(i)`。

`match` 表达式的一个要求是它们必须是详尽的，即必须涵盖 `match` 表达式中值的所有可能性。确保你已涵盖每一种可能性的一种方法是让最后一个分支使用一个捕获所有模式：例如，一个匹配任何值的变量名永远不会失败，因此涵盖了所有剩余的情况。

特定的模式 `_` 将匹配任何内容，但它从不绑定到变量，因此它经常用于最后一个 match 分支。当你想忽略任何未指定的值时，`_` 模式会很有用，例如。我们将在本章后面的[忽略模式中的值](#忽略模式中的值)一节中更详细地介绍 `_` 模式。

## `let` 语句

在本章之前，我们只明确讨论了如何在 `match` 和 `if let` 中使用模式，但事实上，我们也在其他地方使用了模式，包括在 `let` 语句中。例如，考虑这个使用 `let` 的直接变量赋值：

```rust
let x = 5;
```

每次你像这样使用 `let` 语句时，你都在使用模式，尽管你可能没有意识到！更正式地说，`let` 语句看起来像这样：

```
let PATTERN = EXPRESSION;
```

在像 `let x = 5;` 这样的语句中，PATTERN 位置是一个变量名，变量名只是一种特别简单的模式形式。Rust 将表达式与模式进行比较，并分配它找到的任何名称。因此，在 `let x = 5;` 示例中，`x` 是一个模式，意思是"将匹配这里的内容绑定到变量 `x`"。因为名称 `x` 是整个模式，所以这个模式实际上意味着"将所有内容绑定到变量 `x`，无论值是什么。"

为了更清楚地看到 `let` 的模式匹配方面，请考虑清单 19-1，它使用带有 `let` 的模式来解构元组。

**清单 19-1**：使用模式来解构元组并一次创建三个变量

```rust
fn main() {
    let (x, y, z) = (1, 2, 3);
}
```

在这里，我们将一个元组与一个模式匹配。Rust 将值 `(1, 2, 3)` 与模式 `(x, y, z)` 进行比较，并看到该值与模式匹配——即，它看到两者中的元素数量相同——因此 Rust 将 `1` 绑定到 `x`，`2` 绑定到 `y`，`3` 绑定到 `z`。你可以将这个元组模式看作是将三个单独的变量模式嵌套在其中。

如果模式中的元素数量与元组中的元素数量不匹配，整体类型将不匹配，我们将得到编译器错误。例如，清单 19-2 显示了尝试将三个元素的元组解构为两个变量，这将无法工作。

**清单 19-2**：错误地构造一个变量数量与元组中元素数量不匹配的模式

```rust,ignore
fn main() {
    let (x, y) = (1, 2, 3);
}
```

尝试编译此代码会导致以下类型错误：

```console
$ cargo run
   Compiling patterns v0.1.0 (file:///projects/patterns)
error[E0308]: mismatched types
 --> src/main.rs:2:9
  |
2 |     let (x, y) = (1, 2, 3);
  |         ^^^^^^   --------- this expression has type `({integer}, {integer}, {integer})`
  |         |
  |         expected a tuple with 3 elements, found one with 2 elements
  |
  = note: expected tuple `({integer}, {integer}, {integer})`
             found tuple `(_, _)`

For more information about this error, try `rustc --explain E0308`.
error: could not compile `patterns` (bin "patterns")) due to 1 previous error
```

为了修复错误，我们可以使用 `_` 或 `..` 忽略元组中的一个或多个值，如你在[忽略模式中的值](#忽略模式中的值)一节中所见。如果问题是模式中有太多变量，解决方案是通过删除变量来使类型匹配，以便变量的数量等于元组中元素的数量。

## 条件 `if let` 表达式

在第 6 章中，我们讨论了如何使用 `if let` 表达式，主要是作为一种更简短的编写等效于只匹配一个情况的 `match` 的方式。可选地，`if let` 可以有一个相应的 `else`，其中包含在 `if let` 中的模式不匹配时要运行的代码。

清单 19-3 显示了也可以混合和匹配 `if let`、`else if` 和 `else if let` 表达式。这样做比 `match` 表达式给了我们更多的灵活性，在 `match` 表达式中，我们只能表达一个值与模式进行比较。此外，Rust 不要求 `if let`、`else if` 和 `else if let` 分支序列中的条件彼此相关。

清单 19-3 中的代码根据对几个条件的检查来确定你的背景色。对于这个例子，我们创建了带有硬编码值的变量，这些值在真实程序中可能来自用户输入。

**清单 19-3**：混合 `if let`、`else if`、`else if let` 和 `else`（文件名：*src/main.rs*）

```rust
fn main() {
    let favorite_color: Option<&str> = None;
    let is_tuesday = false;
    let age: Result<u8, _> = "34".parse();

    if let Some(color) = favorite_color {
        println!("Using your favorite color, {color}, as the background");
    } else if is_tuesday {
        println!("Tuesday is green day!");
    } else if let Ok(age) = age {
        if age > 30 {
            println!("Using purple as the background color");
        } else {
            println!("Using orange as the background color");
        }
    } else {
        println!("Using blue as the background color");
    }
}
```

如果用户指定了最喜欢的颜色，则使用该颜色作为背景。如果没有指定最喜欢的颜色且今天是星期二，背景色为绿色。否则，如果用户将年龄指定为字符串，并且我们可以成功地将其解析为数字，则颜色根据数字的值是紫色或橙色。如果这些条件都不适用，背景色为蓝色。

这种条件结构让我们能够支持复杂的需求。有了这里的硬编码值，这个例子将打印 `Using purple as the background color`。

你可以看到 `if let` 也可以引入新的变量，以与 `match` 分支相同的方式遮蔽同一范围内的现有变量：行 `if let Ok(age) = age` 引入了一个新的包含 `Ok` 变体内部值的 `age` 变量，遮蔽了现有的 `age` 变量。这意味着我们需要将该条件放在该块内：我们不能将这两个条件组合成 `if let Ok(age) = age && age > 30`。我们想与 30 比较的新 `age` 直到新范围以大括号开始时才有效。

使用 `if let` 表达式的缺点是编译器不会检查穷尽性，而 `match` 表达式会。如果我们省略最后一个 `else` 块，因此遗漏了一些情况的处理，编译器不会提醒我们可能的逻辑错误。

## `while let` 条件循环

与 `if let` 的构造相似，`while let` 条件循环允许 `while` 循环在模式持续匹配时一直运行。在清单 19-4 中，我们展示了一个 `while let` 循环，它等待线程之间发送的消息，但在这种情况下检查的是 `Result` 而不是 `Option`。

**清单 19-4**：使用 `while let` 循环在 `rx.recv()` 返回 `Ok` 时打印值

```rust
fn main() {
    let (tx, rx) = std::sync::mpsc::channel();
    std::thread::spawn(move || {
        for val in [1, 2, 3] {
            tx.send(val).unwrap();
        }
    });

    while let Ok(value) = rx.recv() {
        println!("{value}");
    }
}
```

这个例子打印 `1`、`2`，然后 `3`。`recv` 方法从通道的接收端取出第一条消息并返回一个 `Ok(value)`。当我们在第 16 章第一次看到 `recv` 时，我们直接解包了错误，或者使用 `for` 循环将其作为迭代器与之交互。如清单 19-4 所示，我们也可以使用 `while let`，因为只要发送者存在，`recv` 方法每次有消息到达时都会返回一个 `Ok`，然后在发送方断开连接后产生一个 `Err`。

## `for` 循环

在 `for` 循环中，紧跟在关键字 `for` 后面的值是一个模式。例如，在 `for x in y` 中，`x` 是模式。清单 19-5 演示了如何在 `for` 循环中使用模式来解构，或者说分解元组作为 `for` 循环的一部分。

**清单 19-5**：在 `for` 循环中使用模式来解构元组

```rust
fn main() {
    let v = vec!['a', 'b', 'c'];

    for (index, value) in v.iter().enumerate() {
        println!("{value} is at index {index}");
    }
}
```

清单 19-5 中的代码将打印以下内容：

```console
$ cargo run
   Compiling patterns v0.1.0 (file:///projects/patterns)
    Finished `dev` profile [unoptimized + debuginfo] target(s) in 0.52s
     Running `target/debug/patterns`
a is at index 0
b is at index 1
c is at index 2
```

我们使用 `enumerate` 方法调整迭代器，使其生成一个值和该值的索引，放入一个元组中。生成的第一个值是元组 `(0, 'a')`。当这个值与模式 `(index, value)` 匹配时，index 将是 `0`，value 将是 `'a'`，打印输出的第一行。

## 函数参数

函数参数也可以是模式。清单 19-6 中的代码现在看起来应该很熟悉了，它声明了一个名为 `foo` 的函数，该函数接受一个类型为 `i32` 的参数 `x`。

**清单 19-6**：在参数中使用模式的函数签名

```rust
fn foo(x: i32) {
    // 代码在这里
}

fn main() {}
```

`x` 部分是一个模式！正如我们对 `let` 所做的那样，我们可以在函数的参数中匹配一个元组到模式。清单 19-7 在将元组传递给函数时拆分其中的值。

**清单 19-7**：参数解构元组的函数（文件名：*src/main.rs*）

```rust
fn print_coordinates(&(x, y): &(i32, i32)) {
    println!("Current location: ({x}, {y})");
}

fn main() {
    let point = (3, 5);
    print_coordinates(&point);
}
```

此代码打印 `Current location: (3, 5)`。值 `&(3, 5)` 与模式 `&(x, y)` 匹配，所以 `x` 是值 `3`，`y` 是值 `5`。

我们也可以在闭包参数列表中以与函数参数列表相同的方式使用模式，因为闭包类似于函数，如第 13 章中所述。

至此，你已经看到了几种使用模式的方式，但模式在我们能使用它们的所有地方的工作方式并不相同。在某些地方，模式必须是无可辩驳的；在其他情况下，它们可以是可辩驳的。我们将在接下来讨论这两个概念。

[ignoring-values-in-a-pattern]: /rust-book/ch19-03-pattern-syntax#忽略模式中的值
