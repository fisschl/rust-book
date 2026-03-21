---
title: 路径引用模块树中的项
---

要像在文件系统中导航一样向 Rust 展示模块树中某个项的位置，我们需要使用路径。调用函数时，我们需要知道它的路径。

路径有两种形式：

- _绝对路径_ 是以 crate 根开始的完整路径；对于来自外部 crate 的代码，绝对路径以 crate 名称开头，对于来自当前 crate 的代码，它以 `crate` 字面量开头。
- _相对路径_ 从当前模块开始，使用 `self`、`super` 或当前模块中的标识符。

绝对路径和相对路径后面都跟一个或多个用双冒号（`::`）分隔的标识符。

回到代码示例 7-1，假设我们想调用 `add_to_waitlist` 函数。这就等于问：`add_to_waitlist` 函数的路径是什么？代码示例 7-3 包含了代码示例 7-1 的部分内容，其中一些模块和函数被删除了。

我们将展示两种从 crate 根中定义的新函数 `eat_at_restaurant` 调用 `add_to_waitlist` 函数的方式。这些路径是正确的，但还有一个问题会阻止这个示例按原样编译。我们稍后会解释原因。

`eat_at_restaurant` 函数是我们库 crate 公共 API 的一部分，所以我们用 `pub` 关键字标记它。在[“使用 `pub` 关键字暴露路径”](#使用-pub-关键字暴露路径)部分，我们将更详细地介绍 `pub`。

**代码示例 7-3：使用绝对和相对路径调用 `add_to_waitlist` 函数**

```rust
mod front_of_house {
    mod hosting {
        fn add_to_waitlist() {}
    }
}

pub fn eat_at_restaurant() {
    // 绝对路径
    crate::front_of_house::hosting::add_to_waitlist();

    // 相对路径
    front_of_house::hosting::add_to_waitlist();
}
```

我们第一次在 `eat_at_restaurant` 中调用 `add_to_waitlist` 函数时使用的是绝对路径。`add_to_waitlist` 函数与 `eat_at_restaurant` 定义在同一个 crate 中，这意味着我们可以使用 `crate` 关键字开始绝对路径。然后我们包含连续的每个模块，直到到达 `add_to_waitlist`。你可以想象一个具有相同结构的文件系统：我们会指定路径 `/front_of_house/hosting/add_to_waitlist` 来运行 `add_to_waitlist` 程序；使用 `crate` 名称从 crate 根开始就像在你的 shell 中使用 `/` 从文件系统根开始一样。

我们第二次在 `eat_at_restaurant` 中调用 `add_to_waitlist` 时使用的是相对路径。路径以 `front_of_house` 开头，这是与 `eat_at_restaurant` 在同一模块树层级定义的模块名称。这里的文件系统等价路径将是 `front_of_house/hosting/add_to_waitlist`。以模块名称开头意味着该路径是相对的。

选择使用相对路径还是绝对路径是你要基于项目做出的决定，这取决于你更可能单独移动项定义代码，还是与使用该项的代码一起移动。例如，如果我们将 `front_of_house` 模块和 `eat_at_restaurant` 函数一起移动到一个名为 `customer_experience` 的模块中，我们需要更新 `add_to_waitlist` 的绝对路径，但相对路径仍然有效。然而，如果我们将 `eat_at_restaurant` 函数单独移动到一个名为 `dining` 的模块中，`add_to_waitlist` 调用的绝对路径将保持不变，但相对路径需要更新。我们一般倾向于指定绝对路径，因为我们更可能希望独立移动代码定义和项调用。

让我们尝试编译代码示例 7-3，找出它为什么还不能编译！我们得到的错误如代码示例 7-4 所示。

**代码示例 7-4：编译代码示例 7-3 时的编译器错误**

```console
$ cargo build
   Compiling restaurant v0.1.0 (file:///projects/restaurant)
error[E0603]: module `hosting` is private
 --> src/lib.rs:9:28
  |
9 |     crate::front_of_house::hosting::add_to_waitlist();
  |                            ^^^^^^^  --------------- function `add_to_waitlist` is not publicly re-exported
  |                            |
  |                            private module
  |
note: the module `hosting` is defined here
 --> src/lib.rs:2:5
  |
2 |     mod hosting {
  |     ^^^^^^^^^^^

error[E0603]: module `hosting` is private
  --> src/lib.rs:12:21
   |
12 |     front_of_house::hosting::add_to_waitlist();
   |                     ^^^^^^^  --------------- function `add_to_waitlist` is not publicly re-exported
   |                     |
   |                     private module
   |
note: the module `hosting` is defined here
  --> src/lib.rs:2:5
   |
 2 |     mod hosting {
   |     ^^^^^^^^^^^

For more information about this error, try `rustc --explain E0603`.
error: could not compile `restaurant` (lib) due to 2 previous errors
```

错误消息说 `hosting` 模块是私有的。换句话说，我们找到了 `hosting` 模块和 `add_to_waitlist` 函数的正确路径，但 Rust 不允许我们使用它们，因为它没有访问私有部分的权限。在 Rust 中，所有项（函数、方法、结构体、枚举、模块和常量）默认对父模块是私有的。如果你想让函数或结构体成为私有，就把它放在一个模块中。

父模块中的项不能使用子模块中的私有项，但子模块中的项可以使用它们祖先模块中的项。这是因为子模块包装并隐藏了它们的实现细节，但子模块可以看到它们定义的上下文。继续我们的比喻，把隐私规则想象成餐厅的后厨：里面发生的事情对餐厅顾客来说是私有的，但办公室经理可以看到并操作他们经营的餐厅里的一切。

Rust 选择让模块系统以这种方式工作，以便隐藏内部实现细节是默认行为。这样，你就知道可以在不破坏外部代码的情况下更改内部代码的哪些部分。然而，Rust 确实允许你通过使用 `pub` 关键字将子模块内部的部分代码暴露给外部祖先模块，从而使项变为公共的。

## 使用 `pub` 关键字暴露路径

让我们回到代码示例 7-4 中告诉我们 `hosting` 模块是私有的错误。我们希望父模块中的 `eat_at_restaurant` 函数能访问子模块中的 `add_to_waitlist` 函数，因此我们标记 `hosting` 模块为 `pub`，如代码示例 7-5 所示。

**代码示例 7-5：声明 `hosting` 模块为 `pub` 以从 `eat_at_restaurant` 使用它**

```rust
mod front_of_house {
    pub mod hosting {
        fn add_to_waitlist() {}
    }
}

// -- snip --

pub fn eat_at_restaurant() {
    // 绝对路径
    crate::front_of_house::hosting::add_to_waitlist();

    // 相对路径
    front_of_house::hosting::add_to_waitlist();
}
```

不幸的是，代码示例 7-5 仍然会导致编译器错误，如代码示例 7-6 所示。

**代码示例 7-6：编译代码示例 7-5 时的编译器错误**

```console
$ cargo build
   Compiling restaurant v0.1.0 (file:///projects/restaurant)
error[E0603]: function `add_to_waitlist` is private
  --> src/lib.rs:10:37
   |
10 |     crate::front_of_house::hosting::add_to_waitlist();
   |                                     ^^^^^^^^^^^^^^^ private function
   |
note: the function `add_to_waitlist` is defined here
  --> src/lib.rs:3:9
   |
 3 |         fn add_to_waitlist() {}
   |         ^^^^^^^^^^^^^^^^^^^^

error[E0603]: function `add_to_waitlist` is private
  --> src/lib.rs:13:30
   |
13 |     front_of_house::hosting::add_to_waitlist();
   |                              ^^^^^^^^^^^^^^^ private function
   |
note: the function `add_to_waitlist` is defined here
  --> src/lib.rs:3:9
   |
 3 |         fn add_to_waitlist() {}
   |         ^^^^^^^^^^^^^^^^^^^^

For more information about this error, try `rustc --explain E0603`.
error: could not compile `restaurant` (lib) due to 2 previous errors
```

发生了什么？在 `mod hosting` 前面添加 `pub` 关键字会使模块成为公共的。有了这个更改，如果我们可以访问 `front_of_house`，就可以访问 `hosting`。但 `hosting` 的 _内容_ 仍然是私有的；使模块成为公共的并不会使它的内容成为公共的。模块上的 `pub` 关键字只允许其祖先模块中的代码引用它，而不能访问其内部代码。因为模块是容器，仅仅使模块成为公共的并不能让我们做太多事情；我们需要更进一步，选择使模块内的一个或多个项也成为公共的。

代码示例 7-6 中的错误说 `add_to_waitlist` 函数是私有的。隐私规则同样适用于结构体、枚举、函数和方法以及模块。

让我们也通过在其定义前添加 `pub` 关键字使 `add_to_waitlist` 函数成为公共的，如代码示例 7-7 所示。

**代码示例 7-7：向 `mod hosting` 和 `fn add_to_waitlist` 添加 `pub` 关键字，让我们可以从 `eat_at_restaurant` 调用该函数**

```rust
mod front_of_house {
    pub mod hosting {
        pub fn add_to_waitlist() {}
    }
}

// -- snip --

pub fn eat_at_restaurant() {
    // 绝对路径
    crate::front_of_house::hosting::add_to_waitlist();

    // 相对路径
    front_of_house::hosting::add_to_waitlist();
}
```

现在代码可以编译了！要了解为什么添加 `pub` 关键字能让我们在 `eat_at_restaurant` 中使用这些路径，让我们看看绝对路径和相对路径。

在绝对路径中，我们以 `crate` 开头，这是我们 crate 模块树的根。`front_of_house` 模块定义在 crate 根中。虽然 `front_of_house` 不是公共的，但因为 `eat_at_restaurant` 函数与 `front_of_house` 定义在同一个模块中（也就是说，`eat_at_restaurant` 和 `front_of_house` 是兄弟关系），我们可以在 `eat_at_restaurant` 中引用 `front_of_house`。接下来是标记为 `pub` 的 `hosting` 模块。我们可以访问 `hosting` 的父模块，因此我们可以访问 `hosting`。最后，`add_to_waitlist` 函数标记为 `pub`，我们可以访问它的父模块，所以这个函数调用成功了！

在相对路径中，逻辑与绝对路径相同，除了第一步：路径不是从 crate 根开始，而是从 `front_of_house` 开始。`front_of_house` 模块与 `eat_at_restaurant` 定义在同一个模块中，因此从 `eat_at_restaurant` 定义的模块开始的相对路径是有效的。然后，因为 `hosting` 和 `add_to_waitlist` 标记为 `pub`，路径的其余部分也有效，这个函数调用是有效的！

如果你计划分享你的库 crate，让其他项目可以使用你的代码，你的公共 API 是你与 crate 用户之间的契约，决定了他们如何与你的代码交互。管理公共 API 变更有许多考虑因素，以便让人们更容易依赖你的 crate。这些考虑因素超出了本书的范围；如果你对这个话题感兴趣，请参阅 [Rust API 指南](https://rust-lang.github.io/api-guidelines/)。

> **同时包含二进制文件和库的包的最佳实践**
>
> 我们提到，一个包可以同时包含 _src/main.rs_ 二进制 crate 根和 _src/lib.rs_ 库 crate 根，而且两个 crate 默认都会有包的名称。通常，具有这种同时包含库和二进制 crate 模式的包会在二进制 crate 中只放足够的代码来启动一个可执行文件，该可执行文件调用在库 crate 中定义的代码。这让其他项目能够受益于该包提供的最大功能，因为库 crate 的代码可以共享。
>
> 模块树应该在 _src/lib.rs_ 中定义。然后，任何公共项都可以在二进制 crate 中使用，路径以包的名称开头。二进制 crate 成为库 crate 的用户，就像完全外部的 crate 会使用库 crate 一样：它只能使用公共 API。这有助于你设计一个良好的 API；不仅你是作者，你也是用户！
>
> 在[第 12 章][ch12]中，我们将用包含二进制 crate 和库 crate 的命令行程序来演示这种组织实践。

## 以 `super` 开始相对路径

我们可以通过使用 `super` 在路径开头来构建从父模块开始的相对路径，而不是当前模块或 crate 根。这类似于以 `..` 语法开始的文件系统路径，意思是进入父目录。使用 `super` 允许我们引用我们知道在父模块中的项，当模块与父模块密切相关但父模块某天可能移到模块树的其他位置时，这可以使重新排列模块树更容易。

考虑代码示例 7-8 中的代码，它模拟了厨师修正错误订单并亲自将其送到顾客手中的情况。在 `back_of_house` 模块中定义的 `fix_incorrect_order` 函数通过指定以 `super` 开头的 `deliver_order` 路径来调用在父模块中定义的 `deliver_order` 函数。

**代码示例 7-8：使用以 `super` 开头的相对路径调用函数**

```rust
fn deliver_order() {}

mod back_of_house {
    fn fix_incorrect_order() {
        cook_order();
        super::deliver_order();
    }

    fn cook_order() {}
}
```

`fix_incorrect_order` 函数在 `back_of_house` 模块中，因此我们可以使用 `super` 进入 `back_of_house` 的父模块，在这个例子中是 `crate`，即根目录。从那里，我们查找 `deliver_order` 并找到了它。成功！我们认为 `back_of_house` 模块和 `deliver_order` 函数可能保持相同的关系，如果我们决定重组 crate 的模块树，它们会一起移动。因此，我们使用 `super`，这样如果这段代码被移到不同的模块，将来需要更新的地方会更少。

## 使结构体和枚举成为公共的

我们也可以使用 `pub` 将结构体和枚举指定为公共的，但在结构体和枚举上使用 `pub` 有一些额外的细节。如果我们在结构体定义前使用 `pub`，我们会使结构体成为公共的，但结构体的字段仍然是私有的。我们可以根据情况将每个字段设为公共的或私有的。在代码示例 7-9 中，我们定义了一个公共的 `back_of_house::Breakfast` 结构体，有一个公共的 `toast` 字段但有一个私有的 `seasonal_fruit` 字段。这模拟了餐厅中的情况：顾客可以选择随餐附带的面包类型，但厨师根据季节和库存决定搭配哪种水果。可用的水果变化很快，所以顾客不能选择水果，甚至不能看到他们能得到哪种水果。

**代码示例 7-9：有公共字段和私有字段的结构体**

```rust
mod back_of_house {
    pub struct Breakfast {
        pub toast: String,
        seasonal_fruit: String,
    }

    impl Breakfast {
        pub fn summer(toast: &str) -> Breakfast {
            Breakfast {
                toast: String::from(toast),
                seasonal_fruit: String::from("peaches"),
            }
        }
    }
}

pub fn eat_at_restaurant() {
    // 在夏天订购一份配黑麦吐司的早餐。
    let mut meal = back_of_house::Breakfast::summer("Rye");
    // 改变我们对想要面包的想法。
    meal.toast = String::from("Wheat");
    println!("I'd like {} toast please", meal.toast);

    // 如果取消注释下一行则不会编译；我们不允许查看或修改随餐附带的时令水果。
    // meal.seasonal_fruit = String::from("blueberries");
}
```

因为 `back_of_house::Breakfast` 结构体中的 `toast` 字段是公共的，在 `eat_at_restaurant` 中我们可以使用点符号写入和读取 `toast` 字段。请注意，我们不能在 `eat_at_restaurant` 中使用 `seasonal_fruit` 字段，因为 `seasonal_fruit` 是私有的。尝试取消注释修改 `seasonal_fruit` 字段值的行，看看你会得到什么错误！

另外，请注意因为 `back_of_house::Breakfast` 有一个私有字段，结构体需要提供一个公共的关联函数来构造 `Breakfast` 的实例（我们这里命名为 `summer`）。如果 `Breakfast` 没有这样的函数，我们就不能在 `eat_at_restaurant` 中创建 `Breakfast` 的实例，因为我们就不能在 `eat_at_restaurant` 中设置私有 `seasonal_fruit` 字段的值。

相反，如果我们使枚举成为公共的，它的所有变体就都变成公共的了。我们只需要在 `enum` 关键字前加 `pub`，如代码示例 7-10 所示。

**代码示例 7-10：将枚举指定为公共的使其所有变体都成为公共的**

```rust
mod back_of_house {
    pub enum Appetizer {
        Soup,
        Salad,
    }
}

pub fn eat_at_restaurant() {
    let order1 = back_of_house::Appetizer::Soup;
    let order2 = back_of_house::Appetizer::Salad;
}
```

因为我们使 `Appetizer` 枚举成为公共的，我们可以在 `eat_at_restaurant` 中使用 `Soup` 和 `Salad` 变体。

除非枚举的变体是公共的，否则枚举就没太大用处；每次都必须用 `pub` 注解所有枚举变体会很烦人，所以枚举变体的默认状态是公共的。结构体通常在字段不是公共的情况下也很有用，所以结构体字段遵循默认所有都是私有的规则，除非用 `pub` 注解。

还有一种涉及 `pub` 的情况我们还没有涵盖，那就是我们最后一个模块系统特性：`use` 关键字。我们将先单独介绍 `use`，然后再展示如何结合 `pub` 和 `use` 使用。

[ch12]: https://doc.rust-lang.org/book/ch12-00-an-io-project.html
