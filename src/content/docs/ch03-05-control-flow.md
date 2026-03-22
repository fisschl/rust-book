---
title: 3.5. 控制流
---

根据条件是否为 `true` 来运行某些代码的能力，以及在条件为 `true` 时重复运行某些代码的能力，是大多数编程语言中的基本构建块。让你控制 Rust 代码执行流程的最常见结构是 `if` 表达式和循环。

### `if` 表达式

`if` 表达式允许你根据条件分支你的代码。你提供一个条件，然后说明，"如果这个条件满足，运行这段代码块。如果条件不满足，不要运行这段代码块。"

在你的 *projects* 目录中创建一个名为 *branches* 的新项目来探索 `if` 表达式。在 *src/main.rs* 文件中，输入以下内容：

*文件名：src/main.rs*

```rust
fn main() {
    let number = 3;

    if number < 5 {
        println!("condition was true");
    } else {
        println!("condition was false");
    }
}
```

所有 `if` 表达式都以关键字 `if` 开头，后跟一个条件。在这种情况下，条件检查变量 `number` 的值是否小于 5。我们将条件为 `true` 时要执行的代码块放在条件后的花括号内。与 `if` 表达式中的条件关联的代码块有时被称为*分支*，就像我们在第 2 章["比较猜测与秘密数字"][comparing-the-guess-to-the-secret-number]部分讨论的 `match` 表达式中的分支一样。

可选地，我们也可以包含一个 `else` 表达式，我们在这里选择这样做，以便在条件计算为 `false` 时给程序一个替代代码块来执行。如果你不提供 `else` 表达式且条件为 `false`，程序将跳过 `if` 块并继续执行下一段代码。

尝试运行这段代码；你应该会看到以下输出：

```console
$ cargo run
   Compiling branches v0.1.0 (file:///projects/branches)
    Finished `dev` profile [unoptimized + debuginfo] target(s) in 0.31s
     Running `target/debug/branches`
condition was true
```

让我们尝试将 `number` 的值更改为使条件为 `false` 的值，看看会发生什么：

```rust
fn main() {
    let number = 7;

    if number < 5 {
        println!("condition was true");
    } else {
        println!("condition was false");
    }
}
```

再次运行程序，查看输出：

```console
$ cargo run
   Compiling branches v0.1.0 (file:///projects/branches)
    Finished `dev` profile [unoptimized + debuginfo] target(s) in 0.31s
     Running `target/debug/branches`
condition was false
```

还值得注意的是，这段代码中的条件*必须*是 `bool`。如果条件不是 `bool`，我们会得到一个错误。例如，尝试运行以下代码：

*文件名：src/main.rs*

```rust
fn main() {
    let number = 3;

    if number {
        println!("number was three");
    }
}
```

这次 `if` 条件计算为值 `3`，Rust 会抛出错误：

```console
$ cargo run
   Compiling branches v0.1.0 (file:///projects/branches)
error[E0308]: mismatched types
 --> src/main.rs:4:8
  |
4 |     if number {
  |        ^^^^^^ expected `bool`, found integer

For more information about this error, try `rustc --explain E0308`.
error: could not compile `branches` (bin "branches") due to 1 previous error
```

错误表明 Rust 期望一个 `bool` 但得到了一个整数。与 Ruby 和 JavaScript 等语言不同，Rust 不会自动尝试将非布尔类型转换为布尔值。你必须明确并始终为 `if` 提供一个布尔值作为其条件。例如，如果我们希望 `if` 代码块仅在数字不等于 `0` 时运行，我们可以将 `if` 表达式更改为以下内容：

*文件名：src/main.rs*

```rust
fn main() {
    let number = 3;

    if number != 0 {
        println!("number was something other than zero");
    }
}
```

运行这段代码将打印 `number was something other than zero`。

#### 使用 `else if` 处理多个条件

你可以在 `else if` 表达式中结合 `if` 和 `else` 来使用多个条件。例如：

*文件名：src/main.rs*

```rust
fn main() {
    let number = 6;

    if number % 4 == 0 {
        println!("number is divisible by 4");
    } else if number % 3 == 0 {
        println!("number is divisible by 3");
    } else if number % 2 == 0 {
        println!("number is divisible by 2");
    } else {
        println!("number is not divisible by 4, 3, or 2");
    }
}
```

这个程序有四条可能的路径可以走。运行它后，你应该会看到以下输出：

```console
$ cargo run
   Compiling branches v0.1.0 (file:///projects/branches)
    Finished `dev` profile [unoptimized + debuginfo] target(s) in 0.31s
     Running `target/debug/branches`
number is divisible by 3
```

当这个程序执行时，它依次检查每个 `if` 表达式，并执行第一个条件计算为 `true` 的主体。注意，即使 6 能被 2 整除，我们也看不到输出 `number is divisible by 2`，也没有看到来自 `else` 块的 `number is not divisible by 4, 3, or 2` 文本。这是因为 Rust 只执行第一个 `true` 条件的块，一旦找到一个，它甚至不会检查其余的。

使用太多 `else if` 表达式会使代码混乱，所以如果你有一个以上，你可能想要重构你的代码。第 6 章描述了一个强大的 Rust 分支结构 `match`，适用于这些情况。

#### 在 `let` 语句中使用 `if`

因为 `if` 是一个表达式，我们可以在 `let` 语句的右侧使用它来将结果赋值给变量，如清单 3-2 所示。

**清单 3-2**：将 `if` 表达式的结果赋值给变量（文件名：*src/main.rs*）

```rust
fn main() {
    let condition = true;
    let number = if condition { 5 } else { 6 };

    println!("The value of number is: {number}");
}
```

`number` 变量将根据 `if` 表达式的结果绑定到一个值。运行这段代码看看会发生什么：

```console
$ cargo run
   Compiling branches v0.1.0 (file:///projects/branches)
    Finished `dev` profile [unoptimized + debuginfo] target(s) in 0.30s
     Running `target/debug/branches`
The value of number is: 5
```

请记住，代码块计算为其中最后一个表达式的值，数字本身也是表达式。在这种情况下，整个 `if` 表达式的值取决于哪个代码块执行。这意味着有可能作为 `if` 每个分支结果的值必须是相同的类型；在清单 3-2 中，`if` 分支和 `else` 分支的结果都是 `i32` 整数。如果类型不匹配，如下面的示例，我们会得到一个错误：

*文件名：src/main.rs*

```rust
fn main() {
    let condition = true;

    let number = if condition { 5 } else { "six" };

    println!("The value of number is: {number}");
}
```

当我们尝试编译这段代码时，我们会得到一个错误。`if` 和 `else` 分支具有不兼容的值类型，Rust 准确地指出在程序中哪里可以找到问题：

```console
$ cargo run
   Compiling branches v0.1.0 (file:///projects/branches)
error[E0308]: `if` and `else` have incompatible types
 --> src/main.rs:4:44
  |
4 |     let number = if condition { 5 } else { "six" };
  |                                 -          ^^^^^ expected integer, found `&str`
  |                                 |
  |                                 expected because of this

For more information about this error, try `rustc --explain E0308`.
error: could not compile `branches` (bin "branches") due to 1 previous error
```

`if` 块中的表达式计算为一个整数，`else` 块中的表达式计算为一个字符串。这行不通，因为变量必须具有单一类型，而 Rust 需要在编译时明确知道 `number` 变量是什么类型。知道 `number` 的类型让编译器可以验证类型在我们使用 `number` 的任何地方都是有效的。如果 `number` 的类型只在运行时确定，Rust 将无法做到这一点；如果编译器必须跟踪任何变量的多种假设类型，它会更复杂，对代码的保证也会更少。

### 使用循环重复

多次执行代码块通常很有用。为此，Rust 提供了几个*循环*，它们将运行循环体内的代码直到结束，然后立即从头开始。为了试验循环，让我们创建一个名为 *loops* 的新项目。

Rust 有三种循环：`loop`、`while` 和 `for`。让我们尝试每一种。

#### 使用 `loop` 重复代码

`loop` 关键字告诉 Rust 反复执行一个代码块，要么永远执行，要么直到你明确告诉它停止。

作为示例，将你 *loops* 目录中的 *src/main.rs* 文件更改为如下所示：

*文件名：src/main.rs*

```rust
fn main() {
    loop {
        println!("again!");
    }
}
```

当我们运行这个程序时，我们会看到 `again!` 被不断地打印，直到我们手动停止程序。大多数终端支持键盘快捷键 `ctrl-C` 来中断一个陷入持续循环的程序。试试看：

```console
$ cargo run
   Compiling loops v0.1.0 (file:///projects/loops)
    Finished `dev` profile [unoptimized + debuginfo] target(s) in 0.08s
     Running `target/debug/loops`
again!
again!
again!
again!
^Cagain!
```

符号 `^C` 代表你按下 `ctrl-C` 的位置。

你可能会也可能不会在 `^C` 之后看到单词 `again!`，这取决于代码在循环中接收到中断信号时的位置。

幸运的是，Rust 还提供了一种使用代码跳出循环的方法。你可以在循环中放置 `break` 关键字来告诉程序何时停止执行循环。回想一下，我们在第 2 章["猜中后退出"][quitting-after-a-correct-guess]部分在猜数字游戏中这样做过，当用户猜中正确数字时退出程序。

我们也在猜数字游戏中使用了 `continue`，它在循环中告诉程序跳过本次循环迭代中剩余的任何代码，进入下一次迭代。

#### 从循环返回值

`loop` 的一个用途是重试你知道可能失败的操作，例如检查线程是否已完成其工作。你可能还需要将该操作的结果从循环传递到代码的其余部分。为此，你可以在用于停止循环的 `break` 表达式后添加你想要返回的值；该值将从循环中返回，以便你可以使用它，如下所示：

```rust
fn main() {
    let mut counter = 0;

    let result = loop {
        counter += 1;

        if counter == 10 {
            break counter * 2;
        }
    };

    println!("The result is {result}");
}
```

在循环之前，我们声明一个名为 `counter` 的变量并将其初始化为 `0`。然后，我们声明一个名为 `result` 的变量来保存从循环返回的值。在循环的每次迭代中，我们给 `counter` 变量加 `1`，然后检查 `counter` 是否等于 `10`。当它等于时，我们使用带值 `counter * 2` 的 `break` 关键字。循环后，我们使用分号来结束将值赋值给 `result` 的语句。最后，我们打印 `result` 中的值，在这个例子中是 `20`。

你也可以从循环内部 `return`。虽然 `break` 只退出当前循环，但 `return` 总是退出当前函数。

#### 使用循环标签消除歧义

如果你有嵌套循环，`break` 和 `continue` 适用于此时最内层的循环。你可以选择在循环上指定一个*循环标签*，然后你可以将其与 `break` 或 `continue` 一起使用，以指定这些关键字适用于标记的循环而不是最内层的循环。循环标签必须以单引号开头。这里是一个有两个嵌套循环的例子：

```rust
fn main() {
    let mut count = 0;
    'counting_up: loop {
        println!("count = {count}");
        let mut remaining = 10;

        loop {
            println!("remaining = {remaining}");
            if remaining == 9 {
                break;
            }
            if count == 2 {
                break 'counting_up;
            }
            remaining -= 1;
        }

        count += 1;
    }
    println!("End count = {count}");
}
```

外层循环有标签 `'counting_up`，它将从 0 计数到 2。没有标签的内层循环从 10 倒数到 9。第一个没有指定标签的 `break` 将只退出内层循环。`break 'counting_up;` 语句将退出外层循环。这段代码打印：

```console
$ cargo run
   Compiling loops v0.1.0 (file:///projects/loops)
    Finished `dev` profile [unoptimized + debuginfo] target(s) in 0.58s
     Running `target/debug/loops`
count = 0
remaining = 10
remaining = 9
count = 1
remaining = 10
remaining = 9
count = 2
remaining = 10
End count = 2
```

#### 使用 `while` 简化条件循环

程序通常需要在循环内评估一个条件。当条件为 `true` 时，循环运行。当条件不再为 `true` 时，程序调用 `break`，停止循环。可以使用 `loop`、`if`、`else` 和 `break` 的组合来实现这样的行为；如果你愿意，你现在可以在程序中尝试这样做。然而，这种模式非常常见，以至于 Rust 有一个内置的语言结构来实现它，称为 `while` 循环。在清单 3-3 中，我们使用 `while` 循环程序三次，每次倒计时，然后，在循环后，打印一条消息并退出。

**清单 3-3**：使用 `while` 循环在条件计算为 `true` 时运行代码（文件名：*src/main.rs*）

```rust
fn main() {
    let mut number = 3;

    while number != 0 {
        println!("{number}!");

        number -= 1;
    }

    println!("LIFTOFF!!!");
}
```

这种结构消除了如果你使用 `loop`、`if`、`else` 和 `break` 所需的许多嵌套，而且更清晰。当条件计算为 `true` 时，代码运行；否则，它退出循环。

#### 使用 `for` 遍历集合

你可以选择使用 `while` 构造来遍历集合的元素，例如数组。例如，清单 3-4 中的循环打印数组 `a` 中的每个元素。

**清单 3-4**：使用 `while` 循环遍历集合的每个元素（文件名：*src/main.rs*）

```rust
fn main() {
    let a = [10, 20, 30, 40, 50];
    let mut index = 0;

    while index < 5 {
        println!("the value is: {}", a[index]);

        index += 1;
    }
}
```

这里，代码遍历数组中的元素。它从索引 `0` 开始，然后循环直到到达数组中的最终索引（即，当 `index < 5` 不再为 `true` 时）。运行这段代码将打印数组中的每个元素：

```console
$ cargo run
   Compiling loops v0.1.0 (file:///projects/loops)
    Finished `dev` profile [unoptimized + debuginfo] target(s) in 0.32s
     Running `target/debug/loops`
the value is: 10
the value is: 20
the value is: 30
the value is: 40
the value is: 50
```

所有五个数组值都如预期出现在终端中。即使 `index` 最终会达到 `5`，循环也会在尝试从数组中获取第六个值之前停止执行。

然而，这种方法容易出错；如果索引值或测试条件不正确，我们可能导致程序 panic。例如，如果你将 `a` 数组的定义更改为有四个元素，但忘记将条件更新为 `while index < 4`，代码将会 panic。它也很慢，因为编译器会添加运行时代码来在循环的每次迭代中执行索引是否在数组边界内的条件检查。

作为一个更简洁的替代方案，你可以使用 `for` 循环并对集合中的每个项目执行一些代码。`for` 循环看起来像清单 3-5 中的代码。

**清单 3-5**：使用 `for` 循环遍历集合的每个元素（文件名：*src/main.rs*）

```rust
fn main() {
    let a = [10, 20, 30, 40, 50];

    for element in a {
        println!("the value is: {element}");
    }
}
```

当我们运行这段代码时，我们会看到与清单 3-4 相同的输出。更重要的是，我们现在提高了代码的安全性，并消除了因超出数组末尾或不够远而遗漏某些项目而可能导致 bug 的机会。`for` 循环生成的机器代码也可以更高效，因为在每次迭代中不需要将索引与数组长度进行比较。

使用 `for` 循环，如果你改变了数组中值的数量，你不需要记得更改任何其他代码，就像你在清单 3-4 中使用的方法一样。

`for` 循环的安全性和简洁性使它们成为 Rust 中最常用的循环结构。即使在你想要运行某些代码一定次数的情况下，就像在清单 3-3 中使用 `while` 循环的倒计时示例中一样，大多数 Rustaceans 也会使用 `for` 循环。这样做的方法是使用标准库提供的 `Range`，它生成从某个数字开始并在另一个数字之前结束的所有数字序列。

这是使用 `for` 循环和我们尚未谈论的另一种方法 `rev` 来反转范围的倒计时效果：

*文件名：src/main.rs*

```rust
fn main() {
    for number in (1..4).rev() {
        println!("{number}!");
    }
    println!("LIFTOFF!!!");
}
```

这段代码更简洁，不是吗？

## 小结

你做到了！这是一个相当大的章节：你学习了变量、标量和复合数据类型、函数、注释、`if` 表达式和循环！为了练习本章讨论的概念，尝试构建执行以下操作的程序：

- 在 Fahrenheit 和 Celsius 之间转换温度。
- 生成第 *n* 个 Fibonacci 数字。
- 打印圣诞颂歌"The Twelve Days of Christmas"的歌词，利用歌曲中的重复。

当你准备好继续前进时，我们将讨论 Rust 中一个在其他编程语言中*不*常存在的概念：所有权。

[comparing-the-guess-to-the-secret-number]: /rust-book/ch02-00-guessing-game-tutorial#比较猜测与秘密数字
[quitting-after-a-correct-guess]: /rust-book/ch02-00-guessing-game-tutorial#猜中后退出
