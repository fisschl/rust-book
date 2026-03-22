---
title: 12.4. 测试库功能
---

## 使用测试驱动开发添加功能

现在搜索逻辑已经在 *src/lib.rs* 中与 `main` 函数分离，为我们的代码核心功能编写测试变得更加容易。我们可以直接使用各种参数调用函数并检查返回值，而不必从命令行调用我们的二进制文件。

在本节中，我们将使用测试驱动开发（TDD）过程为 `minigrep` 程序添加搜索逻辑，步骤如下：

1. 编写一个失败的测试并运行它，确保它因你期望的原因而失败。
2. 编写或修改足够的代码使新测试通过。
3. 重构你刚刚添加或更改的代码，并确保测试继续通过。
4. 从第1步重复！

虽然这只是编写软件的多种方法之一，但 TDD 可以帮助推动代码设计。在编写使测试通过的代码之前先编写测试有助于在整个过程中保持高测试覆盖率。

我们将通过测试驱动实际搜索文件内容中查询字符串并生成匹配查询的行列表的功能的实现。我们将在一个名为 `search` 的函数中添加此功能。

### 编写失败的测试

在 *src/lib.rs* 中，我们将按照[第11章][ch11-anatomy]中的做法添加一个带有测试函数的 `tests` 模块。测试函数指定了我们希望 `search` 函数具有的行为：它将接受一个查询和要搜索的文本，并只返回文本中包含查询的行。**清单 12-15** 显示了此测试。

**清单 12-15**：为我们希望 `search` 函数具有的功能创建失败测试（文件名：*src/lib.rs*）

```rust
pub fn search<'a>(query: &str, contents: &'a str) -> Vec<&'a str> {
    unimplemented!();
}

// --snip--

#[cfg(test)]
mod tests {
    use super::*;

    #[test]
    fn one_result() {
        let query = "duct";
        let contents = "\
Rust:
safe, fast, productive.
Pick three.";

        assert_eq!(vec!["safe, fast, productive."], search(query, contents));
    }
}
```

此测试搜索字符串 `"duct"`。我们搜索的文本有三行，只有一行包含 `"duct"`（注意开头双引号后的反斜杠告诉 Rust 不要在这个字符串字面量内容的开头放置换行符）。我们断言从 `search` 函数返回的值只包含我们期望的那一行。

如果我们运行此测试，它目前会失败，因为 `unimplemented!` 宏会以消息 "not implemented"（未实现）panic。根据 TDD 原则，我们将采取一小步，通过定义 `search` 函数始终返回一个空向量来使调用函数时不会 panic，如**清单 12-16**所示。然后，测试应该编译并失败，因为空向量不匹配包含行 `"safe, fast, productive."` 的向量。

**清单 12-16**：定义足够的 `search` 函数以确保调用它时不会 panic（文件名：*src/lib.rs*）

```rust
pub fn search<'a>(query: &str, contents: &'a str) -> Vec<&'a str> {
    vec![]
}
```

现在让我们讨论为什么需要在 `search` 的签名中定义显式生命周期 `'a`，并在 `contents` 参数和返回值中使用该生命周期。回想一下[第10章][ch10-lifetimes]，生命周期参数指定哪个参数的生命周期与返回值的生命周期相关联。在这种情况下，我们表明返回的向量应包含引用参数 `contents` 的切片（而不是参数 `query`）的切片。

换句话说，我们告诉 Rust `search` 函数返回的数据将与传递给 `search` 函数的 `contents` 参数中的数据一样长。这很重要！切片引用的数据 _需要_ 在引用有效期间保持有效；如果编译器假设我们正在制作 `query` 的字符串切片而不是 `contents`，它将错误地进行安全检查。

如果我们忘记生命周期注解并尝试编译此函数，我们会得到这个错误：

```console
$ cargo build
   Compiling minigrep v0.1.0 (file:///projects/minigrep)
error[E0106]: missing lifetime specifier
 --> src/lib.rs:1:51
  |
1 | pub fn search(query: &str, contents: &str) -> Vec<&str> {
  |                      ----            ----         ^ expected named lifetime parameter
  |
  = help: this function's return type contains a borrowed value, but the signature does not say whether it is borrowed from `query` or `contents`
help: consider introducing a named lifetime parameter
  |
1 | pub fn search<'a>(query: &'a str, contents: &'a str) -> Vec<&'a str> {
  |              ++++         ++                 ++              ++

For more information about this error, try `rustc --explain E0106`.
error: could not compile `minigrep` (lib) due to 1 previous error
```

Rust 无法知道我们需要两个参数中的哪一个用于输出，所以我们需要明确地告诉它。请注意，帮助文本建议为所有参数和输出类型指定相同的生命周期参数，这是不正确的！因为 `contents` 是包含所有文本的参数，而我们希望返回该文本中匹配的部分，所以我们知道 `contents` 是唯一应该使用生命周期语法与返回值关联的参数。

其他编程语言不要求你在签名中将参数与返回值关联，但这种做法会随着时间的推移变得更容易。你可能想将这个例子与第10章中["用生命周期验证引用"][validating-references-with-lifetimes]部分的例子进行比较。

### 编写代码使测试通过

目前，我们的测试正在失败，因为我们总是返回一个空向量。要修复这个问题并实现 `search`，我们的程序需要遵循以下步骤：

1. 遍历内容的每一行。
2. 检查该行是否包含我们的查询字符串。
3. 如果包含，将其添加到我们要返回的值列表中。
4. 如果不包含，什么也不做。
5. 返回匹配结果的列表。

让我们从遍历行开始，逐步完成每一步。

#### 使用 `lines` 方法遍历行

Rust 有一个有用的方法来处理字符串的逐行迭代，方便地命名为 `lines`，其工作方式如**清单 12-17**所示。请注意，这还不会编译。

**清单 12-17**：遍历 `contents` 中的每一行（文件名：*src/lib.rs*）

```rust
pub fn search<'a>(query: &str, contents: &'a str) -> Vec<&'a str> {
    for line in contents.lines() {
        // do something with line
    }
}
```

`lines` 方法返回一个迭代器。我们将在[第13章][ch13-iterators]中深入讨论迭代器。但回想一下，你在[清单 3-5][ch3-iter]中看到过这种使用迭代器的方式，在那里我们使用带有迭代器的 `for` 循环来对集合中的每个项运行一些代码。

#### 在每行中搜索查询

接下来，我们将检查当前行是否包含我们的查询字符串。幸运的是，字符串有一个名为 `contains` 的有用方法可以为我们完成这个任务！在 `search` 函数中添加对 `contains` 方法的调用，如**清单 12-18**所示。请注意，这仍然不会编译。

**清单 12-18**：添加功能以检查行是否包含 `query` 中的字符串（文件名：*src/lib.rs*）

```rust
pub fn search<'a>(query: &str, contents: &'a str) -> Vec<&'a str> {
    for line in contents.lines() {
        if line.contains(query) {
            // do something with line
        }
    }
}
```

目前，我们正在逐步构建功能。为了使代码编译，我们需要从主体返回一个值，就像我们在函数签名中指出的那样。

#### 存储匹配的行

要完成这个函数，我们需要一种方法来存储我们想要返回的匹配行。为此，我们可以在 `for` 循环之前创建一个可变向量，并调用 `push` 方法将 `line` 存储在向量中。在 `for` 循环之后，我们返回向量，如**清单 12-19**所示。

**清单 12-19**：存储匹配的行以便我们可以返回它们（文件名：*src/lib.rs*）

```rust
pub fn search<'a>(query: &str, contents: &'a str) -> Vec<&'a str> {
    let mut results = Vec::new();

    for line in contents.lines() {
        if line.contains(query) {
            results.push(line);
        }
    }

    results
}
```

现在 `search` 函数应该只返回包含 `query` 的行，我们的测试应该通过。让我们运行测试：

```console
$ cargo test
   Compiling minigrep v0.1.0 (file:///projects/minigrep)
    Finished `test` profile [unoptimized + debuginfo] target(s) in 1.22s
     Running unittests src/lib.rs (target/debug/deps/minigrep-9cd200e5fac0fc94)

running 1 test
test tests::one_result ... ok

test result: ok. 1 passed; 0 failed; 0 ignored; 0 measured; 0 filtered out; finished in 0.00s

     Running unittests src/main.rs (target/debug/deps/minigrep-9cd200e5fac0fc94)

running 0 tests

test result: ok. 0 passed; 0 failed; 0 ignored; 0 measured; 0 filtered out; finished in 0.00s

   Doc-tests minigrep

running 0 tests

test result: ok. 0 passed; 0 failed; 0 ignored; 0 measured; 0 filtered out; finished in 0.00s

```

我们的测试通过了，所以我们知道它有效！

在这一点上，我们可以考虑在保持测试通过以维持相同功能的同时重构搜索函数的实现机会。搜索函数中的代码不算太糟糕，但它没有利用迭代器的一些有用特性。我们将在[第13章][ch13-iterators]中回到这个例子，在那里我们将详细探讨迭代器，并看看如何改进它。

现在整个程序应该可以工作了！让我们先试用一个应该从艾米莉·狄金森的诗中返回恰好一行的词：*frog*。

```console
$ cargo run -- frog poem.txt
   Compiling minigrep v0.1.0 (file:///projects/minigrep)
    Finished `dev` profile [unoptimized + debuginfo] target(s) in 0.38s
     Running `target/debug/minigrep frog poem.txt`
How public, like a frog

```

酷！现在让我们尝试一个会匹配多行的词，比如 *body*：

```console
$ cargo run -- body poem.txt
   Compiling minigrep v0.1.0 (file:///projects/minigrep)
    Finished `dev` profile [unoptimized + debuginfo] target(s) in 0.0s
     Running `target/debug/minigrep body poem.txt`
I'm nobody! Who are you?
Are you nobody, too?
How dreary to be somebody!

```

最后，让我们确保当我们搜索一个根本不在诗中的词时，比如 *monomorphization*，我们不会得到任何行：

```console
$ cargo run -- monomorphization poem.txt
   Compiling minigrep v0.1.0 (file:///projects/minigrep)
    Finished `dev` profile [unoptimized + debuginfo] target(s) in 0.0s
     Running `target/debug/minigrep monomorphization poem.txt`

```

太棒了！我们构建了自己版本的经典工具，并学到了很多关于如何构建应用程序的知识。我们还学到了一些关于文件输入和输出、生命周期、测试和命令行解析的知识。

为了完善这个项目，我们将简要演示如何使用环境变量以及如何打印到标准错误，这两个功能在编写命令行程序时都非常有用。

[validating-references-with-lifetimes]: /rust-book/ch10-03-lifetime-syntax/#用生命周期验证引用
[ch11-anatomy]: /rust-book/ch11-01-writing-tests/#测试函数的结构
[ch10-lifetimes]: /rust-book/ch10-03-lifetime-syntax/
[ch3-iter]: /rust-book/ch03-05-control-flow/#使用-for-遍历集合
[ch13-iterators]: /rust-book/ch13-02-iterators/
