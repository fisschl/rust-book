---
title: 20.4. 高级函数和闭包
---

本节探讨与函数和闭包相关的一些高级特性，包括函数指针和返回闭包。

## 函数指针

我们已经讨论了如何将闭包传递给函数；你也可以将普通函数传递给函数！当你想要传递一个你已经定义好的函数而不是定义一个新闭包时，这种技术非常有用。函数强制转换为类型 `fn`（小写 _f_），不要与 `Fn` 闭包 Trait 混淆。`fn` 类型称为 **函数指针** 。使用函数指针传递函数将允许你使用函数作为其他函数的参数。

指定参数是函数指针的语法类似于闭包，如清单 20-28 所示，其中我们定义了一个函数 `add_one`，它将其参数加 1。函数 `do_twice` 接受两个参数：一个指向任何接受 `i32` 参数并返回 `i32` 的函数的函数指针，以及一个 `i32` 值。`do_twice` 函数调用函数 `f` 两次，传递 `arg` 值，然后将两个函数调用结果相加。`main` 函数使用参数 `add_one` 和 `5` 调用 `do_twice`。

**清单 20-28**：使用 `fn` 类型接受函数指针作为参数（文件名：src/main.rs）

```rust
fn add_one(x: i32) -> i32 {
    x + 1
}

fn do_twice(f: fn(i32) -> i32, arg: i32) -> i32 {
    f(arg) + f(arg)
}

fn main() {
    let answer = do_twice(add_one, 5);

    println!("The answer is: {answer}");
}
```

这段代码打印 `The answer is: 12`。我们指定 `do_twice` 中的参数 `f` 是一个 `fn`，它接受一个 `i32` 类型的参数并返回一个 `i32`。然后，我们可以在 `do_twice` 的主体中调用 `f`。在 `main` 中，我们可以将函数名 `add_one` 作为第一个参数传递给 `do_twice`。

与闭包不同，`fn` 是一个类型而不是 Trait，所以我们直接指定 `fn` 作为参数类型，而不是声明一个带有 `Fn` Trait 之一作为 Trait bound 的泛型类型参数。

函数指针实现了所有三个闭包 Trait（`Fn`、`FnMut` 和 `FnOnce`），这意味着你总是可以将函数指针作为参数传递给期望闭包的函数。最好使用泛型类型和闭包 Trait 之一来编写函数，这样你的函数可以接受函数或闭包。

也就是说，有一个例子说明你只想要接受 `fn` 而不接受闭包：当与没有闭包的外部代码交互时，C 函数可以接受函数作为参数，但 C 没有闭包。

作为一个你可以使用内联定义的闭包或命名函数的例子，让我们看一下标准库中 `Iterator` Trait 提供的 `map` 方法的使用。要使用 `map` 方法将数字向量转换为字符串向量，我们可以使用闭包，如清单 20-29 所示。

**清单 20-29**：使用闭包与 `map` 方法将数字转换为字符串

**文件名：src/main.rs**

```rust
fn main() {
    let list_of_numbers = vec![1, 2, 3];
    let list_of_strings: Vec<String> =
        list_of_numbers.iter().map(|i| i.to_string()).collect();
}
```

或者我们可以将命名函数作为参数传递给 `map` 而不是闭包。清单 20-30 展示了这会是什么样子。

**清单 20-30**：使用 `String::to_string` 函数与 `map` 方法将数字转换为字符串

**文件名：src/main.rs**

```rust
fn main() {
    let list_of_numbers = vec![1, 2, 3];
    let list_of_strings: Vec<String> =
        list_of_numbers.iter().map(ToString::to_string).collect();
}
```

请注意，我们必须使用在[高级 Trait][advanced-traits]一节中讨论的完全限定语法，因为有多个可用的函数名为 `to_string`。

这里，我们使用的是在 `ToString` Trait 中定义的 `to_string` 函数，标准库为任何实现 `Display` 的类型都实现了该 Trait。

回想一下第 6 章的[枚举值][enum-values]一节，我们定义的每个枚举变体的名称也成为初始化函数。我们可以使用这些初始化函数作为实现闭包 Trait 的函数指针，这意味着我们可以将初始化函数指定为接受闭包的方法的参数，如清单 20-31 所示。

**清单 20-31**：使用枚举初始化函数与 `map` 方法从数字创建 `Status` 实例

**文件名：src/main.rs**

```rust
fn main() {
    enum Status {
        Value(u32),
        Stop,
    }

    let list_of_statuses: Vec<Status> = (0u32..20).map(Status::Value).collect();
}
```

在这里，我们通过使用 `Status::Value` 的初始化函数，为 `map` 被调用范围内的每个 `u32` 值创建 `Status::Value` 实例。有些人更喜欢这种风格，有些人更喜欢使用闭包。它们编译成相同的代码，所以使用对你来说更清晰的那种风格。

## 返回闭包

闭包由 Trait 表示，这意味着你不能直接返回闭包。在大多数情况下，当你可能想要返回一个 Trait 时，你可以转而使用实现该 Trait 的具体类型作为函数的返回值。然而，你通常不能对闭包这样做，因为它们没有可返回的具体类型；如果闭包从其作用域捕获任何值，则不允许你使用函数指针 `fn` 作为返回类型。

相反，你通常会使用我们在第 10 章中学到的 `impl Trait` 语法。你可以返回任何函数类型，使用 `Fn`、`FnOnce` 和 `FnMut`。例如，清单 20-32 中的代码将编译得很好。

**清单 20-32**：使用 `impl Trait` 语法从函数返回闭包

**文件名：src/lib.rs**

```rust
fn returns_closure() -> impl Fn(i32) -> i32 {
    |x| x + 1
}
```

然而，正如我们在第 13 章的[推断和标注闭包类型][closure-types]一节中提到的，每个闭包也是其自己不同的类型。如果你需要处理具有相同签名但不同实现的多个函数，你将需要对它们使用 Trait 对象。考虑如果你编写如清单 20-33 所示的代码会发生什么。

**清单 20-33**：创建由返回 `impl Fn` 类型的函数定义的闭包 `Vec<T>`（文件名：src/main.rs）

```rust
fn main() {
    let handlers = vec![returns_closure(), returns_initialized_closure(123)];
    for handler in handlers {
        let output = handler(5);
        println!("{output}");
    }
}

fn returns_closure() -> impl Fn(i32) -> i32 {
    |x| x + 1
}

fn returns_initialized_closure(init: i32) -> impl Fn(i32) -> i32 {
    move |x| x + init
}
```

在这里，我们有两个函数，`returns_closure` 和 `returns_initialized_closure`，它们都返回 `impl Fn(i32) -> i32`。请注意，它们返回的闭包是不同的，即使它们实现了相同的类型。如果我们尝试编译这个，Rust 会告诉我们这行不通：

```text
error: concrete type differs from previous defining opaque type use
  --> src/main.rs:2:41
   |
2  |     let handlers = vec![returns_closure(), returns_initialized_closure(123)];
   |                                         ^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^ expected `{closure@src/main.rs:10:5: 10:14}`, found `{closure@src/main.rs:14:5: 14:23}`
   |
note: defining opaque type use is in the same scope
  --> src/main.rs:2:24
   |
2  |     let handlers = vec![returns_closure(), returns_initialized_closure(123)];
   |                        ^^^^^^^^^^^^^^^^^^

For more information about this error, try `rustc --explain E0308`.
error: could not compile `example` (bin "example") due to 1 previous error
```

错误消息告诉我们，每当我们返回一个 `impl Trait` 时，Rust 会创建一个唯一的 **不透明类型** ，一种我们无法查看 Rust 为我们构造的细节的类型，我们也无法猜测 Rust 将生成的类型来自己编写。因此，即使这些函数返回实现相同 Trait `Fn(i32) -> i32` 的闭包，Rust 为每个函数生成的不透明类型是不同的。（这类似于当异步块具有相同的输出类型时，Rust 为不同的异步块生成不同的具体类型，如我们在第 17 章的[`Pin` 类型和 `Unpin` Trait][future-types]一节中看到的。）我们已经多次看到这个问题的一个解决方案：我们可以使用 Trait 对象，如清单 20-34 所示。

**清单 20-34**：创建由返回 `Box<dyn Fn>` 的函数定义的闭包 `Vec<T>`，使它们具有相同的类型

**文件名：src/main.rs**

```rust
fn main() {
    let handlers = vec![returns_closure(), returns_initialized_closure(123)];
    for handler in handlers {
        let output = handler(5);
        println!("{output}");
    }
}

fn returns_closure() -> Box<dyn Fn(i32) -> i32> {
    Box::new(|x| x + 1)
}

fn returns_initialized_closure(init: i32) -> Box<dyn Fn(i32) -> i32> {
    Box::new(move |x| x + init)
}
```

这段代码将编译得很好。有关 Trait 对象的更多信息，请参阅第 18 章的[使用 Trait 对象抽象共享行为][trait-objects]一节。

接下来，让我们看看宏！

[advanced-traits]: /rust-book/ch20-02-advanced-traits
[enum-values]: /rust-book/ch06-01-defining-an-enum#枚举值
[closure-types]: /rust-book/ch13-01-closures#推断和标注闭包类型
[future-types]: /rust-book/ch17-03-more-futures
[trait-objects]: /rust-book/ch18-02-trait-objects
