---
title: 使用 use 关键字将路径引入作用域
---

每次调用函数都要写出完整路径可能显得繁琐且重复。在代码示例 7-7 中，无论我们选择绝对路径还是相对路径来访问 `add_to_waitlist` 函数，每次想调用 `add_to_waitlist` 时都必须同时指定 `front_of_house` 和 `hosting`。幸运的是，有一种方法可以简化这个过程：我们可以用 `use` 关键字创建一个路径的快捷方式，然后在作用域的其他地方使用这个更短的名称。

在代码示例 7-11 中，我们将 `crate::front_of_house::hosting` 模块引入 `eat_at_restaurant` 函数的作用域，这样我们只需要指定 `hosting::add_to_waitlist` 就可以在 `eat_at_restaurant` 中调用 `add_to_waitlist` 函数了。

**代码示例 7-11：使用 `use` 将模块引入作用域**

```rust
mod front_of_house {
    pub mod hosting {
        pub fn add_to_waitlist() {}
    }
}

use crate::front_of_house::hosting;

pub fn eat_at_restaurant() {
    hosting::add_to_waitlist();
}
```

在作用域中添加 `use` 和路径类似于在文件系统中创建符号链接。通过在 crate 根中添加 `use crate::front_of_house::hosting`，`hosting` 现在在该作用域中是一个有效的名称，就像 `hosting` 模块是在 crate 根中定义的一样。用 `use` 引入作用域的路径也会像其他路径一样检查隐私。

请注意，`use` 只为 `use` 出现的特定作用域创建快捷方式。代码示例 7-12 将 `eat_at_restaurant` 函数移到一个名为 `customer` 的新子模块中，这与 `use` 语句是不同的作用域，因此函数体将无法编译。

**代码示例 7-12：`use` 语句只适用于它所在的作用域**

```rust
mod front_of_house {
    pub mod hosting {
        pub fn add_to_waitlist() {}
    }
}

use crate::front_of_house::hosting;

mod customer {
    pub fn eat_at_restaurant() {
        hosting::add_to_waitlist();
    }
}
```

编译器错误表明快捷方式不再适用于 `customer` 模块内：

```console
$ cargo build
   Compiling restaurant v0.1.0 (file:///projects/restaurant)
error[E0433]: failed to resolve: use of unresolved module or unlinked crate `hosting`
  --> src/lib.rs:11:9
   |
11 |         hosting::add_to_waitlist();
   |         ^^^^^^^ use of unresolved module or unlinked crate `hosting`
   |
   = help: if you wanted to use a crate named `hosting`, use `cargo add hosting` to add it to your `Cargo.toml`
help: consider importing this module through its public re-export
   |
10 +     use crate::hosting;
   |

warning: unused import: `crate::front_of_house::hosting`
 --> src/lib.rs:7:5
  |
7 | use crate::front_of_house::hosting;
  |     ^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^
  |
  = note: `#[warn(unused_imports)]` on by default

For more information about this error, try `rustc --explain E0433`.
warning: `restaurant` (lib) generated 1 warning
error: could not compile `restaurant` (lib) due to 1 previous error; 1 warning emitted
```

注意还有一个警告说 `use` 在其作用域中不再被使用！要解决这个问题，可以将 `use` 也移到 `customer` 模块中，或者在子 `customer` 模块中使用 `super::hosting` 引用父模块中的快捷方式。

## 创建惯用的 `use` 路径

在代码示例 7-11 中，你可能想知道为什么我们指定 `use crate::front_of_house::hosting` 然后在 `eat_at_restaurant` 中调用 `hosting::add_to_waitlist`，而不是将 `use` 路径一路指定到 `add_to_waitlist` 函数以获得相同的结果，如代码示例 7-13 所示。

**代码示例 7-13：使用 `use` 将 `add_to_waitlist` 函数引入作用域，这是非惯用写法**

```rust
mod front_of_house {
    pub mod hosting {
        pub fn add_to_waitlist() {}
    }
}

use crate::front_of_house::hosting::add_to_waitlist;

pub fn eat_at_restaurant() {
    add_to_waitlist();
}
```

虽然代码示例 7-11 和代码示例 7-13 都完成了相同的任务，但代码示例 7-11 是用 `use` 将函数引入作用域的惯用方式。将函数的父模块引入作用域意味着我们在调用函数时必须指定父模块。在调用函数时指定父模块可以清楚地表明该函数不是在本地定义的，同时仍然最小化完整路径的重复。代码示例 7-13 中的代码不清楚 `add_to_waitlist` 是在哪里定义的。

另一方面，当用 `use` 引入结构体、枚举和其他项时，指定完整路径是惯用的。代码示例 7-14 展示了将标准库的 `HashMap` 结构体引入二进制 crate 作用域的惯用方式。

**代码示例 7-14：以惯用方式将 `HashMap` 引入作用域**

```rust
use std::collections::HashMap;

fn main() {
    let mut map = HashMap::new();
    map.insert(1, 2);
}
```

这种惯用法背后没有强有力的理由：它只是已经成为约定的惯例，人们已经习惯了用这种方式阅读和编写 Rust 代码。

这种惯例的例外情况是，如果我们用 `use` 语句将两个同名的项引入作用域，因为 Rust 不允许这样做。代码示例 7-15 展示了如何将两个同名的 `Result` 类型引入作用域，它们有不同的父模块，以及如何引用它们。

**代码示例 7-15：将两个同名类型引入同一作用域需要使用它们的父模块**

```rust
use std::fmt;
use std::io;

fn function1() -> fmt::Result {
    // --snip--
    Ok(())
}

fn function2() -> io::Result<()> {
    // --snip--
    Ok(())
}
```

如你所见，使用父模块可以区分两个 `Result` 类型。如果我们改为指定 `use std::fmt::Result` 和 `use std::io::Result`，我们会在同一作用域中有两个 `Result` 类型，Rust 不知道当我们使用 `Result` 时指的是哪一个。

## 使用 `as` 关键字提供新名称

对于用 `use` 将两个同名类型引入同一作用域的问题，还有另一种解决方案：在路径之后，我们可以指定 `as` 和一个新的本地名称，或类型 _别名_ 。代码示例 7-16 展示了通过使用 `as` 重命名两个 `Result` 类型之一来编写代码示例 7-16 的另一种方式。

**代码示例 7-16：使用 `as` 关键字将类型引入作用域时重命名**

```rust
use std::fmt::Result;
use std::io::Result as IoResult;

fn function1() -> Result {
    // --snip--
    Ok(())
}

fn function2() -> IoResult<()> {
    // --snip--
    Ok(())
}
```

在第二个 `use` 语句中，我们为 `std::io::Result` 类型选择了新名称 `IoResult`，这不会与我们同时引入作用域的 `std::fmt` 中的 `Result` 冲突。代码示例 7-15 和代码示例 7-16 都被认为是惯用的，所以选择取决于你！

## 使用 `pub use` 重新导出名称

当我们用 `use` 关键字将名称引入作用域时，该名称对于导入它的作用域是私有的。为了让该作用域外的代码能够像在该作用域中定义的那样引用该名称，我们可以结合 `pub` 和 `use` 使用。这种技术称为 _重新导出_ ，因为我们把项引入作用域的同时也使其可供其他人引入他们的作用域。

代码示例 7-17 展示了将代码示例 7-11 中的 `use` 在根模块中改为 `pub use` 的代码。

**代码示例 7-17：使用 `pub use` 使名称可以从新作用域供任何代码使用**

```rust
mod front_of_house {
    pub mod hosting {
        pub fn add_to_waitlist() {}
    }
}

pub use crate::front_of_house::hosting;

pub fn eat_at_restaurant() {
    hosting::add_to_waitlist();
}
```

在此更改之前，外部代码必须通过路径 `restaurant::front_of_house::hosting::add_to_waitlist()` 调用 `add_to_waitlist` 函数，这也要求 `front_of_house` 模块标记为 `pub`。现在，由于这个 `pub use` 已经从根模块重新导出了 `hosting` 模块，外部代码可以使用路径 `restaurant::hosting::add_to_waitlist()` 来代替。

当你的代码内部结构与调用你代码的程序员思考领域的方式不同时，重新导出是很有用的。例如，在这个餐厅的比喻中，经营餐厅的人会考虑"前厅"和"后厨"。但光顾餐厅的顾客可能不会用这些术语来考虑餐厅的各个部分。通过 `pub use`，我们可以用一种结构编写代码，但暴露不同的结构。这样做使我们的库对从事库工作的程序员和调用库的程序员都很有条理。我们将在[第 14 章][ch14-export]的"导出一个方便的公共 API"中查看 `pub use` 的另一个示例以及它如何影响你的 crate 文档。

## 使用外部包

在第 2 章中，我们编写了一个猜数字游戏项目，使用了一个名为 `rand` 的外部包来获取随机数。要在我们的项目中使用 `rand`，我们将这一行添加到 _Cargo.toml_：

**Cargo.toml**

```toml
[dependencies]
rand = "0.8.5"
```

在 _Cargo.toml_ 中添加 `rand` 作为依赖项会告诉 Cargo 从 [crates.io](https://crates.io/) 下载 `rand` 包及其任何依赖项，并使 `rand` 对我们的项目可用。

然后，为了将 `rand` 定义引入我们包的作用域，我们添加了一行以 crate 名称 `rand` 开头的 `use` 行，并列出我们想要引入作用域的项。回想一下，在第 2 章的[生成随机数][ch02-random]中，我们将 `Rng` trait 引入作用域并调用了 `rand::thread_rng` 函数：

```rust
use rand::Rng;
use rand::distr::{Distribution, Uniform};

// ...
let secret_number = rand::thread_rng().gen_range(1..=101);
```

Rust 社区成员在 [crates.io](https://crates.io/) 上提供了许多包，将其中任何一个引入你的包都涉及相同的步骤：将它们列在你包的 _Cargo.toml_ 文件中，并使用 `use` 将它们 crate 中的项引入作用域。

请注意，标准的 `std` 库也是一个 crate，它对我们的包来说是外部的。因为标准库随 Rust 语言一起发布，我们不需要更改 _Cargo.toml_ 来包含 `std`。但我们确实需要使用 `use` 来将其中的项引入我们包的作用域。例如，使用 `HashMap` 我们会用这一行：

```rust
use std::collections::HashMap;
```

这是一个以 `std`（标准库 crate 的名称）开头的绝对路径。

## 使用嵌套路径清理 `use` 列表

如果我们正在使用在同一个 crate 或同一个模块中定义的多个项，将每一项单独列在一行会占用文件中大量的垂直空间。例如，我们在猜数字游戏的代码示例 2-4 中的这两个 `use` 语句将 `std` 中的项引入作用域：

**src/main.rs**

```rust
use rand::Rng;
// --snip--
use std::cmp::Ordering;
use std::io;
// --snip--
```

相反，我们可以使用嵌套路径在一行中将相同的项引入作用域。我们通过指定路径的公共部分，后跟两个冒号，然后用花括号括起路径中不同的部分列表，如代码示例 7-18 所示。

**代码示例 7-18：指定嵌套路径将具有相同前缀的多个项引入作用域**

```rust
use rand::Rng;
// --snip--
use std::{cmp::Ordering, io};
// --snip--
```

在更大的程序中，使用嵌套路径从同一个 crate 或模块引入多个项可以大大减少所需的单独 `use` 语句的数量！

我们可以在路径的任何级别使用嵌套路径，这在合并共享子路径的两个 `use` 语句时很有用。例如，代码示例 7-19 展示了两个 `use` 语句：一个将 `std::io` 引入作用域，一个将 `std::io::Write` 引入作用域。

**代码示例 7-19：两个 `use` 语句，其中一个是另一个的子路径**

```rust
use std::io;
use std::io::Write;
```

这两个路径的公共部分是 `std::io`，这也是第一个路径的完整路径。要将这两个路径合并为一个 `use` 语句，我们可以在嵌套路径中使用 `self`，如代码示例 7-20 所示。

**代码示例 7-20：将代码示例 7-19 中的路径合并为一个 `use` 语句**

```rust
use std::io::{self, Write};
```

这一行将 `std::io` 和 `std::io::Write` 引入作用域。

## 使用 Glob 运算符导入项

如果我们想将路径中定义的 _所有_ 公共项引入作用域，我们可以指定该路径后跟 `*` glob 运算符：

```rust
use std::collections::*;
```

这个 `use` 语句将 `std::collections` 中定义的所有公共项引入当前作用域。使用 glob 运算符时要小心！Glob 可能使你更难分辨哪些名称在作用域中，以及程序中使用的名称是在哪里定义的。此外，如果依赖项更改其定义，你导入的内容也会改变，这可能导致编译器错误，例如，当你升级依赖项时，如果依赖项添加了一个与你作用域中定义同名的定义。

Glob 运算符经常在测试时使用，将测试下的所有内容引入 `tests` 模块；我们将在[第 11 章][ch11-tests]的"如何编写测试"中讨论这个问题。

[ch14-export]: https://doc.rust-lang.org/book/ch14-02-publishing-to-crates-io.html#exporting-a-convenient-public-api
[ch02-random]: /rust-book/ch02-00-guessing-game-tutorial/#生成随机数
[ch11-tests]: https://doc.rust-lang.org/book/ch11-01-writing-tests.html#how-to-write-tests
