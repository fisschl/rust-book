---
title: 11.1. 编写测试
---

 _测试_ 是验证非测试代码是否按预期方式运行的 Rust 函数。测试函数体通常执行以下三个操作：

- 设置任何所需的数据或状态。
- 运行你想要测试的代码。
- 断言结果是你期望的。

让我们看看 Rust 专门提供的用于编写执行这些操作的测试的功能，包括 `test` 属性、几个宏和 `should_panic` 属性。

### 构建测试函数

最简单的情况下，Rust 中的测试是一个用 `test` 属性注解的函数。属性是关于 Rust 代码片段的元数据；一个例子是我们在第 5 章中用于结构体的 `derive` 属性。要将函数变成测试函数，请在 `fn` 前面的一行添加 `#[test]`。当你使用 `cargo test` 命令运行测试时，Rust 会构建一个测试运行器二进制文件，运行被注解的函数，并报告每个测试函数是通过还是失败。

每当我们使用 Cargo 创建一个新的库项目时，会自动为我们生成一个包含测试函数的测试模块。这个模块为你提供了一个编写测试的模板，这样你就不必每次开始一个新项目时都查找确切的结构和语法。你可以添加任意数量的额外测试函数和测试模块！

在我们实际测试任何代码之前，我们将通过实验模板测试来探索测试工作原理的一些方面。然后，我们将编写一些真实世界的测试，调用我们编写的一些代码并断言其行为是正确的。

让我们创建一个名为 `adder` 的新库项目，它将两个数字相加：

```console
$ cargo new adder --lib
     Created library `adder` project
$ cd adder
```

你的 `adder` 库中的 *src/lib.rs* 文件内容应如清单 11-1 所示。

**清单 11-1**：`cargo new` 自动生成的代码（*文件名：src/lib.rs*）

```rust
pub fn add(left: u64, right: u64) -> u64 {
    left + right
}

#[cfg(test)]
mod tests {
    use super::*;

    #[test]
    fn it_works() {
        let result = add(2, 2);
        assert_eq!(result, 4);
    }
}
```

文件以一个示例 `add` 函数开始，这样我们就有东西可以测试。

现在，让我们只关注 `it_works` 函数。注意 `#[test]` 注解：这个属性表明这是一个测试函数，因此测试运行器知道将该函数视为测试。我们在 `tests` 模块中也可能有非测试函数来帮助设置常见场景或执行常见操作，因此我们总是需要指明哪些函数是测试。

示例函数体使用 `assert_eq!` 宏来断言 `result`（包含调用 `add` 并传入 2 和 2 的结果）等于 4。这个断言作为典型测试格式的示例。让我们运行它来查看这个测试是否通过。

`cargo test` 命令运行我们项目中的所有测试，如清单 11-2 所示。

**清单 11-2**：运行自动生成测试的输出

```console
$ cargo test
   Compiling adder v0.1.0 (file:///projects/adder)
    Finished `test` profile [unoptimized + debuginfo] target(s) in 0.57s
     Running unittests src/lib.rs (target/debug/deps/adder-01ad14159ff659ab)

running 1 test
test tests::it_works ... ok

test result: ok. 1 passed; 0 failed; 0 ignored; 0 measured; 0 filtered out; finished in 0.00s

   Doc-tests adder

running 0 tests

test result: ok. 0 passed; 0 failed; 0 ignored; 0 measured; 0 filtered out; finished in 0.00s
```

Cargo 编译并运行了测试。我们看到 `running 1 test` 这一行。下一行显示了生成的测试函数的名称，叫做 `tests::it_works`，以及运行该测试的结果是 `ok`。总体摘要 `test result: ok.` 意味着所有测试都通过了，而显示 `1 passed; 0 failed` 的部分统计了通过或失败的测试数量。

可以将测试标记为忽略，使其在特定情况下不运行；我们将在本章后面的[「除非特别要求否则忽略测试」][ignoring]部分中介绍这一点。因为我们这里没有这样做，所以摘要显示 `0 ignored`。我们还可以向 `cargo test` 命令传递一个参数，只运行名称与字符串匹配的测试；这称为 _过滤_ ，我们将在[「按名称运行测试的子集」][subset]部分中介绍。在这里，我们没有过滤正在运行的测试，所以摘要的末尾显示 `0 filtered out`。

`0 measured` 统计是用于测量性能的基准测试。在撰写本文时，基准测试仅在 nightly Rust 中可用。请参阅[关于基准测试的文档][bench]了解更多信息。

测试输出中从 `Doc-tests adder` 开始的部分是任何文档测试的结果。我们还没有任何文档测试，但 Rust 可以编译出现在我们 API 文档中的任何代码示例。这个特性有助于保持你的文档和代码同步！我们将在第 14 章的[「文档注释作为测试」][doc-comments]部分中讨论如何编写文档测试。现在，我们将忽略 `Doc-tests` 输出。

让我们开始根据自己的需求定制测试。首先，将 `it_works` 函数的名称更改为不同的名称，例如 `exploration`，如下所示：

*文件名：src/lib.rs*

```rust
pub fn add(left: u64, right: u64) -> u64 {
    left + right
}

#[cfg(test)]
mod tests {
    use super::*;

    #[test]
    fn exploration() {
        let result = add(2, 2);
        assert_eq!(result, 4);
    }
}
```

然后，再次运行 `cargo test`。输出现在显示 `exploration` 而不是 `it_works`：

```console
$ cargo test
   Compiling adder v0.1.0 (file:///projects/adder)
    Finished `test` profile [unoptimized + debuginfo] target(s) in 0.59s
     Running unittests src/lib.rs (target/debug/deps/adder-92948b65e88960b4)

running 1 test
test tests::exploration ... ok

test result: ok. 1 passed; 0 failed; 0 ignored; 0 measured; 0 filtered out; finished in 0.00s

   Doc-tests adder

running 0 tests

test result: ok. 0 passed; 0 failed; 0 ignored; 0 measured; 0 filtered out; finished in 0.00s
```

现在我们将添加另一个测试，但这次我们将制作一个失败的测试！当测试函数中的某些内容发生 panic 时，测试就会失败。每个测试都在一个新线程中运行，当主线程看到测试线程已经死亡时，该测试被标记为失败。在第 9 章中，我们讨论了最简单的 panic 方式是调用 `panic!` 宏。输入名为 `another` 的新测试，使你的 *src/lib.rs* 文件看起来像清单 11-3。

**清单 11-3**：添加第二个测试，因为我们调用了 `panic!` 宏，所以它会失败（*文件名：src/lib.rs*）

```rust
pub fn add(left: u64, right: u64) -> u64 {
    left + right
}

#[cfg(test)]
mod tests {
    use super::*;

    #[test]
    fn exploration() {
        let result = add(2, 2);
        assert_eq!(result, 4);
    }

    #[test]
    fn another() {
        panic!("Make this test fail");
    }
}
```

再次使用 `cargo test` 运行测试。输出应如清单 11-4 所示，它显示我们的 `exploration` 测试通过了，而 `another` 失败了。

**清单 11-4**：当一个测试通过而一个测试失败时的测试结果

```console
$ cargo test
   Compiling adder v0.1.0 (file:///projects/adder)
    Finished `test` profile [unoptimized + debuginfo] target(s) in 0.72s
     Running unittests src/lib.rs (target/debug/deps/adder-92948b65e88960b4)

running 2 tests
test tests::another ... FAILED
test tests::exploration ... ok

failures:

---- tests::another stdout ----

thread 'tests::another' panicked at src/lib.rs:17:9:
Make this test fail
note: run with `RUST_BACKTRACE=1` environment variable to display a backtrace


failures:
    tests::another

test result: FAILED. 1 passed; 1 failed; 0 ignored; 0 measured; 0 filtered out; finished in 0.00s

error: test failed, to rerun pass `--lib`
```

`test tests::another` 这一行没有显示 `ok`，而是显示了 `FAILED`。在单个结果和摘要之间出现了两个新部分：第一部分显示每个测试失败的详细原因。在这种情况下，我们得到的详细信息是 `tests::another` 失败了，因为它在 *src/lib.rs* 文件的第 17 行以消息 `Make this test fail` panic 了。下一部分列出了所有失败测试的名称，当有大量测试和大量详细的失败测试输出时，这很有用。我们可以使用失败测试的名称来只运行该测试以便更容易地调试它；我们将在[「控制测试的运行方式」][controlling-how-tests-are-run]部分中讨论更多运行测试的方法。

摘要行显示在最后：总的来说，我们的测试结果是 `FAILED`。我们有一个测试通过，一个测试失败。

现在你已经看到了在不同情况下测试结果的样子，让我们看看除了 `panic!` 之外，在测试中还有哪些有用的宏。

### 使用 `assert!` 检查结果

标准库提供的 `assert!` 宏在你想要确保测试中的某个条件求值为 `true` 时很有用。我们给 `assert!` 宏一个求值为布尔值的参数。如果值是 `true`，什么都不会发生，测试通过。如果值是 `false`，`assert!` 宏会调用 `panic!` 导致测试失败。使用 `assert!` 宏有助于我们检查代码是否按我们期望的方式运行。

在第 5 章的清单 5-15 中，我们使用了 `Rectangle` 结构体和 `can_hold` 方法，它们在清单 11-5 中重复出现。让我们将这些代码放入 *src/lib.rs* 文件中，然后使用 `assert!` 宏为它们编写一些测试。

**清单 11-5**：第 5 章的 `Rectangle` 结构体及其 `can_hold` 方法（*文件名：src/lib.rs*）

```rust
#[derive(Debug)]
struct Rectangle {
    width: u32,
    height: u32,
}

impl Rectangle {
    fn can_hold(&self, other: &Rectangle) -> bool {
        self.width > other.width && self.height > other.height
    }
}
```

`can_hold` 方法返回一个布尔值，这意味着它非常适合使用 `assert!` 宏。在清单 11-6 中，我们通过创建一个宽度为 8、高度为 7 的 `Rectangle` 实例，并断言它可以容纳另一个宽度为 5、高度为 1 的 `Rectangle` 实例来测试 `can_hold` 方法。

**清单 11-6**：`can_hold` 的测试，检查较大的矩形是否确实可以容纳较小的矩形

```rust
#[derive(Debug)]
struct Rectangle {
    width: u32,
    height: u32,
}

impl Rectangle {
    fn can_hold(&self, other: &Rectangle) -> bool {
        self.width > other.width && self.height > other.height
    }
}

#[cfg(test)]
mod tests {
    use super::*;

    #[test]
    fn larger_can_hold_smaller() {
        let larger = Rectangle {
            width: 8,
            height: 7,
        };
        let smaller = Rectangle {
            width: 5,
            height: 1,
        };

        assert!(larger.can_hold(&smaller));
    }
}
```

注意 `tests` 模块内部的 `use super::*;` 这一行。`tests` 模块是一个遵循我们在第 7 章的[「路径引用模块树中的项」][paths-for-referring-to-an-item-in-the-module-tree]部分中介绍的常规可见性规则的常规模块。因为 `tests` 模块是内部模块，我们需要将外部模块中正在测试的代码引入内部模块的作用域。我们在这里使用了 glob，因此我们在外部模块中定义的任何内容都对这个 `tests` 模块可用。

我们将我们的测试命名为 `larger_can_hold_smaller`，并创建了我们需要的两个 `Rectangle` 实例。然后，我们调用了 `assert!` 宏并传给它调用 `larger.can_hold(&smaller)` 的结果。这个表达式应该返回 `true`，所以我们的测试应该通过。让我们看看！

```console
$ cargo test
   Compiling rectangle v0.1.0 (file:///projects/rectangle)
    Finished `test` profile [unoptimized + debuginfo] target(s) in 0.66s
     Running unittests src/lib.rs (target/debug/deps/rectangle-6584c4561e48942e)

running 1 test
test tests::larger_can_hold_smaller ... ok

test result: ok. 1 passed; 0 failed; 0 ignored; 0 measured; 0 filtered out; finished in 0.00s

   Doc-tests rectangle

running 0 tests

test result: ok. 0 passed; 0 failed; 0 ignored; 0 measured; 0 filtered out; finished in 0.00s
```

确实通过了！让我们添加另一个测试，这次断言较小的矩形不能容纳较大的矩形：

*文件名：src/lib.rs*

```rust
#[derive(Debug)]
struct Rectangle {
    width: u32,
    height: u32,
}

impl Rectangle {
    fn can_hold(&self, other: &Rectangle) -> bool {
        self.width > other.width && self.height > other.height
    }
}

#[cfg(test)]
mod tests {
    use super::*;

    #[test]
    fn larger_can_hold_smaller() {
        let larger = Rectangle {
            width: 8,
            height: 7,
        };
        let smaller = Rectangle {
            width: 5,
            height: 1,
        };

        assert!(larger.can_hold(&smaller));
    }

    #[test]
    fn smaller_cannot_hold_larger() {
        let larger = Rectangle {
            width: 8,
            height: 7,
        };
        let smaller = Rectangle {
            width: 5,
            height: 1,
        };

        assert!(!smaller.can_hold(&larger));
    }
}
```

因为在这种情况下 `can_hold` 函数的正确结果是 `false`，我们需要在将它传递给 `assert!` 宏之前否定该结果。因此，如果 `can_hold` 返回 `false`，我们的测试将通过：

```console
$ cargo test
   Compiling rectangle v0.1.0 (file:///projects/rectangle)
    Finished `test` profile [unoptimized + debuginfo] target(s) in 0.66s
     Running unittests src/lib.rs (target/debug/deps/rectangle-6584c4561e48942e)

running 2 tests
test tests::larger_can_hold_smaller ... ok
test tests::smaller_cannot_hold_larger ... ok

test result: ok. 2 passed; 0 failed; 0 ignored; 0 measured; 0 filtered out; finished in 0.00s

   Doc-tests rectangle

running 0 tests

test result: ok. 0 passed; 0 failed; 0 ignored; 0 measured; 0 filtered out; finished in 0.00s
```

两个测试通过了！现在让我们看看当我们在代码中引入一个 bug 时测试结果会发生什么。我们将在比较宽度时将大于号（`>`）替换为小于号（`<`）来改变 `can_hold` 方法的实现：

```rust
#[derive(Debug)]
struct Rectangle {
    width: u32,
    height: u32,
}

impl Rectangle {
    fn can_hold(&self, other: &Rectangle) -> bool {
        self.width < other.width && self.height > other.height
    }
}

#[cfg(test)]
mod tests {
    use super::*;

    #[test]
    fn larger_can_hold_smaller() {
        let larger = Rectangle {
            width: 8,
            height: 7,
        };
        let smaller = Rectangle {
            width: 5,
            height: 1,
        };

        assert!(larger.can_hold(&smaller));
    }

    #[test]
    fn smaller_cannot_hold_larger() {
        let larger = Rectangle {
            width: 8,
            height: 7,
        };
        let smaller = Rectangle {
            width: 5,
            height: 1,
        };

        assert!(!smaller.can_hold(&larger));
    }
}
```

现在运行测试会产生以下结果：

```console
$ cargo test
   Compiling rectangle v0.1.0 (file:///projects/rectangle)
    Finished `test` profile [unoptimized + debuginfo] target(s) in 0.66s
     Running unittests src/lib.rs (target/debug/deps/rectangle-6584c4561e48942e)

running 2 tests
test tests::larger_can_hold_smaller ... FAILED
test tests::smaller_cannot_hold_larger ... ok

failures:

---- tests::larger_can_hold_smaller stdout ----

thread 'tests::larger_can_hold_smaller' panicked at src/lib.rs:28:9:
assertion failed: larger.can_hold(&smaller)
note: run with `RUST_BACKTRACE=1` environment variable to display a backtrace


failures:
    tests::larger_can_hold_smaller

test result: FAILED. 1 passed; 1 failed; 0 ignored; 0 measured; 0 filtered out; finished in 0.00s

error: test failed, to rerun pass `--lib`
```

我们的测试捕获了这个 bug！因为 `larger.width` 是 `8` 而 `smaller.width` 是 `5`，`can_hold` 中的宽度比较现在返回 `false`：8 不小于 5。

### 使用 `assert_eq!` 和 `assert_ne!` 测试相等性

验证功能的常见方法是测试被测代码的结果与你期望代码返回的值之间的相等性。你可以通过使用 `assert!` 宏并向它传递使用 `==` 运算符的表达式来做到这一点。然而，这是一种如此常见的测试，以至于标准库提供了一对宏——`assert_eq!` 和 `assert_ne!`——来更方便地执行这种测试。这些宏分别比较两个参数是否相等或不相等。如果断言失败，它们还会打印这两个值，这样更容易看到测试失败的原因；相反，`assert!` 宏只表示它得到了 `==` 表达式的 `false` 值，而不会打印导致 `false` 值的值。

在清单 11-7 中，我们编写了一个名为 `add_two` 的函数，它给它的参数加 `2`，然后我们用 `assert_eq!` 宏测试这个函数。

**清单 11-7**：使用 `assert_eq!` 宏测试 `add_two` 函数（*文件名：src/lib.rs*）

```rust
pub fn add_two(a: u64) -> u64 {
    a + 2
}

#[cfg(test)]
mod tests {
    use super::*;

    #[test]
    fn it_adds_two() {
        let result = add_two(2);
        assert_eq!(result, 4);
    }
}
```

让我们检查它是否通过！

```console
$ cargo test
   Compiling adder v0.1.0 (file:///projects/adder)
    Finished `test` profile [unoptimized + debuginfo] target(s) in 0.58s
     Running unittests src/lib.rs (target/debug/deps/adder-92948b65e88960b4)

running 1 test
test tests::it_adds_two ... ok

test result: ok. 1 passed; 0 failed; 0 ignored; 0 measured; 0 filtered out; finished in 0.00s

   Doc-tests adder

running 0 tests

test result: ok. 0 passed; 0 failed; 0 ignored; 0 measured; 0 filtered out; finished in 0.00s
```

我们创建一个名为 `result` 的变量来保存调用 `add_two(2)` 的结果。然后，我们将 `result` 和 `4` 作为参数传递给 `assert_eq!` 宏。这个测试的输出行是 `test tests::it_adds_two ... ok`，而 `ok` 文本表明我们的测试通过了！

让我们在我们的代码中引入一个 bug 来看看 `assert_eq!` 失败时是什么样子。将 `add_two` 函数的实现改为加 `3`：

```rust
pub fn add_two(a: u64) -> u64 {
    a + 3
}

#[cfg(test)]
mod tests {
    use super::*;

    #[test]
    fn it_adds_two() {
        let result = add_two(2);
        assert_eq!(result, 4);
    }
}
```

再次运行测试：

```console
$ cargo test
   Compiling adder v0.1.0 (file:///projects/adder)
    Finished `test` profile [unoptimized + debuginfo] target(s) in 0.61s
     Running unittests src/lib.rs (target/debug/deps/adder-92948b65e88960b4)

running 1 test
test tests::it_adds_two ... FAILED

failures:

---- tests::it_adds_two stdout ----

thread 'tests::it_adds_two' panicked at src/lib.rs:12:9:
assertion `left == right` failed
  left: 5
 right: 4
note: run with `RUST_BACKTRACE=1` environment variable to display a backtrace


failures:
    tests::it_adds_two

test result: FAILED. 0 passed; 1 failed; 0 ignored; 0 measured; 0 filtered out; finished in 0.00s

error: test failed, to rerun pass `--lib`
```

我们的测试捕获了这个 bug！`tests::it_adds_two` 测试失败了，消息告诉我们失败的断言是 `left == right` 以及 `left` 和 `right` 值是什么。这个消息帮助我们开始调试：`left` 参数，即我们调用 `add_two(2)` 的结果，是 `5`，但 `right` 参数是 `4`。你可以想象，当我们有大量测试在进行时，这将特别有帮助。

请注意，在某些语言和测试框架中，相等性断言函数的参数被称为 `expected` 和 `actual`，我们指定参数的顺序很重要。然而，在 Rust 中，它们被称为 `left` 和 `right`，我们指定期望值和代码产生的值的顺序并不重要。我们可以将测试中的断言写为 `assert_eq!(4, result)`，这将导致显示 `` assertion `left == right` failed `` 的相同失败消息。

`assert_ne!` 宏在我们给它的两个值不相等时会通过，如果它们相等则会失败。这个宏在我们不确定值_将是_什么，但我们知道值肯定 _不应该_ 是什么的情况下最有用。例如，如果我们正在测试一个保证会以某种方式改变其输入的函数，但输入被改变的方式取决于我们运行测试的星期几，那么最好的断言可能是函数的输出不等于输入。

在底层，`assert_eq!` 和 `assert_ne!` 宏分别使用 `==` 和 `!=` 运算符。当断言失败时，这些宏使用调试格式化打印它们的参数，这意味着被比较的值必须实现 `PartialEq` 和 `Debug` trait。所有基本类型和大多数标准库类型都实现了这些 trait。对于你自己定义的struct和enum，你需要实现 `PartialEq` 来断言这些类型的相等性。当断言失败时，你还需要实现 `Debug` 来打印这些值。因为这两个 trait 都是可派生 trait，如第 5 章的清单 5-12 中提到的，这通常就像给你的 struct 或 enum 定义添加 `#[derive(PartialEq, Debug)]` 注解一样简单。有关这些和其他可派生 trait 的更多细节，请参阅附录 C 的[「可派生的 Trait」][derivable-traits]。

### 添加自定义失败消息

你还可以将自定义消息作为可选参数添加到 `assert!`、`assert_eq!` 和 `assert_ne!` 宏中，与失败消息一起打印。在必需参数之后指定的任何参数都将传递给 `format!` 宏（在第 8 章的[「使用 `+` 或 `format!` 拼接」][concatenating]中讨论），因此你可以传递包含 `{}` 占位符和要放入这些占位符的值的格式字符串。自定义消息对于记录断言的含义很有用；当测试失败时，你会对代码的问题有更好的了解。

例如，假设我们有一个通过名字问候人们的函数，我们想测试我们传递给函数的名字是否出现在输出中：

*文件名：src/lib.rs*

```rust
pub fn greeting(name: &str) -> String {
    format!("Hello {name}!")
}

#[cfg(test)]
mod tests {
    use super::*;

    #[test]
    fn greeting_contains_name() {
        let result = greeting("Carol");
        assert!(result.contains("Carol"));
    }
}
```

这个程序的需求还没有达成一致，而且我们相当确定问候语开头的 `Hello` 文本会改变。我们决定当需求改变时不想更新测试，因此我们不检查与 `greeting` 函数返回值的精确相等性，而只是断言输出包含输入参数的文本。

现在让我们通过将 `greeting` 改为不包含 `name` 来向这段代码引入一个 bug，看看默认测试失败是什么样子：

```rust
pub fn greeting(name: &str) -> String {
    String::from("Hello!")
}

#[cfg(test)]
mod tests {
    use super::*;

    #[test]
    fn greeting_contains_name() {
        let result = greeting("Carol");
        assert!(result.contains("Carol"));
    }
}
```

运行这个测试会产生以下结果：

```console
$ cargo test
   Compiling greeter v0.1.0 (file:///projects/greeter)
    Finished `test` profile [unoptimized + debuginfo] target(s) in 0.91s
     Running unittests src/lib.rs (target/debug/deps/greeter-170b942eb5bf5e3a)

running 1 test
test tests::greeting_contains_name ... FAILED

failures:

---- tests::greeting_contains_name stdout ----

thread 'tests::greeting_contains_name' panicked at src/lib.rs:12:9:
assertion failed: result.contains("Carol")
note: run with `RUST_BACKTRACE=1` environment variable to display a backtrace


failures:
    tests::greeting_contains_name

test result: FAILED. 0 passed; 1 failed; 0 ignored; 0 measured; 0 filtered out; finished in 0.00s

error: test failed, to rerun pass `--lib`
```

这个结果只是表明断言失败了以及断言在哪一行。一个更有用的失败消息会打印 `greeting` 函数的值。让我们添加一个由格式字符串组成的自定义失败消息，其中包含一个占位符，用我们从 `greeting` 函数实际得到的值填充：

```rust
pub fn greeting(name: &str) -> String {
    String::from("Hello!")
}

#[cfg(test)]
mod tests {
    use super::*;

    #[test]
    fn greeting_contains_name() {
        let result = greeting("Carol");
        assert!(
            result.contains("Carol"),
            "Greeting did not contain name, value was `{result}`"
        );
    }
}
```

现在当我们运行测试时，我们会得到一个更有用的错误消息：

```console
$ cargo test
   Compiling greeter v0.1.0 (file:///projects/greeter)
    Finished `test` profile [unoptimized + debuginfo] target(s) in 0.93s
     Running unittests src/lib.rs (target/debug/deps/greeter-170b942eb5bf5e3a)

running 1 test
test tests::greeting_contains_name ... FAILED

failures:

---- tests::greeting_contains_name stdout ----

thread 'tests::greeting_contains_name' panicked at src/lib.rs:12:9:
Greeting did not contain name, value was `Hello!`
note: run with `RUST_BACKTRACE=1` environment variable to display a backtrace


failures:
    tests::greeting_contains_name

test result: FAILED. 0 passed; 1 failed; 0 ignored; 0 measured; 0 filtered out; finished in 0.00s

error: test failed, to rerun pass `--lib`
```

我们可以在测试输出中看到我们实际得到的值，这将帮助我们调试发生了什么，而不是我们期望发生什么。

### 使用 `should_panic` 检查 panic

除了检查返回值之外，检查我们的代码是否按预期处理错误条件也很重要。例如，考虑我们在第 9 章的清单 9-13 中创建的 `Guess` 类型。使用 `Guess` 的其他代码依赖于 `Guess` 实例将只包含 1 到 100 之间的值的保证。我们可以编写一个测试，确保尝试创建值超出该范围的 `Guess` 实例会发生 panic。

我们通过将属性 `should_panic` 添加到我们的测试函数来实现这一点。如果函数内部的代码发生 panic，测试通过；如果函数内部的代码没有发生 panic，测试失败。

清单 11-8 展示了一个测试，检查 `Guess::new` 的错误条件在我们期望的时候发生。

**清单 11-8**：测试条件会导致 `panic!`（*文件名：src/lib.rs*）

```rust
pub struct Guess {
    value: i32,
}

impl Guess {
    pub fn new(value: i32) -> Guess {
        if value < 1 || value > 100 {
            panic!("Guess value must be between 1 and 100, got {value}.");
        }

        Guess { value }
    }
}

#[cfg(test)]
mod tests {
    use super::*;

    #[test]
    #[should_panic]
    fn greater_than_100() {
        Guess::new(200);
    }
}
```

我们将 `#[should_panic]` 属性放在 `#[test]` 属性之后，以及它所应用的测试函数之前。让我们看看这个测试通过时的结果：

```console
$ cargo test
   Compiling guessing_game v0.1.0 (file:///projects/guessing_game)
    Finished `test` profile [unoptimized + debuginfo] target(s) in 0.58s
     Running unittests src/lib.rs (target/debug/deps/guessing_game-57d70c3acb738f4d)

running 1 test
test tests::greater_than_100 - should panic ... ok

test result: ok. 1 passed; 0 failed; 0 ignored; 0 measured; 0 filtered out; finished in 0.00s

   Doc-tests guessing_game

running 0 tests

test result: ok. 0 passed; 0 failed; 0 ignored; 0 measured; 0 filtered out; finished in 0.00s
```

看起来不错！现在让我们通过删除当值大于 100 时 `new` 函数会发生 panic 的条件来在我们的代码中引入一个 bug：

```rust
pub struct Guess {
    value: i32,
}

impl Guess {
    pub fn new(value: i32) -> Guess {
        if value < 1 {
            panic!("Guess value must be between 1 and 100, got {value}.");
        }

        Guess { value }
    }
}

#[cfg(test)]
mod tests {
    use super::*;

    #[test]
    #[should_panic]
    fn greater_than_100() {
        Guess::new(200);
    }
}
```

当我们运行清单 11-8 中的测试时，它会失败：

```console
$ cargo test
   Compiling guessing_game v0.1.0 (file:///projects/guessing_game)
    Finished `test` profile [unoptimized + debuginfo] target(s) in 0.62s
     Running unittests src/lib.rs (target/debug/deps/guessing_game-57d70c3acb738f4d)

running 1 test
test tests::greater_than_100 - should panic ... FAILED

failures:

---- tests::greater_than_100 stdout ----
note: test did not panic as expected at src/lib.rs:21:8

failures:
    tests::greater_than_100

test result: FAILED. 0 passed; 1 failed; 0 ignored; 0 measured; 0 filtered out; finished in 0.00s

error: test failed, to rerun pass `--lib`
```

在这种情况下，我们没有得到很有帮助的消息，但当我们查看测试函数时，我们看到它用 `#[should_panic]` 进行了注解。我们得到的失败意味着测试函数中的代码没有导致 panic。

使用 `should_panic` 的测试可能不精确。即使测试因与我们期望的不同原因而 panic，`should_panic` 测试也会通过。为了使 `should_panic` 测试更精确，我们可以向 `should_panic` 属性添加一个可选的 `expected` 参数。测试工具将确保失败消息包含提供的文本。例如，考虑清单 11-9 中修改后的 `Guess` 代码，其中 `new` 函数根据值是太小还是太大而 panic 并显示不同的消息。

**清单 11-9**：测试 `panic!`，其 panic 消息包含指定的子串（*文件名：src/lib.rs*）

```rust
pub struct Guess {
    value: i32,
}

impl Guess {
    pub fn new(value: i32) -> Guess {
        if value < 1 {
            panic!(
                "Guess value must be greater than or equal to 1, got {value}."
            );
        } else if value > 100 {
            panic!(
                "Guess value must be less than or equal to 100, got {value}."
            );
        }

        Guess { value }
    }
}

#[cfg(test)]
mod tests {
    use super::*;

    #[test]
    #[should_panic(expected = "less than or equal to 100")]
    fn greater_than_100() {
        Guess::new(200);
    }
}
```

这个测试会通过，因为我们在 `should_panic` 属性的 `expected` 参数中放入的值是 `Guess::new` 函数 panic 时显示的消息的子串。我们可以指定我们期望的整个 panic 消息，在这个例子中将是 `Guess value must be less than or equal to 100, got 200.`。你选择指定什么取决于 panic 消息的多少是唯一的或动态的，以及你希望测试有多精确。在这种情况下，panic 消息的一个子串就足以确保测试函数中的代码执行了 `else if value > 100` 的情况。

为了查看带有 `expected` 消息的 `should_panic` 测试失败时会发生什么，让我们再次通过交换 `if value < 1` 和 `else if value > 100` 块的函数体来在我们的代码中引入一个 bug：

```rust
pub struct Guess {
    value: i32,
}

impl Guess {
    pub fn new(value: i32) -> Guess {
        if value < 1 {
            panic!(
                "Guess value must be less than or equal to 100, got {value}."
            );
        } else if value > 100 {
            panic!(
                "Guess value must be greater than or equal to 1, got {value}."
            );
        }

        Guess { value }
    }
}

#[cfg(test)]
mod tests {
    use super::*;

    #[test]
    #[should_panic(expected = "less than or equal to 100")]
    fn greater_than_100() {
        Guess::new(200);
    }
}
```

这次当我们运行 `should_panic` 测试时，它会失败：

```console
$ cargo test
   Compiling guessing_game v0.1.0 (file:///projects/guessing_game)
    Finished `test` profile [unoptimized + debuginfo] target(s) in 0.66s
     Running unittests src/lib.rs (target/debug/deps/guessing_game-57d70c3acb738f4d)

running 1 test
test tests::greater_than_100 - should panic ... FAILED

failures:

---- tests::greater_than_100 stdout ----

thread 'tests::greater_than_100' panicked at src/lib.rs:12:13:
Guess value must be greater than or equal to 1, got 200.
note: run with `RUST_BACKTRACE=1` environment variable to display a backtrace
note: panic did not contain expected string
      panic message: "Guess value must be greater than or equal to 1, got 200."
 expected substring: "less than or equal to 100"

failures:
    tests::greater_than_100

test result: FAILED. 0 passed; 1 failed; 0 ignored; 0 measured; 0 filtered out; finished in 0.00s

error: test failed, to rerun pass `--lib`
```

失败消息表明这个测试确实如我们所期望的那样 panic 了，但 panic 消息没有包含预期的字符串 `less than or equal to 100`。我们实际得到的 panic 消息是 `Guess value must be greater than or equal to 1, got 200.`。现在我们可以开始找出我们的 bug 在哪里了！

### 在测试中使用 `Result<T, E>`

到目前为止，我们所有的测试在失败时都会 panic。我们也可以编写使用 `Result<T, E>` 的测试！以下是清单 11-1 中的测试，改写为使用 `Result<T, E>` 并在失败时返回 `Err` 而不是 panic：

```rust
pub fn add(left: u64, right: u64) -> u64 {
    left + right
}

#[cfg(test)]
mod tests {
    use super::*;

    #[test]
    fn it_works() -> Result<(), String> {
        let result = add(2, 2);

        if result == 4 {
            Ok(())
        } else {
            Err(String::from("two plus two does not equal four"))
        }
    }
}
```

`it_works` 函数现在有了 `Result<(), String>` 返回类型。在函数体中，我们不是调用 `assert_eq!` 宏，而是在测试通过时返回 `Ok(())`，在测试失败时返回包含 `String` 的 `Err`。

编写返回 `Result<T, E>` 的测试使你能够在测试体中使用问号运算符，这是一种方便的方式来编写如果其中任何操作返回 `Err` 变体就应该失败的测试。

你不能在使用 `Result<T, E>` 的测试上使用 `#[should_panic]` 注解。要断言操作返回 `Err` 变体， _不要_ 对 `Result<T, E>` 值使用问号运算符。相反，使用 `assert!(value.is_err())`。

现在你已经知道了几种编写测试的方法，让我们看看当我们运行测试时会发生什么，并探索我们可以与 `cargo test` 一起使用的不同选项。

[bench]: https://doc.rust-lang.org/nightly/unstable-book/library-features/test.html
[concatenating]: /rust-book/ch08-02-strings/#使用--或-format-连接
[controlling-how-tests-are-run]: /rust-book/ch11-02-running-tests/#控制测试的运行方式
[derivable-traits]: /rust-book/appendix-03-derivable-traits
[doc-comments]: /rust-book/ch14-02-publishing-to-crates-io/#文档注释作为测试
[ignoring]: /rust-book/ch11-02-running-tests/#除非特别要求否则忽略测试
[paths-for-referring-to-an-item-in-the-module-tree]: /rust-book/ch07-03-paths-for-referring-to-an-item-in-the-module-tree/#路径引用模块树中的项
[subset]: /rust-book/ch11-02-running-tests/#按名称运行测试的子集
