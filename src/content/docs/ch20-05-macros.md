---
title: 宏
---

我们在本书中使用了像 `println!` 这样的宏，但我们还没有完全探索宏是什么以及它是如何工作的。术语 **宏** 指的是 Rust 中的一系列特性——使用 `macro_rules!` 的声明式宏和三种过程宏：

- 自定义 `#[derive]` 宏，指定与 `derive` 属性一起使用的代码，用于 struct 和 enum
- 类属性宏，定义可用于任何项的自定义属性
- 类函数宏，看起来像函数调用但对作为参数指定的 token 进行操作

我们将依次讨论这些，但首先，让我们看看为什么我们已经有了函数还需要宏。

## 宏与函数的区别

从根本上说，宏是一种编写代码的方式来编写其他代码，这被称为 **元编程** 。在附录 C 中，我们讨论了 `derive` 属性，它为你生成各种 Trait 的实现。我们在整本书中还使用了 `println!` 和 `vec!` 宏。所有这些宏都会 **扩展** 以产生比你手动编写的代码更多的代码。

元编程有助于减少你必须编写和维护的代码量，这也是函数的作用之一。然而，宏具有函数所没有的一些额外能力。

函数签名必须声明函数具有的参数的数量和类型。另一方面，宏可以接受可变数量的参数：我们可以用 `println!("hello")` 和一个参数一起调用，或者用 `println!("hello {}", name)` 和两个参数一起调用。此外，宏在编译器解释代码含义之前就被扩展了，所以宏可以，例如，在给定类型上实现一个 Trait。函数不能这样做，因为它在运行时被调用，而 Trait 需要在编译时实现。

实现宏而不是函数的缺点是，宏定义比函数定义更复杂，因为你是在编写编写 Rust 代码的 Rust 代码。由于这种间接性，宏定义通常比函数定义更难阅读、理解和维护。

宏和函数之间的另一个重要区别是，你必须在文件中的 **之前** 定义宏或将它们引入作用域，然后才能调用它们，而函数你可以在任何地方定义并在任何地方调用。

## 用于通用元编程的声明式宏

Rust 中最广泛使用的宏形式是 **声明式宏** 。这些有时也被称为 "按例宏"、"`macro_rules!` 宏" 或简称 "宏"。在其核心，声明式宏允许你编写类似于 Rust `match` 表达式的东西。如第 6 章所述，`match` 表达式是控制结构，它接受一个表达式，将表达式的结果值与模式进行比较，然后运行与匹配模式关联的代码。宏也将值与与特定代码关联的模式进行比较：在这种情况下，值是传递给宏的字面 Rust 源代码；模式与该源代码的结构进行比较；当匹配时，与每个模式关联的代码将替换传递给宏的代码。这一切都发生在编译期间。

要定义宏，你使用 `macro_rules!` 结构。让我们通过查看 `vec!` 宏是如何定义的，来探索如何使用 `macro_rules!`。第 8 章介绍了我们如何使用 `vec!` 宏来创建具有特定值的新向量。例如，以下宏创建一个包含三个整数的新向量：

```rust
let v: Vec<u32> = vec![1, 2, 3];
```

我们也可以使用 `vec!` 宏来创建包含两个整数的向量或包含五个字符串切片的向量。我们无法使用函数来做同样的事情，因为我们无法预先知道值的数量或类型。

清单 20-35 显示了 `vec!` 宏的一个稍微简化的定义。

**清单 20-35**：`vec!` 宏定义的简化版本（文件名：src/lib.rs）

```rust
#[macro_export]
macro_rules! vec {
    ( $( $x:expr ),* ) => {
        {
            let mut temp_vec = Vec::new();
            $(
                temp_vec.push($x);
            )*
            temp_vec
        }
    };
}
```

> 注意：标准库中 `vec!` 宏的实际定义包括预先分配正确内存量的代码。该代码是一种优化，我们在这里不包括，以使示例更简单。

`#[macro_export]` 注解指示应该在将定义宏的 crate 引入作用域时，使此宏可用。没有这个注解，宏就无法被引入作用域。

然后，我们开始宏定义，使用 `macro_rules!` 和我们正在定义的宏的名称 **不** 带感叹号。名称，在这种情况下是 `vec`，后面跟着表示宏定义主体的大括号。

`vec!` 主体中的结构类似于 `match` 表达式的结构。这里我们有一个带模式 `( $( $x:expr ),* )` 的分支，后跟 `=>` 和与此模式关联的代码块。如果模式匹配，将发出关联的代码块。鉴于这是此宏中唯一的模式，只有一种有效的匹配方式；任何其他模式都将导致错误。更复杂的宏将有多个分支。

宏定义中的有效模式语法与第 19 章介绍的模式语法不同，因为宏模式是针对 Rust 代码结构而不是值进行匹配的。让我们看看清单 20-35 中的模式片段的含义；有关完整的宏模式语法，请参阅 [Rust 参考][ref]。

首先，我们使用一组括号来包含整个模式。我们使用美元符号 (`$`) 来声明宏系统中的一个变量，该变量将包含与模式匹配的 Rust 代码。美元符号清楚地表明这是一个宏变量，而不是常规的 Rust 变量。接下来是一组括号，捕获与括号内模式匹配的值，以便在替换代码中使用。在 `$()` 内是 `$x:expr`，它匹配任何 Rust 表达式，并将该表达式命名为 `$x`。

跟在 `$()` 后面的逗号表示，在 `$()` 中匹配的代码的每个实例之间必须出现一个字面逗号分隔符。`*` 指定该模式匹配前面内容的零个或多个实例。

当我们使用 `vec![1, 2, 3];` 调用此宏时，`$x` 模式与三个表达式 `1`、`2` 和 `3` 匹配三次。

现在让我们看看与此分支关联的代码主体中的模式：`$()*` 内的 `temp_vec.push()` 根据模式匹配 `$()` 的次数为零次或多次，为每个部分生成。`$x` 被替换为每个匹配的表达式。当我们使用 `vec![1, 2, 3];` 调用此宏时，替换此宏调用生成的代码将是以下内容：

```rust
{
    let mut temp_vec = Vec::new();
    temp_vec.push(1);
    temp_vec.push(2);
    temp_vec.push(3);
    temp_vec
}
```

我们定义了一个可以接收任意数量的任意类型参数的宏，并且可以生成代码来创建包含指定元素的向量。

要了解有关如何编写宏的更多信息，请查阅在线文档或其他资源，例如由 Daniel Keep 发起并由 Lukas Wirth 继续编写的 ["Rust 宏小书"][tlborm]。

## 用于从属性生成代码的过程宏

宏的第二种形式是过程宏，它的行为更像函数（并且是一种过程）。**过程宏** 接受一些代码作为输入，对这些代码进行操作，并产生一些代码作为输出，而不是像声明式宏那样针对模式匹配并将代码替换为其他代码。三种过程宏是自定义 `derive`、类属性和类函数，它们都以类似的方式工作。

创建过程宏时，定义必须位于具有特殊 crate 类型的其自己的 crate 中。这是由于复杂的技术原因，我们希望将来能消除。在清单 20-36 中，我们展示了如何定义过程宏，其中 `some_attribute` 是使用特定宏变体的占位符。

**清单 20-36**：定义过程宏的示例（文件名：src/lib.rs）

```rust
use proc_macro::TokenStream;

#[some_attribute]
pub fn some_name(input: TokenStream) -> TokenStream {
}
```

定义过程宏的函数接受 `TokenStream` 作为输入并产生 `TokenStream` 作为输出。`TokenStream` 类型由随 Rust 一起提供的 `proc_macro` crate 定义，并表示一系列 token。这是宏的核心：宏正在操作的源代码构成输入 `TokenStream`，宏产生的代码是输出 `TokenStream`。该函数还附加了一个属性，指定我们正在创建的过程宏的种类。我们可以在同一个 crate 中有多种过程宏。

让我们看看不同类型的过程宏。我们将从一个自定义 `derive` 宏开始，然后解释使其他形式不同的微小差异。

## 自定义 `derive` 宏

让我们创建一个名为 `hello_macro` 的 crate，它定义了一个名为 `HelloMacro` 的 Trait，带有一个名为 `hello_macro` 的关联函数。与其让我们的用户为他们每个类型实现 `HelloMacro` Trait，不如我们提供一个过程宏，使用户可以用 `#[derive(HelloMacro)]` 来注解他们的类型，以获得 `hello_macro` 函数的默认实现。默认实现将打印 `Hello, Macro! My name is TypeName!`，其中 `TypeName` 是定义此 Trait 的类型名称。换句话说，我们将编写一个 crate，使另一个程序员能够编写像清单 20-37 这样的代码，使用我们的 crate。

**清单 20-37**：使用我们的过程宏时，我们 crate 的用户将能够编写的代码（文件名：src/main.rs）

```rust
use hello_macro::HelloMacro;
use hello_macro_derive::HelloMacro;

#[derive(HelloMacro)]
struct Pancakes;

fn main() {
    Pancakes::hello_macro();
}
```

当我们完成时，这段代码将打印 `Hello, Macro! My name is Pancakes!`。第一步是创建一个新的库 crate，如下所示：

```console
$ cargo new hello_macro --lib
```

接下来，在清单 20-38 中，我们将定义 `HelloMacro` Trait 及其关联函数。

**清单 20-38**：一个我们将与 `derive` 宏一起使用的简单 Trait（文件名：src/lib.rs）

```rust
pub trait HelloMacro {
    fn hello_macro();
}
```

我们有一个 Trait 及其函数。此时，我们的 crate 用户可以如清单 20-39 所示实现该 Trait 以实现所需的功能。

**清单 20-39**：如果用户编写 `HelloMacro` Trait 的手动实现会是什么样子（文件名：src/main.rs）

```rust
use hello_macro::HelloMacro;

struct Pancakes;

impl HelloMacro for Pancakes {
    fn hello_macro() {
        println!("Hello, Macro! My name is Pancakes!");
    }
}

fn main() {
    Pancakes::hello_macro();
}
```

然而，他们需要为他们想要与 `hello_macro` 一起使用的每种类型编写实现块；我们希望让他们免于做这项工作。

此外，我们还不能为 `hello_macro` 函数提供默认实现，该实现将打印 Trait 被实现的类型的名称：Rust 没有反射能力，因此无法在运行时查找类型名称。我们需要一个宏在编译时生成代码。

下一步是定义过程宏。在撰写本文时，过程宏需要位于其自己的 crate 中。最终，这一限制可能会被解除。crate 和宏 crate 的结构约定如下：对于一个名为 `foo` 的 crate，自定义 `derive` 过程宏 crate 称为 `foo_derive`。让我们在 `hello_macro` 项目中启动一个名为 `hello_macro_derive` 的新 crate：

```console
$ cargo new hello_macro_derive --lib
```

我们的两个 crate 紧密相关，因此我们在 `hello_macro` crate 的目录内创建过程宏 crate。如果我们更改 `hello_macro` 中的 Trait 定义，我们也必须更改 `hello_macro_derive` 中过程宏的实现。这两个 crate 需要单独发布，使用这些 crate 的程序员需要将它们都添加为依赖项并将它们都引入作用域。我们可以让 `hello_macro` crate 使用 `hello_macro_derive` 作为依赖项并重新导出过程宏代码。然而，我们构建项目的方式使得程序员即使不想要 `derive` 功能也可以使用 `hello_macro`。

我们需要将 `hello_macro_derive` crate 声明为过程宏 crate。我们还需要 `syn` 和 `quote` crate 的功能，稍后你就会看到，所以我们需要将它们添加为依赖项。将以下内容添加到 `hello_macro_derive` 的 _Cargo.toml_ 文件：

**文件名：hello_macro_derive/Cargo.toml**

```toml
[lib]
proc-macro = true

[dependencies]
syn = "2.0"
quote = "1.0"
```

要开始定义过程宏，请将清单 20-40 中的代码放入 `hello_macro_derive` crate 的 _src/lib.rs_ 文件中。请注意，在我们为 `impl_hello_macro` 函数添加定义之前，这段代码不会编译。

**清单 20-40**：大多数过程宏 crate 将需要用来处理 Rust 代码的代码（文件名：hello_macro_derive/src/lib.rs）

```rust
use proc_macro::TokenStream;
use quote::quote;

#[proc_macro_derive(HelloMacro)]
pub fn hello_macro_derive(input: TokenStream) -> TokenStream {
    // 将 Rust 代码的表示构建为语法树
    // 以便我们可以操作它。
    let ast = syn::parse(input).unwrap();

    // 构建 Trait 实现。
    impl_hello_macro(&ast)
}
```

注意，我们将代码拆分为负责解析 `TokenStream` 的 `hello_macro_derive` 函数，和负责转换语法树的 `impl_hello_macro` 函数：这使编写过程宏更方便。外部函数（在本例中为 `hello_macro_derive`）中的代码对于你查看或创建的几乎每个过程宏 crate 都将相同。你指定在内部函数（在本例中为 `impl_hello_macro`）主体中的代码将根据过程宏的目的而有所不同。

我们引入了三个新的 crate：`proc_macro`、[`syn`][syn] 和 [`quote`][quote]。`proc_macro` crate 随 Rust 一起提供，因此我们不需要将它添加到 _Cargo.toml_ 中的依赖项。`proc_macro` crate 是编译器的 API，允许我们从代码中读取和操作 Rust 代码。

`syn` crate 将 Rust 代码从字符串解析为我们可以对其执行操作的数据结构。`quote` crate 将 `syn` 数据结构转换回 Rust 代码。这些 crate 使得解析我们可能想要处理的任何 Rust 代码变得更加简单：为 Rust 代码编写完整的解析器并非简单的任务。

当我们的库用户在类型上指定 `#[derive(HelloMacro)]` 时，将调用 `hello_macro_derive` 函数。这是可能的，因为我们在此处使用 `proc_macro_derive` 注解了 `hello_macro_derive` 函数并指定了名称 `HelloMacro`，这与我们的 Trait 名称匹配；这是大多数过程宏遵循的约定。

`hello_macro_derive` 函数首先将 `input` 从 `TokenStream` 转换为数据结构，然后我们可以解释并对其执行操作。这就是 `syn` 发挥作用的地方。`syn` 中的 `parse` 函数接受 `TokenStream` 并返回表示解析后的 Rust 代码的 `DeriveInput` struct。清单 20-41 显示了我们从解析 `struct Pancakes;` 字符串得到的 `DeriveInput` struct 的相关部分。

**清单 20-41**：解析清单 20-37 中具有宏属性的代码时得到的 `DeriveInput` 实例

```rust
DeriveInput {
    // --snip--

    ident: Ident {
        ident: "Pancakes",
        span: #0 bytes(95..103)
    },
    data: Struct(
        DataStruct {
            struct_token: Struct,
            fields: Unit,
            semi_token: Some(
                Semi
            )
        }
    )
}
```

此 struct 的字段显示我们解析的 Rust 代码是一个单元 struct，其 `ident`（ **标识符** ，意为名称）为 `Pancakes`。此 struct 上有更多字段用于描述各种 Rust 代码；查看 [`syn` 关于 `DeriveInput` 的文档][syn-docs] 以获取更多信息。

很快我们将定义 `impl_hello_macro` 函数，它将在其中构建我们想要包含的新 Rust 代码。但在我们这样做之前，请注意我们的 `derive` 宏的输出也是一个 `TokenStream`。返回的 `TokenStream` 被添加到我们的 crate 用户编写的代码中，因此当他们编译他们的 crate 时，他们将获得我们在修改后的 `TokenStream` 中提供的额外功能。

你可能已经注意到，如果此处对 `syn::parse` 函数的调用失败，我们正在调用 `unwrap` 以使 `hello_macro_derive` 函数 panic。我们的过程宏有必要在错误时 panic，因为 `proc_macro_derive` 函数必须返回 `TokenStream` 而不是 `Result` 以符合过程宏 API。我们通过使用 `unwrap` 简化了此示例；在生产代码中，你应该通过使用 `panic!` 或 `expect` 提供关于出了什么问题的更具体的错误消息。

现在我们有了将带注解的 Rust 代码从 `TokenStream` 转换为 `DeriveInput` 实例的代码，让我们生成在带注解的类型上实现 `HelloMacro` Trait 的代码，如清单 20-42 所示。

**清单 20-42**：使用解析的 Rust 代码实现 `HelloMacro` Trait（文件名：hello_macro_derive/src/lib.rs）

```rust
fn impl_hello_macro(ast: &syn::DeriveInput) -> TokenStream {
    let name = &ast.ident;
    let generated = quote! {
        impl HelloMacro for #name {
            fn hello_macro() {
                println!("Hello, Macro! My name is {}!", stringify!(#name));
            }
        }
    };
    generated.into()
}
```

我们使用 `ast.ident` 获得包含带注解类型名称（标识符）的 `Ident` struct 实例。清单 20-41 中的 struct 显示，当我们在清单 20-37 的代码上运行 `impl_hello_macro` 函数时，我们得到的 `ident` 将具有值为 `"Pancakes"` 的 `ident` 字段。因此，清单 20-42 中的 `name` 变量将包含一个 `Ident` struct 实例，打印时将是字符串 `"Pancakes"`，即清单 20-37 中 struct 的名称。

`quote!` 宏允许我们定义我们想要返回的 Rust 代码。编译器期望的是 `quote!` 宏执行直接结果之外的东西，因此我们需要将其转换为 `TokenStream`。我们通过调用 `into` 方法来完成此操作，该方法消耗此中间表示并返回所需 `TokenStream` 类型的值。

`quote!` 宏还提供一些非常酷的模板机制：我们可以输入 `#name`，`quote!` 将用变量 `name` 中的值替换它。你甚至可以进行一些类似于常规宏工作的重复。查看 [the `quote` crate 的文档][quote-docs] 以获得全面的介绍。

我们希望我们的过程宏为用户带注解的类型生成我们的 `HelloMacro` Trait 的实现，我们可以使用 `#name` 获得该类型。Trait 实现有一个函数 `hello_macro`，其主体包含我们想要提供的功能：打印 `Hello, Macro! My name is`，然后是带注解类型的名称。

此处使用的 `stringify!` 宏内置于 Rust 中。它接受一个 Rust 表达式，例如 `1 + 2`，并在编译时将表达式转换为字符串字面量，例如 `"1 + 2"`。这与 `format!` 或 `println!` 不同，后者是评估表达式然后将结果转换为 `String` 的宏。`#name` 输入可能是要按字面打印的表达式，因此我们使用 `stringify!`。使用 `stringify!` 还通过将 `#name` 在编译时转换为字符串字面量来节省分配。

此时，`cargo build` 应该在 `hello_macro` 和 `hello_macro_derive` 中成功完成。让我们将这些 crate 连接到清单 20-37 中的代码，看看过程宏的实际作用！使用 `cargo new pancakes` 在 _projects_ 目录中创建一个新的二进制项目。我们需要在 `pancakes` crate 的 _Cargo.toml_ 中添加 `hello_macro` 和 `hello_macro_derive` 作为依赖项。如果你将你的 `hello_macro` 和 `hello_macro_derive` 版本发布到 [crates.io](https://crates.io/)，它们将是常规依赖项；如果没有，你可以将它们指定为 `path` 依赖项，如下所示：

```toml
[dependencies]
hello_macro = { path = "../hello_macro" }
hello_macro_derive = { path = "../hello_macro/hello_macro_derive" }
```

将清单 20-37 中的代码放入 _src/main.rs_，并运行 `cargo run`：它应该打印 `Hello, Macro! My name is Pancakes!`。来自过程宏的 `HelloMacro` Trait 的实现被包括在内，`pancakes` crate 无需实现它；`#[derive(HelloMacro)]` 添加了 Trait 实现。

接下来，让我们探讨其他类型的过程宏与自定义 `derive` 宏的区别。

## 类属性宏

类属性宏类似于自定义 `derive` 宏，但不是为 `derive` 属性生成代码，它们允许你创建新属性。它们也更灵活：`derive` 仅适用于 struct 和 enum；属性也可以应用于其他项，例如函数。以下是使用类属性宏的示例。假设你有一个名为 `route` 的属性，在使用 Web 应用程序框架时注解函数：

```rust
#[route(GET, "/")]
fn index() {
```

这个 `#[route]` 属性将由框架定义为过程宏。宏定义函数的签名看起来像这样：

```rust
#[proc_macro_attribute]
pub fn route(attr: TokenStream, item: TokenStream) -> TokenStream {
```

在这里，我们有两个 `TokenStream` 类型的参数。第一个是属性内容：`GET, "/"` 部分。第二个是属性附加到的项的主体：在本例中是 `fn index() {}` 和函数的其余主体。

除此之外，类属性宏的工作方式与自定义 `derive` 宏相同：你创建一个带有 `proc-macro` crate 类型的 crate，并实现一个生成你想要代码的函数！

## 类函数宏

类函数宏定义看起来像函数调用的宏。类似于 `macro_rules!` 宏，它们比函数更灵活；例如，它们可以接受未知数量的参数。然而，`macro_rules!` 宏只能使用我们在前面的[用于通用元编程的声明式宏](#用于通用元编程的声明式宏)一节中讨论过的匹配式语法定义。类函数宏接受 `TokenStream` 参数，它们的定义使用该 `TokenStream` 进行操作，使用 Rust 代码，就像其他两种类型的过程宏一样。类函数宏的一个例子是可能像这样调用的 `sql!` 宏：

```rust
let sql = sql!(SELECT * FROM posts WHERE id=1);
```

此宏将解析其中的 SQL 语句，并检查它在语法上是否正确，这比 `macro_rules!` 宏可以做的处理要复杂得多。`sql!` 宏将定义如下：

```rust
#[proc_macro]
pub fn sql(input: TokenStream) -> TokenStream {
```

此定义类似于自定义 `derive` 宏的签名：我们接收括号内的 token，并返回我们想要生成的代码。

## 总结

唷！现在你的工具箱中有一些 Rust 特性，你可能不会经常使用，但你会知道它们在非常特定的情况下是可用的。我们介绍了一些复杂的主题，以便当你在错误消息建议中或在其他人的代码中遇到它们时，你能够识别这些概念和语法。将此章节作为参考来指导你找到解决方案。

接下来，我们将把我们在整本书中讨论的所有内容付诸实践，再做最后一个项目！

[ref]: https://doc.rust-lang.org/reference/macros-by-example.html
[tlborm]: https://veykril.github.io/tlborm/
[syn]: https://crates.io/crates/syn
[quote]: https://crates.io/crates/quote
[syn-docs]: https://docs.rs/syn/2.0/syn/struct.DeriveInput.html
[quote-docs]: https://docs.rs/quote
