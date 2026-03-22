---
title: 18.2. 使用 Trait 对象来抽象共享行为
---

在第 8 章中，我们提到向量的一个限制是它们只能存储单一类型的元素。我们在清单 8-9 中创建了一个变通方案，定义了一个 `SpreadsheetCell` enum，它有用于保存整数、浮点数和文本的变体。这意味着我们可以在每个单元格中存储不同类型的数据，同时仍然拥有一个代表一行单元格的向量。当我们的可互换项目是一个在编译代码时我们就知道的固定类型集合时，这是一个完全好的解决方案。

然而，有时我们希望库用户能够扩展在特定情况下有效的类型集合。为了展示我们如何实现这一点，我们将创建一个图形用户界面（GUI）工具示例，它遍历一个项目列表，在每个项目上调用 `draw` 方法将其绘制到屏幕上——这是 GUI 工具的常用技术。我们将创建一个名为 `gui` 的库 crate，其中包含 GUI 库的结构。这个 crate 可能包含一些供人们使用的类型，例如 `Button` 或 `TextField`。此外，`gui` 用户还将希望创建他们自己的可绘制类型：例如，一位程序员可能会添加一个 `Image`，另一位可能会添加一个 `SelectBox`。

在编写库的时候，我们无法知道和定义其他程序员可能想要创建的所有类型。但我们知道 `gui` 需要跟踪许多不同类型的值，并且需要在这些不同类型的值上调用 `draw` 方法。它不需要确切知道当我们调用 `draw` 方法时会发生什么，只需要知道该值会有这个方法供我们调用即可。

在有继承的语言中，我们可能会定义一个名为 `Component` 的类，它上面有一个名为 `draw` 的方法。其他类，如 `Button`、`Image` 和 `SelectBox`，将继承自 `Component` 从而继承 `draw` 方法。它们可以各自覆盖 `draw` 方法来定义它们自定义的行为，但框架可以将所有类型都视为 `Component` 实例并在其上调用 `draw`。但由于 Rust 没有继承，我们需要另一种方式来构建 `gui` 库，以允许用户创建与库兼容的新类型。

## 为公共行为定义 Trait

为了实现我们希望 `gui` 具有的行为，我们将定义一个名为 `Draw` 的 trait，它将有一个名为 `draw` 的方法。然后，我们可以定义一个接受 trait 对象的向量。**trait 对象** 指向一个实现我们指定 trait 的类型实例，以及一个用于在运行时查找该类型上 trait 方法的表。我们通过指定某种指针（如引用或 `Box<T>` 智能指针），然后使用 `dyn` 关键字，再指定相关 trait 来创建 trait 对象。（我们将在第 20 章的[动态大小类型和 `Sized` trait][dynamically-sized]一节中讨论 trait 对象必须使用指针的原因。）我们可以在泛型或具体类型的位置使用 trait 对象。无论我们在哪里使用 trait 对象，Rust 的类型系统都会在编译时确保在该上下文中使用的任何值都实现 trait 对象的 trait。因此，我们不需要在编译时知道所有可能的类型。

我们提到过，在 Rust 中，我们不将 struct 和 enum 称为"对象"以将它们与其他语言的对象区分开来。在 struct 或 enum 中，struct 字段中的数据与 `impl` 块中的行为是分离的，而在其他语言中，数据和行为组合成一个概念通常被称为对象。trait 对象与其他语言中的对象不同，因为我们不能向 trait 对象添加数据。trait 对象不像其他语言中的对象那样普遍有用：它们的特定目的是允许对公共行为进行抽象。

清单 18-3 展示了如何定义一个名为 `Draw` 的 trait，它有一个名为 `draw` 的方法。

**清单 18-3**：`Draw` trait 的定义（文件名：*src/lib.rs*）

```rust
pub trait Draw {
    fn draw(&self);
}
```

这个语法应该看起来很熟悉，来自我们在第 10 章关于如何定义 trait 的讨论。接下来是一些新语法：清单 18-4 定义了一个名为 `Screen` 的 struct，它持有一个名为 `components` 的向量。这个向量的类型是 `Box<dyn Draw>`，这是一个 trait 对象；它是 `Box` 内部任何实现 `Draw` trait 的类型的替身。

**清单 18-4**：带有 `components` 字段的 `Screen` struct 定义，该字段持有实现 `Draw` trait 的 trait 对象向量（文件名：*src/lib.rs*）

```rust
pub struct Screen {
    pub components: Vec<Box<dyn Draw>>,
}
```

在 `Screen` struct 上，我们将定义一个名为 `run` 的方法，它将在其每个 `components` 上调用 `draw` 方法，如清单 18-5 所示。

**清单 18-5**：在 `Screen` 上的 `run` 方法，在每个组件上调用 `draw` 方法（文件名：*src/lib.rs*）

```rust
impl Screen {
    pub fn run(&self) {
        for component in self.components.iter() {
            component.draw();
        }
    }
}
```

这与定义一个使用带 trait bound 的泛型类型参数的 struct 不同。泛型类型参数一次只能被一种具体类型替代，而 trait 对象允许在运行时用多种具体类型来填充 trait 对象。例如，我们可以使用泛型类型和 trait bound 来定义 `Screen` struct，如清单 18-6 所示。

**清单 18-6**：使用泛型和 trait bound 的 `Screen` struct 及其 `run` 方法的替代实现（文件名：*src/lib.rs*）

```rust
pub struct Screen<T: Draw> {
    pub components: Vec<T>,
}

impl<T> Screen<T>
where
    T: Draw,
{
    pub fn run(&self) {
        for component in self.components.iter() {
            component.draw();
        }
    }
}
```

这限制我们只能使用组件列表全为 `Button` 类型或全为 `TextField` 类型的 `Screen` 实例。如果你只会有同构集合，使用泛型和 trait bound 是更可取的，因为定义将在编译时被单态化为使用具体类型。

另一方面，使用 trait 对象的方法，一个 `Screen` 实例可以持有一个包含 `Box<Button>` 以及 `Box<TextField>` 的 `Vec<T>`。让我们看看这是如何工作的，然后我们将讨论运行时性能的影响。

## 实现 Trait

现在我们将添加一些实现 `Draw` trait 的类型。我们将提供 `Button` 类型。同样，实际实现 GUI 库超出了本书的范围，所以 `draw` 方法在其主体中不会有任何有用的实现。为了想象实现可能是什么样子，一个 `Button` struct 可能有 `width`、`height` 和 `label` 字段，如清单 18-7 所示。

**清单 18-7**：实现 `Draw` trait 的 `Button` struct（文件名：*src/lib.rs*）

```rust
pub struct Button {
    pub width: u32,
    pub height: u32,
    pub label: String,
}

impl Draw for Button {
    fn draw(&self) {
        // 实际绘制按钮的代码
    }
}
```

`Button` 上的 `width`、`height` 和 `label` 字段将与其他组件上的字段不同；例如，一个 `TextField` 类型可能有这些相同的字段加上一个 `placeholder` 字段。我们希望在屏幕上绘制的每种类型都将实现 `Draw` trait，但将在 `draw` 方法中使用不同的代码来定义如何绘制该特定类型，如 `Button` 这里所示（没有实际的 GUI 代码，如前所述）。例如，`Button` 类型可能有一个额外的 `impl` 块，包含与用户点击按钮时发生什么相关的方法。这些方法不适用于像 `TextField` 这样的类型。

如果使用我们库的某人决定实现一个具有 `width`、`height` 和 `options` 字段的 `SelectBox` struct，他们也会为 `SelectBox` 类型实现 `Draw` trait，如清单 18-8 所示。

**清单 18-8**：另一个 crate 使用 `gui` 并在 `SelectBox` struct 上实现 `Draw` trait（文件名：*src/main.rs*）

```rust
use gui::Draw;

struct SelectBox {
    width: u32,
    height: u32,
    options: Vec<String>,
}

impl Draw for SelectBox {
    fn draw(&self) {
        // 实际绘制选择框的代码
    }
}
```

我们库的用户现在可以编写他们的 `main` 函数来创建一个 `Screen` 实例。对于 `Screen` 实例，他们可以通过将每个放在 `Box<T>` 中使其成为 trait 对象来添加 `SelectBox` 和 `Button`。然后他们可以在 `Screen` 实例上调用 `run` 方法，这将在每个组件上调用 `draw`。清单 18-9 展示了这种实现。

**清单 18-9**：使用 trait 对象来存储实现相同 trait 的不同类型的值（文件名：*src/main.rs*）

```rust
use gui::{Button, Screen};

fn main() {
    let screen = Screen {
        components: vec![
            Box::new(SelectBox {
                width: 75,
                height: 10,
                options: vec![
                    String::from("Yes"),
                    String::from("Maybe"),
                    String::from("No"),
                ],
            }),
            Box::new(Button {
                width: 50,
                height: 10,
                label: String::from("OK"),
            }),
        ],
    };

    screen.run();
}
```

当我们编写库时，我们不知道有人可能会添加 `SelectBox` 类型，但我们的 `Screen` 实现能够操作这个新类型并绘制它，因为 `SelectBox` 实现了 `Draw` trait，这意味着它实现了 `draw` 方法。

这个概念——只关心值响应的消息而不是值的具体类型——类似于动态类型语言中 **鸭子类型** 的概念：如果它走路像鸭子，叫声像鸭子，那它一定是只鸭子！在清单 18-5 中 `Screen` 的 `run` 实现中，`run` 不需要知道每个组件的具体类型是什么。它不需要检查组件是否是 `Button` 或 `SelectBox` 的实例，它只需在组件上调用 `draw` 方法。通过将 `components` 向量中的值类型指定为 `Box<dyn Draw>`，我们定义了 `Screen` 需要可以调用其 `draw` 方法的值。

使用 trait 对象和 Rust 类型系统来编写类似于使用鸭子类型的代码的优势在于，我们永远不需要在运行时检查值是否实现了特定方法，或者担心如果值没有实现方法但我们调用了它而产生错误。如果值没有实现 trait 对象需要的 trait，Rust 就不会编译我们的代码。

例如，清单 18-10 展示了如果我们尝试用 `String` 作为组件创建 `Screen` 会发生什么。

**清单 18-10**：尝试使用一个没有实现 trait 对象 trait 的类型（文件名：*src/main.rs*）

```rust
use gui::Screen;

fn main() {
    let screen = Screen {
        components: vec![Box::new(String::from("Hi"))],
    };

    screen.run();
}
```

我们会得到这个错误，因为 `String` 没有实现 `Draw` trait：

```console
$ cargo run
   Compiling gui v0.1.0 (file:///projects/gui)
error[E0277]: the trait bound `String: Draw` is not satisfied
 --> src/main.rs:5:26
  |
5 |         components: vec![Box::new(String::from("Hi"))],
  |                          ^^^^^^^^^^^^^^^^^^^^^^^^^^^^ the trait `Draw` is not implemented for `String`
  |
  = help: the trait `Draw` is implemented for `Button`
  = note: required for the cast from `Box<String>` to `Box<dyn Draw>`

For more information about this error, try `rustc --explain E0277`.
error: could not compile `gui` (bin "gui") due to 1 previous error
```

这个错误让我们知道，要么我们传递了一些我们本意不想传递给 `Screen` 的东西，所以我们应该传递不同的类型，要么我们应该在 `String` 上实现 `Draw`，以便 `Screen` 能够在其上调用 `draw`。

## 执行动态分发

回想一下第 10 章[使用泛型的代码性能][performance-of-code-using-generics]一节中我们对编译器对泛型执行的 **单态化** 过程的讨论：编译器为我们用作泛型类型参数替代品的每种具体类型生成函数和方法的非泛型实现。单态化产生的代码执行的是 **静态分发** ，即编译器在编译时知道你正在调用哪个方法。这与 **动态分发** 相反，即编译器在编译时无法判断你正在调用哪个方法。在动态分发的情况下，编译器会发出在运行时知道要调用哪个方法的代码。

当我们使用 trait 对象时，Rust 必须使用动态分发。编译器不知道可能用于使用 trait 对象的代码的所有类型，所以它不知道要在哪个类型上调用哪个方法实现。相反，在运行时，Rust 使用 trait 对象内部的指针来知道要调用哪个方法。这种查找会产生静态分发不会产生的运行时成本。动态分发还阻止编译器选择内联方法代码，从而阻止一些优化，Rust 有关于你能在哪里和不能在哪里使用动态分发的规则，称为 **dyn 兼容性** 。这些规则超出了本次讨论的范围，但你可以在[参考文档][dyn-compatibility]中阅读更多关于它们的内容。然而，我们在清单 18-5 编写的代码中确实获得了额外的灵活性，并能够在清单 18-9 中支持，所以这是一个需要考虑的权衡。

[performance-of-code-using-generics]: /rust-book/ch10-01-syntax#使用泛型的代码性能
[dynamically-sized]: /rust-book/ch20-03-advanced-types#动态大小类型和-sized-trait
[dyn-compatibility]: https://doc.rust-lang.org/reference/items/traits.html#dyn-compatibility
