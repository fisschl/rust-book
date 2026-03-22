---
title: 19.2. 可辩驳性：模式是否可能匹配失败
---

模式有两种形式：可辩驳的和无可辩驳的。对于任何可能传递的值都会匹配的模式是 **无可辩驳的** 。一个例子是语句 `let x = 5;` 中的 `x`，因为 `x` 匹配任何东西，因此不可能匹配失败。对于某些可能的值可能匹配失败的模式是 **可辩驳的** 。一个例子是表达式 `if let Some(x) = a_value` 中的 `Some(x)`，因为如果 `a_value` 变量中的值是 `None` 而不是 `Some`，`Some(x)` 模式将不会匹配。

函数参数、`let` 语句和 `for` 循环只能接受无可辩驳的模式，因为当值不匹配时程序无法做任何有意义的事情。`if let` 和 `while let` 表达式以及 `let...else` 语句接受可辩驳和无可辩驳的模式，但编译器会对无可辩驳的模式发出警告，因为根据定义，它们旨在处理可能的失败：条件表达式的功能在于它能够根据成功或失败而执行不同的操作。

一般来说，你不必担心可辩驳和无可辩驳模式之间的区别；但是，你确实需要熟悉可辩驳性的概念，以便在看到错误消息中的它时能够做出响应。在那些情况下，你需要根据代码的预期行为来改变模式或你正在使用模式的结构。

让我们看一个例子，说明当我们尝试在 Rust 要求无可辩驳模式的地方使用可辩驳模式，以及相反情况时会发生什么。清单 19-8 显示了一个 `let` 语句，但对于模式，我们指定了 `Some(x)`，一个可辩驳模式。如你所料，这段代码不会编译。

**清单 19-8**：尝试将可辩驳模式与 `let` 一起使用

```rust
fn main() {
    let some_option_value: Option<i32> = None;
    let Some(x) = some_option_value;
}
```

如果 `some_option_value` 是 `None` 值，它将无法匹配模式 `Some(x)`，这意味着该模式是可辩驳的。然而，`let` 语句只能接受无可辩驳的模式，因为对于 `None` 值代码无法做任何有效的事情。在编译时，Rust 会抱怨我们尝试在需要无可辩驳模式的地方使用可辩驳模式：

```console
$ cargo run
   Compiling patterns v0.1.0 (file:///projects/patterns)
error[E0005]: refutable pattern in local binding
 --> src/main.rs:3:9
  |
3 |     let Some(x) = some_option_value;
  |         ^^^^^^^ pattern `None` not covered
  |
  = note: `let` bindings require an "irrefutable pattern", like a `struct` or an `enum` with only one variant
  = note: for more information, visit https://doc.rust-lang.org/book/ch19-02-refutability.html
  = note: the matched value is of type `Option<i32>`
help: you might want to use `let else` to handle the variant that isn't matched
  |
3 |     let Some(x) = some_option_value else { todo!() };
  |                                     ++++++++++++++++

For more information about this error, try `rustc --explain E0005`.
error: could not compile `patterns` (bin "patterns") due to 1 previous error
```

因为我们没有覆盖（也无法覆盖！）模式 `Some(x)` 的每一个有效值，Rust 理所当然地产生了编译器错误。

如果我们在需要无可辩驳模式的地方有可辩驳模式，我们可以通过更改使用模式的代码来修复它：不使用 `let`，我们可以使用 `let...else`。然后，如果模式不匹配，花括号中的代码将处理该值。清单 19-9 展示了如何修复清单 19-8 中的代码。

**清单 19-9**：使用 `let...else` 和带有可辩驳模式的块代替 `let`

```rust
fn main() {
    let some_option_value: Option<i32> = None;
    let Some(x) = some_option_value else {
        return;
    };
}
```

我们给了代码一条出路！这段代码完全有效，尽管这意味着如果不收到警告我们就不能使用无可辩驳的模式。如果我们给 `let...else` 一个总是匹配的模式，例如 `x`，如清单 19-10 所示，编译器将发出警告。

**清单 19-10**：尝试将无可辩驳模式与 `let...else` 一起使用

```rust
fn main() {
    let x = 5 else {
        return;
    };
}
```

Rust 抱怨使用 `let...else` 与无可辩驳模式没有意义：

```console
$ cargo run
   Compiling patterns v0.1.0 (file:///projects/patterns)
warning: irrefutable `let...else` pattern
 --> src/main.rs:2:5
  |
2 |     let x = 5 else {
  |     ^^^^^^^^^
  |
  = note: this pattern will always match, so the `else` clause is useless
  = help: consider removing the `else` clause
  = note: `#[warn(irrefutable_let_patterns)]` on by default

warning: `patterns` (bin "patterns") generated 1 warning
    Finished `dev` profile [unoptimized + debuginfo] target(s) in 0.39s
     Running `target/debug/patterns`
```

因此，match 分支必须使用可辩驳模式，除了最后一个分支，它应该使用无可辩驳模式匹配任何剩余的值。Rust 允许我们在只有一个分支的 `match` 中使用无可辩驳模式，但这种语法不是特别有用，可以用更简单的 `let` 语句代替。

现在你知道在哪里使用模式以及可辩驳和无可辩驳模式之间的区别，让我们介绍我们可以用来创建模式的所有语法。
