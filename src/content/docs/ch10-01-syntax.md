---
title: 10.1. 泛型数据类型
---

我们使用泛型来为函数签名或结构体等项目创建定义，然后我们可以将其用于许多不同的具体数据类型。让我们首先看看如何使用泛型定义函数、结构体、枚举和方法。然后，我们将讨论泛型如何影响代码性能。

## 在函数定义中

当定义使用泛型的函数时，我们将泛型放在函数的签名中，通常我们在这里指定参数和返回值的数据类型。这样做使我们的代码更灵活，并为函数的调用者提供更多功能，同时防止代码重复。

继续使用我们的 `largest` 函数，代码示例 10-4 显示了两个都找到切片中最大值的函数。然后我们将这些组合成一个使用泛型的函数。

**代码示例 10-4：两个仅在名称和签名中的类型上不同的函数**

```rust
fn largest_i32(list: &[i32]) -> &i32 {
    let mut largest = &list[0];

    for item in list {
        if item > largest {
            largest = item;
        }
    }

    largest
}

fn largest_char(list: &[char]) -> &char {
    let mut largest = &list[0];

    for item in list {
        if item > largest {
            largest = item;
        }
    }

    largest
}

fn main() {
    let number_list = vec![34, 50, 25, 100, 65];

    let result = largest_i32(&number_list);
    println!("最大的数字是 {result}");

    let char_list = vec!['y', 'm', 'a', 'q'];

    let result = largest_char(&char_list);
    println!("最大的字符是 {result}");
}
```

`largest_i32` 函数是我们在代码示例 10-3 中提取的，用于找到切片中最大的 `i32`。`largest_char` 函数找到切片中最大的 `char`。函数体具有相同的代码，因此让我们通过在单个函数中引入泛型类型参数来消除重复。

为了在单个新函数中参数化类型，我们需要命名类型参数，就像我们对函数的值参数所做的那样。你可以使用任何标识符作为类型参数名称。但我们将使用 `T`，因为按照惯例，Rust 中的类型参数名称很短，通常只有一个字母，而且 Rust 的类型命名约定是 UpperCamelCase。`T` 是 _type_ 的缩写，是大多数 Rust 程序员的默认选择。

当我们在函数体中使用参数时，我们必须在签名中声明参数名称，以便编译器知道该名称的含义。类似地，当我们在函数签名中使用类型参数名称时，我们必须在使用它之前声明类型参数名称。为了定义泛型 `largest` 函数，我们将类型名称声明放在尖括号 `<>` 中，位于函数名称和参数列表之间，如下所示：

```rust
fn largest<T>(list: &[T]) -> &T {
```

我们读取这个定义为"函数 `largest` 对于某个类型 `T` 是泛型的"。这个函数有一个名为 `list` 的参数，它是类型 `T` 的值的切片。`largest` 函数将返回对相同类型 `T` 的值的引用。

代码示例 10-5 显示了使用其签名中的泛型数据类型的组合 `largest` 函数定义。清单还显示了我们如何使用切片 `i32` 值或 `char` 值调用该函数。请注意，此代码尚不能编译。

**代码示例 10-5：使用泛型类型参数的 `largest` 函数；这还不能编译**

```rust
fn largest<T>(list: &[T]) -> &T {
    let mut largest = &list[0];

    for item in list {
        if item > largest {
            largest = item;
        }
    }

    largest
}

fn main() {
    let number_list = vec![34, 50, 25, 100, 65];

    let result = largest(&number_list);
    println!("最大的数字是 {result}");

    let char_list = vec!['y', 'm', 'a', 'q'];

    let result = largest(&char_list);
    println!("最大的字符是 {result}");
}
```

如果我们现在编译此代码，我们会收到错误：

```console
$ cargo run
   Compiling chapter10 v0.1.0 (file:///projects/chapter10)
error[E0369]: binary operation `>` cannot be applied to type `&T`
 --> src/main.rs:5:17
  |
5 |         if item > largest {
  |            ---- ^ ------- &T
  |            |
  |            &T
  |
  = note: `>` is defined for `std::cmp::PartialOrd`
help: consider restricting type parameter `T`
  |
1 | fn largest<T: std::cmp::PartialOrd>(list: &[T]) -> &T {
  |          ++++++++++++++++++++++++

For more information about this error, try `rustc --explain E0369`.
error: could not compile `chapter10` (bin "chapter10") due to 1 previous error
```

帮助文本提到了 `std::cmp::PartialOrd`，这是一个 trait，我们将在下一节讨论 trait。现在，知道这个错误表明 `largest` 的函数体对于 `T` 可能代表的所有类型都不起作用。因为我们想在函数体中比较类型 `T` 的值，我们只能使用那些值可以排序的类型。为了启用比较，标准库有 `std::cmp::PartialOrd` trait，你可以在其上实现类型（有关此 trait 的更多信息，请参见附录 C）。为了修复代码示例 10-5，我们可以按照帮助文本的建议，将 `T` 的有效类型限制为仅实现 `PartialOrd` 的类型。然后清单将编译，因为标准库在 `i32` 和 `char` 上都实现了 `PartialOrd`。

## 在结构体定义中

我们还可以使用 `<>` 语法定义结构体，以在一个或多个字段中使用泛型类型参数。代码示例 10-6 定义了一个 `Point<T>` 结构体，用于保存任何类型的 `x` 和 `y` 坐标值。

**代码示例 10-6**：保存类型为 `T` 的 `x` 和 `y` 值的 `Point<T>` 结构体

```rust
struct Point<T> {
    x: T,
    y: T,
}

fn main() {
    let integer = Point { x: 5, y: 10 };
    let float = Point { x: 1.0, y: 4.0 };
}
```

在结构体定义中使用泛型的语法与函数定义中使用的类似。首先，我们在结构体名称后的尖括号内声明类型参数的名称。然后，我们在结构体定义中使用泛型类型，否则我们会指定具体数据类型。

请注意，因为我们只使用了一个泛型类型来定义 `Point<T>`，这个定义表示 `Point<T>` 结构体对于某个类型 `T` 是泛型的，字段 `x` 和 `y` 都 _是_ 相同的类型，无论该类型可能是什么。如果我们创建一个具有不同类型值的 `Point<T>` 实例，如代码示例 10-7 所示，我们的代码将无法编译。

**代码示例 10-7：字段 `x` 和 `y` 必须是相同的类型，因为它们都有相同的泛型数据类型 `T`**

```rust
struct Point<T> {
    x: T,
    y: T,
}

fn main() {
    let wont_work = Point { x: 5, y: 4.0 };
}
```

在这个例子中，当我们将整数值 `5` 赋给 `x` 时，我们让编译器知道泛型类型 `T` 对于这个 `Point<T>` 实例将是一个整数。然后，当我们为 `y` 指定 `4.0` 时，我们将 `y` 定义为与 `x` 具有相同的类型，我们会得到如下类型不匹配错误：

```console
$ cargo run
   Compiling chapter10 v0.1.0 (file:///projects/chapter10)
error[E0308]: mismatched types
 --> src/main.rs:7:38
  |
7 |     let wont_work = Point { x: 5, y: 4.0 };
  |                                      ^^^ expected integer, found floating-point number

For more information about this error, try `rustc --explain E0308`.
error: could not compile `chapter10` (bin "chapter10") due to 1 previous error
```

要定义一个 `x` 和 `y` 都是泛型但可以具有不同类型的 `Point` 结构体，我们可以使用多个泛型类型参数。例如，在代码示例 10-8 中，我们将 `Point` 的定义更改为对类型 `T` 和 `U` 是泛型的，其中 `x` 是类型 `T`，`y` 是类型 `U`。

**代码示例 10-8**：对两种类型泛型的 `Point<T, U>`，以便 `x` 和 `y` 可以是不同类型的值

```rust
struct Point<T, U> {
    x: T,
    y: U,
}

fn main() {
    let both_integer = Point { x: 5, y: 10 };
    let both_float = Point { x: 1.0, y: 4.0 };
    let integer_and_float = Point { x: 5, y: 4.0 };
}
```

现在显示的 `Point` 的所有实例都是允许的！你可以在定义中使用任意多的泛型类型参数，但使用超过几个会使你的代码难以阅读。如果你发现你的代码中需要很多泛型类型，这可能表明你的代码需要重构为更小的部分。

## 在枚举定义中

正如我们对结构体所做的那样，我们可以定义枚举在其变体中保存泛型数据类型。让我们再看一下标准库提供的 `Option<T>` 枚举，我们在第 6 章中使用过：

```rust
enum Option<T> {
    Some(T),
    None,
}
```

这个定义现在对你来说应该更有意义了。正如你所看到的，`Option<T>` 枚举对于类型 `T` 是泛型的，并且有两个变体：`Some`，它持有一个类型 `T` 的值，和一个不持有任何值的 `None` 变体。通过使用 `Option<T>` 枚举，我们可以表达可选值的抽象概念，而且因为 `Option<T>` 是泛型的，无论可选值的类型是什么，我们都可以使用这种抽象。

枚举也可以使用多个泛型类型。我们在第 9 章使用的 `Result` 枚举的定义就是一个例子：

```rust
enum Result<T, E> {
    Ok(T),
    Err(E),
}
```

`Result` 枚举对于两种类型 `T` 和 `E` 是泛型的，有两个变体：`Ok`，它持有一个类型 `T` 的值，和 `Err`，它持有一个类型 `E` 的值。这个定义使我们可以方便地在任何操作可能成功（返回某个类型 `T` 的值）或失败（返回某种类型 `E` 的错误）的地方使用 `Result` 枚举。事实上，这正是我们在代码示例 9-3 中用来打开文件的方式，当文件成功打开时 `T` 被填充为类型 `std::fs::File`，当打开文件有问题时 `E` 被填充为类型 `std::io::Error`。

当你识别代码中具有多个仅在它们持有的值类型上不同的结构体或枚举定义的情况时，你可以通过使用泛型类型来避免重复。

## 在方法定义中

我们可以在结构体和枚举上实现方法（如我们在第 5 章所做的那样），并在它们的定义中也使用泛型类型。代码示例 10-9 显示了我们在代码示例 10-6 中定义的 `Point<T>` 结构体，其实现了一个名为 `x` 的方法。

**代码示例 10-9**：在 `Point<T>` 结构体上实现一个名为 `x` 的方法，该方法将返回对类型为 `T` 的 `x` 字段的引用

```rust
struct Point<T> {
    x: T,
    y: T,
}

impl<T> Point<T> {
    fn x(&self) -> &T {
        &self.x
    }
}

fn main() {
    let p = Point { x: 5, y: 10 };

    println!("p.x = {}", p.x());
}
```

在这里，我们在 `Point<T>` 上定义了一个名为 `x` 的方法，它返回对字段 `x` 中数据的引用。

请注意，我们必须在 `impl` 之后声明 `T`，以便我们可以使用 `T` 来指定我们正在类型 `Point<T>` 上实现方法。通过在 `impl` 之后将 `T` 声明为泛型类型，Rust 可以识别 `Point` 中尖括号中的类型是泛型类型而不是具体类型。我们可以为这个泛型参数选择与结构体定义中声明的泛型参数不同的名称，但使用相同的名称是惯例。如果你在声明泛型类型的 `impl` 中编写方法，该方法将定义在类型的任何实例上，无论用什么具体类型最终替代泛型类型。

在类型上定义方法时，我们还可以指定对泛型类型的约束。例如，我们可以只在 `Point<f32>` 实例上实现方法，而不是在具有任何泛型类型的 `Point<T>` 实例上。在代码示例 10-10 中，我们使用具体类型 `f32`，这意味着我们在 `impl` 之后不声明任何类型。

**代码示例 10-10：仅适用于泛型类型参数 `T` 具有特定具体类型的结构体的 `impl` 块**

```rust
impl Point<f32> {
    fn distance_from_origin(&self) -> f32 {
        (self.x.powi(2) + self.y.powi(2)).sqrt()
    }
}
```

这段代码意味着类型 `Point<f32>` 将有一个 `distance_from_origin` 方法；`T` 不是 `f32` 类型的 `Point<T>` 的其他实例将没有定义此方法。该方法测量我们的点距离坐标 (0.0, 0.0) 的点有多远，并使用仅适用于浮点类型的数学运算。

结构体定义中的泛型类型参数并不总是与你在同一结构体的方法签名中使用的相同。代码示例 10-11 使用泛型类型 `X1` 和 `Y1` 表示 `Point` 结构体，使用 `X2` 和 `Y2` 表示 `mixup` 方法签名，以使示例更清晰。该方法创建一个新的 `Point` 实例，其中 `x` 值来自 `self` `Point`（类型为 `X1`），`y` 值来自传入的 `Point`（类型为 `Y2`）。

**代码示例 10-11：使用与其结构体定义不同的泛型类型的方法**

```rust
struct Point<X1, Y1> {
    x: X1,
    y: Y1,
}

impl<X1, Y1> Point<X1, Y1> {
    fn mixup<X2, Y2>(self, other: Point<X2, Y2>) -> Point<X1, Y2> {
        Point {
            x: self.x,
            y: other.y,
        }
    }
}

fn main() {
    let p1 = Point { x: 5, y: 10.4 };
    let p2 = Point { x: "Hello", y: 'c' };

    let p3 = p1.mixup(p2);

    println!("p3.x = {}, p3.y = {}", p3.x, p3.y);
}
```

在 `main` 中，我们定义了一个 `Point`，其 `x` 为 `i32`（值为 `5`），`y` 为 `f64`（值为 `10.4`）。`p2` 变量是一个 `Point` 结构体，其 `x` 为字符串切片（值为 `"Hello"`），`y` 为 `char`（值为 `'c'`）。在 `p1` 上调用 `mixup` 并以 `p2` 作为参数，得到 `p3`，它将有一个 `i32` 作为 `x`，因为 `x` 来自 `p1`。`p3` 变量将有一个 `char` 作为 `y`，因为 `y` 来自 `p2`。`println!` 宏调用将打印 `p3.x = 5, p3.y = c`。

这个例子的目的是演示一些泛型参数在 `impl` 中声明而一些在方法定义中声明的情况。这里，泛型参数 `X1` 和 `Y1` 在 `impl` 之后声明，因为它们与结构体定义一起。泛型参数 `X2` 和 `Y2` 在 `fn mixup` 之后声明，因为它们仅与方法相关。

## 使用泛型的代码性能

你可能想知道使用泛型类型参数是否有运行时成本。好消息是，使用泛型类型不会使你的程序比使用具体类型运行得更慢。

Rust 通过在编译时对使用泛型的代码执行单态化来实现这一点。 _单态化_ 是通过填充编译时使用的具体类型将泛型代码转换为特定代码的过程。在这个过程中，编译器执行与我们用于在代码示例 10-5 中创建泛型函数的步骤相反的步骤：编译器查看调用泛型代码的所有地方，并为调用泛型代码的具体类型生成代码。

让我们通过使用标准库的泛型 `Option<T>` 枚举来看看这是如何工作的：

```rust
let integer = Some(5);
let float = Some(5.0);
```

当 Rust 编译此代码时，它执行单态化。在此过程中，编译器读取已在 `Option<T>` 实例中使用的值，并识别出两种 `Option<T>`：一种是 `i32`，另一种是 `f64`。因此，它将 `Option<T>` 的泛型定义扩展为专门针对 `i32` 和 `f64` 的两个定义，从而用特定定义替换泛型定义。

单态化版本的代码看起来类似于以下内容（编译器使用与我们在这里用于说明的不同名称）：

```rust
enum Option_i32 {
    Some(i32),
    None,
}

enum Option_f64 {
    Some(f64),
    None,
}

fn main() {
    let integer = Option_i32::Some(5);
    let float = Option_f64::Some(5.0);
}
```

泛型 `Option<T>` 被编译器创建的特定定义替换。因为 Rust 将泛型代码编译为在每个实例中指定类型的代码，我们使用泛型不会付出运行时成本。当代码运行时，它的表现就像我们手动重复每个定义一样。单态化过程使 Rust 的泛型在运行时极其高效。
