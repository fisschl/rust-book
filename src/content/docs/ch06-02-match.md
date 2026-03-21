---
title: "match 控制流结构"
---

Rust 有一个非常强大的控制流结构叫做 `match`，它允许你将一个值与一系列模式进行比较，然后根据哪个模式匹配来执行代码。模式可以由字面值、变量名、通配符和许多其他东西组成；[第19章][ch19-00-patterns] 涵盖了所有不同类型的模式及其作用。`match` 的强大之处在于模式的表达力，以及编译器确认所有可能的情况都已处理的事实。

把 `match` 表达式想象成硬币分类机：硬币沿着一条轨道滑下，轨道上有各种大小的孔，每个硬币都会落入它遇到的第一个适合它的孔中。同样地，值在 `match` 中经过每个模式，在值"适合"的第一个模式处，值就会落入相关的代码块中以供执行期间使用。

说到硬币，让我们用它们作为使用 `match` 的例子！我们可以编写一个函数，接收一个未知的美国硬币，并以类似于计数机的方式确定它是哪种硬币，然后返回其以美分为单位的值，如代码清单 6-3 所示。

**文件名：`src/main.rs`**

```rust
enum Coin {
    Penny,
    Nickel,
    Dime,
    Quarter,
}

fn value_in_cents(coin: Coin) -> u8 {
    match coin {
        Coin::Penny => 1,
        Coin::Nickel => 5,
        Coin::Dime => 10,
        Coin::Quarter => 25,
    }
}

fn main() {}
```

让我们来分解一下 `value_in_cents` 函数中的 `match`。首先，我们列出 `match` 关键字，后跟一个表达式，在本例中是值 `coin`。这看起来非常类似于与 `if` 一起使用的条件表达式，但有一个很大的区别：使用 `if` 时，条件需要求值为布尔值，但在这里它可以是任何类型。本例中 `coin` 的类型是我们在第一行定义的 `Coin` 枚举。

接下来是 `match` 分支（arms）。一个分支有两个部分：一个模式和一些代码。这里的第一个分支有一个模式，即值 `Coin::Penny`，然后是 `=>` 操作符，它将模式和要运行的代码分开。在本例中，代码只是值 `1`。每个分支都用逗号与下一个分支分隔。

当 `match` 表达式执行时，它会按顺序将结果值与每个分支的模式进行比较。如果模式匹配该值，则执行与该模式关联的代码。如果该模式不匹配该值，则继续执行到下一个分支，就像硬币分类机一样。我们可以拥有任意数量的分支：在代码清单 6-3 中，我们的 `match` 有四个分支。

与每个分支关联的代码是一个表达式，匹配分支中表达式的结果值就是整个 `match` 表达式返回的值。

如果匹配分支的代码很短，我们通常不使用大括号，就像代码清单 6-3 中那样，每个分支只返回一个值。如果你想在匹配分支中运行多行代码，你必须使用大括号，然后分支后面的逗号就变成可选的。例如，以下代码每次使用 `Coin::Penny` 调用该方法时都会打印"Lucky penny!"，但它仍然返回块的最后一个值 `1`：

```rust
enum Coin {
    Penny,
    Nickel,
    Dime,
    Quarter,
}

fn value_in_cents(coin: Coin) -> u8 {
    match coin {
        Coin::Penny => {
            println!("Lucky penny!");
            1
        }
        Coin::Nickel => 5,
        Coin::Dime => 10,
        Coin::Quarter => 25,
    }
}

fn main() {}
```

### 绑定到值的

match 分支的另一个有用特性是它们可以绑定到与模式匹配的值的部分。这就是我们如何从枚举变体中提取值的方法。

作为示例，让我们更改其中一个枚举变体以在其中保存数据。从 1999 年到 2008 年，美国铸币局为 50 个州中的每一个铸造了不同设计的 25 美分硬币。没有其他硬币获得州设计，所以只有 25 美分硬币有这个额外的值。我们可以通过将 `Quarter` 变体更改为包含存储在其中的 `UsState` 值来将这些信息添加到我们的 `enum` 中，如代码清单 6-4 所示。

**文件名：`src/main.rs`**

```rust
#[derive(Debug)] // 这样我们可以在一会儿检查状态
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

fn main() {}
```

让我们想象一个朋友正在尝试收集所有 50 个州的 25 美分硬币。当我们按硬币类型分类我们的零钱时，我们也会喊出每个 25 美分硬币相关的州名，这样如果它是我们朋友没有的，他们就可以把它添加到他们的收藏中。

在这段代码的 match 表达式中，我们向匹配 `Coin::Quarter` 变体值的模式添加了一个名为 `state` 的变量。当 `Coin::Quarter` 匹配时，`state` 变量将绑定到该 25 美分硬币的州的值。然后，我们可以在该分支的代码中使用 `state`，如下所示：

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

fn value_in_cents(coin: Coin) -> u8 {
    match coin {
        Coin::Penny => 1,
        Coin::Nickel => 5,
        Coin::Dime => 10,
        Coin::Quarter(state) => {
            println!("State quarter from {state:?}!");
            25
        }
    }
}

fn main() {
    value_in_cents(Coin::Quarter(UsState::Alaska));
}
```

如果我们调用 `value_in_cents(Coin::Quarter(UsState::Alaska))`，`coin` 将是 `Coin::Quarter(UsState::Alaska)`。当我们将该值与每个 match 分支进行比较时，没有一个匹配，直到我们到达 `Coin::Quarter(state)`。此时，`state` 的绑定将是值 `UsState::Alaska`。然后，我们可以在 `println!` 表达式中使用该绑定，从而从 `Quarter` 的 `Coin` 枚举变体中获取内部状态值。

### `Option<T>` 的 `match` 

在上一节中，我们希望在处理 `Option<T>` 时从 `Some` 情况中获取内部的 `T` 值；我们也可以像处理 `Coin` 枚举一样使用 `match` 来处理 `Option<T>`！我们不比较硬币，而是比较 `Option<T>` 的变体，但 `match` 表达式的工作方式保持不变。

假设我们想编写一个函数，它接收一个 `Option<i32>`，如果其中有值，就给该值加 1。如果里面没有值，函数应该返回 `None` 值，而不尝试执行任何操作。

多亏了 `match`，这个函数很容易编写，看起来像代码清单 6-5。

**文件名：`src/main.rs`**

```rust
fn main() {
    fn plus_one(x: Option<i32>) -> Option<i32> {
        match x {
            None => None,
            Some(i) => Some(i + 1),
        }
    }

    let five = Some(5);
    let six = plus_one(five);
    let none = plus_one(None);
}
```

让我们更详细地检查 `plus_one` 的第一次执行。当我们调用 `plus_one(five)` 时，`plus_one` 主体中的变量 `x` 将具有值 `Some(5)`。然后我们将它与每个 match 分支进行比较：

```rust
        None => None,
```

`Some(5)` 值不匹配模式 `None`，所以我们继续到下一个分支：

```rust
        Some(i) => Some(i + 1),
```

`Some(5)` 匹配 `Some(i)` 吗？它确实匹配！我们有相同的变体。`i` 绑定到包含在 `Some` 中的值，所以 `i` 取值 `5`。然后执行 match 分支中的代码，所以我们将 `i` 的值加 1，并用我们的总数 `6` 在里面创建一个新的 `Some` 值。

现在让我们考虑代码清单 6-5 中的第二次 `plus_one` 调用，其中 `x` 是 `None`。我们进入 `match` 并与第一个分支比较：

```rust
        None => None,
```

它匹配了！没有值可以加，所以程序停止并返回 `=>` 右侧的 `None` 值。因为第一个分支匹配了，所以没有比较其他分支。

在许多情况下，结合 `match` 和枚举是很有用的。你会在 Rust 代码中经常看到这种模式：针对枚举进行 `match`，将变量绑定到内部的数据，然后根据它执行代码。一开始有点棘手，但一旦你习惯了，你会希望在所有语言中都有它。它一直是用户的最爱。

### match 是穷尽的

关于 `match` 还有另一个方面我们需要讨论：分支的模式必须涵盖所有可能性。考虑我们这个 `plus_one` 函数的版本，它有一个 bug 且无法编译：

```rust
fn main() {
    fn plus_one(x: Option<i32>) -> Option<i32> {
        match x {
            Some(i) => Some(i + 1),
        }
    }

    let five = Some(5);
    let six = plus_one(five);
    let none = plus_one(None);
}
```

我们没有处理 `None` 情况，所以这段代码会导致 bug。幸运的是，这是 Rust 知道如何捕获的 bug。如果我们尝试编译这段代码，我们会得到这个错误：

```console
$ cargo run
   Compiling enums v0.1.0 (file:///projects/enums)
error[E0004]: non-exhaustive patterns: `None` not covered
 --> src/main.rs:3:15
  |
3 |         match x {
  |               ^ pattern `None` not covered
  |
note: `Option<i32>` defined here
 --> /rustc/1159e78c4747b02ef996e55082b704c09b970588/library/core/src/option.rs:593:1
  ::: /rustc/1159e78c4747b02ef996e55082b704c09b970588/library/core/src/option.rs:597:5
  |
  = note: not covered
  = note: the matched value is of type `Option<i32>`
help: ensure that all possible cases are being handled by adding a match arm with a wildcard pattern or an explicit pattern as shown
  |
4 ~             Some(i) => Some(i + 1),
5 ~             None => todo!(),
  |

For more information about this error, try `rustc --explain E0004`.
error: could not compile `enums` (bin "enums") due to 1 previous error
```

Rust 知道我们没有涵盖所有可能的情况，甚至知道我们忘记了哪个模式！Rust 中的 match 是*穷尽的*：我们必须穷尽每一个最后的可能性，代码才能有效。特别是在 `Option<T>` 的情况下，当 Rust 阻止我们忘记显式处理 `None` 情况时，它保护我们免于假设我们有一个值，而实际上我们可能有一个 null，从而使前面讨论的十亿美元错误成为不可能。

### 通配模式和 `_` 占位符

使用枚举，我们还可以为几个特定的值采取特殊的操作，但对所有其他值采取一个默认的操作。想象我们正在实现一个游戏，如果你在掷骰子时掷出 3，你的玩家不移动而是得到一顶花哨的新帽子。如果你掷出 7，你的玩家失去一顶花哨的帽子。对于所有其他值，你的玩家在游戏板上移动那么多格。这里有一个实现该逻辑的 `match`，骰子掷出的结果是硬编码的而不是随机值，所有其他逻辑由没有主体的函数表示，因为实际实现超出了本示例的范围：

```rust
fn main() {
    let dice_roll = 9;
    match dice_roll {
        3 => add_fancy_hat(),
        7 => remove_fancy_hat(),
        other => move_player(other),
    }

    fn add_fancy_hat() {}
    fn remove_fancy_hat() {}
    fn move_player(num_spaces: u8) {}
}
```

对于前两个分支，模式是字面值 `3` 和 `7`。对于覆盖所有其他可能值的最后一个分支，模式是我们选择命名为 `other` 的变量。为 `other` 分支运行的代码通过将变量传递给 `move_player` 函数来使用该变量。

这段代码可以编译，即使我们没有列出 `u8` 可以拥有的所有可能值，因为最后一个模式将匹配所有未明确列出的值。这个通配模式满足了 `match` 必须是穷尽的的要求。注意，我们必须将通配分支放在最后，因为模式是按顺序评估的。如果我们把通配分支放在前面，其他分支就永远不会运行，所以如果我们把分支添加在通配之后，Rust 会警告我们！

Rust 还有一个模式，当我们想要一个通配但不想*使用*通配模式中的值时可以使用：`_` 是一个特殊的模式，它匹配任何值但不绑定到该值。这告诉 Rust 我们不会使用这个值，所以 Rust 不会警告我们关于未使用的变量。

让我们改变游戏规则：现在，如果你掷出除 3 或 7 以外的任何数字，你必须重新掷骰子。我们不再需要通配值，所以我们可以将我们的代码更改为使用 `_` 而不是名为 `other` 的变量：

```rust
fn main() {
    let dice_roll = 9;
    match dice_roll {
        3 => add_fancy_hat(),
        7 => remove_fancy_hat(),
        _ => reroll(),
    }

    fn add_fancy_hat() {}
    fn remove_fancy_hat() {}
    fn reroll() {}
}
```

这个示例也满足了穷尽性要求，因为我们在最后一个分支中显式地忽略了所有其他值；我们没有忘记任何东西。

最后，我们将再改变一次游戏规则，这样如果你的回合中掷出除 3 或 7 以外的任何数字，就不会发生任何事情。我们可以通过在 `_` 分支中使用单元值（我们在["元组类型"][tuples] 部分提到的空元组类型）作为与 `_` 分支一起的代码来表达这一点：

```rust
fn main() {
    let dice_roll = 9;
    match dice_roll {
        3 => add_fancy_hat(),
        7 => remove_fancy_hat(),
        _ => (),
    }

    fn add_fancy_hat() {}
    fn remove_fancy_hat() {}
}
```

在这里，我们明确地告诉 Rust，我们不会使用任何不匹配前面分支中模式的值，在这种情况下我们不想运行任何代码。

关于模式和匹配还有更多内容，我们将在 [第19章][ch19-00-patterns] 中介绍。现在，我们将转到 `if let` 语法，它在 `match` 表达式有点冗长的情况下会很有用。

[ch19-00-patterns]: /rust-book/ch19-00-patterns/
[tuples]: /rust-book/ch03-02-data-types/#元组类型
