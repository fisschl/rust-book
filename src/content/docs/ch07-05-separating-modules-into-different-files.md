---
title: 将模块拆分到不同文件
---

到目前为止，本章中的所有示例都在一个文件中定义了多个模块。当模块变大时，你可能希望将它们的定义移到单独的文件中，以便更容易导航代码。

例如，让我们从代码示例 7-17 开始，它有多个餐厅模块。我们将把模块提取到文件中，而不是在 crate 根文件中定义所有模块。在这种情况下，crate 根文件是 _src/lib.rs_，但这个程序也适用于 crate 根文件为 _src/main.rs_ 的二进制 crate。

首先，我们将把 `front_of_house` 模块提取到它自己的文件中。删除 `front_of_house` 模块的花括号内的代码，只留下 `mod front_of_house;` 声明，这样 _src/lib.rs_ 就包含代码示例 7-21 中所示的代码。请注意，在我们创建代码示例 7-22 中的 _src/front_of_house.rs_ 文件之前，这将不会编译。

**代码示例 7-21：声明 `front_of_house` 模块，其内容将在 *src/front_of_house.rs* 中**

```rust
mod front_of_house;

pub use crate::front_of_house::hosting;

pub fn eat_at_restaurant() {
    hosting::add_to_waitlist();
}
```

接下来，将原来在花括号中的代码放到一个名为 _src/front_of_house.rs_ 的新文件中，如代码示例 7-22 所示。编译器知道要查找这个文件，因为它在 crate 根中遇到了名为 `front_of_house` 的模块声明。

**代码示例 7-22：*src/front_of_house.rs* 中 `front_of_house` 模块内部的定义**

```rust
pub mod hosting {
    pub fn add_to_waitlist() {}
}
```

请注意，你只需要在模块树中使用 `mod` 声明加载文件 _一次_ 。一旦编译器知道该文件是项目的一部分（并且知道你放置 `mod` 语句的位置，因此知道代码在模块树中的位置），项目中的其他文件应该使用声明该文件的路径来引用加载文件的代码，如[“路径引用模块树中的项”](/rust-book/ch07-03-paths-for-referring-to-an-item-in-the-module-tree)部分所述。换句话说，`mod`  _不是_ 你在其他编程语言中可能见过的"include"操作。

接下来，我们将把 `hosting` 模块提取到它自己的文件中。过程略有不同，因为 `hosting` 是 `front_of_house` 的子模块，而不是根模块的子模块。我们将把 `hosting` 的文件放在一个新目录中，该目录将根据其在模块树中的祖先命名，在本例中是 _src/front_of_house_。

要开始移动 `hosting`，我们修改 _src/front_of_house.rs_，使其只包含 `hosting` 模块的声明：

**src/front_of_house.rs**

```rust
pub mod hosting;
```

然后，我们创建一个 _src/front_of_house_ 目录和一个 _hosting.rs_ 文件来包含 `hosting` 模块中定义的内容：

**src/front_of_house/hosting.rs**

```rust
pub fn add_to_waitlist() {}
```

如果我们把 _hosting.rs_ 放在 _src_ 目录中，编译器会期望 _hosting.rs_ 代码位于 crate 根中声明的 `hosting` 模块中，而不是作为 `front_of_house` 模块的子模块。编译器用于检查哪些文件包含哪些模块代码的规则意味着目录和文件更紧密地匹配模块树。

> ### 替代文件路径
>
> 到目前为止，我们已经介绍了 Rust 编译器使用的最惯用的文件路径，但 Rust 还支持一种较旧的文件路径风格。对于在 crate 根中声明的名为 `front_of_house` 的模块，编译器将在以下位置查找模块的代码：>
> - _src/front_of_house.rs_（我们介绍的）
> - _src/front_of_house/mod.rs_（较旧的风格，仍然支持的路径）
>
> 对于名为 `hosting` 且是 `front_of_house` 子模块的模块，编译器将在以下位置查找模块的代码：
>
> - _src/front_of_house/hosting.rs_（我们介绍的）
> - _src/front_of_house/hosting/mod.rs_（较旧的风格，仍然支持的路径）
>
> 如果你对同一个模块使用两种风格，会得到编译器错误。在同一项目中为不同模块混合使用两种风格是允许的，但可能会让浏览你项目的人感到困惑。
>
> 使用名为 _mod.rs_ 的文件的风格的主要缺点是，你的项目中最终可能会有很多名为 _mod.rs_ 的文件，当你在编辑器中同时打开它们时可能会感到困惑。

我们已经将每个模块的代码移到了单独的文件中，模块树保持不变。`eat_at_restaurant` 中的函数调用无需任何修改即可工作，即使定义位于不同的文件中。这种技术允许你在模块大小增长时将它们移动到新文件。

请注意，_src/lib.rs_ 中的 `pub use crate::front_of_house::hosting` 语句也没有改变，`use` 对哪些文件作为 crate 的一部分被编译也没有影响。`mod` 关键字声明模块，Rust 会在与模块同名的文件中查找该模块的代码。

## 总结

Rust 允许你将一个包拆分为多个 crate，将一个 crate 拆分为模块，以便你可以在一个模块中引用另一个模块中定义的项。你可以通过指定绝对或相对路径来做到这一点。这些路径可以通过 `use` 语句引入作用域，这样你就可以在该作用域中多次使用该路径的较短形式。模块代码默认是私有的，但你可以通过添加 `pub` 关键字使定义成为公共的。

在下一章中，我们将介绍标准库中的一些集合数据结构，你可以在你整洁组织的代码中使用它们。
