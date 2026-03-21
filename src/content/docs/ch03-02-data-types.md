---
title: 数据类型
---

Rust 中的每个值都属于某种*数据类型*，这告诉 Rust 正在指定哪种数据，以便它知道如何处理该数据。我们将查看两个数据类型子集：标量和复合类型。

请记住，Rust 是一种*静态类型*的语言，这意味着它必须在编译时知道所有变量的类型。编译器通常可以根据值以及我们如何使用它来推断我们想要使用的类型。在许多类型都可能的情况下，例如当我们在第2章的["比较猜测与秘密数字"][comparing-the-guess-to-the-secret-number]部分使用 `parse` 将 `String` 转换为数字类型时，我们必须添加类型注解，如下所示：

```rust
let guess: u32 = "42".parse().expect("Not a number!");
```

如果我们不在上述代码中添加 `: u32` 类型注解，Rust 将显示以下错误，这意味着编译器需要我们从它那里获得更多信息，以知道我们想要使用哪种类型：

```console
$ cargo build
   Compiling no_type_annotations v0.1.0 (file:///projects/no_type_annotations)
error[E0284]: type annotations needed
 --> src/main.rs:2:9
  |
2 |     let guess = "42".parse().expect("Not a number!");
  |         ^^^^^        ----- type must be known at this point
  |
  = note: cannot satisfy `<_ as FromStr>::Err == _`
help: consider giving `guess` an explicit type
  |
2 |     let guess: /* Type */ = "42".parse().expect("Not a number!");
  |              ++++++++++++

For more information about this error, try `rustc --explain E0284`.
error: could not compile `no_type_annotations` (bin "no_type_annotations") due to 1 previous error
```

你将看到其他数据类型的不同类型注解。

### 标量类型

*标量*类型表示单个值。Rust 有四种主要的标量类型：整数、浮点数、布尔值和字符。你可能从其他编程语言中认出这些。让我们深入了解它们在 Rust 中的工作方式。

#### 整数类型

*整数*是没有小数部分的数字。我们在第2章使用了一种整数类型，即 `u32` 类型。这种类型声明表明与之关联的值应该是无符号整数（有符号整数类型以 `i` 而不是 `u` 开头），占用 32 位的空间。表 3-1 显示了 Rust 中内置的整数类型。我们可以使用这些变体中的任何一个来声明整数值的类型。

*表 3-1：Rust 中的整数类型*

| 长度 | 有符号 | 无符号 |
|-------|-------|--------|
| 8-bit   | `i8`    | `u8`     |
| 16-bit  | `i16`   | `u16`    |
| 32-bit  | `i32`   | `u32`    |
| 64-bit  | `i64`   | `u64`    |
| 128-bit | `i128`  | `u128`   |
| 架构相关 | `isize` | `usize`  |

每个变体都可以是有符号或无符号的，并且具有明确的大小。*有符号*和*无符号*指的是数字是否可以为负——换句话说，数字是否需要带有符号（有符号）或者它将永远为正，因此可以不带符号表示（无符号）。这就像在纸上写数字：当符号重要时，数字显示加号或减号；但是，当可以安全地假设数字为正时，它显示不带符号。有符号数字使用[二进制补码][twos-complement]表示法存储。

每个有符号变体可以存储从 −(2<sup>n − 1</sup>) 到 2<sup>n − 1</sup> − 1 的数字（包含），其中 *n* 是该变体使用的位数。所以，`i8` 可以存储从 −(2<sup>7</sup>) 到 2<sup>7</sup> − 1 的数字，等于 −128 到 127。无符号变体可以存储从 0 到 2<sup>n</sup> − 1 的数字，所以 `u8` 可以存储从 0 到 2<sup>8</sup> − 1 的数字，等于 0 到 255。

此外，`isize` 和 `usize` 类型取决于你的程序运行所在的计算机架构：如果你在 64 位架构上则为 64 位，如果你在 32 位架构上则为 32 位。

你可以用表 3-2 中所示的任何形式编写整数字面量。注意，可以是多种数字类型的数字字面量允许使用类型后缀，例如 `57u8`，来指定类型。数字字面量也可以使用 `_` 作为视觉分隔符，使数字更容易阅读，例如 `1_000`，它将具有与指定 `1000` 相同的值。

*表 3-2：Rust 中的整数字面量*

| 数字字面量 | 示例 |
| ---------------- | ------------- |
| 十进制          | `98_222`      |
| 十六进制              | `0xff`        |
| 八进制            | `0o77`        |
| 二进制           | `0b1111_0000` |
| 字节 (`u8` 专用) | `b'A'`        |

那么你怎么知道要使用哪种整数类型呢？如果你不确定，Rust 的默认值通常是很好的起点：整数类型默认为 `i32`。你使用 `isize` 或 `usize` 的主要情况是在索引某种集合时。

> ##### 整数溢出
>
> 假设你有一个类型为 `u8` 的变量，可以容纳 0 到 255 之间的值。如果你尝试将变量更改为超出该范围的值，例如 256，将发生*整数溢出*，这可能导致两种行为之一。当你在调试模式下编译时，Rust 包含对整数溢出的检查，如果发生这种行为，会导致你的程序在运行时*panic*。当程序以错误退出时，Rust 使用术语*panic*；我们将在第 9 章的["不可恢复的错误与`panic!`"][unrecoverable-errors-with-panic]部分更深入地讨论 panic。
>
> 当你使用 `--release` 标志在发布模式下编译时，Rust 不会包含导致 panic 的整数溢出检查。相反，如果发生溢出，Rust 执行*二进制补码回绕*。简而言之，大于该类型可以容纳的最大值的值会"回绕"到该类型可以容纳的最小值。对于 `u8`，值 256 变为 0，值 257 变为 1，依此类推。程序不会 panic，但变量将拥有一个可能不是你所期望的值。依赖整数溢出的回绕行为被认为是一个错误。
>
> 为了显式处理溢出的可能性，你可以使用标准库为基本数字类型提供的以下方法族：
>
> - 使用 `wrapping_*` 方法在所有模式下回绕，例如 `wrapping_add`。
> - 如果溢出则返回 `None` 值的 `checked_*` 方法。
> - 返回值和一个表示是否发生溢出的布尔值的 `overflowing_*` 方法。
> - 在值的最小值或最大值处饱和的 `saturating_*` 方法。

#### 浮点类型

Rust 还有两种基本类型用于*浮点数*，即带小数点的数字。Rust 的浮点类型是 `f32` 和 `f64`，分别为 32 位和 64 位大小。默认类型是 `f64`，因为在现代 CPU 上，它的速度与 `f32` 大致相同，但能够提供更精确的值。所有浮点类型都是有符号的。

以下是一个展示浮点数的例子：

*文件名：src/main.rs*

```rust
fn main() {
    let x = 2.0; // f64

    let y: f32 = 3.0; // f32
}
```

浮点数按照 IEEE-754 标准表示。

#### 数字运算

Rust 支持你对所有数字类型所期望的基本数学运算：加法、减法、乘法、除法和取余。整数除法向零截断到最接近的整数。以下代码展示了如何在 `let` 语句中使用每个数字运算：

*文件名：src/main.rs*

```rust
fn main() {
    // addition
    let sum = 5 + 10;

    // subtraction
    let difference = 95.5 - 4.3;

    // multiplication
    let product = 4 * 30;

    // division
    let quotient = 56.7 / 32.2;
    let truncated = -5 / 3; // Results in -1

    // remainder
    let remainder = 43 % 5;
}
```

这些语句中的每个表达式都使用一个数学运算符并计算为单个值，然后绑定到一个变量。[附录 B][appendix_b] 包含了 Rust 提供的所有运算符的列表。

#### 布尔类型

与大多数其他编程语言一样，Rust 中的布尔类型有两个可能的值：`true` 和 `false`。布尔值占用一个字节。Rust 中的布尔类型使用 `bool` 指定。例如：

*文件名：src/main.rs*

```rust
fn main() {
    let t = true;

    let f: bool = false; // with explicit type annotation
}
```

使用布尔值的主要方式是通过条件，例如 `if` 表达式。我们将在["控制流"][control-flow]部分介绍 `if` 表达式在 Rust 中的工作方式。

#### 字符类型

Rust 的 `char` 类型是语言中最基本的字母类型。以下是声明 `char` 值的一些示例：

*文件名：src/main.rs*

```rust
fn main() {
    let c = 'z';
    let z: char = 'ℤ'; // with explicit type annotation
    let heart_eyed_cat = '😻';
}
```

注意，我们用单引号指定 `char` 字面量，而不是使用双引号的字符串字面量。Rust 的 `char` 类型大小为 4 个字节，表示一个 Unicode 标量值，这意味着它可以表示的远不止 ASCII。重音字母；中文、日文和韩文字符；表情符号；以及零宽空格在 Rust 中都是有效的 `char` 值。Unicode 标量值的范围是 `U+0000` 到 `U+D7FF` 和 `U+E000` 到 `U+10FFFF`（包含）。然而，"字符"实际上并不是 Unicode 中的概念，所以你对"字符"的直觉可能与 Rust 中 `char` 的含义不匹配。我们将在第8章的["用字符串存储 UTF-8 编码文本"][strings]中详细讨论这个话题。

### 复合类型

*复合类型*可以将多个值组合成一个类型。Rust 有两种基本的复合类型：元组和数组。

#### 元组类型

*元组*是将多种类型的多个值组合成一个复合类型的一般方式。元组具有固定长度：一旦声明，它们就不能增长或缩小。

我们通过在括号内编写逗号分隔的值列表来创建元组。元组中的每个位置都有一个类型，元组中不同值的类型不必相同。我们在这个例子中添加了可选的类型注解：

*文件名：src/main.rs*

```rust
fn main() {
    let tup: (i32, f64, u8) = (500, 6.4, 1);
}
```

变量 `tup` 绑定到整个元组，因为元组被视为单个复合元素。要从元组中获取单个值，我们可以使用模式匹配来解构元组值，如下所示：

*文件名：src/main.rs*

```rust
fn main() {
    let tup = (500, 6.4, 1);

    let (x, y, z) = tup;

    println!("The value of y is: {y}");
}
```

这个程序首先创建一个元组并将其绑定到变量 `tup`。然后它使用带有 `let` 的模式来获取 `tup` 并将其转换为三个单独的变量 `x`、`y` 和 `z`。这被称为*解构*，因为它将单个元组分解为三个部分。最后，程序打印 `y` 的值，即 `6.4`。

我们还可以通过使用句点（`.`）后跟我们要访问的值的索引来直接访问元组元素。例如：

*文件名：src/main.rs*

```rust
fn main() {
    let x: (i32, f64, u8) = (500, 6.4, 1);

    let five_hundred = x.0;

    let six_point_four = x.1;

    let one = x.2;
}
```

这个程序创建元组 `x`，然后使用各自的索引访问元组的每个元素。与大多数编程语言一样，元组中的第一个索引是 0。

没有任何值的元组有一个特殊的名称，*单元*。这个值及其对应的类型都写作 `()`，表示空值或空返回类型。如果表达式不返回任何其他值，则隐式返回单元值。

#### 数组类型

拥有多个值集合的另一种方式是使用*数组*。与元组不同，数组的每个元素必须具有相同的类型。与某些其他语言中的数组不同，Rust 中的数组具有固定长度。

我们将数组中的值写成方括号内的逗号分隔列表：

*文件名：src/main.rs*

```rust
fn main() {
    let a = [1, 2, 3, 4, 5];
}
```

当你希望数据分配在栈上时，数组很有用，与我们到目前为止看到的其他类型一样，而不是堆（我们将在[第4章][stack-and-heap]中更多地讨论栈与堆），或者当你希望确保你总是有固定数量的元素时。不过，数组不如 vector 类型灵活。vector 是标准库提供的一种类似集合类型，*允许*增长或缩小大小，因为其内容存在于堆上。如果你不确定应该使用数组还是 vector，你可能应该使用 vector。[第8章][vectors]更详细地讨论了 vectors。

然而，当你知道元素数量不需要改变时，数组更有用。例如，如果你在程序中使用月份名称，你可能会使用数组而不是 vector，因为你知道它将始终包含 12 个元素：

```rust
let months = ["January", "February", "March", "April", "May", "June", "July",
              "August", "September", "October", "November", "December"];
```

你使用方括号编写数组的类型，其中包含每个元素的类型、分号，然后是数组中的元素数量，如下所示：

```rust
let a: [i32; 5] = [1, 2, 3, 4, 5];
```

这里，`i32` 是每个元素的类型。分号后，数字 `5` 表示数组包含五个元素。

你还可以通过指定初始值，后跟分号，然后是方括号中数组的长度来初始化数组，使其包含每个元素的相同值，如下所示：

```rust
let a = [3; 5];
```

名为 `a` 的数组将包含 `5` 个元素，这些元素最初都将设置为值 `3`。这与编写 `let a = [3, 3, 3, 3, 3];` 相同，但方式更简洁。

#### 数组元素访问

数组是已知固定大小的单块内存，可以分配在栈上。你可以使用索引访问数组的元素，如下所示：

*文件名：src/main.rs*

```rust
fn main() {
    let a = [1, 2, 3, 4, 5];

    let first = a[0];
    let second = a[1];
}
```

在这个例子中，名为 `first` 的变量将获得值 `1`，因为这是索引 `[0]` 处数组中的值。名为 `second` 的变量将从数组的索引 `[1]` 处获得值 `2`。

#### 无效的数组元素访问

让我们看看如果你尝试访问超出数组末尾的数组元素会发生什么。假设你运行这段代码，类似于第2章的猜数字游戏，从用户那里获取数组索引：

*文件名：src/main.rs*

```rust
use std::io;

fn main() {
    let a = [1, 2, 3, 4, 5];

    println!("Please enter an array index.");

    let mut index = String::new();

    io::stdin()
        .read_line(&mut index)
        .expect("Failed to read line");

    let index: usize = index
        .trim()
        .parse()
        .expect("Index entered was not a number");

    let element = a[index];

    println!("The value of the element at index {index} is: {element}");
}
```

这段代码成功编译。如果你使用 `cargo run` 运行这段代码并输入 `0`、`1`、`2`、`3` 或 `4`，程序将打印出数组中该索引处的相应值。如果你输入超出数组末尾的数字，例如 `10`，你将看到如下输出：

```console
thread 'main' panicked at src/main.rs:19:19:
index out of bounds: the len is 5 but the index is 10
note: run with `RUST_BACKTRACE=1` environment variable to display a backtrace
```

程序在使用无效值进行索引操作时导致运行时错误。程序以错误消息退出，没有执行最终的 `println!` 语句。当你尝试使用索引访问元素时，Rust 会检查你指定的索引是否小于数组长度。如果索引大于或等于长度，Rust 将 panic。这个检查必须在运行时发生，特别是在这种情况下，因为编译器不可能知道用户稍后运行代码时会输入什么值。

这是 Rust 内存安全原则在实践中的一个例子。在许多低级语言中，不进行这种检查，当你提供不正确的索引时，可能会访问无效内存。Rust 通过立即退出而不是允许内存访问并继续来保护你免受这种错误。第9章讨论了 Rust 的更多错误处理，以及如何编写既不会 panic 也不会允许无效内存访问的可读、安全代码。

[comparing-the-guess-to-the-secret-number]: /rust-book/ch02-00-guessing-game-tutorial#比较猜测与秘密数字
[twos-complement]: https://en.wikipedia.org/wiki/Two%27s_complement
[control-flow]: /rust-book/ch03-05-control-flow
[strings]: https://doc.rust-lang.org/book/ch08-02-strings.html#storing-utf-8-encoded-text-with-strings
[stack-and-heap]: /rust-book/ch04-01-what-is-ownership/#栈与堆
[vectors]: https://doc.rust-lang.org/book/ch08-01-vectors.html
[unrecoverable-errors-with-panic]: https://doc.rust-lang.org/book/ch09-01-unrecoverable-errors-with-panic.html
[appendix_b]: https://doc.rust-lang.org/book/appendix-02-operators.html
