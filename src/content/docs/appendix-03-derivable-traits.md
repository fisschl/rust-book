---
title: C. 可派生 trait
---

在本书的各个地方，我们讨论了 `derive` 属性，你可以将其应用于结构体或枚举定义。`derive` 属性会生成代码，在使用 `derive` 语法注释的类型上实现具有其自身默认实现的 trait。

在本附录中，我们提供了标准库中可以与 `derive` 一起使用的所有 trait 的参考。每个部分涵盖：

- 派生此 trait 将启用的运算符和方法
- `derive` 提供的 trait 实现的作用
- 实现该 trait 对类型的意义
- 允许或不允许实现该 trait 的条件
- 需要该 trait 的操作示例

如果你想要与 `derive` 属性提供的行为不同的行为，请查阅每个 trait 的[标准库文档][std]，了解如何手动实现它们的详细信息。

此处列出的 trait 是标准库中定义的、可以使用 `derive` 在你的类型上实现的唯一 trait。标准库中定义的其他 trait 没有合理的默认行为，因此由你以对你试图实现的目标有意义的方式实现它们。

一个不能派生的 trait 示例是 `Display`，它处理向最终用户格式化。你应该始终考虑向最终用户显示类型的适当方式。最终用户应该被允许看到类型的哪些部分？他们会发现哪些部分相关？什么格式的数据对他们最相关？Rust 编译器没有这种洞察力，因此它无法为你提供适当的默认行为。

本附录中提供的可派生 trait 列表并不全面：库可以为它们自己的 trait 实现 `derive`，使你可以使用 `derive` 的 trait 列表真正是开放式的。实现 `derive` 涉及使用过程宏，这在第 20 章的["自定义 `derive` 宏"][custom-derive-macros]一节中有所介绍。

## `Debug` 用于程序员输出

`Debug` trait 在格式字符串中启用调试格式化，你可以通过在 `{}` 占位符中添加 `:?` 来指示。

`Debug` trait 允许你打印类型的实例以用于调试目的，因此你和其他使用你类型的程序员可以在程序执行的特定点检查实例。

`Debug` trait 是必需的，例如，在使用 `assert_eq!` 宏时。如果相等断言失败，该宏会打印作为参数给出的实例值，以便程序员可以看到为什么这两个实例不相等。

## `PartialEq` 和 `Eq` 用于相等比较

`PartialEq` trait 允许你比较类型的实例以检查相等性，并启用 `==` 和 `!=` 运算符的使用。

派生 `PartialEq` 实现了 `eq` 方法。当在结构体上派生 `PartialEq` 时，只有当 *所有* 字段都相等时，两个实例才相等，如果 *任何* 字段不相等，则实例不相等。当在枚举上派生时，枚举的每个变体等于自身且不等于其他变体。

`PartialEq` trait 是必需的，例如，与使用 `assert_eq!` 宏一起，该宏需要能够比较类型的两个实例是否相等。

`Eq` trait 没有方法。它的目的是表明对于注解类型的每个值，该值等于自身。`Eq` trait 只能应用于也实现 `PartialEq` 的类型，尽管并非所有实现 `PartialEq` 的类型都可以实现 `Eq`。其中一个例子是浮点数类型：浮点数的实现表明两个非数字（`NaN`）值的实例彼此不相等。

`Eq` 是必需的一个例子是作为 `HashMap<K, V>` 中的键，以便 `HashMap<K, V>` 可以判断两个键是否相同。

## `PartialOrd` 和 `Ord` 用于排序比较

`PartialOrd` trait 允许你比较类型的实例以进行排序。实现 `PartialOrd` 的类型可以与 `<`、`>`、`<=` 和 `>=` 运算符一起使用。你只能将 `PartialOrd` trait 应用于也实现 `PartialEq` 的类型。

派生 `PartialOrd` 实现了 `partial_cmp` 方法，该方法返回一个 `Option<Ordering>`，当给定的值不产生排序时，该值将为 `None`。一个不产生排序的值的例子（即使该类型的大多数值可以比较）是 `NaN` 浮点值。使用任何浮点数和 `NaN` 浮点值调用 `partial_cmp` 将返回 `None`。

当在结构体上派生时，`PartialOrd` 通过按字段在结构体定义中出现的顺序比较每个字段中的值来比较两个实例。当在枚举上派生时，在枚举定义中较早声明的枚举变体被认为小于后面列出的变体。

`PartialOrd` trait 是必需的，例如，对于来自 `rand` crate 的 `gen_range` 方法，该方法生成由范围表达式指定的范围内的随机值。

`Ord` trait 允许你知道对于注解类型的任何两个值，将存在有效的排序。`Ord` trait 实现 `cmp` 方法，该方法返回 `Ordering` 而不是 `Option<Ordering>`，因为总是可能有有效的排序。你只能将 `Ord` trait 应用于也实现 `PartialOrd` 和 `Eq` 的类型（`Eq` 需要 `PartialEq`）。当在结构体和枚举上派生时，`cmp` 的行为与 `PartialOrd` 的派生实现对 `partial_cmp` 的行为相同。

`Ord` 是必需的一个例子是在 `BTreeSet<T>` 中存储值时，这是一种基于值的排序顺序存储数据的数据结构。

## `Clone` 和 `Copy` 用于复制值

`Clone` trait 允许你显式创建值的深拷贝，复制过程可能涉及运行任意代码和复制堆数据。有关 `Clone` 的更多信息，请参见第 4 章的["与 Clone 交互的变量和数据"][variables-and-data-interacting-with-clone]一节。

派生 `Clone` 实现了 `clone` 方法，当为整个类型实现时，会在类型的每个部分上调用 `clone`。这意味着类型中的所有字段或值也必须实现 `Clone` 才能派生 `Clone`。

`Clone` 是必需的一个例子是在切片上调用 `to_vec` 方法时。切片不拥有它包含的类型实例，但从 `to_vec` 返回的向量需要拥有其实例，因此 `to_vec` 在每个项目上调用 `clone`。因此，存储在切片中的类型必须实现 `Clone`。

`Copy` trait 允许你仅通过复制存储在栈上的位来复制值；不需要任意代码。有关 `Copy` 的更多信息，请参见第 4 章的["仅栈数据：Copy"][stack-only-data-copy]一节。

`Copy` trait 没有定义任何方法，以防止程序员重载这些方法并违反没有运行任意代码的假设。这样，所有程序员都可以假设复制值将非常快。

你可以在部分都实现 `Copy` 的任何类型上派生 `Copy`。实现 `Copy` 的类型还必须实现 `Clone`，因为实现 `Copy` 的类型具有执行与 `Copy` 相同任务的 `Clone` 的简单实现。

`Copy` trait 很少是必需的；实现 `Copy` 的类型有可用的优化，意味着你不必调用 `clone`，这使代码更简洁。

`Copy` 可以完成的任何事情你也可以用 `Clone` 完成，但代码可能更慢或不得不在某些地方使用 `clone`。

## `Hash` 用于将值映射到固定大小的值

`Hash` trait 允许你获取任意大小的类型的实例，并使用哈希函数将该实例映射到固定大小的值。派生 `Hash` 实现了 `hash` 方法。`hash` 方法的派生实现结合了在类型的每个部分上调用 `hash` 的结果，意味着所有字段或值也必须实现 `Hash` 才能派生 `Hash`。

`Hash` 是必需的一个例子是在 `HashMap<K, V>` 中存储键以高效存储数据。

## `Default` 用于默认值

`Default` trait 允许你为类型创建默认值。派生 `Default` 实现了 `default` 函数。`default` 函数的派生实现在类型的每个部分上调用 `default` 函数，意味着类型中的所有字段或值也必须实现 `Default` 才能派生 `Default`。

`Default::default` 函数通常与第 5 章的["使用结构体更新语法从其他实例创建实例"][creating-instances-from-other-instances-with-struct-update-syntax]一节中讨论的结构体更新语法结合使用。你可以自定义结构体的几个字段，然后通过使用 `..Default::default()` 为其余字段设置和使用默认值。

当你对 `Option<T>` 实例使用 `unwrap_or_default` 方法时，例如，`Default` trait 是必需的。如果 `Option<T>` 是 `None`，`unwrap_or_default` 方法将返回存储在 `Option<T>` 中的类型 `T` 的 `Default::default` 的结果。

[std]: https://doc.rust-lang.org/std/index.html
[creating-instances-from-other-instances-with-struct-update-syntax]: /rust-book/ch05-01-defining-structs#使用结构体更新语法从其他实例创建实例
[stack-only-data-copy]: /rust-book/ch04-01-what-is-ownership#仅栈数据copy
[variables-and-data-interacting-with-clone]: /rust-book/ch04-01-what-is-ownership#与-clone-交互的变量和数据
[custom-derive-macros]: /rust-book/ch20-05-macros#过程宏