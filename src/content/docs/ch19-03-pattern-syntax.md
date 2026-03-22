---
title: 19.3. 模式语法
---

在本节中，我们收集模式中有效的所有语法，并讨论为什么以及何时你可能想使用每一种。

## 匹配字面值

如你在第 6 章中所见，你可以直接将模式与字面值进行匹配。以下代码给出了一些示例：

```rust
fn main() {
    let x = 1;

    match x {
        1 => println!("one"),
        2 => println!("two"),
        3 => println!("three"),
        _ => println!("anything"),
    }
}
```

这段代码打印 `one`，因为 `x` 中的值是 `1`。当你希望你的代码在获得特定的具体值时采取行动时，这种语法很有用。

## 匹配命名变量

命名变量是无可辩驳的模式，可以匹配任何值，我们在本书中已经多次使用它们。然而，当你在 `match`、`if let` 或 `while let` 表达式中使用命名变量时，有一个复杂之处。因为每种表达式都开始一个新的范围，所以在这些表达式中作为模式的一部分声明的变量会遮蔽这些构造之外的同名变量，就像所有变量一样。在清单 19-11 中，我们声明了一个名为 `x` 的变量，其值为 `Some(5)`，以及一个变量 `y`，其值为 `10`。然后我们创建一个对值 `x` 的 `match` 表达式。查看 match 分支中的模式和末尾的 `println!`，并尝试在运行此代码或进一步阅读之前弄清楚代码将打印什么。

**清单 19-11**：一个 `match` 表达式，其中一个分支引入了一个遮蔽现有变量 `y` 的新变量（文件名：*src/main.rs*）

```rust
fn main() {
    let x = Some(5);
    let y = 10;

    match x {
        Some(50) => println!("Got 50"),
        Some(y) => println!("Matched, y = {y}"),
        _ => println!("Default case, x = {x:?}"),
    }

    println!("at the end: x = {x:?}, y = {y}");
}
```

让我们逐步了解 `match` 表达式运行时会发生什么。第一个 match 分支中的模式与 `x` 的定义值不匹配，因此代码继续执行。

第二个 match 分支中的模式引入了一个名为 `y` 的新变量，它将匹配 `Some` 值内部的任何值。因为我们在 `match` 表达式内部的新范围内，所以这是一个新的 `y` 变量，而不是我们在开始时声明的值为 `10` 的 `y`。这个新的 `y` 绑定将匹配 `Some` 内部的任何值，这正是我们在 `x` 中拥有的值。因此，这个新的 `y` 绑定到 `x` 中 `Some` 的内部值。该值是 `5`，所以该分支的表达式执行并打印 `Matched, y = 5`。

如果 `x` 是 `None` 值而不是 `Some(5)`，前两个分支中的模式将不会匹配，因此值将匹配到下划线。我们没有在下划线分支的模式中引入 `x` 变量，因此表达式中的 `x` 仍然是未被遮蔽的外部 `x`。在这个假设的情况下，`match` 将打印 `Default case, x = None`。

当 `match` 表达式完成时，它的作用域结束，内部 `y` 的作用域也随之结束。最后一个 `println!` 产生 `at the end: x = Some(5), y = 10`。

要创建一个比较外部 `x` 和 `y` 值的 `match` 表达式，而不是引入一个遮蔽现有 `y` 变量的新变量，我们需要使用 match 守卫条件。我们将在本章后面的[添加条件性的 Match Guards](#添加条件性的-match-guards)一节中讨论 match guards。

## 匹配多个模式

在 `match` 表达式中，你可以使用 `|` 语法匹配多个模式，这是模式 **或** 运算符。例如，在以下代码中，我们将 `x` 的值与 match 分支进行匹配，第一个分支有一个 **或** 选项，这意味着如果 `x` 的值匹配该分支中的任何一个值，该分支的代码将运行：

```rust
fn main() {
    let x = 1;

    match x {
        1 | 2 => println!("one or two"),
        3 => println!("three"),
        _ => println!("anything"),
    }
}
```

此代码打印 `one or two`。

## 使用 `..=` 匹配范围的值

`..=` 语法允许我们匹配到一个包含的范围。在以下代码中，当模式匹配给定范围内的任何值时，该分支将执行：

```rust
fn main() {
    let x = 5;

    match x {
        1..=5 => println!("one through five"),
        _ => println!("something else"),
    }
}
```

如果 `x` 是 `1`、`2`、`3`、`4` 或 `5`，第一个分支将匹配。这种语法比使用 `|` 运算符来表达相同的想法更方便；如果我们使用 `|`，我们必须指定 `1 | 2 | 3 | 4 | 5`。指定一个范围要短得多，特别是如果我们想匹配，比如说，1 到 1,000 之间的任何数字！

编译器在编译时检查范围是否为空，而且因为 Rust 能判断范围是否为空或非空的唯一类型是 `char` 和数字值，所以只允许对数字或 `char` 值使用范围。

以下是一个使用 `char` 值范围的示例：

```rust
fn main() {
    let x = 'c';

    match x {
        'a'..='j' => println!("early ASCII letter"),
        'k'..='z' => println!("late ASCII letter"),
        _ => println!("something else"),
    }
}
```

Rust 可以判断 `'c'` 在第一个模式的范围内并打印 `early ASCII letter`。

## 解构以拆分值

我们还可以使用模式来解构结构体、枚举和元组以使用这些值的不同部分。让我们逐一了解每种值。

### 结构体

清单 19-12 显示了一个具有两个字段 `x` 和 `y` 的 `Point` 结构体，我们可以使用带有 `let` 语句的模式来拆分它。

**清单 19-12**：将结构体的字段解构为单独的变量（文件名：*src/main.rs*）

```rust
struct Point {
    x: i32,
    y: i32,
}

fn main() {
    let p = Point { x: 0, y: 7 };

    let Point { x: a, y: b } = p;
    assert_eq!(0, a);
    assert_eq!(7, b);
}
```

此代码创建变量 `a` 和 `b`，它们匹配 `p` 结构体的 `x` 和 `y` 字段的值。此示例显示，模式中变量的名称不必与结构体的字段名称匹配。然而，将变量名称与字段名称匹配是常见的做法，以便更容易记住哪些变量来自哪些字段。因为这种常见用法，也因为写 `let Point { x: x, y: y } = p;` 包含大量重复，Rust 为匹配结构体字段的模式提供了一个简写：你只需要列出结构体字段的名称，从模式创建的变量将具有相同的名称。清单 19-13 的行为与清单 19-12 中的代码相同，但在 `let` 模式中创建的变量是 `x` 和 `y` 而不是 `a` 和 `b`。

**清单 19-13**：使用结构体字段简写来解构结构体字段（文件名：*src/main.rs*）

```rust
struct Point {
    x: i32,
    y: i32,
}

fn main() {
    let p = Point { x: 0, y: 7 };

    let Point { x, y } = p;
    assert_eq!(0, x);
    assert_eq!(7, y);
}
```

此代码创建变量 `x` 和 `y`，它们匹配 `p` 变量的 `x` 和 `y` 字段。结果是变量 `x` 和 `y` 包含来自 `p` 结构体的值。

我们还可以使用字面值作为结构体模式的一部分来进行解构，而不是为所有字段创建变量。这样做允许我们测试某些字段的特定值，同时创建变量来解构其他字段。

在清单 19-14 中，我们有一个 `match` 表达式，它将 `Point` 值分为三种情况：直接位于 `x` 轴上的点（当 `y = 0` 时为真）、位于 `y` 轴上的点（`x = 0`）或不在任何轴上的点。

**清单 19-14**：在一个模式中解构和匹配字面值（文件名：*src/main.rs*）

```rust
struct Point {
    x: i32,
    y: i32,
}

fn main() {
    let p = Point { x: 0, y: 7 };

    match p {
        Point { x, y: 0 } => println!("On the x axis at {x}"),
        Point { x: 0, y } => println!("On the y axis at {y}"),
        Point { x, y } => {
            println!("On neither axis: ({x}, {y})");
        }
    }
}
```

第一个分支将匹配位于 `x` 轴上的任何点，通过指定如果 `y` 字段的值与字面值 `0` 匹配，则 `y` 字段匹配。该模式仍然创建一个 `x` 变量，我们可以在此分支的代码中使用。

类似地，第二个分支通过指定如果 `x` 字段的值为 `0`，则 `x` 字段匹配，并创建一个变量 `y` 来保存 `y` 字段的值，从而匹配位于 `y` 轴上的任何点。第三个分支不指定任何字面值，因此它匹配任何其他 `Point` 并为 `x` 和 `y` 字段创建变量。

在此示例中，值 `p` 通过 `x` 包含 `0` 而匹配第二个分支，因此此代码将打印 `On the y axis at 7`。

请记住，一旦 `match` 表达式找到了第一个匹配的模式，它就会停止检查分支，因此即使 `Point { x: 0, y: 0 }` 位于 `x` 轴和 `y` 轴上，此代码也只会打印 `On the x axis at 0`。

### 枚举

我们已经在本书中解构了枚举（例如，第 6 章中的清单 6-5），但我们还没有明确讨论用于解构枚举的模式与枚举内部存储的数据定义方式相对应。作为示例，在清单 19-15 中，我们使用清单 6-2 中的 `Message` 枚举，并编写一个 `match`，其模式将解构每个内部值。

**清单 19-15**：解构持有不同种类值的枚举变体（文件名：*src/main.rs*）

```rust
enum Message {
    Quit,
    Move { x: i32, y: i32 },
    Write(String),
    ChangeColor(i32, i32, i32),
}

fn main() {
    let msg = Message::ChangeColor(0, 160, 255);

    match msg {
        Message::Quit => {
            println!("The Quit variant has no data to destructure.");
        }
        Message::Move { x, y } => {
            println!("Move in the x direction {x} and in the y direction {y}");
        }
        Message::Write(text) => {
            println!("Text message: {text}");
        }
        Message::ChangeColor(r, g, b) => {
            println!("Change color to red {r}, green {g}, and blue {b}");
        }
    }
}
```

此代码将打印 `Change color to red 0, green 160, and blue 255`。尝试更改 `msg` 的值以查看其他分支的代码运行。

对于没有任何数据的枚举变体，如 `Message::Quit`，我们无法进一步解构该值。我们只能匹配字面值 `Message::Quit`，而且该模式中没有变量。

对于类似结构体的枚举变体，例如 `Message::Move`，我们可以使用与用于匹配结构体的模式类似的模式。在变体名称之后，我们放置花括号，然后列出字段及其变量，以便我们将各个部分拆分以在此分支的代码中使用。这里我们使用与清单 19-13 中相同的简写形式。

对于类似元组的枚举变体，如持有一个元素的元组的 `Message::Write` 和持有三个元素的元组的 `Message::ChangeColor`，该模式类似于我们用于匹配元组的模式。模式中变量的数量必须与我们匹配的变体中元素的数量匹配。

### 嵌套的结构体和枚举

到目前为止，我们的示例都是匹配一层深的结构体或枚举，但匹配也可以在嵌套的项目上工作！例如，我们可以重构清单 19-15 中的代码，以在 `ChangeColor` 消息中支持 RGB 和 HSV 颜色，如清单 19-16 所示。

**清单 19-16**：匹配嵌套枚举

```rust
enum Color {
    Rgb(i32, i32, i32),
    Hsv(i32, i32, i32),
}

enum Message {
    Quit,
    Move { x: i32, y: i32 },
    Write(String),
    ChangeColor(Color),
}

fn main() {
    let msg = Message::ChangeColor(Color::Hsv(0, 160, 255));

    match msg {
        Message::ChangeColor(Color::Rgb(r, g, b)) => {
            println!("Change color to red {r}, green {g}, and blue {b}");
        }
        Message::ChangeColor(Color::Hsv(h, s, v)) => {
            println!("Change color to hue {h}, saturation {s}, value {v}");
        }
        _ => (),
    }
}
```

`match` 表达式中第一个分支的模式匹配一个包含 `Color::Rgb` 变体的 `Message::ChangeColor` 枚举变体；然后，该模式绑定到三个内部 `i32` 值。第二个分支的模式也匹配一个 `Message::ChangeColor` 枚举变体，但内部枚举匹配 `Color::Hsv`。我们可以在一个 `match` 表达式中指定这些复杂条件，即使涉及两个枚举。

### 结构体和元组

我们可以以甚至更复杂的方式混合、匹配和嵌套解构模式。以下示例展示了一个复杂的解构，我们在元组中嵌套结构体和元组，并解构出所有原始值：

```rust
fn main() {
    struct Point {
        x: i32,
        y: i32,
    }

    let ((feet, inches), Point { x, y }) = ((3, 10), Point { x: 3, y: -10 });
}
```

此代码允许我们将复杂类型分解为其组成部分，以便我们可以单独使用我们感兴趣的值。

使用模式进行解构是一种方便的方式，可以单独使用值的各个部分，例如结构体中每个字段的值，彼此分开。

## 忽略模式中的值

你已经看到，在 `match` 的最后一个分支中忽略模式中的值有时很有用，以获得一个实际上什么都不做但确实涵盖了所有剩余可能值的捕获所有模式。有几种方法可以忽略整个值或值的一部分：使用 `_` 模式（你已经见过），在另一个模式中使用 `_` 模式，使用以下划线开头的名称，或使用 `..` 忽略值的其余部分。让我们探索如何以及为什么使用这些模式。

### 使用 `_` 忽略整个值

我们使用下划线作为通配符模式，它将匹配任何值但不绑定到该值。这在 `match` 表达式的最后一个分支中特别有用，但我们也可以在任何模式中使用它，包括函数参数，如清单 19-17 所示。

**清单 19-17**：在函数签名中使用 `_`（文件名：*src/main.rs*）

```rust
fn foo(_: i32, y: i32) {
    println!("This code only uses the y parameter: {y}");
}

fn main() {
    foo(3, 4);
}
```

此代码将完全忽略作为第一个参数传递的值 `3`，并打印 `This code only uses the y parameter: 4`。

在大多数情况下，当你不再需要某个函数参数时，你会更改签名，使其不包含未使用的参数。忽略函数参数在某些情况下特别有用，例如，当你实现 trait 时，如果你的实现中的函数体不需要其中一个参数，但你仍然需要该类型签名。然后你避免了关于未使用函数参数的编译器警告，就像你使用名称时那样。

### 在嵌套的 `_` 中忽略值的一部分

我们还可以在另一个模式中使用 `_` 来仅忽略值的一部分，例如，当我们只想测试值的一部分，但对我们想运行的相应代码中的其他部分没有用处时。清单 19-18 显示了负责管理设置值的代码。业务要求是，用户不应被允许覆盖设置的现有自定义，但可以在设置当前未设置时取消设置并给它赋值。

**清单 19-18**：当我们不需要使用 `Some` 内部的值时，在匹配 `Some` 变体的模式中使用下划线

```rust
fn main() {
    let mut setting_value = Some(5);
    let new_setting_value = Some(10);

    match (setting_value, new_setting_value) {
        (Some(_), Some(_)) => {
            println!("Can't overwrite an existing customized value");
        }
        _ => {
            setting_value = new_setting_value;
        }
    }

    println!("setting is {setting_value:?}");
}
```

此代码将打印 `Can't overwrite an existing customized value`，然后打印 `setting is Some(5)`。在第一个 match 分支中，我们不需要匹配或使用任一 `Some` 变体内部的值，但我们确实需要测试 `setting_value` 和 `new_setting_value` 都是 `Some` 变体的情况。在这种情况下，我们打印不更改 `setting_value` 的原因，而且它没有更改。

在所有其他情况下（如果 `setting_value` 或 `new_setting_value` 是 `None`），由第二个分支中的 `_` 模式表达，我们希望允许 `new_setting_value` 成为 `setting_value`。

我们还可以在一个模式中的多个地方使用下划线来忽略特定值。清单 19-19 显示了一个忽略五元组中第二和第四个值的示例。

**清单 19-19**：忽略元组的多个部分

```rust
fn main() {
    let numbers = (2, 4, 8, 16, 32);

    match numbers {
        (first, _, third, _, fifth) => {
            println!("Some numbers: {first}, {third}, {fifth}");
        }
    }
}
```

此代码将打印 `Some numbers: 2, 8, 32`，而值 `4` 和 `16` 将被忽略。

### 通过以 `_` 开头的名称忽略未使用的变量

如果你创建了一个变量但在任何地方都没有使用它，Rust 通常会发出警告，因为未使用的变量可能是一个 bug。然而，有时能够创建一个你暂时不会使用的变量是很有用的，例如当你正在进行原型设计或刚刚开始一个项目时。在这种情况下，你可以通过以下划线开头命名变量来告诉 Rust 不要警告你未使用的变量。在清单 19-20 中，我们创建了两个未使用的变量，但当我们编译此代码时，我们应该只收到关于其中一个的警告。

**清单 19-20**：以变量名称开头使用下划线以避免收到未使用变量警告（文件名：*src/main.rs*）

```rust
fn main() {
    let _x = 5;
    let y = 10;
}
```

这里，我们收到关于未使用变量 `y` 的警告，但我们没有收到关于 `_x` 的警告。

请注意，仅使用 `_` 和使用以下划线开头的名称之间存在细微差别。语法 `_x` 仍然将值绑定到变量，而 `_` 根本不绑定。为了展示这种区别很重要的情况，清单 19-21 将给我们一个错误。

**清单 19-21**：以开头的未使用变量仍然绑定该值，这可能获取该值的所有权。

```rust
fn main() {
    let s = Some(String::from("Hello!"));

    if let Some(_s) = s {
        println!("found a string");
    }

    println!("{s:?}");
}
```

我们将收到一个错误，因为 `s` 值仍将移动到 `_s`，这阻止了我们再次使用 `s`。然而，单独使用下划线不会绑定到该值。清单 19-22 将编译没有任何错误，因为 `s` 不会移动到 `_`。

**清单 19-22**：使用下划线不会绑定该值。

```rust
fn main() {
    let s = Some(String::from("Hello!"));

    if let Some(_) = s {
        println!("found a string");
    }

    println!("{s:?}");
}
```

此代码运行良好，因为我们从未将 `s` 绑定到任何东西；它没有被移动。

### 使用 `..` 忽略值的其余部分

对于具有许多部分的值，我们可以使用 `..` 语法来使用特定部分并忽略其余部分，避免需要为每个被忽略的值列出下划线。`..` 模式忽略我们未在模式的其余部分中显式匹配的值的所有部分。在清单 19-23 中，我们有一个在三维空间中保存坐标的 `Point` 结构体。在 `match` 表达式中，我们只想对 `x` 坐标进行操作，并忽略 `y` 和 `z` 字段中的值。

**清单 19-23**：使用 `..` 忽略 `Point` 的所有字段，除了 `x`

```rust
fn main() {
    struct Point {
        x: i32,
        y: i32,
        z: i32,
    }

    let origin = Point { x: 0, y: 0, z: 0 };

    match origin {
        Point { x, .. } => println!("x is {x}"),
    }
}
```

我们列出 `x` 值，然后只包含 `..` 模式。这比列出 `y: _` 和 `z: _` 更快，特别是当我们在只有一两个字段相关的情况下处理具有大量字段的结构体时。

`..` 语法将根据需要扩展为尽可能多的值。清单 19-24 展示了如何将 `..` 与元组一起使用。

**清单 19-24**：仅匹配元组中的第一个和最后一个值，并忽略所有其他值（文件名：*src/main.rs*）

```rust
fn main() {
    let numbers = (2, 4, 8, 16, 32);

    match numbers {
        (first, .., last) => {
            println!("Some numbers: {first}, {last}");
        }
    }
}
```

在此代码中，第一个和最后一个值分别与 `first` 和 `last` 匹配。`..` 将匹配并忽略中间的所有内容。

然而，使用 `..` 必须是明确的。如果不清楚哪些值是用于匹配的，哪些应该被忽略，Rust 会给我们一个错误。清单 19-25 展示了以不明确方式使用 `..` 的示例，因此它不会编译。

**清单 19-25**：试图以不明确的方式使用 `..`（文件名：*src/main.rs*）

```rust,ignore
fn main() {
    let numbers = (2, 4, 8, 16, 32);

    match numbers {
        (.., second, ..) => {
            println!("Some numbers: {second}")
        },
    }
}
```

当我们编译此示例时，我们得到此错误：

```console
$ cargo run
   Compiling patterns v0.1.0 (file:///projects/patterns)
error: `..` can only be used once per tuple pattern
 --> src/main.rs:5:22
  |
5 |         (.., second, ..) => {
  |          --          ^^ can only be used once per tuple pattern
  |          |
  |          previously used here

error: could not compile `patterns` (bin "patterns") due to 1 previous error
```

Rust 无法确定元组中有多少值要在匹配与 `second` 的值之前忽略，然后又有多少值要在之后忽略。此代码可能意味着我们想要忽略 `2`，将 `second` 绑定到 `4`，然后忽略 `8`、`16` 和 `32`；或者我们想要忽略 `2` 和 `4`，将 `second` 绑定到 `8`，然后忽略 `16` 和 `32`；等等。变量名称 `second` 对 Rust 来说没有任何特殊含义，因此我们会收到编译器错误，因为像这样在两个地方使用 `..` 是不明确的。

## 添加条件性的 Match Guards

**match guard** 是一个额外的 `if` 条件，在 `match` 分支中的模式之后指定，也必须匹配才能选择该分支。Match guards 用于表达比单独的模式更复杂的想法。但请注意，它们仅在 `match` 表达式中可用，在 `if let` 或 `while let` 表达式中不可用。

该条件可以使用模式中创建的变量。清单 19-26 显示了一个 `match`，其中第一个分支具有模式 `Some(x)`，还具有一个 match guard `if x % 2 == 0`（如果数字是偶数，则为 `true`）。

**清单 19-26**：向模式添加 match guard

```rust
fn main() {
    let num = Some(4);

    match num {
        Some(x) if x % 2 == 0 => println!("The number {x} is even"),
        Some(x) => println!("The number {x} is odd"),
        None => (),
    }
}
```

此示例将打印 `The number 4 is even`。当 `num` 与第一个分支中的模式比较时，它匹配，因为 `Some(4)` 匹配 `Some(x)`。然后，match guard 检查 `x` 除以 2 的余数是否等于 0，因为它是，所以选择了第一个分支。

如果 `num` 是 `Some(5)`，第一个分支中的 match guard 将为 `false`，因为 5 除以 2 的余数是 1，不等于 0。Rust 将转到第二个分支，它会匹配，因为第二个分支没有 match guard，因此匹配任何 `Some` 变体。

没有办法在模式中表达 `if x % 2 == 0` 条件，因此 match guard 使我们能够表达这种逻辑。这种额外表达能力的缺点是，当涉及 match guard 表达式时，编译器不会尝试检查穷尽性。

在讨论清单 19-11 时，我们提到可以使用 match guards 来解决我们的模式遮蔽问题。回想一下，我们在 `match` 表达式中的模式内创建了一个新变量，而不是使用 `match` 外部的变量。那个新变量意味着我们无法测试外部变量的值。清单 19-27 展示了如何使用 match guard 来解决此问题。

**清单 19-27**：使用 match guard 来测试与外部变量的相等性（文件名：*src/main.rs*）

```rust
fn main() {
    let x = Some(5);
    let y = 10;

    match x {
        Some(50) => println!("Got 50"),
        Some(n) if n == y => println!("Matched, n = {n}"),
        _ => println!("Default case, x = {x:?}"),
    }

    println!("at the end: x = {x:?}, y = {y}");
}
```

此代码现在将打印 `Default case, x = Some(5)`。第二个 match 分支中的模式不会引入会遮蔽外部 `y` 的新变量 `y`，这意味着我们可以在 match guard 中使用外部 `y`。我们不将模式指定为 `Some(y)`，这将遮蔽外部 `y`，而是指定 `Some(n)`。这创建了一个不会遮蔽任何东西的新变量 `n`，因为外部没有 `n` 变量。

Match guard `if n == y` 不是模式，因此不引入新变量。这个 `y` **是** 外部 `y`，而不是遮蔽它的新 `y`，我们可以通过将 `n` 与 `y` 进行比较来查找与外部 `y` 具有相同值的值。

你也可以在 match guard 中使用 **或** 运算符 `|` 来指定多个模式；match guard 条件将应用于所有模式。清单 19-28 展示了将使用 `|` 的模式与 match guard 组合时的优先级。此示例的重要部分是 `if y` match guard 适用于 `4`、`5` **和** `6`，即使它可能看起来 `if y` 只适用于 `6`。

**清单 19-28**：将多个模式与 match guard 组合

```rust
fn main() {
    let x = 4;
    let y = false;

    match x {
        4 | 5 | 6 if y => println!("yes"),
        _ => println!("no"),
    }
}
```

Match 条件表明，只有当 `x` 的值等于 `4`、`5` 或 `6` **且** `y` 是 `true` 时，该分支才匹配。当此代码运行时，第一个分支的模式匹配，因为 `x` 是 `4`，但 match guard `if y` 是 `false`，因此没有选择第一个分支。代码转到第二个分支，它确实匹配，此程序打印 `no`。原因是 `if` 条件适用于整个模式 `4 | 5 | 6`，而不仅仅是最后一个值 `6`。换句话说，match guard 与模式相关的优先级行为如下：

```text
(4 | 5 | 6) if y => ...
```

而不是这样：

```text
4 | 5 | (6 if y) => ...
```

运行代码后，优先级行为很明显：如果 match guard 仅适用于使用 `|` 运算符指定的值列表中的最后一个值，该分支将匹配，程序将打印 `yes`。

## 使用 `@` 绑定

**at** 运算符 `@` 允许我们创建一个变量，在测试该值进行模式匹配的同时保存该值。在清单 19-29 中，我们想测试 `Message::Hello` 的 `id` 字段是否在范围 `3..=7` 内。我们还想将该值绑定到变量 `id`，以便我们可以在与该分支关联的代码中使用它。

**清单 19-29**：使用 `@` 在模式中绑定到一个值，同时测试它

```rust
fn main() {
    enum Message {
        Hello { id: i32 },
    }

    let msg = Message::Hello { id: 5 };

    match msg {
        Message::Hello { id: id @ 3..=7 } => {
            println!("Found an id in range: {id}")
        }
        Message::Hello { id: 10..=12 } => {
            println!("Found an id in another range")
        }
        Message::Hello { id } => println!("Found some other id: {id}"),
    }
}
```

此示例将打印 `Found an id in range: 5`。通过在范围 `3..=7` 之前指定 `id @`，我们将匹配该范围的任何值捕获到名为 `id` 的变量中，同时也测试该值是否匹配该范围模式。

在第二个分支中，我们在模式中只指定了一个范围，与该分支关联的代码没有一个包含 `id` 字段实际值的变量。`id` 字段的值可能是 10、11 或 12，但随该模式运行的代码不知道是哪一个。模式代码无法使用来自 `id` 字段的值，因为我们没有将该值保存在变量中。

在最后一个分支中，我们指定了一个没有范围的变量，我们确实在分支的代码中以名为 `id` 的变量形式有值可用。原因是我们使用了结构体字段简写语法。但我们没有在此分支中对 `id` 字段中的值应用任何测试，就像我们对前两个分支所做的那样：任何值都将匹配此模式。

使用 `@` 允许我们在一个模式中测试一个值并将其保存在变量中。

## 总结

Rust 的模式在区分不同类型的数据时非常有用。在 `match` 表达式中使用时，Rust 确保你的模式涵盖每一个可能的值，否则你的程序将不会编译。`let` 语句和函数参数中的模式使这些构造更有用，可以将值解构为更小的部分，并将这些部分分配给变量。我们可以创建简单或复杂的模式以满足我们的需求。

接下来，对于本书的倒数第二章，我们将介绍 Rust 的各种特性的一些高级方面。
