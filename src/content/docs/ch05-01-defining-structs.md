---
title: 5.1. 定义并实例化结构体
---

结构体与第 3 章["元组类型"][tuples] 部分讨论的元组类似，两者都包含多个相关的值。像元组一样，结构体的各个部分可以是不同类型。但与元组不同的是，在结构体中你会为每个数据命名，这样值的意义就很清楚。添加这些名称意味着结构体比元组更灵活：你不必依赖数据的顺序来指定或访问实例的值。

要定义结构体，我们输入关键字 `struct` 并命名整个结构体。结构体的名称应该描述正在分组的数据块的意义。然后，在大括号内，我们定义数据的名称和类型，我们称这些数据为*字段*。例如，清单 5-1 展示了一个存储用户账户信息的结构体。

**清单 5-1**：`User` 结构体定义（文件名：src/main.rs）

```rust
struct User {
    active: bool,
    username: String,
    email: String,
    sign_in_count: u64,
}

fn main() {}
```

要在定义结构体后使用它，我们通过为每个字段指定具体值来创建该结构体的*实例*。我们通过说明结构体的名称，然后添加包含 _`key: value`_ 对的大括号来创建实例，其中键是字段的名称，值是我们要存储在这些字段中的数据。我们不必按照在结构体中声明字段的相同顺序来指定字段。换句话说，结构体定义就像是该类型的通用模板，而实例则用特定的数据填充该模板以创建该类型的值。例如，我们可以声明一个特定的用户，如清单 5-2 所示。

**清单 5-2**：创建 `User` 结构体的实例（文件名：src/main.rs）

```rust
struct User {
    active: bool,
    username: String,
    email: String,
    sign_in_count: u64,
}

fn main() {
    let user1 = User {
        active: true,
        username: String::from("someusername123"),
        email: String::from("someone@example.com"),
        sign_in_count: 1,
    };
}
```

要从结构体中获取特定值，我们使用点号表示法。例如，要访问该用户的电子邮件地址，我们使用 `user1.email`。如果实例是可变的，我们可以使用点号表示法并赋值给特定字段来更改值。清单 5-3 展示了如何更改可变 `User` 实例的 `email` 字段的值。

**清单 5-3**：更改 `User` 实例的 `email` 字段的值（文件名：src/main.rs）

```rust
struct User {
    active: bool,
    username: String,
    email: String,
    sign_in_count: u64,
}

fn main() {
    let mut user1 = User {
        active: true,
        username: String::from("someusername123"),
        email: String::from("someone@example.com"),
        sign_in_count: 1,
    };

    user1.email = String::from("anotheremail@example.com");
}
```

请注意，整个实例必须是可变的；Rust 不允许我们只将某些字段标记为可变的。与任何表达式一样，我们可以在函数体的最后一个表达式中构造结构体的新实例，以隐式返回该新实例。

清单 5-4 展示了一个 `build_user` 函数，它返回一个具有给定电子邮件和用户名的 `User` 实例。`active` 字段获得值 `true`，`sign_in_count` 获得值 `1`。

**清单 5-4**：`build_user` 函数接受电子邮件和用户名并返回 `User` 实例（文件名：src/main.rs）

```rust
struct User {
    active: bool,
    username: String,
    email: String,
    sign_in_count: u64,
}

fn build_user(email: String, username: String) -> User {
    User {
        active: true,
        username: username,
        email: email,
        sign_in_count: 1,
    }
}

fn main() {
    let user1 = build_user(
        String::from("someone@example.com"),
        String::from("someusername123"),
    );
}
```

使用与结构体字段相同的名称命名函数参数是有意义的，但必须重复 `email` 和 `username` 字段名和变量有点繁琐。如果结构体有更多字段，重复每个名称会变得更烦人。幸运的是，有一个方便的简写！

### 使用字段初始化简写

因为清单 5-4 中的参数名称和结构体字段名称完全相同，我们可以使用*字段初始化简写*语法来重写 `build_user`，使其行为完全相同，但没有 `username` 和 `email` 的重复，如清单 5-5 所示。

**清单 5-5**：`build_user` 函数使用字段初始化简写，因为 `username` 和 `email` 参数与结构体字段同名（文件名：src/main.rs）

```rust
struct User {
    active: bool,
    username: String,
    email: String,
    sign_in_count: u64,
}

fn build_user(email: String, username: String) -> User {
    User {
        active: true,
        username,
        email,
        sign_in_count: 1,
    }
}

fn main() {
    let user1 = build_user(
        String::from("someone@example.com"),
        String::from("someusername123"),
    );
}
```

在这里，我们正在创建 `User` 结构体的新实例，它有一个名为 `email` 的字段。我们想将 `email` 字段的值设置为 `build_user` 函数的 `email` 参数的值。因为 `email` 字段和 `email` 参数同名，我们只需要写 `email` 而不是 `email: email`。

### 使用结构体更新语法创建实例

创建一个包含相同类型另一个实例大部分值但更改其中一些值的新结构体实例通常很有用。你可以使用结构体更新语法来做到这一点。

首先，在清单 5-6 中，我们展示了如何以常规方式在 `user2` 中创建一个新的 `User` 实例，不使用更新语法。我们为 `email` 设置一个新值，但其他情况下使用我们在清单 5-2 中创建的 `user1` 的相同值。

**清单 5-6**：使用 `user1` 的所有值创建一个新的 `User` 实例，只更改一个值（文件名：src/main.rs）

```rust
struct User {
    active: bool,
    username: String,
    email: String,
    sign_in_count: u64,
}

fn main() {
    // --snip--

    let user1 = User {
        email: String::from("someone@example.com"),
        username: String::from("someusername123"),
        active: true,
        sign_in_count: 1,
    };

    let user2 = User {
        active: user1.active,
        username: user1.username,
        email: String::from("another@example.com"),
        sign_in_count: user1.sign_in_count,
    };
}
```

使用结构体更新语法，我们可以用更少的代码实现相同的效果，如清单 5-7 所示。语法 `..` 指定未显式设置的其余字段应具有与给定实例中字段相同的值。

**清单 5-7**：使用结构体更新语法为 `User` 实例设置新的 `email` 值，但使用 `user1` 的其余值（文件名：src/main.rs）

```rust
struct User {
    active: bool,
    username: String,
    email: String,
    sign_in_count: u64,
}

fn main() {
    // --snip--

    let user1 = User {
        email: String::from("someone@example.com"),
        username: String::from("someusername123"),
        active: true,
        sign_in_count: 1,
    };

    let user2 = User {
        email: String::from("another@example.com"),
        ..user1
    };
}
```

清单 5-7 中的代码也在 `user2` 中创建了一个实例，该实例具有不同的 `email` 值，但具有来自 `user1` 的 `username`、`active` 和 `sign_in_count` 字段的相同值。`..user1` 必须放在最后，以指定任何其余字段应从其对应字段中获取值，但我们可以选择按任何顺序为任意多的字段指定值，无论字段在结构体定义中的顺序如何。

请注意，结构体更新语法使用 `=` 就像赋值一样；这是因为它会移动数据，正如我们在["变量与数据交互：移动"][move] 部分中看到的那样。在这个例子中，创建 `user2` 后我们不能再使用 `user1`，因为 `user1` 的 `username` 字段中的 `String` 被移动到了 `user2` 中。如果我们为 `user2` 提供了 `email` 和 `username` 的新 `String` 值，因此只使用了来自 `user1` 的 `active` 和 `sign_in_count` 值，那么创建 `user2` 后 `user1` 仍然有效。`active` 和 `sign_in_count` 都是实现 `Copy` trait 的类型，所以我们讨论过的["仅栈数据：Copy"][copy] 部分中的行为将适用。在这个例子中，我们也可以继续使用 `user1.email`，因为它的值没有被移出 `user1`。

### 使用元组结构体创建不同类型

Rust 还支持看起来像元组的结构体，称为*元组结构体*。元组结构体具有结构体名称提供的额外含义，但没有与其字段关联的名称；相反，它们只有字段的类型。当你想给整个元组命名并使元组成为与其他元组不同的类型，以及在常规结构体中命名每个字段会显得冗长或多余时，元组结构体很有用。

要定义元组结构体，以关键字 `struct` 和结构体名称开头，后跟元组中的类型。例如，这里我们定义并使用两个名为 `Color` 和 `Point` 的元组结构体：

**文件名：src/main.rs**

```rust
struct Color(i32, i32, i32);
struct Point(i32, i32, i32);

fn main() {
    let black = Color(0, 0, 0);
    let origin = Point(0, 0, 0);
}
```

请注意，`black` 和 `origin` 值是不同的类型，因为它们是不同元组结构体的实例。你定义的每个结构体都是它自己的类型，即使结构体内的字段可能具有相同的类型。例如，一个接受 `Color` 类型参数的函数不能接受 `Point` 作为参数，即使两种类型都由三个 `i32` 值组成。否则，元组结构体实例与元组相似，你可以将它们解构为单个部分，你可以使用 `.` 后跟索引来访问单个值。与元组不同的是，元组结构体在解构它们时要求你命名结构体的类型。例如，我们会写 `let Point(x, y, z) = origin;` 来将 `origin` 点中的值解构为名为 `x`、`y` 和 `z` 的变量。

### 定义类单元结构体

你也可以定义没有任何字段的结构体！这些被称为*类单元结构体*，因为它们的行为类似于 `()`，我们在["元组类型"][tuples] 部分中提到的单元类型。当你需要为某个类型实现 trait 但不想在该类型本身存储任何数据时，类单元结构体很有用。我们将在第 10 章讨论 trait。这里有一个声明和实例化名为 `AlwaysEqual` 的单元结构体的例子：

**文件名：src/main.rs**

```rust
struct AlwaysEqual;

fn main() {
    let subject = AlwaysEqual;
}
```

要定义 `AlwaysEqual`，我们使用 `struct` 关键字，我们想要的名字，然后是一个分号。不需要大括号或圆括号！然后，我们可以以类似的方式在 `subject` 变量中获得 `AlwaysEqual` 的实例：使用我们定义的名字，不带任何大括号或圆括号。想象一下，稍后我们将为此类型实现行为，使得 `AlwaysEqual` 的每个实例总是等于任何其他类型的每个实例，也许是为了获得测试的已知结果。我们不需要任何数据来实现这种行为！你将在第 10 章看到如何定义 trait 并在任何类型上实现它们，包括类单元结构体。

> ### 结构体数据的所有权
>
> 在清单 5-1 的 `User` 结构体定义中，我们使用了拥有的 `String` 类型而不是 `&str` 字符串切片类型。这是一个深思熟虑的选择，因为我们希望该结构体的每个实例拥有其所有数据，并且只要整个结构体有效，该数据就有效。
>
> 结构体也可以存储对由其他东西拥有的数据的引用，但这样做需要使用*生命周期*，这是我们将在第 10 章讨论的 Rust 特性。生命周期确保结构体引用的数据在结构体有效期间保持有效。假设你尝试在结构体中存储引用而不指定生命周期，如下面的 *src/main.rs* 中所示；这不会起作用：
>
> **文件名：src/main.rs**
>
> ```rust
> struct User {
>     active: bool,
>     username: &str,
>     email: &str,
>     sign_in_count: u64,> }
>
> fn main() {
>     let user1 = User {
>         active: true,
>         username: "someusername123",
>         email: "someone@example.com",
>         sign_in_count: 1,
>     };
> }
> ```
>
> 编译器会抱怨它需要生命周期说明符：
>
> ```console
> $ cargo run
>    Compiling structs v0.1.0 (file:///projects/structs)
> error[E0106]: missing lifetime specifier
>  --> src/main.rs:3:15
>   |
> 3 |     username: &str,
>   |               ^ expected named lifetime parameter
>   |
> help: consider introducing a named lifetime parameter
>   |
> 1 ~ struct User<'a> {
> 2 |     active: bool,
> 3 ~     username: &'a str,
>   |
>
> error[E0106]: missing lifetime specifier
>  --> src/main.rs:4:12
>   |
> 4 |     email: &str,
>   |            ^ expected named lifetime parameter
>   |
> help: consider introducing a named lifetime parameter
>   |
> 1 ~ struct User<'a> {
> 2 |     active: bool,
> 3 |     username: &str,
> 4 ~     email: &'a str,
>   |
>
> For more information about this error, try `rustc --explain E0106`.
> error: could not compile `structs` (bin "structs") due to 2 previous errors
> ```
>
> 在第 10 章中，我们将讨论如何修复这些错误，以便你可以在结构体中存储引用，但现在，我们将使用像 `String` 这样的拥有类型而不是像 `&str` 这样的引用来修复这些错误。

[tuples]: /rust-book/ch03-02-data-types#元组类型
[move]: /rust-book/ch04-01-what-is-ownership/#变量与数据交互移动
[copy]: /rust-book/ch04-01-what-is-ownership/#仅栈数据copy
