---
title: 10.3. 生命周期语法
---

生命周期确保引用在我们想要使用它们的时间内有效。生命周期是 Rust 的类型系统的一部分，它允许我们验证引用在程序中实际使用它们的时间内是有效的。

## 借用检查器

Rust 编译器有一个 _借用检查器_ ，它将引用生命周期与它们引用的值的生命周期进行比较，以确保数据的有效性。为了验证这一点，Rust 要求我们在代码中明确这些关系。

## 函数签名中的生命周期标注

让我们检查函数签名中需要显式生命周期标注的简单示例。代码示例 10-21 显示了一个函数，它返回两个字符串切片中较长的一个。

**代码示例 10-21：返回两个字符串切片中较长一个的函数，但不编译**

```rust
fn longest(x: &str, y: &str) -> &str {
    if x.len() > y.len() {
        x
    } else {
        y
    }
}
```

当我们尝试编译此代码时，我们会收到错误：

```console
$ cargo run
   Compiling chapter10 v0.1.0 (file:///projects/chapter10)
error[E0106]: missing lifetime specifier
 --> src/main.rs:1:33
  |
1 | fn longest(x: &str, y: &str) -> &str {
  |               ----     ----     ^ expected named lifetime parameter
  |
  = help: this function's return type contains a borrowed value, but the signature does not say whether it is borrowed from `x` or `y`
help: consider introducing a named lifetime parameter
  |
1 | fn longest<'a>(x: &'a str, y: &'a str) -> &'a str {
  |           ++++     ++          ++          ++

For more information about this error, help: `rustc --explain E0106`.
error: could not compile `chapter10` (bin "chapter10") due to 1 previous error
```

帮助文本提到了 _生命周期标注_ ：Rust 要求我们明确 `x` 和 `y` 的引用与返回值之间的关系。

## 生命周期标注语法

生命周期标注不会改变引用存活多长时间。生命周期标注描述了多个引用生命周期的关系，而不影响生命周期。

生命周期标注有一个稍微不寻常 syntax：它们的名称必须以撇号（'）开头，并且通常全部小写且非常短，就像泛型类型一样。大多数人使用名称 `'a` 作为第一个生命周期标注。

我们在引用符号 `&` 之后放置生命周期标注，并使用空格将标注与引用类型分开。这里有一些示例：

```rust
&i32        // 引用
&'a i32     // 带有显式生命周期的引用
&'a mut i32 // 带有显式生命期的可变引用
```

## 函数签名中的生命周期标注

为了修复代码示例 10-21 中的错误，我们需要将函数签名改为：

**代码示例 10-22：`longest` 函数定义，指定所有签名中的引用必须具有相同的生命周期 `'a`**

```rust
fn longest<'a>(x: &'a str, y: &'a str) -> &'a str {
    if x.len() > y.len() {
        x
    } else {
        y
    }
}
```

函数签名现在告诉 Rust，对于某个生命周期 `'a`，该函数采用两个参数，它们都是字符串切片，它们至少与生命周期 `'a` 一样长。该函数签名还告诉 Rust，从该函数返回的字符串切片将至少与生命周期 `'a` 一样长。

## 生命周期与引用关系

当在函数中使用具体引用时，借用检查器拒绝任何不符合生命周期约束的引用。

代码示例 10-23 展示了在 `main` 函数中使用 `longest` 函数。

**代码示例 10-23：在 `longest` 函数中使用具有不同具体生命周期的字符串切片引用**

```rust
fn main() {
    let string1 = String::from("long string is long");

    {
        let string2 = String::from("xyz");
        let result = longest(string1.as_str(), string2.as_str());
        println!("最长的字符串是 {}", result);
    }
}
```

## 结构体中的生命周期标注

到目前为止，我们只定义了拥有所有权类型的结构体。我们可以定义包含引用的结构体，但我们需要在每个引用上添加生命周期标注。代码示例 10-24 有一个名为 `ImportantExcerpt` 的结构体，它包含一个字符串切片。

**代码示例 10-24：包含引用的结构体，因此需要生命周期标注**

```rust
struct ImportantExcerpt<'a> {
    part: &'a str,
}

fn main() {
    let novel = String::from("Call me Ishmael. Some years ago...");
    let first_sentence = novel.split('.').next().expect("找不到 '.'");
    let i = ImportantExcerpt {
        part: first_sentence,
    };
}
```

这个结构体有一个字段 `part`，它保存一个字符串切片，这是一个引用。与泛型数据类型一样，我们在结构体名称后的尖括号内声明泛型生命周期参数的名称，以便我们可以在结构体定义的主体中使用生命周期参数。

## 生命周期省略

在了解了如何显式标注生命周期之后，让我们谈谈一种情况，即编译器允许我们省略生命周期标注。

在早期版本的 Rust 中，每次使用引用都需要显式生命周期标注。然而，随着 Rust 的使用，人们注意到某些生命周期模式一次又一次地重复。为了使这些常见模式更方便，Rust 团队添加了称为 _生命周期省略规则_ 的代码到编译器的分析中。

生命周期省略规则是编译器用来推断引用生命周期的特定情况集。如果我们遵循这些规则，我们就不需要显式编写生命周期标注。

生命周期省略规则包括：

1. 每个是引用的参数都有自己的生命周期标注。
2. 如果只有一个输入生命周期标注，该生命周期被赋给所有输出生命周期。
3. 如果有多个输入生命周期标注，但其中之一是 `&self` 或 `&mut self`，`self` 的生命周期被赋给所有输出生命周期。

## 方法中的生命周期标注

当我们在结构体上定义方法时，我们需要在 `impl` 行的结构体名称后加上生命周期标注，然后在方法签名中使用这些标注。

代码示例 10-25 显示了在 `ImportantExcerpt` 结构体上定义的方法。

**代码示例 10-25：`ImportantExcerpt` 上带有生命周期标注的方法**

```rust
impl<'a> ImportantExcerpt<'a> {
    fn level(&self) -> i32 {
        3
    }
}
```

## 静态生命周期

`'static` 生命周期是一种特殊的生命周期，它表示引用在程序的整个执行期间都有效。所有字符串字面量都有 `'static` 生命周期，如下所示：

```rust
let s: &'static str = "我有静态生命周期。";
```

## 结合泛型类型参数、Trait 约束和生命周期

让我们简要地看一个函数，它结合了泛型类型参数、trait 约束和生命周期标注。

```rust
use std::fmt::Display;

fn longest_with_an_announcement<'a, T>(
    x: &'a str,
    y: &'a str,
    ann: T,
) -> &'a str
where
    T: Display,
{
    println!("公告！{ann}");
    if x.len() > y.len() {
        x
    } else {
        y
    }
}
```

这是 Rust 泛型语法中最复杂的示例之一！函数返回两个字符串切片中较长的一个。它还有一个额外的参数 `ann`，其泛型类型 `T` 可以是任何实现了 `Display` trait 的类型。`ann` 将在函数比较字符串切片的长度之前被打印。

## 总结

在本章中，我们涵盖了 Rust 的三个主要泛型特性：泛型类型参数、trait 和生命周期。泛型类型参数让我们能够为不同类型的值使用相同的代码。Trait 让我们能够指定类型具有的行为，并与其他类型共享。生命周期确保引用在我们想要使用它们的时间内有效。

这些特性结合在一起，让你能够编写不会重复的高效、灵活的代码。通过使用泛型，你可以创建适用于多种类型的函数和结构体，而不需要为每个类型编写单独的实现。通过使用 trait，你可以定义类型应该实现的行为，并在泛型中使用这些约束。通过使用生命周期，你可以确保引用在使用时是有效的，防止悬垂指针和其他内存安全问题。

现在你已经了解了 Rust 的类型系统的这些高级特性，我们将在接下来的章节中继续探索 Rust 的其他强大功能。
