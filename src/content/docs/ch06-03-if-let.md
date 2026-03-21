---
title: "if let 和 let...else 简洁控制流"
---

`if let` 语法让你可以将 `if` 和 `let` 组合成一种不太冗长的方式来处理匹配单个模式的值，同时忽略其余的值。考虑代码清单 6-6 中的程序，它对 `config_max` 变量中的 `Option<u8>` 值进行匹配，但只想在值是 `Some` 变体时执行代码。

**文件名：`src/main.rs`**

```rust
fn main() {
    let config_max = Some(3u8);
    match config_max {
        Some(max) => println!("The maximum is configured to be {max}"),
        _ => (),
    }
}
```

如果值是 `Some`，我们通过将值绑定到模式中的变量 `max` 来打印 `Some` 变体中的值。我们不想对 `None` 值做任何事。为了满足 `match` 表达式，我们必须在只处理一个变体后添加 `_ => ()`，这是令人讨厌的样板代码。

相反，我们可以使用 `if let` 以更短的方式编写这段代码。以下代码的行为与代码清单 6-6 中的 `match` 相同：

```rust
fn main() {
    let config_max = Some(3u8);
    if let Some(max) = config_max {
        println!("The maximum is configured to be {max}");
    }
}
```

`if let` 语法接受一个模式和一个用等号分隔的表达式。它的工作方式与 `match` 相同，其中表达式被交给 `match`，模式是它的第一个分支。在本例中，模式是 `Some(max)`，`max` 绑定到 `Some` 内部的值。然后，我们可以在 `if let` 块的主体中以与我们在相应的 `match` 分支中使用 `max` 相同的方式使用 `max`。只有当值匹配模式时，`if let` 块中的代码才会运行。

使用 `if let` 意味着更少的输入、更少的缩进和更少的样板代码。然而，你失去了 `match` 强制执行的穷尽检查，确保你没有忘记处理任何情况。在 `match` 和 `if let` 之间选择取决于你在特定情况下做什么，以及为了失去穷尽检查而获得简洁性是否是一个适当的权衡。

换句话说，你可以将 `if let` 视为 `match` 的语法糖，它在值匹配一个模式时运行代码，然后忽略所有其他值。

我们可以在 `if let` 中包含一个 `else`。与 `else` 一起的代码块与在与 `if let` 和 `else` 等效的 `match` 表达式中与 `_` 情况一起的代码块相同。回想一下代码清单 6-4 中的 `Coin` 枚举定义，其中 `Quarter` 变体还持有一个 `UsState` 值。如果我们想计算我们看到的所有非 25 美分硬币，同时宣布 25 美分硬币的州，我们可以使用 `match` 表达式来做到这一点，像这样：

```rust
#[derive(Debug)]
enum UsState {
    Alabama,
    Alaska,
    // --snip--
}

enum Coin {
    Penny,
    Nickel,
    Dime,
    Quarter(UsState),
}

fn main() {
    let coin = Coin::Penny;
    let mut count = 0;
    match coin {
        Coin::Quarter(state) => println!("State quarter from {state:?}!"),
        _ => count += 1,
    }
}
```

或者我们可以使用 `if let` 和 `else` 表达式，像这样：

```rust
#[derive(Debug)]
enum UsState {
    Alabama,
    Alaska,
    // --snip--
}

enum Coin {
    Penny,
    Nickel,
    Dime,
    Quarter(UsState),
}

fn main() {
    let coin = Coin::Penny;
    let mut count = 0;
    if let Coin::Quarter(state) = coin {
        println!("State quarter from {state:?}!");
    } else {
        count += 1;
    }
}
```

## 使用 `let...else` 保持在"快乐路径"

常见的模式是当值存在时执行一些计算，否则返回默认值。继续我们带有 `UsState` 值的硬币示例，如果我们想根据 25 美分硬币上的州有多老来说些有趣的话，我们可能会在 `UsState` 上引入一个方法来检查州的年龄，像这样：

```rust
#[derive(Debug)] // 这样我们可以在一会儿检查状态
enum UsState {
    Alabama,
    Alaska,
    // --snip--
}

impl UsState {
    fn existed_in(&self, year: u16) -> bool {
        match self {
            UsState::Alabama => year >= 1819,
            UsState::Alaska => year >= 1959,
            // -- snip --
        }
    }
}
```

然后，我们可能会使用 `if let` 来匹配硬币的类型，在条件的主体中引入一个 `state` 变量，如代码清单 6-7 所示。

**文件名：`src/main.rs`**

```rust
#[derive(Debug)] // 这样我们可以在一会儿检查状态
enum UsState {
    Alabama,
    Alaska,
    // --snip--
}

impl UsState {
    fn existed_in(&self, year: u16) -> bool {
        match self {
            UsState::Alabama => year >= 1819,
            UsState::Alaska => year >= 1959,
            // -- snip --
        }
    }
}

enum Coin {
    Penny,
    Nickel,
    Dime,
    Quarter(UsState),
}

fn describe_state_quarter(coin: Coin) -> Option<String> {
    if let Coin::Quarter(state) = coin {
        if state.existed_in(1900) {
            Some(format!("{state:?} is pretty old, for America!"))
        } else {
            Some(format!("{state:?} is relatively new."))
        }
    } else {
        None
    }
}

fn main() {
    if let Some(desc) = describe_state_quarter(Coin::Quarter(UsState::Alaska)) {
        println!("{desc}");
    }
}
```

这完成了工作，但它将工作推入了 `if let` 语句的主体中，如果要做的工作更复杂，可能很难理解顶层分支是如何关联的。我们还可以利用表达式产生值的事实，要么从 `if let` 产生 `state`，要么提前返回，如代码清单 6-8 所示。（你也可以用 `match` 做类似的事情。）

**文件名：`src/main.rs`**

```rust
#[derive(Debug)] // 这样我们可以在一会儿检查状态
enum UsState {
    Alabama,
    Alaska,
    // --snip--
}

impl UsState {
    fn existed_in(&self, year: u16) -> bool {
        match self {
            UsState::Alabama => year >= 1819,
            UsState::Alaska => year >= 1959,
            // -- snip --
        }
    }
}

enum Coin {
    Penny,
    Nickel,
    Dime,
    Quarter(UsState),
}

fn describe_state_quarter(coin: Coin) -> Option<String> {
    let state = if let Coin::Quarter(state) = coin {
        state
    } else {
        return None;
    };

    if state.existed_in(1900) {
        Some(format!("{state:?} is pretty old, for America!"))
    } else {
        Some(format!("{state:?} is relatively new."))
    }
}

fn main() {
    if let Some(desc) = describe_state_quarter(Coin::Quarter(UsState::Alaska)) {
        println!("{desc}");
    }
}
```

不过，这本身也有点令人烦恼！`if let` 的一个分支产生一个值，另一个分支则完全从函数返回。

为了使这种常见模式更好地表达，Rust 有 `let...else`。`let...else` 语法在左侧接受一个模式，在右侧接受一个表达式，非常类似于 `if let`，但它没有 `if` 分支，只有 `else` 分支。如果模式匹配，它将在外部作用域中绑定模式中的值。如果模式*不*匹配，程序将流入 `else` 分支，该分支必须从函数返回。

在代码清单 6-9 中，你可以看到当使用 `let...else` 代替 `if let` 时，代码清单 6-8 的样子。

**文件名：`src/main.rs`**

```rust
#[derive(Debug)] // 这样我们可以在一会儿检查状态
enum UsState {
    Alabama,
    Alaska,
    // --snip--
}

impl UsState {
    fn existed_in(&self, year: u16) -> bool {
        match self {
            UsState::Alabama => year >= 1819,
            UsState::Alaska => year >= 1959,
            // -- snip --
        }
    }
}

enum Coin {
    Penny,
    Nickel,
    Dime,
    Quarter(UsState),
}

fn describe_state_quarter(coin: Coin) -> Option<String> {
    let Coin::Quarter(state) = coin else {
        return None;
    };

    if state.existed_in(1900) {
        Some(format!("{state:?} is pretty old, for America!"))
    } else {
        Some(format!("{state:?} is relatively new."))
    }
}

fn main() {
    if let Some(desc) = describe_state_quarter(Coin::Quarter(UsState::Alaska)) {
        println!("{desc}");
    }
}
```

注意，通过这种方式，它保持在函数主体的"快乐路径"上，而不会像 `if let` 那样为两个分支提供显著不同的控制流。

如果你的程序中有逻辑太冗长而无法使用 `match` 表达的情况，请记住 `if let` 和 `let...else` 也在你的 Rust 工具箱中。

## 小结

我们现在已经介绍了如何使用枚举来创建自定义类型，这种类型可以是一组枚举值中的一个。我们展示了标准库的 `Option<T>` 类型如何帮助你使用类型系统来防止错误。当枚举值内部有数据时，你可以使用 `match` 或 `if let` 来提取和使用这些值，具体取决于你需要处理多少种情况。

你的 Rust 程序现在可以使用结构体和枚举来表达你领域中的概念。创建自定义类型用于你的 API 中确保了类型安全：编译器将确保你的函数只获得每个函数期望的类型的值。

为了向你的用户提供一个组织良好的 API，易于使用且只暴露你的用户需要的恰好内容，让我们现在转向 Rust 的模块。
