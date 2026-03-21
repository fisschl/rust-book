---
title: "方法语法"
---

## 方法

方法类似于函数：我们使用 `fn` 关键字和名称声明它们，它们可以有参数和返回值，并且它们包含在从其他地方调用方法时运行的代码。与函数不同，方法是在结构体（或枚举或 trait 对象）的上下文中定义的，我们将在 [第6章][enums] 和 [第18章][trait-objects] 中分别介绍，而且它们的第一个参数总是 `self`，它代表调用方法的该结构体的实例。

### 方法语法

让我们将具有 `Rectangle` 实例作为参数的 `area` 函数改为在 `Rectangle` 结构上定义的 `area` 方法，如代码清单 5-13 所示。

**文件名：`src/main.rs`**

```rust
#[derive(Debug)]
struct Rectangle {
    width: u32,
    height: u32,
}

impl Rectangle {
    fn area(&self) -> u32 {
        self.width * self.height
    }
}

fn main() {
    let rect1 = Rectangle {
        width: 30,
        height: 50,
    };

    println!(
        "The area of the rectangle is {} square pixels.",
        rect1.area()
    );
}
```

为了在 `Rectangle` 的上下文中定义函数，我们为 `Rectangle` 开始一个 `impl`（实现）块。此 `impl` 块内的所有内容都将与 `Rectangle` 类型相关联。然后，我们将 `area` 函数移入 `impl` 的大括号内，并将签名中（以及整个主体中）的第一个（在本例中也是唯一一个）参数更改为 `self`。在 `main` 中，我们调用 `area` 函数并传递 `rect1` 作为参数的地方，可以改为使用*方法语法*在我们的 `Rectangle` 实例上调用 `area` 方法。方法语法位于实例之后：我们添加一个点，然后是方法名、括号和任何参数。

在 `area` 的签名中，我们使用 `&self` 而不是 `rectangle: &Rectangle`。`&self` 实际上是 `self: &Self` 的简写。在 `impl` 块内，类型 `Self` 是 `impl` 块所对应类型的别名。方法的第一个参数必须具有名为 `self` 的 `Self` 类型参数，因此 Rust 允许你在第一个参数位置仅用名称 `self` 来简写。注意，我们仍然需要在 `self` 简写前使用 `&` 来表示此方法借用 `Self` 实例，就像我们在 `rectangle: &Rectangle` 中所做的一样。方法可以获取 `self` 的所有权，不可变地借用 `self`，就像我们这里所做的，或者可变地借用 `self`，就像它们可以处理任何其他参数一样。

我们在这里选择 `&self` 的原因与我们之前在函数版本中使用 `&Rectangle` 的原因相同：我们不想获取所有权，我们只想读取结构体中的数据，而不是写入它。如果我们想要更改我们调用该方法的实例作为方法的一部分，我们将使用 `&mut self` 作为第一个参数。通过仅使用 `self` 作为第一个参数来获取实例所有权的方法是很少见的；这种技术通常在方法将 `self` 转换为其他内容时使用，并且你希望在转换后阻止调用者使用原始实例。

使用方法而不是函数的主要原因，除了提供方法语法且不必在每个方法的签名中重复 `self` 的类型之外，是为了组织。我们将使用类型的实例可以做的所有事情都放在一个 `impl` 块中，而不是让我们在库的未来用户在我们提供的各个地方搜索 `Rectangle` 的功能。

请注意，我们可以选择与结构体的某个字段同名的方法。例如，我们可以在 `Rectangle` 上定义一个同样名为 `width` 的方法：

**文件名：`src/main.rs`**

```rust
#[derive(Debug)]
struct Rectangle {
    width: u32,
    height: u32,
}

impl Rectangle {
    fn width(&self) -> bool {
        self.width > 0
    }
}

fn main() {
    let rect1 = Rectangle {
        width: 30,
        height: 50,
    };

    if rect1.width() {
        println!("The rectangle has a nonzero width; it is {}", rect1.width);
    }
}
```

在这里，我们选择让 `width` 方法在实例的 `width` 字段的值大于 `0` 时返回 `true`，如果值为 `0` 则返回 `false`：我们可以在同名方法中将字段用于任何目的。在 `main` 中，当我们在 `rect1.width` 后面加上括号时，Rust 知道我们指的是 `width` 方法。当我们不使用括号时，Rust 知道我们指的是 `width` 字段。

通常但不总是，当我们给方法与字段同名时，我们希望它只返回字段中的值而不做其他事情。这类方法称为*getter*，Rust 不会像其他语言那样自动为结构体字段实现它们。getter 很有用，因为你可以将字段设为私有但将方法设为公共，从而作为类型的公共 API 的一部分启用对该字段的只读访问。我们将在 [第7章][public] 中讨论什么是公共和私有的，以及如何指定字段或方法是公共的还是私有的。

> ### `->` 运算符在哪里？
>
> 在 C 和 C++ 中，调用方法使用两种不同的运算符：如果你在对象上直接调用方法则使用 `.`，如果你在指向对象的指针上调用方法并需要先解引用指针则使用 `->`。换句话说，如果 `object` 是指针，那么 `object->something()` 类似于 `(*object).something()`。
>
> Rust 没有与 `->` 运算符等效的东西；相反，Rust 有一个称为*自动引用和解引用*的功能。调用方法是 Rust 中极少数具有这种行为的地方之一。
>
> 它是这样工作的：当你用 `object.something()` 调用方法时，Rust 会自动添加 `&`、`&mut` 或 `*`，使 `object` 与方法的签名匹配。换句话说，以下是相同的：
>
> ```rust
> # #[derive(Debug,Copy,Clone)]
> # struct Point {
> #     x: f64,
> #     y: f64,
> # }
> #
> # impl Point {
> #    fn distance(&self, other: &Point) -> f64 {
> #        let x_squared = f64::powi(other.x - self.x, 2);
> #        let y_squared = f64::powi(other.y - self.y, 2);
> #
> #        f64::sqrt(x_squared + y_squared)
> #    }
> # }
> # let p1 = Point { x: 0.0, y: 0.0 };
> # let p2 = Point { x: 5.0, y: 6.5 };
> p1.distance(&p2);
> (&p1).distance(&p2);
> ```
>
> 第一个看起来干净多了。这种自动引用行为有效是因为方法有一个明确的接收者——`self` 的类型。给定方法的接收者和名称，Rust 可以明确地确定方法是在读取 (`&self`)、修改 (`&mut self`) 还是消耗 (`self`)。Rust 使方法接收者的借用隐式化这一事实，是使所有权在实际使用中符合人体工程学的很大一部分原因。

### 带更多参数的方法

让我们通过在 `Rectangle` 结构上实现第二个方法来练习使用方法。这次我们希望 `Rectangle` 的实例接收另一个 `Rectangle` 实例，如果第二个 `Rectangle` 可以完全放入 `self`（第一个 `Rectangle`）中，则返回 `true`；否则应返回 `false`。也就是说，一旦我们定义了 `can_hold` 方法，我们希望能够编写如代码清单 5-14 所示的程序。

**文件名：`src/main.rs`**

```rust
fn main() {
    let rect1 = Rectangle {
        width: 30,
        height: 50,
    };
    let rect2 = Rectangle {
        width: 10,
        height: 40,
    };
    let rect3 = Rectangle {
        width: 60,
        height: 45,
    };

    println!("Can rect1 hold rect2? {}", rect1.can_hold(&rect2));
    println!("Can rect1 hold rect3? {}", rect1.can_hold(&rect3));
}
```

预期输出将如下所示，因为 `rect2` 的两个维度都小于 `rect1` 的维度，但 `rect3` 比 `rect1` 宽：

```text
Can rect1 hold rect2? true
Can rect1 hold rect3? false
```

我们知道我们想要定义一个方法，因此它将在 `impl Rectangle` 块内。方法名将是 `can_hold`，它将接收另一个 `Rectangle` 的不可变借用作为参数。我们可以通过查看调用方法的代码来确定参数的类型：`rect1.can_hold(&rect2)` 传入 `&rect2`，这是对 `rect2`（`Rectangle` 的实例）的不可变借用。这是有道理的，因为我们只需要读取 `rect2`（而不是写入，这意味着我们需要可变借用），而且我们希望 `main` 保留 `rect2` 的所有权，以便在调用 `can_hold` 方法后再次使用它。`can_hold` 的返回值将是一个布尔值，实现将检查 `self` 的宽度和高度是否分别大于另一个 `Rectangle` 的宽度和高度。让我们将新的 `can_hold` 方法添加到代码清单 5-13 的 `impl` 块中，如代码清单 5-15 所示。

**文件名：`src/main.rs`**

```rust
#[derive(Debug)]
struct Rectangle {
    width: u32,
    height: u32,
}

impl Rectangle {
    fn area(&self) -> u32 {
        self.width * self.height
    }

    fn can_hold(&self, other: &Rectangle) -> bool {
        self.width > other.width && self.height > other.height
    }
}

fn main() {
    let rect1 = Rectangle {
        width: 30,
        height: 50,
    };
    let rect2 = Rectangle {
        width: 10,
        height: 40,
    };
    let rect3 = Rectangle {
        width: 60,
        height: 45,
    };

    println!("Can rect1 hold rect2? {}", rect1.can_hold(&rect2));
    println!("Can rect1 hold rect3? {}", rect1.can_hold(&rect3));
}
```

当我们用代码清单 5-14 中的 `main` 函数运行此代码时，我们将获得期望的输出。方法可以带有我们添加到 `self` 参数之后的签名中的多个参数，这些参数的作用与函数中的参数一样。

### 关联函数

在 `impl` 块中定义的所有函数都称为*关联函数*，因为它们与 `impl` 后面的类型相关联。我们可以定义不以 `self` 作为其第一个参数的关联函数（因此不是方法），因为它们不需要类型的实例来工作。我们已经使用过这样的函数：`String::from` 函数，它在 `String` 类型上定义。

不是方法的关联函数通常用于返回结构体新实例的构造函数。这些通常称为 `new`，但 `new` 不是特殊名称，也不是内置在语言中的。例如，我们可以选择提供一个名为 `square` 的关联函数，它将有一个尺寸参数并将该值用作宽度和高度，从而更容易创建正方形 `Rectangle`，而不必指定相同的值两次：

**文件名：`src/main.rs`**

```rust
#[derive(Debug)]
struct Rectangle {
    width: u32,
    height: u32,
}

impl Rectangle {
    fn square(size: u32) -> Self {
        Self {
            width: size,
            height: size,
        }
    }
}

fn main() {
    let sq = Rectangle::square(3);
}
```

函数返回类型和函数体中的 `Self` 关键字是 `impl` 关键字后面类型的别名，在本例中是 `Rectangle`。

要调用此关联函数，我们使用带有结构体名称的 `::` 语法；`let sq = Rectangle::square(3);` 是一个例子。这个函数由结构体命名空间化：`::` 语法既用于关联函数也用于模块创建的命名空间。我们将在 [第7章][modules] 中讨论模块。

### 多个 `impl` 块

每个结构体允许有多个 `impl` 块。例如，代码清单 5-15 等同于代码清单 5-16 所示的代码，后者将每个方法放在自己的 `impl` 块中。

```rust
#[derive(Debug)]
struct Rectangle {
    width: u32,
    height: u32,
}

impl Rectangle {
    fn area(&self) -> u32 {
        self.width * self.height
    }
}

impl Rectangle {
    fn can_hold(&self, other: &Rectangle) -> bool {
        self.width > other.width && self.height > other.height
    }
}

fn main() {
    let rect1 = Rectangle {
        width: 30,
        height: 50,
    };
    let rect2 = Rectangle {
        width: 10,
        height: 40,
    };
    let rect3 = Rectangle {
        width: 60,
        height: 45,
    };

    println!("Can rect1 hold rect2? {}", rect1.can_hold(&rect2));
    println!("Can rect1 hold rect3? {}", rect1.can_hold(&rect3));
}
```

没有理由将这些方法分成多个 `impl` 块，但这是有效的语法。我们将在第10章中看到多个 `impl` 块有用的案例，届时我们会讨论泛型和 trait。

## 小结

结构体让你创建对你领域有意义的自定义类型。通过使用结构体，你可以将相关联的数据片段相互连接，并为每个片段命名，使你的代码清晰。在 `impl` 块中，你可以定义与类型相关联的函数，而方法是一种关联函数，让你指定结构体实例的行为。

但结构体并不是创建自定义类型的唯一方式：让我们转向 Rust 的枚举功能，为你的工具箱添加另一种工具。

[enums]: /rust-book/ch06-00-enums/
[trait-objects]: /rust-book/ch18-02-trait-objects/
[public]: /rust-book/ch07-03-paths-for-referring-to-an-item-in-the-module-tree/
[modules]: /rust-book/ch07-02-defining-modules-to-control-scope-and-privacy/
