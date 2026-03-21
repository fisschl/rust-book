---
title: "RefCell<T> 和内部可变性模式"
---

_内部可变性_ 是 Rust 中的一种设计模式，允许你在存在对该数据的不可变引用时改变数据；通常情况下，这种操作会被借用规则禁止。要改变数据，该模式使用数据结构内部的 `unsafe` 代码来绕过 Rust 通常的突变和借用规则。不安全代码向编译器表明我们正在手动检查规则，而不是依赖编译器为我们检查；我们将在第20章中更多地讨论不安全代码。

只有当我们能确保在运行时遵循借用规则时，即使编译器无法保证，我们也可以使用使用内部可变性模式的类型。然后将涉及的不安全代码包装在安全的 API 中，外层类型仍然是不可变的。

让我们通过查看遵循内部可变性模式的 `RefCell<T>` 类型来探索这个概念。

### 在运行时强制执行借用规则

与 `Rc<T>` 不同，`RefCell<T>` 类型表示对其持有的数据的单一所有权。那么，是什么让 `RefCell<T>` 与 `Box<T>` 这样的类型不同呢？回想一下你在第4章学到的借用规则：

- 在任何给定时间，你 _要么_ 有一个可变引用， _要么_ 有任意数量的不可变引用（但不能两者都有）。
- 引用必须始终有效。

对于引用和 `Box<T>`，借用规则的不变量在编译时强制执行。对于 `RefCell<T>`，这些不变量是在 _运行时_ 强制执行的。对于引用，如果你违反这些规则，你会得到编译错误。对于 `RefCell<T>`，如果你违反这些规则，你的程序会 panic 并退出。

在编译时检查借用规则的优势是错误会在开发过程的早期被发现，并且对运行时性能没有影响，因为所有分析都是预先完成的。由于这些原因，在大多数情况下，在编译时检查借用规则是最佳选择，这就是为什么这是 Rust 的默认行为。

在运行时检查借用规则的优势是某些内存安全的场景被允许，而在编译时检查下它们会被禁止。静态分析，如 Rust 编译器，本质上是保守的。某些代码属性不可能通过分析代码来检测：最著名的例子是停机问题，这超出了本书的范围，但这是一个有趣的研究课题。

因为某些分析是不可能的，如果 Rust 编译器不能确定代码符合所有权规则，它可能会拒绝一个正确的程序；这样，它是保守的。如果 Rust 接受一个不正确的程序，用户将无法信任 Rust 做出的保证。然而，如果 Rust 拒绝一个正确的程序，程序员会不方便，但不会发生灾难性的事情。当你确定你的代码遵循借用规则但编译器无法理解并保证这一点时，`RefCell<T>` 类型是有用的。

类似于 `Rc<T>`，`RefCell<T>` 仅用于单线程场景，如果你尝试在多线程上下文中使用它，会给你一个编译时错误。我们将在第16章讨论如何在多线程程序中获得 `RefCell<T>` 的功能。

以下是选择 `Box<T>`、`Rc<T>` 或 `RefCell<T>` 的原因总结：

- `Rc<T>` 启用对相同数据的多个所有权；`Box<T>` 和 `RefCell<T>` 有单一所有者。
- `Box<T>` 允许在编译时检查的不可变或可变借用；`Rc<T>` 只允许在编译时检查的不可变借用；`RefCell<T>` 允许在运行时检查的不可变或可变借用。
- 因为 `RefCell<T>` 允许在运行时检查的可变借用，所以即使 `RefCell<T>` 是不可变的，你也可以改变 `RefCell<T>` 内部的值。

改变不可变值内部的值是内部可变性模式。让我们看看内部可变性有用的情况，并探讨它是如何实现的。

### 使用内部可变性

借用规则的一个后果是，当你有一个不可变值时，你不能可变地借用。例如，这段代码将无法编译：

```rust
fn main() {
    let x = 5;
    let y = &mut x;
}
```

如果你尝试编译这段代码，你会得到以下错误：

```console
$ cargo run
   Compiling borrowing v0.1.0 (file:///projects/borrowing)
error[E0596]: cannot borrow `x` as mutable, as it is not declared as mutable
 --> src/main.rs:3:13
  |
3 |     let y = &mut x;
  |             ^^^^^^ cannot borrow as mutable
  |
help: consider changing this to be mutable
  |
2 |     let mut x = 5;
  |         +++

For more information about this error, try `rustc --explain E0596`.
error: could not compile `borrowing` (bin "borrowing") due to 1 previous error
```

然而，在某些情况下，值在其方法中改变自身但对其他代码显示为不可变是有用的。值的方法之外的代码不能改变该值。使用 `RefCell<T>` 是获得内部可变性能力的一种方式，但 `RefCell<T>` 并不能完全绕过借用规则：编译器中的借用检查器允许这种内部可变性，借用规则在运行时检查。如果你违反规则，你会得到 `panic!` 而不是编译错误。

让我们通过一个实际例子来看看我们可以使用 `RefCell<T>` 来改变不可变值，以及为什么这是有用的。

#### 使用 Mock 对象进行测试

有时在测试期间，程序员会用一种类型代替另一种类型，以观察特定行为并断言它被正确实现。这个占位符类型被称为 _test double_。把它想象成电影制作中的替身演员，一个人代替演员完成特别棘手的场景。当我们运行测试时，test double 代替其他类型。_Mock 对象_ 是特定类型的 test double，记录测试期间发生的事情，以便你可以断言发生了正确的动作。

Rust 没有像其他语言那样意义上的对象，Rust 也没有像其他语言那样在标准库中内置 mock 对象功能。然而，你绝对可以创建一个结构体来服务于与 mock 对象相同的目的。

以下是我们将要测试的场景：我们将创建一个库，该库根据当前值与最大值的接近程度来跟踪值，并根据当前值与最大值的接近程度发送消息。例如，这个库可以用来跟踪用户被允许进行的 API 调用次数的配额。

我们的库将只提供跟踪值与最大值的接近程度以及消息应该在何时发送的功能。使用我们库的应用程序将需要提供发送消息的机制：应用程序可以直接向用户显示消息、发送电子邮件、发送短信或做其他事情。库不需要知道这些细节。它所需要的只是实现了我们将提供的 trait 的东西，称为 `Messenger`。清单 15-20 显示了库代码。

**代码示例 15-20**：一个库，用于跟踪值与最大值的接近程度，并在值达到某些级别时发出警告

```rust
pub trait Messenger {
    fn send(&self, msg: &str);
}

pub struct LimitTracker<'a, T: Messenger> {
    messenger: &'a T,
    value: usize,
    max: usize,
}

impl<'a, T> LimitTracker<'a, T>
where
    T: Messenger,
{
    pub fn new(messenger: &'a T, max: usize) -> LimitTracker<'a, T> {
        LimitTracker {
            messenger,
            value: 0,
            max,
        }
    }

    pub fn set_value(&mut self, value: usize) {
        self.value = value;

        let percentage_of_max = self.value as f64 / self.max as f64;

        if percentage_of_max >= 1.0 {
            self.messenger.send("Error: You are over your quota!");
        } else if percentage_of_max >= 0.9 {
            self.messenger
                .send("Urgent warning: You've used up over 90% of your quota!");
        } else if percentage_of_max >= 0.75 {
            self.messenger
                .send("Warning: You've used up over 75% of your quota!");
        }
    }
}
```

这段代码的一个重要部分是 `Messenger` trait 有一个名为 `send` 的方法，它接受对 `self` 的不可变引用和消息的文本。这个 trait 是我们的 mock 对象需要实现的接口，以便 mock 可以以与真实对象相同的方式使用。另一个重要部分是我们想要测试 `LimitTracker` 上 `set_value` 方法的行为。我们可以改变传递给 `value` 参数的内容，但 `set_value` 不返回任何内容供我们断言。我们希望能够说，如果我们用实现了 `Messenger` trait 的东西和 `max` 值的特定值创建一个 `LimitTracker`，当我们在 `value` 中传递不同的数字时，messenger 被告诉发送适当的消息。

我们需要一个 mock 对象，当我们调用 `send` 时，不是发送电子邮件或短信，而只是跟踪它被告诉发送的消息。我们可以创建 mock 对象的新实例，创建一个使用 mock 对象的 `LimitTracker`，在 `LimitTracker` 上调用 `set_value` 方法，然后检查 mock 对象是否包含我们期望的消息。清单 15-21 显示了尝试实现一个 mock 对象来做到这一点，但借用检查器不允许它。

**代码示例 15-21**：尝试实现一个借用检查器不允许的 `MockMessenger`

```rust
pub trait Messenger {
    fn send(&self, msg: &str);
}

pub struct LimitTracker<'a, T: Messenger> {
    messenger: &'a T,
    value: usize,
    max: usize,
}

impl<'a, T> LimitTracker<'a, T>
where
    T: Messenger,
{
    pub fn new(messenger: &'a T, max: usize) -> LimitTracker<'a, T> {
        LimitTracker {
            messenger,
            value: 0,
            max,
        }
    }

    pub fn set_value(&mut self, value: usize) {
        self.value = value;

        let percentage_of_max = self.value as f64 / self.max as f64;

        if percentage_of_max >= 1.0 {
            self.messenger.send("Error: You are over your quota!");
        } else if percentage_of_max >= 0.9 {
            self.messenger
                .send("Urgent warning: You've used up over 90% of your quota!");
        } else if percentage_of_max >= 0.75 {
            self.messenger
                .send("Warning: You've used up over 75% of your quota!");
        }
    }
}

#[cfg(test)]
mod tests {
    use super::*;

    struct MockMessenger {
        sent_messages: Vec<String>,
    }

    impl MockMessenger {
        fn new() -> MockMessenger {
            MockMessenger {
                sent_messages: vec![],
            }
        }
    }

    impl Messenger for MockMessenger {
        fn send(&self, message: &str) {
            self.sent_messages.push(String::from(message));
        }
    }

    #[test]
    fn it_sends_an_over_75_percent_warning_message() {
        let mock_messenger = MockMessenger::new();
        let mut limit_tracker = LimitTracker::new(&mock_messenger, 100);

        limit_tracker.set_value(80);

        assert_eq!(mock_messenger.sent_messages.len(), 1);
    }
}
```

这段测试代码定义了一个 `MockMessenger` 结构体，它有一个 `sent_messages` 字段，带有一个 `String` 值的 `Vec` 来跟踪它被告诉发送的消息。我们还定义了一个关联函数 `new`，以便于创建以空消息列表开始的 `MockMessenger` 值。然后，我们为 `MockMessenger` 实现 `Messenger` trait，以便我们可以给 `LimitTracker` 一个 `MockMessenger`。在 `send` 方法的定义中，我们接受作为参数传入的消息并将其存储在 `MockMessenger` 的 `sent_messages` 列表中。

在测试中，我们正在测试当 `LimitTracker` 被告知将 `value` 设置为超过 `max` 值的 75% 时会发生什么。首先，我们创建一个新的 `MockMessenger`，它将以空消息列表开始。然后，我们创建一个新的 `LimitTracker` 并给它新 `MockMessenger` 的引用和 `100` 的 `max` 值。我们在 `LimitTracker` 上用 `80` 的值调用 `set_value` 方法，这是 100 的 75% 以上。然后，我们断言 `MockMessenger` 跟踪的消息列表现在应该有一条消息。

然而，这个测试有一个问题，如下所示：

```console
$ cargo test
   Compiling limit-tracker v0.1.0 (file:///projects/limit-tracker)
error[E0596]: cannot borrow `self.sent_messages` as mutable, as it is behind a `&` reference
  --> src/lib.rs:58:13
   |
58 |             self.sent_messages.push(String::from(message));
   |             ^^^^^^^^^^^^^^^^^^ `self` is a `&` reference, so the data it refers to cannot be borrowed as mutable
   |
help: consider changing this to be a mutable reference in the `impl` method and the `trait` definition
   |
  2 ~     fn send(&mut self, msg: &str);
  3 | }
 ...
 56 |     impl Messenger for MockMessenger {
15:     fn send(&mut self, message: &str) {
   |

For more information about this error, try `rustc --explain E0596`.
error: could not compile `limit-tracker` (lib test) due to 1 previous error
```

我们无法修改 `MockMessenger` 来跟踪消息，因为 `send` 方法接受对 `self` 的不可变引用。我们也不能从错误文本中获取在 `impl` 方法和 trait 定义中都使用 `&mut self` 的建议。我们不想仅仅为了测试而改变 `Messenger` trait。相反，我们需要找到一种方法使我们的测试代码与我们现有的设计一起正确工作。

这是内部可变性可以提供帮助的情况！我们将在 `RefCell<T>` 中存储 `sent_messages`，然后 `send` 方法将能够修改 `sent_messages` 以存储我们看到的消息。清单 15-22 显示了这看起来是什么样子。

**代码示例 15-22**：使用 `RefCell<T>` 在考虑外部值不可变的情况下改变内部值

```rust
pub trait Messenger {
    fn send(&self, msg: &str);
}

pub struct LimitTracker<'a, T: Messenger> {
    messenger: &'a T,
    value: usize,
    max: usize,
}

impl<'a, T> LimitTracker<'a, T>
where
    T: Messenger,
{
    pub fn new(messenger: &'a T, max: usize) -> LimitTracker<'a, T> {
        LimitTracker {
            messenger,
            value: 0,
            max,
        }
    }

    pub fn set_value(&mut self, value: usize) {
        self.value = value;

        let percentage_of_max = self.value as f64 / self.max as f64;

        if percentage_of_max >= 1.0 {
            self.messenger.send("Error: You are over your quota!");
        } else if percentage_of_max >= 0.9 {
            self.messenger
                .send("Urgent warning: You've used up over 90% of your quota!");
        } else if percentage_of_max >= 0.75 {
            self.messenger
                .send("Warning: You've used up over 75% of your quota!");
        }
    }
}

#[cfg(test)]
mod tests {
    use super::*;
    use std::cell::RefCell;

    struct MockMessenger {
        sent_messages: RefCell<Vec<String>>,
    }

    impl MockMessenger {
        fn new() -> MockMessenger {
            MockMessenger {
                sent_messages: RefCell::new(vec![]),
            }
        }
    }

    impl Messenger for MockMessenger {
        fn send(&self, message: &str) {
            self.sent_messages.borrow_mut().push(String::from(message));
        }
    }

    #[test]
    fn it_sends_an_over_75_percent_warning_message() {
        let mock_messenger = MockMessenger::new();
        let mut limit_tracker = LimitTracker::new(&mock_messenger, 100);

        limit_tracker.set_value(80);

        assert_eq!(mock_messenger.sent_messages.borrow().len(), 1);
    }
}
```

`sent_messages` 字段现在是 `RefCell<Vec<String>>` 类型而不是 `Vec<String>`。在 `new` 函数中，我们在空向量周围创建一个新的 `RefCell<Vec<String>>` 实例。

对于 `send` 方法的实现，第一个参数仍然是对 `self` 的不可变借用，这与 trait 定义匹配。我们在 `self.sent_messages` 中的 `RefCell<Vec<String>>` 上调用 `borrow_mut`，以获得对 `RefCell<Vec<String>>` 内部值的可变引用，即向量。然后，我们可以在向量的可变引用上调用 `push`，以跟踪测试期间发送的消息。

我们必须做的最后一个更改是在断言中：要查看内部向量中有多少项，我们在 `RefCell<Vec<String>>` 上调用 `borrow` 以获得向量的不可变引用。

现在你已经看到了如何使用 `RefCell<T>`，让我们深入了解它是如何工作的！

#### 在运行时跟踪借用

在创建不可变和可变引用时，我们分别使用 `&` 和 `&mut` 语法。对于 `RefCell<T>`，我们使用 `borrow` 和 `borrow_mut` 方法，它们是属于 `RefCell<T>` 的安全 API 的一部分。`borrow` 方法返回智能指针类型 `Ref<T>`，`borrow_mut` 返回智能指针类型 `RefMut<T>`。这两种类型都实现 `Deref`，因此我们可以像常规引用一样对待它们。

`RefCell<T>` 跟踪当前有多少 `Ref<T>` 和 `RefMut<T>` 智能指针处于活动状态。每次我们调用 `borrow` 时，`RefCell<T>` 增加其活动不可变借用的计数。当 `Ref<T>` 值超出作用域时，不可变借用的计数减少1。就像编译时借用规则一样，`RefCell<T>` 让我们在任何时间点有多个不可变借用或一个可变借用。

如果我们尝试违反这些规则，而不是像使用引用那样得到编译错误，`RefCell<T>` 的实现将在运行时 panic。清单 15-23 显示了清单 15-22 中 `send` 实现的修改。我们故意尝试为同一作用域创建两个可变借用，以说明 `RefCell<T>` 在运行时阻止我们这样做。

**代码示例 15-23**：在同一作用域中创建两个可变引用，以查看 `RefCell<T>` 将 panic

```rust
pub trait Messenger {
    fn send(&self, msg: &str);
}

pub struct LimitTracker<'a, T: Messenger> {
    messenger: &'a T,
    value: usize,
    max: usize,
}

impl<'a, T> LimitTracker<'a, T>
where
    T: Messenger,
{
    pub fn new(messenger: &'a T, max: usize) -> LimitTracker<'a, T> {
        LimitTracker {
            messenger,
            value: 0,
            max,
        }
    }

    pub fn set_value(&mut self, value: usize) {
        self.value = value;

        let percentage_of_max = self.value as f64 / self.max as f64;

        if percentage_of_max >= 1.0 {
            self.messenger.send("Error: You are over your quota!");
        } else if percentage_of_max >= 0.9 {
            self.messenger
                .send("Urgent warning: You've used up over 90% of our quota!");
        } else if percentage_of_max >= 0.75 {
            self.messenger
                .send("Warning: You've used up over 75% of your quota!");
        }
    }
}

#[cfg(test)]
mod tests {
    use super::*;
    use std::cell::RefCell;

    struct MockMessenger {
        sent_messages: RefCell<Vec<String>>,
    }

    impl MockMessenger {
        fn new() -> MockMessenger {
            MockMessenger {
                sent_messages: RefCell::new(vec![]),
            }
        }
    }

    impl Messenger for MockMessenger {
        fn send(&self, message: &str) {
            let mut one_borrow = self.sent_messages.borrow_mut();
            let mut two_borrow = self.sent_messages.borrow_mut();

            one_borrow.push(String::from(message));
            two_borrow.push(String::from(message));
        }
    }

    #[test]
    fn it_sends_an_over_75_percent_warning_message() {
        let mock_messenger = MockMessenger::new();
        let mut limit_tracker = LimitTracker::new(&mock_messenger, 100);

        limit_tracker.set_value(80);

        assert_eq!(mock_messenger.sent_messages.borrow().len(), 1);
    }
}
```

我们为从 `borrow_mut` 返回的 `RefMut<T>` 智能指针创建一个变量 `one_borrow`。然后，我们以相同的方式在变量 `two_borrow` 中创建另一个可变借用。这在同一作用域中创建了两个可变引用，这是不允许的。当我们运行库的测试时，清单 15-23 中的代码将没有任何错误地编译，但测试将失败：

```console
$ cargo test
   Compiling limit-tracker v0.1.0 (file:///projects/limit-tracker)
    Finished `test` profile [unoptimized + debuginfo] target(s) in 0.91s
     Running unittests src/lib.rs (target/debug/deps/limit_tracker-e599811fa246dbde)

running 1 test
test tests::it_sends_an_over_75_percent_warning_message ... FAILED

failures:

---- tests::it_sends_an_over_75_percent_warning_message stdout ----

thread 'tests::it_sends_an_over_75_percent_warning_message' panicked at src/lib.rs:60:53:
RefCell already borrowed
note: run with `RUST_BACKTRACE=1` environment variable to display a backtrace


failures:
    tests::it_sends_an_over_75_percent_warning_message

test result: FAILED. 0 passed; 1 failed; 0 ignored; 0 measured; 0 filtered out; finished in 0.00s

error: test failed, to rerun pass `--lib`
```

注意，代码以消息 `already borrowed: BorrowMutError` panic。这就是 `RefCell<T>` 在运行时处理借用规则违规的方式。

选择在运行时而不是编译时捕获借用错误，正如我们在这里所做的，意味着你可能会在开发过程的后期发现代码中的错误：可能在代码部署到生产环境之前都不会发现。此外，由于跟踪运行时的借用而不是编译时，你的代码会产生少量运行时性能损失。然而，使用 `RefCell<T>` 使得可以编写一个 mock 对象，该对象可以在你使用它时修改自身以跟踪它看到的消息，即使是在只允许不可变值的上下文中。尽管有这些权衡，你可以使用 `RefCell<T>` 来获得比常规引用更多的功能。

### 允许对可变数据的多个所有者

使用 `RefCell<T>` 的一种常见方式是与 `Rc<T>` 结合使用。回想一下，`Rc<T>` 让你拥有某些数据的多个所有者，但它只给你对该数据的不可变访问。如果你有一个持有 `RefCell<T>` 的 `Rc<T>`，你可以获得一个可以有多个所有者 _并且_ 你可以改变的值！

例如，回想一下清单 15-18 中的 cons list 示例，我们使用 `Rc<T>` 允许多个列表共享另一个列表的所有权。因为 `Rc<T>` 只持有不可变值，一旦我们创建了列表中的任何值，我们就不能改变它们。让我们在 `RefCell<T>` 中添加其改变列表中值的能力。清单 15-24 显示，通过在 `Cons` 定义中使用 `RefCell<T>`，我们可以修改所有列表中存储的值。

**代码示例 15-24**：使用 `Rc<RefCell<i32>>` 创建一个我们可以改变的 `List`

```rust
#[derive(Debug)]
enum List {
    Cons(Rc<RefCell<i32>>, Rc<List>),
    Nil,
}

use crate::List::{Cons, Nil};
use std::cell::RefCell;
use std::rc::Rc;

fn main() {
    let value = Rc::new(RefCell::new(5));

    let a = Rc::new(Cons(Rc::clone(&value), Rc::new(Nil)));

    let b = Cons(Rc::new(RefCell::new(3)), Rc::clone(&a));
    let c = Cons(Rc::new(RefCell::new(4)), Rc::clone(&a));

    *value.borrow_mut() += 10;

    println!("a after = {a:?}");
    println!("b after = {b:?}");
    println!("c after = {c:?}");
}
```

我们创建一个 `Rc<RefCell<i32>>` 实例的值，并将其存储在名为 `value` 的变量中，以便我们稍后可以再次直接访问它。然后，我们在 `a` 中创建一个带有 `Cons` 变体的 `List`，该变体持有 `value`。我们需要克隆 `value`，以便 `a` 和 `value` 都拥有内部 `5` 值的所有权，而不是将所有权从 `value` 转移到 `a` 或让 `a` 借用 `value`。

我们将列表 `a` 包装在 `Rc<T>` 中，以便当我们创建列表 `b` 和 `c` 时，它们都可以指向 `a`，这正是我们在清单 15-18 中所做的。

在 `a`、`b` 和 `c` 中创建列表之后，我们想要将 `value` 中的值增加 10。我们通过在 `value` 上调用 `borrow_mut` 来实现这一点，它使用我们在第5章 ["`->` 运算符在哪里？"][wheres-the---operator] 中讨论的自动解引用特性来解引用 `Rc<T>` 到内部的 `RefCell<i32>` 值。`borrow_mut` 方法返回一个 `RefMut<T>` 智能指针，我们在其上使用解引用运算符并改变内部值。

当我们打印 `a`、`b` 和 `c` 时，我们可以看到它们都有修改后的值 `15` 而不是 `5`：

```console
$ cargo run
   Compiling cons-list v0.1.0 (file:///projects/cons-list)
    Finished `dev` profile [unoptimized + debuginfo] target(s) in 0.63s
     Running `target/debug/cons-list`
a after = Cons(RefCell { value: 15 }, Nil)
b after = Cons(RefCell { value: 3 }, Cons(RefCell { value: 15 }, Nil))
c after = Cons(RefCell { value: 4 }, Cons(RefCell { value: 15 }, Nil))
```

这种技术非常巧妙！通过使用 `RefCell<T>`，我们有一个外表上不可变的 `List` 值。但是我们可以使用 `RefCell<T>` 提供的方法，这些方法提供对其内部可变性的访问，以便我们可以在需要时修改我们的数据。借用规则的运行时检查保护我们免受数据竞争，有时在我们的数据结构中值得用一点速度来换取这种灵活性。注意，`RefCell<T>` 不适用于多线程代码！`Mutex<T>` 是 `RefCell<T>` 的线程安全版本，我们将在第16章讨论 `Mutex<T>`。

[wheres-the---operator]: /rust-book/ch05-03-method-syntax/#--运算符在哪里
