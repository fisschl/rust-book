---
title: 使用结构体的示例程序
---

为了理解什么时候我们可能想要使用结构体，让我们编写一个计算矩形面积的程序。我们将从使用单个变量开始，然后重构程序直到我们使用结构体。

让我们用 Cargo 创建一个名为 *rectangles* 的新二进制项目，它将接受以像素为单位指定的矩形的宽度和高度，并计算矩形的面积。清单 5-8 展示了我们项目的 *src/main.rs* 中一个实现此功能的简短程序。

**清单 5-8**：使用单独的宽度和高度变量计算矩形面积（文件名：src/main.rs）

```rust
fn main() {
    let width1 = 30;
    let height1 = 50;

    println!(
        "The area of the rectangle is {} square pixels.",
        area(width1, height1)
    );
}

fn area(width: u32, height: u32) -> u32 {
    width * height
}
```

现在，使用 `cargo run` 运行这个程序：

```console
$ cargo run
   Compiling rectangles v0.1.0 (file:///projects/rectangles)
    Finished `dev` profile [unoptimized + debuginfo] target(s) in 0.42s
     Running `target/debug/rectangles`
The area of the rectangle is 1500 square pixels.
```

这段代码通过用每个维度调用 `area` 函数成功计算出了矩形的面积，但我们可以做更多工作来使这段代码清晰和易读。

这段代码的问题在 `area` 的签名中很明显：

```rust
fn area(width: u32, height: u32) -> u32 {
```

`area` 函数应该计算一个矩形的面积，但我们编写的函数有两个参数，而且在我们程序的任何地方都不清楚这两个参数是相关的。将宽度和高度组合在一起会更易读和更易管理。我们在第 3 章的["元组类型"][the-tuple-type]<!-- ignore --> 部分讨论过一种方法：使用元组。

### 使用元组重构

清单 5-9 展示了我们程序使用元组的另一个版本。

**清单 5-9**：使用元组指定矩形的宽度和高度（文件名：src/main.rs）

```rust
fn main() {
    let rect1 = (30, 50);

    println!(
        "The area of the rectangle is {} square pixels.",
        area(rect1)
    );
}

fn area(dimensions: (u32, u32)) -> u32 {
    dimensions.0 * dimensions.1
}
```

在某种程度上，这个程序更好了。元组让我们增加了一些结构，我们现在只传递一个参数。但在另一个方面，这个版本不够清晰：元组不给它们的元素命名，所以我们必须索引到元组的各个部分，使我们的计算不那么明显。

对于面积计算来说，混淆宽度和高度并不重要，但如果我们想在屏幕上绘制矩形，那就重要了！我们必须记住 `width` 是元组索引 `0`，`height` 是元组索引 `1`。如果有人要使用我们的代码，这会更难弄清楚和记住。因为我们没有在我们的代码中传达数据的意义，现在更容易引入错误。

### 使用结构体重构

我们使用结构体通过标记数据来增加意义。我们可以将我们正在使用的元组转换为一个具有整体名称以及各部分名称的结构体，如清单 5-10 所示。

**清单 5-10**：定义 `Rectangle` 结构体（文件名：src/main.rs）

```rust
struct Rectangle {
    width: u32,
    height: u32,
}

fn main() {
    let rect1 = Rectangle {
        width: 30,
        height: 50,
    };

    println!(
        "The area of the rectangle is {} square pixels.",
        area(&rect1)
    );
}

fn area(rectangle: &Rectangle) -> u32 {
    rectangle.width * rectangle.height
}
```

在这里，我们定义了一个结构体并将其命名为 `Rectangle`。在大括号内，我们将字段定义为 `width` 和 `height`，两者都具有 `u32` 类型。然后，在 `main` 中，我们创建了一个特定的 `Rectangle` 实例，其宽度为 `30`，高度为 `50`。

我们的 `area` 函数现在定义了一个参数，我们将其命名为 `rectangle`，其类型是结构体 `Rectangle` 实例的不可变借用。正如第 4 章中提到的，我们想借用结构体而不是获取它的所有权。这样，`main` 保留其所有权并可以继续使用 `rect1`，这就是我们在函数签名和调用函数的地方使用 `&` 的原因。

`area` 函数访问 `Rectangle` 实例的 `width` 和 `height` 字段（请注意，访问借用结构体实例的字段不会移动字段值，这就是为什么你经常看到结构体的借用）。我们的 `area` 函数签名现在准确地说明了我们想要的：使用其 `width` 和 `height` 字段计算 `Rectangle` 的面积。这传达了宽度和高度彼此相关，并且给值赋予了描述性名称，而不是使用元组索引值 `0` 和 `1`。这是清晰度上的一个胜利。

### 使用派生 trait 添加功能

在我们调试程序时，能够打印 `Rectangle` 实例并查看其所有字段的值会很有用。清单 5-11 尝试使用我们在前几章中使用过的 [`println!` 宏][println]<!-- ignore -->。然而，这不会起作用。

**清单 5-11**：尝试打印 `Rectangle` 实例（文件名：src/main.rs）

```rust
struct Rectangle {
    width: u32,
    height: u32,
}

fn main() {
    let rect1 = Rectangle {
        width: 30,
        height: 50,
    };

    println!("rect1 is {rect1}");
}
```

当我们编译这段代码时，我们得到一个带有此核心消息的错误：

```text
error[E0277]: `Rectangle` doesn't implement `std::fmt::Display`
```

`println!` 宏可以进行多种格式化，默认情况下，大括号告诉 `println!` 使用称为 `Display` 的格式化：旨在直接供最终用户消费的输出。我们迄今为止看到的原始类型默认实现 `Display`，因为你想向用户显示 `1` 或任何其他原始类型的方式只有一种。但是对于结构体，`println!` 应该如何格式化输出的方式不太清楚，因为有更多的显示可能性：你想要逗号吗？你想打印大括号吗？所有字段都应该显示吗？由于这种歧义，Rust 不会试图猜测我们想要什么，结构体没有提供的与 `println!` 和大括号占位符一起使用的 `Display` 实现。

如果我们继续阅读错误，我们会发现这个有用的注释：

```text
 = help: the trait `std::fmt::Debug` is not implemented for `Rectangle`
 = note: in format strings you may be able to use `{:?}` (or {:#?} for pretty-print) instead
```

让我们试试看！`println!` 宏调用现在看起来像这样 `println!("rect1 is {rect1:?}");`。在大括号内放入说明符 `:?` 告诉 `println!` 我们想要使用称为 `Debug` 的输出格式。`Debug` trait 使我们能够以开发者有用的方式打印结构体，以便我们在调试代码时能看到它的值。

用此更改编译代码。哎呀！我们仍然得到一个错误：

```text
error[E0277]: `Rectangle` doesn't implement `Debug`
```

但是编译器再次给了我们一个有用的注释：

```text
 = help: the trait `Debug` is not implemented for `Rectangle`
 = note: add `#[derive(Debug)]` to `Rectangle` or manually implement the trait
```

Rust 确实包含打印调试信息的功能，但我们必须显式选择启用该功能。为此，我们在结构体定义之前添加外部属性 `#[derive(Debug)]`，如清单 5-12 所示。

**清单 5-12**：添加属性以派生 `Debug` trait 并使用调试格式打印 `Rectangle` 实例（文件名：src/main.rs）

```rust
#[derive(Debug)]
struct Rectangle {
    width: u32,
    height: u32,
}

fn main() {
    let rect1 = Rectangle {
        width: 30,
        height: 50,
    };

    println!("rect1 is {rect1:?}");
}
```

现在当我们运行程序时，我们不会得到任何错误，我们会看到以下输出：

```console
$ cargo run
   Compiling rectangles v0.1.0 (file:///projects/rectangles)
    Finished `dev` profile [unoptimized + debuginfo] target(s) in 0.48s
     Running `target/debug/rectangles`
rect1 is Rectangle { width: 30, height: 50 }
```

很好！这不是最漂亮的输出，但它显示了这个实例的所有字段的值，这肯定会在调试期间有所帮助。当我们有更大的结构体时，输出更容易阅读会很有用；在这些情况下，我们可以在 `println!` 字符串中使用 `{:#?}` 代替 `{:?}`。在这个例子中，使用 `{:#?}` 样式将输出以下内容：

```console
$ cargo run
   Compiling rectangles v0.1.0 (file:///projects/rectangles)
    Finished `dev` profile [unoptimized + debuginfo] target(s) in 0.48s
     Running `target/debug/rectangles`
rect1 is Rectangle {
    width: 30,
    height: 50,
}
```

另一种使用 `Debug` 格式打印值的方法是使用 [`dbg!` 宏][dbg]<!-- ignore -->，它接受表达式的所有权（与 `println!` 相反，后者接受引用），打印该 `dbg!` 宏调用在你代码中发生的文件和行号以及该表达式的结果值，并返回该值的所有权。

> 注意：调用 `dbg!` 宏会打印到标准错误控制台流（`stderr`），与 `println!` 相反，后者打印到标准输出控制台流（`stdout`）。我们将在第 12 章的["将错误重定向到标准错误"][err]<!-- ignore --> 部分更多地讨论 `stderr` 和 `stdout`。

这里有一个例子，我们对分配给 `width` 字段的值以及 `rect1` 中整个结构体的值感兴趣：

```rust
#[derive(Debug)]
struct Rectangle {
    width: u32,
    height: u32,
}

fn main() {
    let scale = 2;
    let rect1 = Rectangle {
        width: dbg!(30 * scale),
        height: 50,
    };

    dbg!(&rect1);
}
```

我们可以将 `dbg!` 放在表达式 `30 * scale` 周围，因为 `dbg!` 返回表达式的值的所有权，`width` 字段将获得与没有 `dbg!` 调用时相同的值。我们不希望 `dbg!` 获取 `rect1` 的所有权，所以我们在下一次调用中使用对 `rect1` 的引用。下面是此示例的输出：

```console
$ cargo run
   Compiling rectangles v0.1.0 (file:///projects/rectangles)
    Finished `dev` profile [unoptimized + debuginfo] target(s) in 0.61s
     Running `target/debug/rectangles`
[src/main.rs:10:16] 30 * scale = 60
[src/main.rs:14:5] &rect1 = Rectangle {
    width: 60,
    height: 50,
}
```

我们可以看到第一个输出位来自 *src/main.rs* 第 10 行，我们在那里调试表达式 `30 * scale`，其结果值是 `60`（为整数实现的 `Debug` 格式只是打印它们的值）。*src/main.rs* 第 14 行的 `dbg!` 调用输出了 `&rect1` 的值，即 `Rectangle` 结构体。此输出使用 `Rectangle` 类型的漂亮 `Debug` 格式。当你试图弄清楚代码在做什么时，`dbg!` 宏真的很有帮助！

除了 `Debug` trait，Rust 还提供了许多 trait 供我们使用 `derive` 属性，可以为我们的自定义类型添加有用的行为。这些 trait 及其行为列在[附录 C][app-c]<!-- ignore --> 中。我们将介绍如何在第 10 章实现这些 trait 以及自定义行为，以及如何创建你自己的 trait。还有许多 `derive` 以外的属性；有关更多信息，请参阅 [Rust Reference 的"属性"部分][attributes]。

我们的 `area` 函数非常具体：它只计算矩形的面积。将这种行为与我们的 `Rectangle` 结构体更紧密地联系起来会很有帮助，因为它不适用于任何其他类型。让我们看看如何继续重构这段代码，将 `area` 函数转变为在我们 `Rectangle` 类型上定义的 `area` 方法。

[the-tuple-type]: /rust-book/ch03-02-data-types#the-tuple-type
[app-c]: https://doc.rust-lang.org/book/appendix-03-derivable-traits.html
[println]: https://doc.rust-lang.org/std/macro.println.html
[dbg]: https://doc.rust-lang.org/std/macro.dbg.html
[err]: https://doc.rust-lang.org/book/ch12-06-writing-to-stderr-instead-of-stdout.html
[attributes]: https://doc.rust-lang.org/reference/attributes.html
