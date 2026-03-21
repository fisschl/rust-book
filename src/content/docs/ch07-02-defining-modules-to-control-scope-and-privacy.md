---
title: "用模块控制作用域和隐私"
---

在本节中，我们将讨论模块和模块系统的其他部分，即*路径*，它允许你命名项目；`use` 关键字，它将路径引入作用域；以及 `pub` 关键字，它使项目公开。我们还将讨论 `as` 关键字、外部包和 glob 操作符。

### 模块速查表

在我们深入了解模块和路径的细节之前，这里我们提供了一个关于模块、路径、`use` 关键字和 `pub` 关键字在编译器中的工作原理，以及大多数开发人员如何组织他们的代码的快速参考。我们将在本章中逐一介绍这些规则的示例，但这是一个很好的地方，可以作为模块如何工作的提醒来参考。

- **从 crate 根开始**：当编译 crate 时，编译器首先查看 crate 根文件（库 crate 通常是 *src/lib.rs*，二进制 crate 通常是 *src/main.rs*）以查找要编译的代码。
- **声明模块**：在 crate 根文件中，你可以声明新模块；例如，你用 `mod garden;` 声明一个"garden"模块。编译器将在以下位置查找模块的代码：
  - 内联，在替换 `mod garden` 后面分号的大括号内
  - 在文件 *src/garden.rs* 中
  - 在文件 *src/garden/mod.rs* 中
- **声明子模块**：在除 crate 根之外的任何文件中，你可以声明子模块。例如，你可以在 *src/garden.rs* 中声明 `mod vegetables;`。编译器将在以父模块命名的目录中查找子模块的代码：
  - 内联，直接跟在 `mod vegetables` 后面，用大括号代替分号
  - 在文件 *src/garden/vegetables.rs* 中
  - 在文件 *src/garden/vegetables/mod.rs* 中
- **模块中代码的路径**：一旦模块成为你 crate 的一部分，只要隐私规则允许，你就可以从同一 crate 中的任何其他地方使用代码路径来引用该模块中的代码。例如，garden vegetables 模块中的 `Asparagus` 类型可以在 `crate::garden::vegetables::Asparagus` 找到。
- **私有与公共**：模块中的代码默认对其父模块是私有的。要使模块公开，请用 `pub mod` 而不是 `mod` 声明它。要使公共模块中的项目也公开，请在它们的声明前使用 `pub`。
- **`use` 关键字**：在作用域内，`use` 关键字创建项目的快捷方式，以减少长路径的重复。在可以引用 `crate::garden::vegetables::Asparagus` 的任何作用域中，你可以用 `use crate::garden::vegetables::Asparagus;` 创建一个快捷方式，从那时起，你只需要写 `Asparagus` 就可以在该作用域中使用该类型。

在这里，我们创建了一个名为 `backyard` 的二进制 crate 来说明这些规则。该 crate 的目录，也名为 *backyard*，包含这些文件和目录：

```text
backyard
├── Cargo.lock
├── Cargo.toml
└── src
    ├── garden
    │   └── vegetables.rs
    ├── garden.rs
    └── main.rs
```

在本例中，crate 根文件是 *src/main.rs*，它包含：

**文件名：`src/main.rs`**

```rust
use crate::garden::vegetables::Asparagus;

pub mod garden;

fn main() {
    let plant = Asparagus {};
    println!("I'm growing {plant:?}!");
}
```

`pub mod garden;` 行告诉编译器包含它在 *src/garden.rs* 中找到的代码，内容是：

**文件名：`src/garden.rs`**

```rust
pub mod vegetables;
```

这里，`pub mod vegetables;` 意味着 *src/garden/vegetables.rs* 中的代码也被包含。代码是：

**文件名：`src/garden/vegetables.rs`**

```rust
#[derive(Debug)]
pub struct Asparagus {}
```

现在让我们深入了解这些规则的详细信息，并在实际操作中演示它们！

### 在模块中分组相关代码

*模块*让我们为了在可读性和易于重用而在 crate 中组织代码。模块还允许我们控制项目的*隐私*，因为模块中的代码默认是私有的。私有项目是内部实现细节，不供外部使用。我们可以选择使模块和其中的项目公开，从而暴露它们以允许外部代码使用和依赖它们。

作为示例，让我们编写一个提供餐厅功能的库 crate。我们将定义函数的签名，但将它们的实现留空，以专注于代码的组织，而不是餐厅的具体实现。

在餐饮业中，餐厅的一些部分被称为前厅，另一些被称为后厅。*前厅*是顾客所在的地方；这包括主持人安排顾客入座、服务员接受订单和付款、调酒师制作饮料的地方。*后厅*是厨师和厨房工作人员在厨房工作、洗碗工打扫、经理做行政工作的地方。

为了以这种方式构建我们的 crate，我们可以将其函数组织成嵌套模块。通过运行 `cargo new restaurant --lib` 创建一个名为 `restaurant` 的新库。然后，将代码清单 7-1 中的代码输入 *src/lib.rs* 以定义一些模块和函数签名；这段代码是前厅部分。

**文件名：`src/lib.rs`**

```rust
mod front_of_house {
    mod hosting {
        fn add_to_waitlist() {}

        fn seat_at_table() {}
    }

    mod serving {
        fn take_order() {}

        fn serve_order() {}

        fn take_payment() {}
    }
}
```

我们用 `mod` 关键字后跟模块名称（在本例中为 `front_of_house`）来定义一个模块。然后模块的主体放入大括号内。在模块内部，我们可以放置其他模块，在本例中就是 `hosting` 和 `serving` 模块。模块还可以包含其他项目的定义，例如结构体、枚举、常量、trait，以及如代码清单 7-1 中的函数。

通过使用模块，我们可以将相关定义分组在一起，并命名它们为什么相关。使用这段代码的程序员可以根据组来导航代码，而不必通读所有定义，从而更容易找到与他们相关的定义。向这段代码添加新功能的程序员会知道将代码放在哪里以保持程序的组织性。

早些时候，我们提到 *src/main.rs* 和 *src/lib.rs* 被称为 *crate 根*。它们名称的原因是这两个文件中任何一个的内容在 crate 模块结构的根部形成一个名为 `crate` 的模块，称为*模块树*。

代码清单 7-2 展示了代码清单 7-1 中结构的模块树。

```text
crate
 └── front_of_house
     ├── hosting
     │   ├── add_to_waitlist
     │   └── seat_at_table
     └── serving
         ├── take_order
         ├── serve_order
         └── take_payment
```

这棵树展示了某些模块如何嵌套在其他模块中；例如，`hosting` 嵌套在 `front_of_house` 中。树还展示了一些模块是*兄弟*关系，意味着它们是在同一模块中定义的；`hosting` 和 `serving` 是在 `front_of_house` 中定义的兄弟。如果模块 A 包含在模块 B 内，我们说模块 A 是模块 B 的*子模块*，模块 B 是模块 A 的*父模块*。注意整个模块树都根植于隐式模块 `crate` 下。

模块树可能会让你想起计算机上的文件系统目录树；这是一个非常恰当的比较！就像文件系统中的目录一样，你使用模块来组织你的代码。就像目录中的文件一样，我们需要一种方法来查找我们的模块。
