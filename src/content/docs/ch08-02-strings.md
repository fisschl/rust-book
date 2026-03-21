---
title: 使用 String 存储 UTF-8 编码的文本
---

我们在第 4 章讨论过字符串，但现在我们将更深入地了解它们。新的 Rustacean 通常会在字符串上遇到困难，原因有三个：Rust 倾向于暴露可能的错误、字符串是比许多程序员认为的更复杂的数据结构，以及 UTF-8。这些因素结合在一起，当你从其他编程语言转过来时，可能会显得困难。

我们在集合的上下文中讨论字符串，因为字符串是作为字节集合实现的，加上一些方法，当这些字节被解释为文本时提供有用的功能。在本节中，我们将讨论每个集合类型都有的 `String` 上的操作，例如创建、更新和读取。我们还将讨论 `String` 与其他集合不同的方式，即索引到 `String` 如何因人和计算机解释 `String` 数据的方式不同而变得复杂。

## 定义字符串

我们将首先定义我们所说的 _字符串_ 这个术语。Rust 核心语言中只有一种是字符串类型，即字符串切片 `str`，它通常以其借用形式 `&str` 出现。在第 4 章中，我们讨论了字符串切片，它们是对存储在其他地方的某些 UTF-8 编码字符串数据的引用。例如，字符串字面量存储在程序的二进制文件中，因此是字符串切片。

`String` 类型由 Rust 标准库提供，而不是编码到核心语言中，是一个可增长的、可变的、拥有的、UTF-8 编码的字符串类型。当 Rustacean 提到 Rust 中的"字符串"时，他们可能指的是 `String` 或字符串切片 `&str` 类型，而不仅仅是其中一种。虽然本节主要关于 `String`，但这两种类型都在 Rust 的标准库中大量使用，而且 `String` 和字符串切片都是 UTF-8 编码的。

## 创建新的 String

许多可用于 `Vec<T>` 的相同操作也可用于 `String`，因为 `String` 实际上是作为字节向量的包装器实现的，带有一些额外的保证、限制和能力。一个以相同方式处理 `Vec<T>` 和 `String` 的函数示例是 `new` 函数，用于创建实例，如代码示例 8-11 所示。

**代码示例 8-11：创建一个新的空 `String`**

```rust
let mut s = String::new();
```

这一行创建了一个名为 `s` 的新空字符串，然后我们可以向其中加载数据。通常，我们会有一些初始数据来启动字符串。为此，我们使用 `to_string` 方法，该方法可用于任何实现了 `Display` trait 的类型，正如字符串字面量所做的那样。代码示例 8-12 展示了两个示例。

**代码示例 8-12：使用 `to_string` 方法从字符串字面量创建 `String`**

```rust
let data = "initial contents";

let s = data.to_string();

// 该方法也可以直接在字面量上使用：
let s = "initial contents".to_string();
```

这段代码创建了一个包含 `initial contents` 的字符串。

我们还可以使用函数 `String::from` 从字符串字面量创建 `String`。代码示例 8-13 中的代码与代码示例 8-12 中使用 `to_string` 的代码等效。

**代码示例 8-13：使用 `String::from` 函数从字符串字面量创建 `String`**

```rust
let s = String::from("initial contents");
```

因为字符串用于很多事情，我们可以使用许多不同的通用 API 来处理字符串，为我们提供了很多选项。其中一些可能看起来是冗余的，但它们都有自己的用途！在这种情况下，`String::from` 和 `to_string` 做同样的事情，所以你选择哪一个取决于风格和可读性。

请记住字符串是 UTF-8 编码的，所以我们可以在其中包含任何正确编码的数据，如代码示例 8-14 所示。

**代码示例 8-14：在字符串中存储不同语言的问候语**

```rust
let hello = String::from("السلام عليكم");
let hello = String::from("Dobrý den");
let hello = String::from("Hello");
let hello = String::from("שלום");
let hello = String::from("नमस्ते");
let hello = String::from("こんにちは");
let hello = String::from("안녕하세요");
let hello = String::from("你好");
let hello = String::from("Olá");
let hello = String::from("Здравствуйте");
let hello = String::from("Hola");
```

所有这些都是有效的 `String` 值。

## 更新 String

`String` 可以增大，其内容可以更改，就像 `Vec<T>` 的内容一样，如果你向其中推入更多数据。此外，你可以方便地使用 `+` 运算符或 `format!` 宏来连接 `String` 值。

### 使用 `push_str` 或 `push` 追加

我们可以使用 `push_str` 方法追加字符串切片来增长 `String`，如代码示例 8-15 所示。

**代码示例 8-15：使用 `push_str` 方法将字符串切片追加到 `String`**

```rust
let mut s = String::from("foo");
s.push_str("bar");
```

这两行之后，`s` 将包含 `foobar`。`push_str` 方法接受一个字符串切片，因为我们不一定想获取参数的所有权。例如，在代码示例 8-16 的代码中，我们希望在将其内容追加到 `s1` 后仍然能够使用 `s2`。

**代码示例 8-16：在将其内容追加到 `String` 后使用字符串切片**

```rust
let mut s1 = String::from("foo");
let s2 = "bar";
s1.push_str(s2);
println!("s2 is {s2}");
```

如果 `push_str` 方法取得了 `s2` 的所有权，我们将无法在最后一行打印其值。然而，这段代码按我们的预期工作！

`push` 方法接受一个字符作为参数并将其添加到 `String`。代码示例 8-17 使用 `push` 方法将字母 _l_ 添加到 `String`。

**代码示例 8-17：使用 `push` 向 `String` 值添加一个字符**

```rust
let mut s = String::from("lo");
s.push('l');
```

结果，`s` 将包含 `lol`。

### 使用 `+` 或 `format!` 连接

通常，你会想要组合两个现有字符串。一种方法是使用 `+` 运算符，如代码示例 8-18 所示。

**代码示例 8-18：使用 `+` 运算符将两个 `String` 值组合成一个新的 `String` 值**

```rust
let s1 = String::from("Hello, ");
let s2 = String::from("world!");
let s3 = s1 + &s2; // 注意 s1 已被移动到这里，不能再使用
```

字符串 `s3` 将包含 `Hello, world!`。`s1` 在加法后不再有效，以及我们使用对 `s2` 的引用的原因，与我们使用 `+` 运算符时调用的方法的签名有关。`+` 运算符使用 `add` 方法，其签名看起来像这样：

```rust
fn add(self, s: &str) -> String {
```

在标准库中，你会看到 `add` 使用泛型和关联类型定义。这里，我们使用了具体类型替代，这就是我们在使用 `String` 值调用此方法时发生的情况。我们将在第 10 章讨论泛型。这个签名给了我们理解 `+` 运算符棘手部分所需的线索。

首先，`s2` 有一个 `&`，意味着我们将第二个字符串的引用添加到第一个字符串。这是因为 `add` 函数中的 `s` 参数：我们只能将字符串切片添加到 `String`；我们不能将两个 `String` 值相加。但是等等——`&s2` 的类型是 `&String`，而不是 `add` 的第二个参数中指定的 `&str`。那么，代码示例 8-18 为什么能编译呢？

我们能够在对 `add` 的调用中使用 `&s2` 的原因是编译器可以将 `&String` 参数强制转换为 `&str`。当我们调用 `add` 方法时，Rust 使用解引用强制转换，这里将 `&s2` 转换为 `&s2[..]`。我们将在第 15 章更深入地讨论解引用强制转换。因为 `add` 不获取 `s` 参数的所有权，在此操作后 `s2` 仍然是一个有效的 `String`。

其次，我们可以从签名中看到 `add` 获取了 `self` 的所有权，因为 `self` _没有_ `&`。这意味着代码示例 8-18 中的 `s1` 将被移入 `add` 调用，之后将不再有效。所以，虽然 `let s3 = s1 + &s2;` 看起来像是会复制两个字符串并创建一个新字符串，但这个语句实际上获取了 `s1` 的所有权，追加了 `s2` 内容的副本，然后返回结果的所有权。换句话说，它看起来像是在做很多复制，但实际上不是；实现比复制更高效。

如果我们需要连接多个字符串，`+` 运算符的行为变得难以处理：

```rust
let s1 = String::from("tic");
let s2 = String::from("tac");
let s3 = String::from("toe");

let s = s1 + "-" + &s2 + "-" + &s3;
```

此时，`s` 将是 `tic-tac-toe`。有了所有的 `+` 和 `"` 字符，很难看清发生了什么。对于以更复杂的方式组合字符串，我们可以改用 `format!` 宏：

```rust
let s1 = String::from("tic");
let s2 = String::from("tac");
let s3 = String::from("toe");

let s = format!("{s1}-{s2}-{s3}");
```

这段代码也将 `s` 设置为 `tic-tac-toe`。`format!` 宏的工作方式类似于 `println!`，但不是将输出打印到屏幕，而是返回一个包含内容的 `String`。使用 `format!` 的版本代码更易读，而且 `format!` 宏生成的代码使用引用，因此这个调用不会获取其任何参数的所有权。

## 索引字符串

在许多其他编程语言中，通过索引引用字符串中的单个字符是有效且常见的操作。然而，如果你尝试在 Rust 中使用索引语法访问 `String` 的部分，你会得到一个错误。考虑代码示例 8-19 中的无效代码。

**代码示例 8-19：尝试对 `String` 使用索引语法**

```rust
let s1 = String::from("hi");
let h = s1[0];
```

这段代码将导致以下错误：

```console
$ cargo run
   Compiling collections v0.1.0 (file:///projects/collections)
error[E0277]: the type `str` cannot be indexed by `{integer}`
 --> src/main.rs:3:16
  |
3 |     let h = s1[0];
  |                ^ string indices are ranges of `usize`
  |
  = help: the trait `SliceIndex<str>` is not implemented for `{integer}`
  = note: you can use `.chars().nth()` or `.bytes().nth()`
          for more information, see chapter 8 in The Book: <https://doc.rust-lang.org/book/ch08-02-strings.html#indexing-into-strings>
  = help: the following other types implement trait `SliceIndex<T>`:
            `usize` implements `SliceIndex<ByteStr>`
            `usize` implements `SliceIndex<[T]>`
  = note: required for `String` to implement `Index<{integer}>`

For more information about this error, try `rustc --explain E0277`.
error: could not compile `collections` (bin "collections") due to 1 previous error
```

错误说明了情况：Rust 字符串不支持索引。但为什么呢？为了回答这个问题，我们需要讨论 Rust 如何在内存中存储字符串。

### 内部表示

`String` 是 `Vec<u8>` 的包装器。让我们看一下代码示例 8-14 中一些正确编码的 UTF-8 示例字符串。首先，这一个：

```rust
let hello = String::from("Hola");
```

在这种情况下，`len` 将是 `4`，这意味着存储字符串 `"Hola"` 的向量是 4 字节长。这些字母中的每一个在 UTF-8 编码时占用 1 字节。然而，以下这一行可能会让你惊讶（注意这个字符串以大写西里尔字母 _Ze_ 开头，而不是数字 3）：

```rust
let hello = String::from("Здравствуйте");
```

如果你被问到这个字符串有多长，你可能会说 12。事实上，Rust 的答案是 24：这是在 UTF-8 中编码"Здравствуйте"所需的字节数，因为该字符串中的每个 Unicode 标量值占用 2 字节存储空间。因此，对字符串字节的索引并不总是对应于一个有效的 Unicode 标量值。为了演示，考虑这段无效的 Rust 代码：

```rust
let hello = "Здравствуйте";
let answer = &hello[0];
```

你已经知道 `answer` 不会是这个字符串的第一个字母 `З`。当用 UTF-8 编码时，`З` 的第一个字节是 `208`，第二个是 `151`，所以看起来 `answer` 实际上应该是 `208`，但 `208` 本身不是一个有效的字符。返回 `208` 可能不是用户想要的结果；然而，这是 Rust 在字节索引 0 处唯一拥有的数据。用户通常不希望返回字节值，即使字符串只包含拉丁字母：如果 `&"hi"[0]` 是返回字节值的有效代码，它将返回 `104`，而不是 `h`。

那么，答案是，为了避免返回意外的值并导致可能不会立即发现的错误，Rust 根本不编译这段代码，并在开发过程的早期防止误解。

### 字节、标量值和字素簇

关于 UTF-8 的另一个点是，实际上从 Rust 的角度来看，有三种相关的方式来看待字符串：作为字节、标量值和字素簇（最接近我们所说的 _字母_ ）。

如果我们看印地语单词"नमस्ते"，用天城文书写的，它存储为 `u8` 值的向量，看起来像这样：

```text
[224, 164, 168, 224, 164, 174, 224, 164, 184, 224, 165, 141, 224, 164, 164,
224, 165, 135]
```

那是 18 字节，也是计算机最终存储这些数据的方式。如果我们将它们看作 Unicode 标量值，也就是 Rust 的 `char` 类型，那些字节看起来像这样：

```text
['न', 'म', 'स', '्', 'त', 'े']
```

这里有六个 `char` 值，但第四个和第六个不是字母：它们是不能独立存在的变音符号。最后，如果我们将它们看作字素簇，我们会得到一个人会称之为组成这个印地语单词的四个字母：

```text
["न", "म", "स्", "ते"]
```

Rust 提供了不同的方式来解释计算机存储的原始字符串数据，以便每个程序可以选择它需要的解释，无论数据使用的是什么人类语言。

Rust 不允许我们索引到 `String` 以获取字符的最后一个原因是，索引操作预计总是花费常数时间（O(1)）。但用 `String` 无法保证这种性能，因为 Rust 必须从头开始遍历内容到索引，以确定有多少个有效字符。

### 切片字符串

索引到字符串通常是个坏主意，因为不清楚字符串索引操作的返回类型应该是什么：字节值、字符、字素簇还是字符串切片。因此，如果你真的需要使用索引来创建字符串切片，Rust 要求你更具体。

与其使用带有单个数字的 `[]` 进行索引，你可以使用带有范围的 `[]` 来创建包含特定字节的字符串切片：

```rust
let hello = "Здравствуйте";

let s = &hello[0..4];
```

这里，`s` 将是一个包含字符串前 4 字节的 `&str`。前面我们提到过，这些字符中的每一个都是 2 字节，这意味着 `s` 将是 `Зд`。

如果我们尝试用类似 `&hello[0..1]` 的方式只切片一个字符的部分字节，Rust 会在运行时 panic，就像访问向量中的无效索引一样：

```console
$ cargo run
   Compiling collections v0.1.0 (file:///projects/collections)
    Finished `dev` profile [unoptimized + debuginfo] target(s) in 0.43s
     Running `target/debug/collections`

thread 'main' panicked at src/main.rs:4:19:
byte index 1 is not a char boundary; it is inside 'З' (bytes 0..2) of `Здравствуйте`
note: run with `RUST_BACKTRACE=1` environment variable to display a backtrace
```

在使用范围创建字符串切片时你应该小心，因为这样做可能会导致你的程序崩溃。

## 遍历字符串

操作字符串片段的最佳方式是明确说明你想要字符还是字节。对于单个 Unicode 标量值，使用 `chars` 方法。在"Зд"上调用 `chars` 会分离并返回两个 `char` 类型的值，你可以遍历结果来访问每个元素：

```rust
for c in "Зд".chars() {
    println!("{c}");
}
```

这段代码将打印以下内容：

```text
З
д
```

或者，`bytes` 方法返回每个原始字节，这可能适合你的领域：

```rust
for b in "Зд".bytes() {
    println!("{b}");
}
```

这段代码将打印组成这个字符串的 4 个字节：

```text
208
151
208
180
```

但一定要记住，有效的 Unicode 标量值可能由多于 1 字节组成。

从天城文书等字符串中获取字素簇是复杂的，所以标准库不提供这个功能。如果你需要这个功能，[crates.io](https://crates.io/)上有可用的 crate。

## 处理字符串的复杂性

总结一下，字符串是复杂的。不同的编程语言对如何向程序员展示这种复杂性做出不同的选择。Rust 选择让所有 Rust 程序正确处理 `String` 数据成为默认行为，这意味着程序员必须预先更多地考虑处理 UTF-8 数据。这种权衡比其他编程语言暴露了更多的字符串复杂性，但它防止你在开发生命周期的后期处理涉及非 ASCII 字符的错误。

好消息是，标准库提供了大量基于 `String` 和 `&str` 类型的功能，帮助正确处理这些复杂情况。请务必查看文档中像 `contains` 这样的有用方法，用于在字符串中搜索，以及 `replace`，用于用另一个字符串替换字符串的部分。

让我们转向一些不太复杂的内容：hash map！
