---
title: 4.3. 切片类型
---

*切片*让你引用[集合][ch08]中的连续元素序列。切片是一种引用，所以它没有所有权。

这里有一个小的编程问题：编写一个函数，接受一个由空格分隔的单词字符串，并返回它找到的第一个单词。如果函数在字符串中没有找到空格，整个字符串必须是一个单词，因此应该返回整个字符串。

> 注意：为了介绍切片的目的，我们在本节中假设只有 ASCII；关于 UTF-8 处理的更详细讨论在第 8 章的["使用字符串存储 UTF-8 编码文本"][字符串] 部分。

让我们先通过不切片的方式来编写这个函数的签名，来理解切片将解决的问题：

```rust
fn first_word(s: &String) -> ?
```

`first_word` 函数有一个 `&String` 类型的参数。我们不需要所有权，所以这很好。（在惯用的 Rust 中，函数不会获取其参数的所有权，除非需要，随着我们继续学习，其原因会变得清晰。）但是我们应该返回什么？我们实际上没有一种方式来谈论字符串的*部分*。然而，我们可以返回单词结尾的索引，由空格指示。让我们尝试一下，如清单 4-7 所示。

**清单 4-7**：`first_word` 函数返回 `String` 参数的字节索引值（文件名：src/main.rs）

```rust
fn first_word(s: &String) -> usize {
    let bytes = s.as_bytes();

    for (i, &item) in bytes.iter().enumerate() {
        if item == b' ' {
            return i;
        }
    }

    s.len()
}

fn main() {}
```

因为我们需要逐个检查 `String` 元素并检查值是否是空格，我们将使用 `as_bytes` 方法将我们的 `String` 转换为字节数组。

```rust
let bytes = s.as_bytes();
```

接下来，我们使用 `iter` 方法创建一个遍历字节数组的迭代器：

```rust
for (i, &item) in bytes.iter().enumerate() {
```

我们将在[第 13 章][ch13] 更详细地讨论迭代器。现在，知道 `iter` 是一个返回集合中每个元素的方法，`enumerate` 包装 `iter` 的结果并返回每个元素作为元组的一部分。`enumerate` 返回的元组的第一个元素是索引，第二个元素是对元素的引用。这比我们自己计算索引更方便。

因为 `enumerate` 方法返回一个元组，我们可以使用模式来解构该元组。我们将在[第 6 章][ch6] 更详细地讨论模式。在 `for` 循环中，我们指定一个模式，在元组中有 `i` 作为索引，在元组中有 `&item` 作为单个字节。因为我们从 `.iter().enumerate()` 得到对元素的引用，所以我们在模式中使用 `&`。

在 `for` 循环内部，我们使用字节字面量语法搜索代表空格的字节。如果我们找到一个空格，我们返回位置。否则，我们使用 `s.len()` 返回字符串的长度。

```rust
if item == b' ' {
    return i;
}

s.len()
```

我们现在有办法找出字符串中第一个单词结尾的索引，但有一个问题。我们单独返回一个 `usize`，但它只在 `&String` 的上下文中是一个有意义的数字。换句话说，因为它是一个与 `String` 分开的值，不能保证它在未来仍然有效。考虑清单 4-8 中使用清单 4-7 中 `first_word` 函数的程序。

**清单 4-8**：存储调用 `first_word` 函数的结果，然后改变 `String` 的内容（文件名：src/main.rs）

```rust
fn first_word(s: &String) -> usize {
    let bytes = s.as_bytes();

    for (i, &item) in bytes.iter().enumerate() {
        if item == b' ' {
            return i;
        }
    }

    s.len()
}

fn main() {
    let mut s = String::from("hello world");

    let word = first_word(&s); // word 将得到值 5

    s.clear(); // 这将清空 String，使其等于 ""

    // word 仍然有值 5 在这里，但 s 不再有我们可以用值 5 有意义地使用的任何内容，
    // 所以 word 现在完全无效了！
}
```

这个程序编译没有任何错误，如果我们调用 `s.clear()` 后使用 `word`，也会编译通过。因为 `word` 与 `s` 的状态完全无关，`word` 仍然包含值 `5`。我们可以用变量 `s` 使用值 `5` 来尝试提取第一个单词，但这会是一个 bug，因为 `s` 的内容自我们在 `word` 中保存 `5` 以来已经改变了。

必须担心 `word` 中的索引与 `s` 中的数据不同步是繁琐且容易出错的！如果我们写一个 `second_word` 函数，管理这些索引会更加脆弱。它的签名必须看起来像这样：

```rust
fn second_word(s: &String) -> (usize, usize) {
```

现在我们正在跟踪起始*和*结束索引，我们有更多从特定状态的数据计算出来的值，但根本没有与该状态绑定。我们有三个不相关的变量在周围漂浮，需要保持同步。

幸运的是，Rust 有解决这个问题的方法：字符串切片。

## 字符串切片

*字符串切片*是对 `String` 元素连续序列的引用，它看起来像这样：

```rust
fn main() {
    let s = String::from("hello world");

    let hello = &s[0..5];
    let world = &s[6..11];
}
```

与对整个 `String` 的引用不同，`hello` 是对 `String` 部分的引用，在额外的 `[0..5]` 位中指定。我们使用方括号内的范围创建切片，通过指定 `[starting_index..ending_index]`，其中 *`starting_index`* 是切片中的第一个位置，*`ending_index`* 是切片中最后一个位置之后的一个位置。在内部，切片数据结构存储切片的起始位置和长度，对应于 *`ending_index`* 减去 *`starting_index`*。所以，在 `let world = &s[6..11];` 的情况下，`world` 将是一个切片，包含指向 `s` 索引 6 处字节的指针，长度值为 `5`。

图 4-7 以图示说明这一点。

![三个表格：代表 s 的栈数据的表格，指向堆上字符串数据 "hello world" 的索引 0 处的字节。第三个表格代表切片 world 的栈数据，长度值为 5，指向堆数据表的第 6 个字节。](img/trpl04-07.svg)

*图 4-7：字符串切片引用 `String` 的一部分*

使用 Rust 的 `..` 范围语法，如果你想从索引 0 开始，你可以省略两个点之前的值。换句话说，这些是相等的：

```rust
let s = String::from("hello");

let slice = &s[0..2];
let slice = &s[..2];
```

同样，如果你的切片包含 `String` 的最后一个字节，你可以省略尾部的数字。这意味着这些是相等的：

```rust
let s = String::from("hello");

let len = s.len();

let slice = &s[3..len];
let slice = &s[3..];
```

你也可以同时省略两个值来获取整个字符串的切片。所以，这些是相等的：

```rust
let s = String::from("hello");

let len = s.len();

let slice = &s[0..len];
let slice = &s[..];
```

> 注意：字符串切片范围索引必须发生在有效的 UTF-8 字符边界。如果你试图在多字节字符中间创建一个字符串切片，你的程序将以错误退出。

考虑到所有这些信息，让我们重写 `first_word` 以返回一个切片。表示"字符串切片"的类型写作 `&str`：

**文件名：src/main.rs**

```rust
fn first_word(s: &String) -> &str {
    let bytes = s.as_bytes();

    for (i, &item) in bytes.iter().enumerate() {
        if item == b' ' {
            return &s[0..i];
        }
    }

    &s[..]
}

fn main() {}
```

我们以与清单 4-7 相同的方式获取单词结尾的索引，通过查找第一个空格的出现。当我们找到空格时，我们使用字符串的开始和空格的索引作为起始和结束索引返回一个字符串切片。

现在当我们调用 `first_word` 时，我们得到一个与底层数据绑定的单一值。该值由对切片起始点的引用和切片中的元素数量组成。

返回切片也适用于 `second_word` 函数：

```rust
fn second_word(s: &String) -> &str {
```

我们现在有了一个更难搞砸的直接 API，因为编译器将确保对 `String` 的引用保持有效。记住清单 4-8 中程序的错误，当我们获取第一个单词结尾的索引但随后清空了字符串，所以我们的索引无效了？这段代码逻辑上不正确，但没有显示任何立即的错误。如果我们继续尝试使用一个已清空字符串的第一个单词索引，问题会在以后出现。切片使这个 bug 不可能发生，并让我们更早知道我们的代码有问题。使用 `first_word` 的切片版本会抛出一个编译时错误：

**文件名：src/main.rs**

```rust
fn first_word(s: &String) -> &str {
    let bytes = s.as_bytes();

    for (i, &item) in bytes.iter().enumerate() {
        if item == b' ' {
            return &s[0..i];
        }
    }

    &s[..]
}

fn main() {
    let mut s = String::from("hello world");

    let word = first_word(&s);

    s.clear(); // 错误！

    println!("the first word is: {word}");
}
```

这是编译器错误：

```console
$ cargo run
   Compiling ownership v0.1.0 (file:///projects/ownership)
error[E0502]: cannot borrow `s` as mutable because it is also borrowed as immutable
  --> src/main.rs:18:5
   |
16 |     let word = first_word(&s);
   |                           -- immutable borrow occurs here
17 |
18 |     s.clear(); // error!
   |     ^^^^^^^^^ mutable borrow occurs here
19 |
20 |     println!("the first word is: {word}");
   |                                   ---- immutable borrow later used here

For more information about this error, try `rustc --explain E0502`.
error: could not compile `ownership` (bin "ownership") due to 1 previous error
```

回想一下借用规则，如果我们有一个对某些东西的不可变引用，我们就不能再获取可变引用。因为 `clear` 需要截断 `String`，它需要获取可变引用。在调用 `clear` 后的 `println!` 使用了 `word` 中的引用，所以不可变引用在这一点上必须仍然有效。Rust 不允许 `clear` 中的可变引用和 `word` 中的不可变引用同时存在，编译失败。Rust 不仅使我们的 API 更易于使用，而且在编译时消除了一整类错误！

### 字符串字面量作为切片

回想一下我们讨论过字符串字面量存储在二进制文件中。现在我们知道切片，我们可以正确理解字符串字面量：

```rust
let s = "Hello, world!";
```

这里 `s` 的类型是 `&str`：它是一个指向二进制文件特定点的切片。这也是为什么字符串字面量是不可变的；`&str` 是不可变引用。

### 字符串切片作为参数

知道你可以对字面量和 `String` 值进行切片，使我们能够对 `first_word` 做另一个改进，那就是它的签名：

```rust
fn first_word(s: &String) -> &str {
```

一个更有经验的 Rustacean 会写清单 4-9 中所示的签名，因为它允许我们在 `&String` 值和 `&str` 值上使用相同的函数。

**清单 4-9**：通过为 `s` 参数使用字符串切片来改进 `first_word` 函数

```rust
fn first_word(s: &str) -> &str {
    let bytes = s.as_bytes();

    for (i, &item) in bytes.iter().enumerate() {
        if item == b' ' {
            return &s[0..i];
        }
    }

    &s[..]
}
```

如果我们有一个字符串切片，我们可以直接传递它。如果我们有一个 `String`，我们可以传递 `String` 的切片或对 `String` 的引用。这种灵活性利用了 deref 强制转换，我们将在第 15 章的["在函数和方法中使用 Deref 强制转换"][deref-coercions] 部分介绍。

定义一个函数以获取字符串切片而不是对 `String` 的引用，使我们的 API 更通用和有用，而不会失去任何功能：

**文件名：src/main.rs**

```rust
fn first_word(s: &str) -> &str {
    let bytes = s.as_bytes();

    for (i, &item) in bytes.iter().enumerate() {
        if item == b' ' {
            return &s[0..i];
        }
    }

    &s[..]
}

fn main() {
    let my_string = String::from("hello world");

    // `first_word` 适用于 `String` 的切片，无论是部分还是全部。
    let word = first_word(&my_string[0..6]);
    let word = first_word(&my_string[..]);
    // `first_word` 也适用于对 `String` 的引用，这等价于
    // `String` 的全部切片。
    let word = first_word(&my_string);

    let my_string_literal = "hello world";

    // `first_word` 适用于字符串字面量的切片，无论是部分还是全部。
    let word = first_word(&my_string_literal[0..6]);
    let word = first_word(&my_string_literal[..]);

    // 因为字符串字面量*就是*字符串切片，
    // 这也适用，不需要切片语法！
    let word = first_word(my_string_literal);
}
```

## 其他切片

字符串切片，正如你可能想象的，是特定于字符串的。但也有一个更通用的切片类型。考虑这个数组：

```rust
let a = [1, 2, 3, 4, 5];
```

正如我们可能想要引用字符串的一部分，我们可能想要引用数组的一部分。我们会这样做：

```rust
let a = [1, 2, 3, 4, 5];

let slice = &a[1..3];

assert_eq!(slice, &[2, 3]);
```

这个切片的类型是 `&[i32]`。它的工作方式与字符串切片相同，通过存储对第一个元素的引用和长度。你将使用这种切片来处理各种其他集合。我们将在第 8 章详细讨论这些集合。

## 总结

所有权、借用和切片的概念确保 Rust 程序在编译时内存安全。Rust 语言以与其他系统编程语言相同的方式让你控制内存使用。但数据的所有者在所有者离开作用域时自动清理数据，意味着你不必编写和调试额外的代码来获得这种控制。

所有权影响 Rust 的许多其他部分的工作方式，因此我们将在本书的其余部分进一步讨论这些概念。让我们继续进入第 5 章，看看如何在 `struct` 中将数据片段组合在一起。

[字符串]: /rust-book/ch08-02-strings/#使用字符串存储-utf-8-编码文本
[ch08]: /rust-book/ch08-00-common-collections
[ch13]: /rust-book/ch13-02-iterators/
[ch6]: /rust-book/ch06-02-match/#绑定到值的匹配模式
[deref-coercions]: /rust-book/ch15-02-deref/#在函数和方法中使用-deref-强制转换
