---
title: 像常规引用一样对待智能指针
---

实现 `Deref` trait 允许你自定义 _解引用运算符_ `*` 的行为（不要与乘法或全局运算符混淆）。通过以智能指针可以像常规引用一样被对待的方式实现 `Deref`，你可以编写操作引用的代码，并将该代码与智能指针一起使用。

让我们首先看看解引用运算符如何与常规引用一起工作。然后，我们将尝试定义一个像 `Box<T>` 一样行为的自定义类型，并看看为什么解引用运算符在我们新定义的类型上不能像引用那样工作。我们将探讨实现 `Deref` trait 如何使智能指针能够以与引用类似的方式工作。然后，我们将查看 Rust 的解引用强制转换特性，以及它如何让我们处理引用或智能指针。

### 跟随引用访问值

常规引用是一种指针类型，思考指针的一种方式是作为指向存储在其他地方值的箭头。在清单 15-6 中，我们创建了一个指向 `i32` 值的引用，然后使用解引用运算符跟随引用访问该值。

**代码示例 15-6**：使用解引用运算符跟随引用访问 `i32` 值

```rust
fn main() {
    let x = 5;
    let y = &x;

    assert_eq!(5, x);
    assert_eq!(5, *y);
}
```

变量 `x` 保存 `i32` 值 `5`。我们将 `y` 设置为等于指向 `x` 的引用。我们可以断言 `x` 等于 `5`。然而，如果我们想对 `y` 中的值进行断言，我们必须使用 `*y` 来跟随引用指向它指向的值（因此， _解引用_ ），以便编译器可以比较实际值。一旦我们解引用 `y`，我们就可以访问 `y` 指向的整数值，我们可以将其与 `5` 进行比较。

如果我们尝试写成 `assert_eq!(5, y);`，我们会得到以下编译错误：

```console
$ cargo run
   Compiling deref-example v0.1.0 (file:///projects/deref-example)
error[E0277]: can't compare `{integer}` with `&{integer}`
 --> src/main.rs:6:5
  |
6 |     assert_eq!(5, y);
  |     ^^^^^^^^^^^^^^^^ no implementation for `{integer} == &{integer}`
  |
  = help: the trait `PartialEq<&{integer}>` is not implemented for `{integer}`
  = note: this error originates in the macro `assert_eq` (in Nightly builds, run with -Z macro-backtrace for more info)

For more information about this error, try `rustc --explain E0277`.
error: could not compile `deref-example` (bin "deref-example") due to 1 previous error
```

不允许比较数字和对数字的引用，因为它们是不同的类型。我们必须使用解引用运算符来跟随引用指向它指向的值。

### 像引用一样使用 `Box<T>`

我们可以重写清单 15-6 中的代码以使用 `Box<T>` 而不是引用；清单 15-7 中在 `Box<T>` 上使用的解引用运算符与清单 15-6 中在引用上使用的解引用运算符功能相同。

**代码示例 15-7**：在 `Box<i32>` 上使用解引用运算符

```rust
fn main() {
    let x = 5;
    let y = Box::new(x);

    assert_eq!(5, x);
    assert_eq!(5, *y);
}
```

清单 15-7 和清单 15-6 之间的主要区别是，这里我们将 `y` 设置为指向 `x` 的复制值的 box 实例，而不是指向 `x` 值的引用。在最后的断言中，我们可以使用解引用运算符跟随 box 的指针，就像我们之前使用 `y` 作为引用时一样。接下来，我们将探索 `Box<T>` 有什么特殊之处，使我们能够通过定义自己的 box 类型来使用解引用运算符。

### 定义我们自己的智能指针

让我们构建一个类似于标准库提供的 `Box<T>` 类型的包装器类型，以体验智能指针类型默认情况下如何与引用行为不同。然后，我们将看看如何添加使用解引用运算符的能力。

> 注意：我们即将构建的 `MyBox<T>` 类型与真正的 `Box<T>` 之间有一个很大的区别：我们的版本不会将其数据存储在堆上。我们在这个示例中专注于 `Deref`，因此数据实际存储在哪里比指针行为不那么重要。

`Box<T>` 类型最终定义为具有一个元素的元组结构体，因此清单 15-8 以相同的方式定义了 `MyBox<T>` 类型。我们还将定义一个 `new` 函数以匹配 `Box<T>` 上定义的 `new` 函数。

**代码示例 15-8**：定义 `MyBox<T>` 类型

```rust
struct MyBox<T>(T);

impl<T> MyBox<T> {
    fn new(x: T) -> MyBox<T> {
        MyBox(x)
    }
}

fn main() {}
```

我们定义了一个名为 `MyBox` 的结构体，并声明泛型参数 `T`，因为我们希望我们的类型能保存任何类型的值。`MyBox` 类型是一个具有类型 `T` 的单个元素的元组结构体。`MyBox::new` 函数接受类型 `T` 的一个参数，并返回一个保存传入值的 `MyBox` 实例。

让我们尝试将清单 15-7 中的 `main` 函数添加到清单 15-8，并将其更改为使用我们定义的 `MyBox<T>` 类型而不是 `Box<T>`。清单 15-9 中的代码将无法编译，因为 Rust 不知道如何解引用 `MyBox`。

**代码示例 15-9**：尝试以我们使用引用和 `Box<T>` 的方式使用 `MyBox<T>`

```rust
struct MyBox<T>(T);

impl<T> MyBox<T> {
    fn new(x: T) -> MyBox<T> {
        MyBox(x)
    }
}

fn main() {
    let x = 5;
    let y = MyBox::new(x);

    assert_eq!(5, x);
    assert_eq!(5, *y);
}
```

以下是产生的编译错误：

```console
$ cargo run
   Compiling deref-example v0.1.0 (file:///projects/deref-example)
error[E0614]: type `MyBox<{integer}>` cannot be dereferenced
  --> src/main.rs:14:19
   |
14 |     assert_eq!(5, *y);
   |                   ^^ can't be dereferenced

For more information about this error, try `rustc --explain E0614`.
error: could not compile `deref-example` (bin "deref-example") due to 1 previous error
```

我们的 `MyBox<T>` 类型无法被解引用，因为我们没有在该类型上实现这种能力。要使用 `*` 运算符启用解引用，我们实现 `Deref` trait。

### 实现 `Deref` Trait

正如在 ["在类型上实现 Trait"][impl-trait] 中讨论的，要实现 trait，我们需要提供 trait 必需方法的实现。标准库提供的 `Deref` trait 要求我们实现一个名为 `deref` 的方法，该方法借用 `self` 并返回对内部数据的引用。清单 15-10 包含了对 `MyBox<T>` 定义的 `Deref` 实现。

**代码示例 15-10**：在 `MyBox<T>` 上实现 `Deref`

```rust
use std::ops::Deref;

impl<T> Deref for MyBox<T> {
    type Target = T;

    fn deref(&self) -> &Self::Target {
        &self.0
    }
}

struct MyBox<T>(T);

impl<T> MyBox<T> {
    fn new(x: T) -> MyBox<T> {
        MyBox(x)
    }
}

fn main() {
    let x = 5;
    let y = MyBox::new(x);

    assert_eq!(5, x);
    assert_eq!(5, *y);
}
```

`type Target = T;` 语法为 `Deref` trait 定义了一个关联类型。关联类型是声明泛型参数的稍微不同的方式，但你现在不必担心它们；我们将在第20章中更详细地介绍它们。

我们用 `&self.0` 填充 `deref` 方法的主体，以便 `deref` 返回我们想要用 `*` 运算符访问的值的引用；回想一下在 ["使用元组结构体创建不同类型"][tuple-structs] 中，`.0` 访问元组结构体中的第一个值。清单 15-9 中在 `MyBox<T>` 值上调用 `*` 的 `main` 函数现在可以编译，断言通过！

没有 `Deref` trait，编译器只能解引用 `&` 引用。`deref` 方法使编译器能够获取任何实现 `Deref` 的类型的值，并调用 `deref` 方法来获取它知道如何解引用的引用。

当我们在清单 15-9 中输入 `*y` 时，Rust 实际上在幕后运行了这段代码：

```rust
*(y.deref())
```

Rust 将 `*` 运算符替换为对 `deref` 方法的调用，然后进行一次普通的解引用，这样我们就不必考虑是否需要调用 `deref` 方法。这个 Rust 特性让我们编写无论我们有常规引用还是实现 `Deref` 的类型都能相同工作的代码。

`deref` 方法返回对值的引用，并且 `*(y.deref())` 中括号外的普通解引用仍然是必要的，这与所有权系统有关。如果 `deref` 方法直接返回值而不是对值的引用，该值将从 `self` 中移出。在这种情况下或在大多数情况下使用解引用运算符时，我们不想取得 `MyBox<T>` 内部值的所有权。

注意，`*` 运算符被替换为对 `deref` 方法的调用，然后在我们每次在代码中使用 `*` 时只调用一次 `*` 运算符。因为 `*` 运算符的替换不会无限递归，我们最终得到 `i32` 类型的数据，这与清单 15-9 中 `assert_eq!` 中的 `5` 相匹配。

### 在函数和方法中使用解引用强制转换

_解引用强制转换_ 将对实现 `Deref` trait 的类型的引用转换为对另一种类型的引用。例如，解引用强制转换可以将 `&String` 转换为 `&str`，因为 `String` 实现了返回 `&str` 的 `Deref` trait。解引用强制转换是 Rust 对函数和方法参数执行的便利操作，它仅对实现 `Deref` trait 的类型有效。当我们将对特定类型值的引用作为参数传递给函数或方法，但该参数类型与函数或方法定义中的参数类型不匹配时，它会自动发生。对 `deref` 方法的一系列调用将我们提供的类型转换为参数需要的类型。

解引用强制转换被添加到 Rust 中，以便编写函数和方法调用的程序员不需要用 `&` 和 `*` 添加那么多显式的引用和解引用。解引用强制转换特性还让我们编写更多可以处理引用或智能指针的代码。

为了看到解引用强制转换的实际效果，让我们使用在清单 15-8 中定义的 `MyBox<T>` 类型以及在清单 15-10 中添加的 `Deref` 实现。清单 15-11 显示了一个具有字符串切片参数的函数定义。

**代码示例 15-11**：一个参数 `name` 类型为 `&str` 的 `hello` 函数

```rust
fn hello(name: &str) {
    println!("Hello, {name}!");
}

fn main() {}
```

我们可以用字符串切片作为参数调用 `hello` 函数，例如 `hello("Rust");`。解引用强制转换使得可以用 `MyBox<String>` 类型的值的引用调用 `hello`，如清单 15-12 所示。

**代码示例 15-12**：用 `MyBox<String>` 值的引用调用 `hello`，因为解引用强制转换而可以工作

```rust
use std::ops::Deref;

impl<T> Deref for MyBox<T> {
    type Target = T;

    fn deref(&self) -> &T {
        &self.0
    }
}

struct MyBox<T>(T);

impl<T> MyBox<T> {
    fn new(x: T) -> MyBox<T> {
        MyBox(x)
    }
}

fn hello(name: &str) {
    println!("Hello, {name}!");
}

fn main() {
    let m = MyBox::new(String::from("Rust"));
    hello(&m);
}
```

这里我们用参数 `&m` 调用 `hello` 函数，它是对 `MyBox<String>` 值的引用。因为我们在清单 15-10 中在 `MyBox<T>` 上实现了 `Deref` trait，Rust 可以通过调用 `deref` 将 `&MyBox<String>` 转换为 `&String`。标准库在 `String` 上提供了返回字符串切片的 `Deref` 实现，这在 `Deref` 的 API 文档中有说明。Rust 再次调用 `deref` 将 `&String` 转换为 `&str`，这与 `hello` 函数的定义匹配。

如果 Rust 没有实现解引用强制转换，我们就必须编写清单 15-13 中的代码而不是清单 15-12 中的代码来用 `&MyBox<String>` 类型的值调用 `hello`。

**代码示例 15-13**：如果 Rust 没有解引用强制转换，我们将不得不编写的代码

```rust
use std::ops::Deref;

impl<T> Deref for MyBox<T> {
    type Target = T;

    fn deref(&self) -> &T {
        &self.0
    }
}

struct MyBox<T>(T);

impl<T> MyBox<T> {
    fn new(x: T) -> MyBox<T> {
        MyBox(x)
    }
}

fn hello(name: &str) {
    println!("Hello, {name}!");
}

fn main() {
    let m = MyBox::new(String::from("Rust"));
    hello(&(*m)[..]);
}
```

`(*m)` 将 `MyBox<String>` 解引用为 `String`。然后，`&` 和 `[..]` 从 `String` 中取一个等于整个字符串的字符串切片，以匹配 `hello` 的签名。没有解引用强制转换的这段代码更难阅读、编写和理解，因为涉及到所有这些符号。解引用强制转换允许 Rust 为我们自动处理这些转换。

当为涉及的类型定义了 `Deref` trait 时，Rust 将分析类型并根据需要使用 `Deref::deref` 多次以获得与参数类型匹配的引用。`Deref::deref` 需要插入的次数在编译时解析，因此利用解引用强制转换没有运行时开销！

### 处理可变引用的解引用强制转换

类似于你如何使用 `Deref` trait 覆盖不可变引用上的 `*` 运算符，你可以使用 `DerefMut` trait 覆盖可变引用上的 `*` 运算符。

Rust 在找到类型和 trait 实现的三种情况下进行解引用强制转换：

1. 当 `T: Deref<Target=U>` 时，从 `&T` 到 `&U`
2. 当 `T: DerefMut<Target=U>` 时，从 `&mut T` 到 `&mut U`
3. 当 `T: Deref<Target=U>` 时，从 `&mut T` 到 `&U`

前两种情况相同，只是第二种实现了可变性。第一种情况指出，如果你有 `&T`，并且 `T` 实现 `Deref` 到某种类型 `U`，你可以透明地获得 `&U`。第二种情况指出，相同的解引用强制转换发生在可变引用上。

第三种情况更棘手：Rust 也会将可变引用强制转换为不可变引用。但反过来 _不能_ 做到：不可变引用永远不会强制转换为可变引用。因为借用规则，如果你有可变引用，该可变引用必须是该数据的唯一引用（否则，程序将无法编译）。将一个可变引用转换为一个不可变引用永远不会破坏借用规则。将不可变引用转换为可变引用需要初始不可变引用是该数据的唯一不可变引用，但借用规则不能保证这一点。因此，Rust 不能假设将不可变引用转换为可变引用是可能的。

[impl-trait]: /rust-book/ch10-02-traits/#在类型上实现-trait
[tuple-structs]: /rust-book/ch05-01-defining-structs/#使用元组结构体创建不同类型
