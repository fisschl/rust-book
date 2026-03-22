---
title: 20.2. 高级 Trait
---

我们首次在第 10 章的[使用 Trait 定义共享行为][traits]一节中介绍了 Trait，但没有讨论更高级的细节。现在你对 Rust 有了更多了解，我们可以深入了解本质细节了。

## 使用关联类型定义 Trait

**关联类型** 将类型占位符与 Trait 连接起来，使得 Trait 方法定义可以在其签名中使用这些占位符类型。Trait 的实现者将为特定实现指定要使用的具体类型，以替代占位符类型。这样，我们可以定义使用某些类型的 Trait，而无需确切知道这些类型是什么，直到 Trait 被实现。

我们在本章中描述的大多数高级功能很少需要。关联类型处于中间位置：它们比本书其余部分解释的功能使用得更少，但比本章讨论的许多其他功能使用得更频繁。

具有关联类型的 Trait 的一个例子是标准库提供的 `Iterator` Trait。关联类型名为 `Item`，代表实现 `Iterator` Trait 的类型正在迭代的值的类型。`Iterator` Trait 的定义如清单 20-13 所示。

**清单 20-13**：具有关联类型 `Item` 的 `Iterator` Trait 的定义

```rust
pub trait Iterator {
    type Item;

    fn next(&mut self) -> Option<Self::Item>;
}
```

类型 `Item` 是一个占位符，`next` 方法的定义显示它将返回类型为 `Option<Self::Item>` 的值。`Iterator` Trait 的实现者将为 `Item` 指定具体类型，`next` 方法将返回一个包含该具体类型值的 `Option`。

关联类型可能看起来类似于泛型的概念，因为后者允许我们在不指定它可以处理什么类型的情况下定义函数。为了检验这两个概念之间的区别，我们将查看在名为 `Counter` 的类型上对 `Iterator` Trait 的实现，该类型指定 `Item` 类型为 `u32`：

**文件名：src/lib.rs**

```rust
struct Counter {
    count: u32,
}

impl Counter {
    fn new() -> Counter {
        Counter { count: 0 }
    }
}

impl Iterator for Counter {
    type Item = u32;

    fn next(&mut self) -> Option<Self::Item> {
        if self.count < 5 {
            self.count += 1;
            Some(self.count)
        } else {
            None
        }
    }
}
```

此语法似乎与泛型相当。那么，为什么不直接使用泛型定义 `Iterator` Trait，如清单 20-14 所示？

**清单 20-14**：使用泛型的 `Iterator` Trait 的假设定义

```rust
pub trait Iterator<T> {
    fn next(&mut self) -> Option<T>;
}
```

区别在于，当使用泛型时，如在清单 20-14 中，我们必须在每个实现中标注类型；因为我们还可以实现 `Iterator<String> for Counter` 或任何其他类型，我们可以为 `Counter` 实现多个 `Iterator`。换句话说，当 Trait 具有泛型参数时，它可以为类型实现多次，每次更改泛型类型参数的具体类型。当我们在 `Counter` 上使用 `next` 方法时，我们必须提供类型注释来指示我们想要使用哪个 `Iterator` 实现。

使用关联类型，我们不需要注释类型，因为我们不能为类型多次实现 Trait。在清单 20-13 中使用关联类型的定义中，我们只能选择一次 `Item` 的类型，因为只能有一个 `impl Iterator for Counter`。我们不必在每次调用 `Counter` 上的 `next` 时都指定我们想要一个 `u32` 值的迭代器。

关联类型也成为 Trait 约定的一部分：Trait 的实现者必须提供一个类型来替代关联类型占位符。关联类型通常具有描述类型将如何使用的名称，在 API 文档中记录关联类型是一个好的做法。

## 使用默认泛型参数和运算符重载

当我们使用泛型类型参数时，我们可以为泛型类型指定默认的具体类型。这消除了 Trait 实现者在默认类型适用时指定具体类型的需要。在声明泛型类型时使用 `<PlaceholderType=ConcreteType>` 语法指定默认类型。

这种技术有用的一个很好的例子是 **运算符重载** ，在这种情况下，你可以自定义运算符（如 `+`）在特定情况下的行为。

Rust 不允许你创建自己的运算符或重载任意运算符。但你可以通过实现与运算符关联的 Trait 来重载 `std::ops` 中列出的操作和相应 Trait。例如，在清单 20-15 中，我们重载 `+` 运算符以将两个 `Point` 实例相加。我们通过在 `Point` struct 上实现 `Add` Trait 来做到这一点。

**清单 20-15**：实现 `Add` Trait 以重载 `+` 运算符来处理 `Point` 实例（文件名：src/main.rs）

```rust
use std::ops::Add;

#[derive(Debug, Copy, Clone, PartialEq)]
struct Point {
    x: i32,
    y: i32,
}

impl Add for Point {
    type Output = Point;

    fn add(self, other: Point) -> Point {
        Point {
            x: self.x + other.x,
            y: self.y + other.y,
        }
    }
}

fn main() {
    assert_eq!(
        Point { x: 1, y: 0 } + Point { x: 2, y: 3 },
        Point { x: 3, y: 3 }
    );
}
```

`add` 方法将两个 `Point` 实例的 `x` 值和两个 `Point` 实例的 `y` 值相加，以创建一个新的 `Point`。`Add` Trait 有一个名为 `Output` 的关联类型，它确定从 `add` 方法返回的类型。

此代码中的默认泛型类型位于 `Add` Trait 内。以下是其定义：

```rust
trait Add<Rhs=Self> {
    type Output;

    fn add(self, rhs: Rhs) -> Self::Output;
}
```

这段代码应该看起来很熟悉：一个具有一个方法和关联类型的 Trait。新部分是 `Rhs=Self`：这种语法称为 **默认类型参数** 。`Rhs` 泛型类型参数（"right-hand side" 的缩写）定义了 `add` 方法中 `rhs` 参数的类型。如果我们在实现 `Add` Trait 时没有为 `Rhs` 指定具体类型，`Rhs` 的类型将默认为 `Self`，即我们正在实现 `Add` 的类型。

当我们为 `Point` 实现 `Add` 时，我们使用了 `Rhs` 的默认值，因为我们想要添加两个 `Point` 实例。让我们看一个实现 `Add` Trait 的例子，其中我们想要自定义 `Rhs` 类型而不是使用默认值。

我们有两个 struct，`Millimeters` 和 `Meters`，以不同单位保存值。这种将现有类型包装在另一个 struct 中的薄包装称为 **newtype 模式** ，我们在[使用 Newtype 模式实现外部 Trait](#使用-newtype-模式实现外部-trait)一节中有更详细的描述。我们希望将毫米值加到米值上，并让 `Add` 的实现正确地进行转换。我们可以为 `Millimeters` 实现 `Add`，以 `Meters` 作为 `Rhs`，如清单 20-16 所示。

**清单 20-16**：在 `Millimeters` 上实现 `Add` Trait 以添加 `Millimeters` 和 `Meters`（文件名：src/lib.rs）

```rust
use std::ops::Add;

struct Millimeters(u32);
struct Meters(u32);

impl Add<Meters> for Millimeters {
    type Output = Millimeters;

    fn add(self, other: Meters) -> Millimeters {
        Millimeters(self.0 + (other.0 * 1000))
    }
}
```

要添加 `Millimeters` 和 `Meters`，我们指定 `impl Add<Meters>` 来设置 `Rhs` 类型参数的值，而不是使用 `Self` 的默认值。

你将在两个主要方面使用默认类型参数：

1. 在不破坏现有代码的情况下扩展类型
2. 允许在特定情况下进行定制，大多数用户不需要

标准库的 `Add` Trait 是第二个目的的一个例子：通常，你会添加两个相似类型，但 `Add` Trait 提供了超越该能力进行定制的可能性。在 `Add` Trait 定义中使用默认类型参数意味着你不必在大部分时间指定额外参数。换句话说，不需要一些实现样板代码，使 Trait 更易于使用。

第一个目的与第二个类似，但方向相反：如果你想向现有 Trait 添加类型参数，你可以给它一个默认值，以允许扩展 Trait 的功能，而不破坏现有实现代码。

## 消除同名方法的歧义

Rust 不会阻止 Trait 拥有与另一个 Trait 的方法同名的方法，也不会阻止你在一个类型上实现两个 Trait。还可以直接在类型上实现与 Trait 中的方法同名的方法。

在调用同名方法时，你需要告诉 Rust 你想使用哪一个。考虑清单 20-17 中的代码，我们定义了两个 Trait，`Pilot` 和 `Wizard`，它们都有一个名为 `fly` 的方法。然后我们在类型 `Human` 上实现这两个 Trait，该类型已经有一个直接在其上实现的名为 `fly` 的方法。每个 `fly` 方法执行不同的操作。

**清单 20-17**：两个 Trait 被定义为具有 `fly` 方法，并在 `Human` 类型上实现，并且直接在 `Human` 上实现 `fly` 方法。（文件名：src/main.rs）

```rust
trait Pilot {
    fn fly(&self);
}

trait Wizard {
    fn fly(&self);
}

struct Human;

impl Pilot for Human {
    fn fly(&self) {
        println!("This is your captain speaking.");
    }
}

impl Wizard for Human {
    fn fly(&self) {
        println!("Up!");
    }
}

impl Human {
    fn fly(&self) {
        println!("*waving arms furiously*");
    }
}

fn main() {}
```

当我们在 `Human` 实例上调用 `fly` 时，编译器默认调用直接在类型上实现的方法，如清单 20-18 所示。

**清单 20-18**：在 `Human` 实例上调用 `fly`（文件名：src/main.rs）

```rust
trait Pilot {
    fn fly(&self);
}

trait Wizard {
    fn fly(&self);
}

struct Human;

impl Pilot for Human {
    fn fly(&self) {
        println!("This is your captain speaking.");
    }
}

impl Wizard for Human {
    fn fly(&self) {
        println!("Up!");
    }
}

impl Human {
    fn fly(&self) {
        println!("*waving arms furiously*");
    }
}

fn main() {
    let person = Human;
    person.fly();
}
```

运行此代码将打印 `*waving arms furiously*`，表明 Rust 调用了直接在 `Human` 上实现的 `fly` 方法。

要调用来自 `Pilot` Trait 或 `Wizard` Trait 的 `fly` 方法，我们需要使用更明确的语法来指定我们指的是哪个 `fly` 方法。清单 20-19 演示了这种语法。

**清单 20-19**：指定我们想要调用哪个 Trait 的 `fly` 方法（文件名：src/main.rs）

```rust
trait Pilot {
    fn fly(&self);
}

trait Wizard {
    fn fly(&self);
}

struct Human;

impl Pilot for Human {
    fn fly(&self) {
        println!("This is your captain speaking.");
    }
}

impl Wizard for Human {
    fn fly(&self) {
        println!("Up!");
    }
}

impl Human {
    fn fly(&self) {
        println!("*waving arms furiously*");
    }
}

fn main() {
    let person = Human;
    Pilot::fly(&person);
    Wizard::fly(&person);
    person.fly();
}
```

在方法名之前指定 Trait 名可以澄清我们想要调用哪个 `fly` 实现给 Rust。我们也可以写 `Human::fly(&person)`，这等同于我们在清单 20-19 中使用的 `person.fly()`，但如果我们不需要消除歧义，这写起来有点长。

运行此代码打印以下内容：

```console
$ cargo run
   Compiling traits-example v0.1.0 (file:///projects/traits-example)
    Finished `dev` profile [unoptimized + debuginfo] target(s) in 0.46s
     Running `target/debug/traits-example`
This is your captain speaking.
Up!
*waving arms furiously*
```

因为 `fly` 方法接受 `self` 参数，如果我们有两个 **类型** 都实现一个 **Trait**，Rust 可以根据 `self` 的类型来推断使用哪个 Trait 实现。

然而，不是方法的关联函数没有 `self` 参数。当多个类型或 Trait 定义了具有相同函数名的非方法函数时，除非使用完全限定语法，否则 Rust 并不总是知道你指的是哪种类型。例如，在清单 20-20 中，我们为一个想要将所有小狗命名为 Spot 的动物收容所创建了一个 Trait。我们创建一个带有关联非方法函数 `baby_name` 的 `Animal` Trait。`Animal` Trait 在 struct `Dog` 上实现，我们也在其上直接提供一个关联非方法函数 `baby_name`。

**清单 20-20**：具有关联函数的 Trait 和具有同名关联函数并也实现该 Trait 的类型（文件名：src/main.rs）

```rust
trait Animal {
    fn baby_name() -> String;
}

struct Dog;

impl Dog {
    fn baby_name() -> String {
        String::from("Spot")
    }
}

impl Animal for Dog {
    fn baby_name() -> String {
        String::from("puppy")
    }
}

fn main() {
    println!("A baby dog is called a {}", Dog::baby_name());
}
```

我们在 `Dog` 上定义的 `baby_name` 关联函数中实现了将所有小狗命名为 Spot 的代码。`Dog` 类型还实现了 Trait `Animal`，它描述了所有动物都具有的特征。小狗被称为幼犬，这在我们为 `Dog` 实现 `Animal` Trait 的与 `Animal` Trait 关联的 `baby_name` 函数中表达。

在 `main` 中，我们调用 `Dog::baby_name` 函数，它直接调用在 `Dog` 上定义的关联函数。此代码打印以下内容：

```console
$ cargo run
   Compiling traits-example v0.1.0 (file:///projects/traits-example)
    Finished `dev` profile [unoptimized + debuginfo] target(s) in 0.54s
     Running `target/debug/traits-example`
A baby dog is called a Spot
```

此输出不是我们想要的。我们想要调用我们在 `Dog` 上实现的 `Animal` Trait 的 `baby_name` 函数，以便代码打印 `A baby dog is called a puppy`。我们在清单 20-19 中使用的指定 Trait 名的技术在这里没有帮助；如果我们把 `main` 改成清单 20-21 中的代码，我们将得到编译错误。

**清单 20-21**：尝试从 `Animal` Trait 调用 `baby_name` 函数，但 Rust 不知道使用哪个实现（文件名：src/main.rs）

```rust
trait Animal {
    fn baby_name() -> String;
}

struct Dog;

impl Dog {
    fn baby_name() -> String {
        String::from("Spot")
    }
}

impl Animal for Dog {
    fn baby_name() -> String {
        String::from("puppy")
    }
}

fn main() {
    println!("A baby dog is called a {}", Animal::baby_name());
}
```

因为 `Animal::baby_name` 没有 `self` 参数，并且可能有其他类型实现了 `Animal` Trait，Rust 无法确定我们想要哪个 `Animal::baby_name` 实现。我们会得到这个编译器错误：

```console
$ cargo run
   Compiling traits-example v0.1.0 (file:///projects/traits-example)
error[E0790]: cannot call associated function on trait without specifying the corresponding `impl` type
  --> src/main.rs:20:43
   |
 2 |     fn baby_name() -> String;
   |     ------------------------- `Animal::baby_name` defined here
...
 20 |     println!("A baby dog is called a {}", Animal::baby_name());
   |                                           ^^^^^^^^^^^^^^^^^^^ cannot call associated function of trait
   |
help: use the fully-qualified path to the only available implementation
   |
 20 |     println!("A baby dog is called a {}", <Dog as Animal>::baby_name());
   |                                           +++++++       +

For more information about this error, try `rustc --explain E0790`.
error: could not compile `traits-example` (bin "traits-example") due to 1 previous error
```

为了消除歧义并告诉 Rust 我们想要使用 `Dog` 的 `Animal` 实现，而不是其他类型的 `Animal` 实现，我们需要使用 **完全限定语法** 。清单 20-22 展示了如何使用完全限定语法。

**清单 20-22**：使用完全限定语法指定我们想要调用 `Animal` Trait 的 `baby_name` 函数，如为 `Dog` 实现的那样（文件名：src/main.rs）

```rust
trait Animal {
    fn baby_name() -> String;
}

struct Dog;

impl Dog {
    fn baby_name() -> String {
        String::from("Spot")
    }
}

impl Animal for Dog {
    fn baby_name() -> String {
        String::from("puppy")
    }
}

fn main() {
    println!("A baby dog is called a {}", <Dog as Animal>::baby_name());
}
```

我们为 Rust 提供尖括号内的类型注释，表明我们想要调用 `Animal` Trait 的 `baby_name` 方法，如为 `Dog` 实现的那样，通过说我们想要将此函数调用中的 `Dog` 类型视为 `Animal`。此代码现在将打印我们想要的：

```console
$ cargo run
   Compiling traits-example v0.1.0 (file:///projects/traits-example)
    Finished `dev` profile [unoptimized + debuginfo] target(s) in 0.48s
     Running `target/debug/traits-example`
A baby dog is called a puppy
```

一般来说，完全限定语法定义如下：

```rust
<Type as Trait>::function(receiver_if_method, next_arg, ...);
```

对于不是方法的关联函数，不会有 `receiver`：只会有其他参数列表。你可以在调用函数或方法的任何地方使用完全限定语法。但是，你可以省略 Rust 可以从程序中的其他信息推断出的此语法的任何部分。你只需要在有多个使用相同名称的实现且 Rust 需要帮助识别你想要调用哪个实现的情况下使用这种更详细的语法。

## 使用超 Trait

有时你可能会编写一个依赖于另一个 Trait 的 Trait 定义：为了让类型实现第一个 Trait，你希望要求该类型也实现第二个 Trait。你会这样做，以便你的 Trait 定义可以使用第二个 Trait 的关联项。你的 Trait 定义所依赖的 Trait 称为你的 Trait 的 **超 Trait** 。

例如，假设我们想要创建一个带有 `outline_print` 方法的 `OutlinePrint` Trait，该方法将打印一个给定值的格式化版本，使其被星号框住。也就是说，给定一个实现标准库 Trait `Display` 以产生 `(x, y)` 的 `Point` struct，当我们在 `x` 为 `1`、`y` 为 `3` 的 `Point` 实例上调用 `outline_print` 时，它应该打印以下内容：

```text
**********
*        *
* (1, 3) *
*        *
**********
```

在 `outline_print` 方法的实现中，我们想要使用 `Display` Trait 的功能。因此，我们需要指定 `OutlinePrint` Trait 只对也实现 `Display` 的类型有效，并提供 `OutlinePrint` 需要的功能。我们可以在 Trait 定义中通过指定 `OutlinePrint: Display` 来做到这一点。这种技术类似于向 Trait 添加 Trait bound。清单 20-23 展示了 `OutlinePrint` Trait 的实现。

**清单 20-23**：实现需要 `Display` 功能的 `OutlinePrint` Trait（文件名：src/main.rs）

```rust
use std::fmt;

trait OutlinePrint: fmt::Display {
    fn outline_print(&self) {
        let output = self.to_string();
        let len = output.len();
        println!("{}", "*".repeat(len + 4));
        println!("*{}", " ".repeat(len + 2));
        println!("* {output} *");
        println!("*{}", " ".repeat(len + 2));
        println!("{}", "*".repeat(len + 4));
    }
}

fn main() {}
```

因为我们已经指定 `OutlinePrint` 需要 `Display` Trait，我们可以使用自动为任何实现 `Display` 的类型实现的 `to_string` 函数。如果我们尝试在不添加冒号并在 Trait 名后指定 `Display` Trait 的情况下使用 `to_string`，我们会得到一个错误，说在当前作用域中没有找到名为 `to_string` 的方法，类型为 `&Self`。

让我们看看当我们尝试在不实现 `Display` 的类型上实现 `OutlinePrint` 时会发生什么，比如 `Point` struct：

**文件名：src/main.rs**

```rust
use std::fmt;

trait OutlinePrint: fmt::Display {
    fn outline_print(&self) {
        let output = self.to_string();
        let len = output.len();
        println!("{}", "*".repeat(len + 4));
        println!("*{}", " ".repeat(len + 2));
        println!("* {output} *");
        println!("*{}", " ".repeat(len + 2));
        println!("{}", "*".repeat(len + 4));
    }
}

struct Point {
    x: i32,
    y: i32,
}

impl OutlinePrint for Point {}

fn main() {
    let p = Point { x: 1, y: 3 };
    p.outline_print();
}
```

我们得到一个错误，说需要 `Display` 但未实现：

```console
$ cargo run
   Compiling traits-example v0.1.0 (file:///projects/traits-example)
error[E0277]: `Point` doesn't implement `std::fmt::Display`
  --> src/main.rs:20:23
   |
 20 | impl OutlinePrint for Point {}
   |                       ^^^^^ the trait `std::fmt::Display` is not implemented for `Point`
   |
note: required by a bound in `OutlinePrint`
   --> src/main.rs:3:21
    |
  3 | trait OutlinePrint: fmt::Display {
    |                     ^^^^^^^^^^^^ required by this bound in `OutlinePrint`

error[E0277]: `Point` doesn't implement `std::fmt::Display`
  --> src/main.rs:24:7
   |
 24 |     p.outline_print();
   |       ^^^^^^^^^^^^^ the trait `std::fmt::Display` is not implemented for `Point`
   |
note: required by a bound in `OutlinePrint::outline_print`
   --> src/main.rs:3:21
    |
  3 | trait OutlinePrint: fmt::Display {
    |                     ^^^^^^^^^^^^ required by this bound in `OutlinePrint::outline_print`
  4 |     fn outline_print(&self) {
    |        ------------- required by a bound in this associated function

For more information about this error, try `rustc --explain E0277`.
error: could not compile `traits-example` (bin "traits-example") due to 2 previous errors
```

为了修复这个问题，我们在 `Point` 上实现 `Display` 并满足 `OutlinePrint` 要求的约束，如下所示：

**文件名：src/main.rs**

```rust
trait OutlinePrint: fmt::Display {
    fn outline_print(&self) {
        let output = self.to_string();
        let len = output.len();
        println!("{}", "*".repeat(len + 4));
        println!("*{}", " ".repeat(len + 2));
        println!("* {output} *");
        println!("*{}", " ".repeat(len + 2));
        println!("{}", "*".repeat(len + 4));
    }
}

struct Point {
    x: i32,
    y: i32,
}

impl OutlinePrint for Point {}

use std::fmt;

impl fmt::Display for Point {
    fn fmt(&self, f: &mut fmt::Formatter) -> fmt::Result {
        write!(f, "({}, {})", self.x, self.y)
    }
}

fn main() {
    let p = Point { x: 1, y: 3 };
    p.outline_print();
}
```

然后，在 `Point` 上实现 `OutlinePrint` Trait 将成功编译，我们可以在 `Point` 实例上调用 `outline_print` 以在星号框中显示它。

## 使用 Newtype 模式实现外部 Trait

在第 10 章的[在类型上实现 Trait][implementing-a-trait-on-a-type]一节中，我们提到了孤儿规则，该规则规定只有当 Trait 或类型，或两者都在我们的 crate 中本地时，我们才允许在类型上实现 Trait。可以使用 newtype 模式绕过此限制，该模式涉及在元组 struct 中创建新类型。（我们在第 5 章的[使用元组 Struct 创建不同类型][tuple-structs]一节中介绍了元组 struct。）元组 struct 将有一个字段，并作为我们希望为其实现 Trait 的类型的薄包装。然后，包装器类型在我们的 crate 中是本地的，我们可以在包装器上实现 Trait。**Newtype** 是一个起源于 Haskell 编程语言的术语。使用此模式没有运行时性能损失，包装器类型在编译时被省略。

例如，假设我们想要在 `Vec<T>` 上实现 `Display`，孤儿规则阻止我们直接这样做，因为 `Display` Trait 和 `Vec<T>` 类型都在我们的 crate 之外定义。我们可以创建一个持有 `Vec<T>` 实例的 `Wrapper` struct；然后，我们可以在 `Wrapper` 上实现 `Display` 并使用 `Vec<T>` 值，如清单 20-24 所示。

**清单 20-24**：围绕 `Vec<String>` 创建 `Wrapper` 类型以实现 `Display`（文件名：src/main.rs）

```rust
use std::fmt;

struct Wrapper(Vec<String>);

impl fmt::Display for Wrapper {
    fn fmt(&self, f: &mut fmt::Formatter) -> fmt::Result {
        write!(f, "[{}]", self.0.join(", "))
    }
}

fn main() {
    let w = Wrapper(vec![String::from("hello"), String::from("world")]);
    println!("w = {w}");
}
```

`Display` 的实现使用 `self.0` 访问内部的 `Vec<T>`，因为 `Wrapper` 是元组 struct 且 `Vec<T>` 是元组中索引 0 处的项目。然后，我们可以在 `Wrapper` 上使用 `Display` Trait 的功能。

使用此技术的缺点是 `Wrapper` 是一个新类型，因此它没有它所持有的值的方法。我们必须在 `Wrapper` 上直接实现 `Vec<T>` 的所有方法，使得这些方法委托给 `self.0`，这将允许我们完全像对待 `Vec<T>` 一样对待 `Wrapper`。如果我们希望新类型具有内部类型的每个方法，在 `Wrapper` 上实现 `Deref` Trait 以返回内部类型将是一个解决方案（我们在第 15 章的[像常规引用一样对待智能指针][smart-pointer-deref]一节中讨论了实现 `Deref` Trait）。如果我们不希望 `Wrapper` 类型具有内部类型的所有方法——例如，为了限制 `Wrapper` 类型的行为——我们将不得不手动实现我们想要的方法。

即使不涉及 Trait，这种 newtype 模式也很有用。让我们转换焦点，看看与 Rust 类型系统交互的一些高级方法。

[traits]: /rust-book/ch10-02-traits
[implementing-a-trait-on-a-type]: /rust-book/ch10-02-traits#在类型上实现-trait
[tuple-structs]: /rust-book/ch05-01-defining-structs#使用元组-struct-创建不同类型
[smart-pointer-deref]: /rust-book/ch15-02-deref#像常规引用一样对待智能指针
