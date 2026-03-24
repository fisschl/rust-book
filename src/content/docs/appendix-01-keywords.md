---
title: A. 关键字
---

以下列表包含 Rust 语言保留供当前或将来使用的关键字。因此，它们不能用作标识符（原始标识符除外，如我们在["原始标识符"][raw-identifiers]一节中讨论的）。_标识符_ 是函数、变量、参数、结构体字段、模块、crate、常量、宏、静态值、属性、类型、trait 或生命周期的名称。

## 当前正在使用的关键字

以下是当前正在使用的关键字列表，并描述了它们的功能。

- **`as`**：执行原始类型转换、消除包含项目的特定 trait 的歧义，或在 `use` 语句中重命名项目。
- **`async`**：返回一个 `Future` 而不是阻塞当前线程。
- **`await`**：暂停执行直到 `Future` 的结果就绪。
- **`break`**：立即退出循环。
- **`const`**：定义常量项或常量原始指针。
- **`continue`**：继续下一次循环迭代。
- **`crate`**：在模块路径中，指 crate 根。
- **`dyn`**：对 trait 对象进行动态分发。
- **`else`**：`if` 和 `if let` 控制流结构的回退。
- **`enum`**：定义一个枚举。
- **`extern`**：链接外部函数或变量。
- **`false`**：布尔假字面量。
- **`fn`**：定义一个函数或函数指针类型。
- **`for`**：遍历迭代器的项目、实现一个 trait 或指定一个高阶生命周期。
- **`if`**：基于条件表达式的结果进行分支。
- **`impl`**：实现固有或 trait 功能。
- **`in`**：`for` 循环语法的一部分。
- **`let`**：绑定一个变量。
- **`loop`**：无条件循环。
- **`match`**：将值与模式匹配。
- **`mod`**：定义一个模块。
- **`move`**：使闭包取得其捕获的所有值的所有权。
- **`mut`**：在引用、原始指针或模式绑定中表示可变性。
- **`pub`**：在结构体字段、`impl` 块或模块中表示公共可见性。
- **`ref`**：通过引用绑定。
- **`return`**：从函数返回。
- **`Self`**：我们正在定义或实现的类型的类型别名。
- **`self`**：方法主体或当前模块。
- **`static`**：全局变量或持续整个程序执行的生命周期。
- **`struct`**：定义一个结构体。
- **`super`**：当前模块的父模块。
- **`trait`**：定义一个 trait。
- **`true`**：布尔真字面量。
- **`type`**：定义一个类型别名或关联类型。
- **`union`**：定义一个[联合体][union]；仅在联合体声明中使用时才是关键字。
- **`unsafe`**：表示不安全代码、函数、trait 或实现。
- **`use`**：将符号引入作用域。
- **`where`**：表示约束类型的子句。
- **`while`**：基于表达式的结果进行条件循环。

## 保留供将来使用的关键字

以下关键字目前没有任何功能，但 Rust 保留它们供潜在的未来使用：

- `abstract`
- `become`
- `box`
- `do`
- `final`
- `gen`
- `macro`
- `override`
- `priv`
- `try`
- `typeof`
- `unsized`
- `virtual`
- `yield`

## 原始标识符

_原始标识符_ 是一种语法，允许你在通常不允许的情况下使用关键字。你可以通过在关键字前加上 `r#` 来使用原始标识符。

例如，`match` 是一个关键字。如果你尝试编译以下使用 `match` 作为其名称的函数：

```rust
fn match(needle: &str, haystack: &str) -> bool {
    haystack.contains(needle)
}
```

你会得到这个错误：

```text
error: expected identifier, found keyword `match`
 --> src/main.rs:4:4
  |
4 | fn match(needle: &str, haystack: &str) -> bool {
  |    ^^^^^ expected identifier, found keyword
```

错误显示你不能使用关键字 `match` 作为函数标识符。要将 `match` 用作函数名，你需要使用原始标识符语法，如下所示：

```rust
fn r#match(needle: &str, haystack: &str) -> bool {
    haystack.contains(needle)
}

fn main() {
    assert!(r#match("foo", "foobar"));
}
```

这段代码将编译而没有任何错误。请注意在函数定义中的函数名以及 `main` 中调用函数的地方都有 `r#` 前缀。

原始标识符允许你使用任何你选择的单词作为标识符，即使该单词恰好是保留关键字。这使我们在选择标识符名称时有更多的自由，也让我们能够与用这些单词不是关键字的语言编写的程序集成。此外，原始标识符允许你使用用不同 Rust 版本编写的库。例如，`try` 在 2015 版本中不是关键字，但在 2018、2021 和 2024 版本中是。如果你依赖一个使用 2015 版本编写并且有 `try` 函数的库，你需要使用原始标识符语法，在这种情况下是 `r#try`，来从你的代码中调用该函数。有关版本的更多信息，请参见[附录 E][appendix-e]。

[raw-identifiers]: #原始标识符
[union]: https://doc.rust-lang.org/reference/items/unions.html
[appendix-e]: /rust-book/appendix-05-editions