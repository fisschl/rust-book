---
title: 闭包
---

Rust 的闭包是可以保存在变量中或作为参数传递给其他函数的匿名函数。你可以在一个地方创建闭包，然后在另一个地方调用它来在不同的上下文中评估它。与函数不同，闭包可以从它们定义的范围内捕获值。我们将演示这些闭包特性如何允许代码重用和行为定制。

## 捕获环境

我们首先来看看如何使用闭包捕获它们定义的环境中的值以供稍后使用。场景是这样的：我们的T恤公司时不时会给邮件列表中的某人赠送一件独家的限量版T恤作为促销。邮件列表中的人可以选择在他们的个人资料中添加他们最喜欢的颜色。如果获得免费T恤的人设置了他们最喜欢的颜色，他们就会得到那种颜色的T恤。如果这个人没有指定最喜欢的颜色，他们就会得到公司目前库存最多的颜色。

有很多方法可以实现这个。对于这个例子，我们将使用一个名为 `ShirtColor` 的枚举，它有 `Red` 和 `Blue` 两个变体（为简单起见，限制可用颜色的数量）。我们用 `Inventory` 结构体来表示公司的库存，它有一个名为 `shirts` 的字段，包含一个 `Vec<ShirtColor>`，表示当前库存的T恤颜色。在 `Inventory` 上定义的 `giveaway` 方法获取免费T恤获得者的可选T恤颜色偏好，并返回这个人将得到的T恤颜色。代码示例13-1展示了这个设置。

**代码示例 13-1：T恤公司的赠品情况**

```rust
#[derive(Debug, PartialEq, Copy, Clone)]
enum ShirtColor {
    Red,
    Blue,
}

struct Inventory {
    shirts: Vec<ShirtColor>,
}

impl Inventory {
    fn giveaway(&self, user_preference: Option<ShirtColor>) -> ShirtColor {
        user_preference.unwrap_or_else(|| self.most_stocked())
    }

    fn most_stocked(&self) -> ShirtColor {
        let mut num_red = 0;
        let mut num_blue = 0;

        for color in &self.shirts {
            match color {
                ShirtColor::Red => num_red += 1,
                ShirtColor::Blue => num_blue += 1,
            }
        }
        if num_red > num_blue {
            ShirtColor::Red
        } else {
            ShirtColor::Blue
        }
    }
}

fn main() {
    let store = Inventory {
        shirts: vec![ShirtColor::Blue, ShirtColor::Red, ShirtColor::Blue],
    };

    let user_pref1 = Some(ShirtColor::Red);
    let giveaway1 = store.giveaway(user_pref1);
    println!(
        "The user with preference {:?} gets {:?}",
        user_pref1, giveaway1
    );

    let user_pref2 = None;
    let giveaway2 = store.giveaway(user_pref2);
    println!(
        "The user with preference {:?} gets {:?}",
        user_pref2, giveaway2
    );
}
```

`main` 中定义的 `store` 有两件蓝色T恤和一件红色T恤剩余，用于此次限量版促销活动。我们调用 `giveaway` 方法，一个用户偏好红色T恤，另一个用户没有任何偏好。

同样，这段代码可以用多种方式实现，在这里，为了专注于闭包，我们坚持你已经学过的概念，除了 `giveaway` 方法中使用闭包的主体部分。在 `giveaway` 方法中，我们将用户偏好作为 `Option<ShirtColor>` 类型的参数获取，并在 `user_preference` 上调用 `unwrap_or_else` 方法。`Option<T>` 上的 [`unwrap_or_else` 方法][unwrap-or-else]由标准库定义。它接受一个参数：一个没有参数并返回 `T` 类型值的闭包（与 `Option<T>` 的 `Some` 变体中存储的类型相同，在本例中是 `ShirtColor`）。如果 `Option<T>` 是 `Some` 变体，`unwrap_or_else` 返回 `Some` 中的值。如果 `Option<T>` 是 `None` 变体，`unwrap_or_else` 调用闭包并返回闭包返回的值。

我们将闭包表达式 `|| self.most_stocked()` 指定为 `unwrap_or_else` 的参数。这是一个本身不带参数的闭包（如果闭包有参数，它们会出现在两个竖线之间）。闭包的主体调用 `self.most_stocked()`。我们在这里定义闭包，`unwrap_or_else` 的实现将在需要结果时稍后评估闭包。

运行这段代码会打印以下内容：

```console
$ cargo run
   Compiling shirt-company v0.1.0 (file:///projects/shirt-company)
    Finished `dev` profile [unoptimized + debuginfo] target(s) in 0.27s
     Running `target/debug/shirt-company`
The user with preference Some(Red) gets Red
The user with preference None gets Blue
```

这里有趣的一点是，我们传递了一个在当前 `Inventory` 实例上调用 `self.most_stocked()` 的闭包。标准库不需要知道我们定义的 `Inventory` 或 `ShirtColor` 类型，也不需要知道这个场景中我们要使用的逻辑。闭包捕获了对 `self` `Inventory` 实例的不可变引用，并将我们指定的代码与闭包一起传递给 `unwrap_or_else` 方法。另一方面，函数不能以这种方式捕获它们的环境。

## 推断和标注闭包类型

函数和闭包之间还有更多区别。闭包通常不需要你像 `fn` 函数那样标注参数或返回值的类型。函数上需要类型标注，因为类型是作为向用户公开的显式接口的一部分。严格定义这个接口对于确保每个人都同意函数使用和返回的值的类型很重要。另一方面，闭包不会以这种方式在公开的接口中使用：它们存储在变量中，它们在不命名的情况下使用，也不向库的用户公开。

闭包通常很短，只在狭窄的上下文中相关，而不是在任意场景中。在这些有限的上下文中，编译器可以推断参数和返回类型，类似于它能够推断大多数变量的类型（在极少数情况下，编译器也需要闭包类型标注）。

与变量一样，如果我们想以增加冗长性为代价来提高明确性和清晰度，我们可以添加类型标注。为闭包标注类型看起来像是代码示例13-2中显示的定义。在这个例子中，我们定义了一个闭包并将其存储在变量中，而不是像代码示例13-1那样在我们传递它作为参数的地方定义闭包。

**代码示例 13-2：在闭包中添加参数和返回值类型的可选类型标注**

```rust
use std::thread;
use std::time::Duration;

fn generate_workout(intensity: u32, random_number: u32) {
    let expensive_closure = |num: u32| -> u32 {
        println!("calculating slowly...");
        thread::sleep(Duration::from_secs(2));
        num
    };

    if intensity < 25 {
        println!("Today, do {} pushups!", expensive_closure(intensity));
        println!("Next, do {} situps!", expensive_closure(intensity));
    } else {
        if random_number == 3 {
            println!("Take a break today! Remember to stay hydrated!");
        } else {
            println!(
                "Today, run for {} minutes!",
                expensive_closure(intensity)
            );
        }
    }
}

fn main() {
    let simulated_user_specified_value = 10;
    let simulated_random_number = 7;

    generate_workout(simulated_user_specified_value, simulated_random_number);
}
```

添加了类型标注后，闭包的语法看起来更像函数的语法。在这里，我们定义了一个函数，它将1添加到其参数，以及一个具有相同行为的闭包，以便比较。我们添加了一些空格来对齐相关部分。这说明了闭包语法与函数语法相似，除了使用竖线和可选的语法量：

```rust
fn  add_one_v1   (x: u32) -> u32 { x + 1 }
let add_one_v2 = |x: u32| -> u32 { x + 1 };
let add_one_v3 = |x|             { x + 1 };
let add_one_v4 = |x|               x + 1  ;
```

第一行显示了一个函数定义，第二行显示了一个完全标注的闭包定义。在第三行，我们移除了闭包定义中的类型标注。在第四行，我们移除了花括号，因为闭包主体只有一个表达式，所以它们是可选的。这些都是有效的定义，在被调用时会产生相同的行为。`add_one_v3` 和 `add_one_v4` 行需要闭包被评估才能编译，因为类型将从它们的使用中推断出来。这类似于 `let v = Vec::new();` 需要类型标注或某种类型的值插入到 `Vec` 中，以便 Rust 能够推断类型。

对于闭包定义，编译器将为每个参数和返回值推断一个具体类型。例如，代码示例13-3展示了一个简单的闭包定义，它只是返回它作为参数接收的值。这个闭包除了用于本示例的目的外，不是很有用。注意，我们没有在定义中添加任何类型标注。因为没有类型标注，我们可以用任何类型调用闭包，这里我们第一次用 `String` 调用。如果我们然后尝试用整数调用 `example_closure`，我们会得到一个错误。

**代码示例 13-3：尝试用两种不同类型调用推断类型的闭包**

```rust
fn main() {
    let example_closure = |x| x;

    let s = example_closure(String::from("hello"));
    let n = example_closure(5);
}
```

编译器给出以下错误：

```console
$ cargo run
   Compiling closure-example v0.1.0 (file:///projects/closure-example)
error[E0308]: mismatched types
 --> src/main.rs:5:29
  |
5 |     let n = example_closure(5);
  |             --------------- ^ expected `String`, found integer
  |             |
  |             arguments to this function are incorrect
  |
note: expected because the closure was earlier called with an argument of type `String`
 --> src/main.rs:4:29
  |
4 |     let s = example_closure(String::from("hello"));
  |             --------------- ^^^^^^^^^^^^^^^^^^^^^ expected because this argument is of type `String`
  |             |
  |             in this closure call
note: closure parameter defined here
 --> src/main.rs:2:28
  |
2 |     let example_closure = |x| x;
  |                            ^
help: try using a conversion method
  |
5 |     let n = example_closure(5.to_string());
  |                              ++++++++++++

For more information about this error, try `rustc --explain E0308`.
error: could not compile `closure-example` (bin "closure-example") due to 1 previous error
```

第一次我们用 `String` 值调用 `example_closure` 时，编译器推断出 `x` 的类型和闭包的返回类型为 `String`。然后这些类型被锁定在 `example_closure` 中的闭包里，当我们下次尝试对同一个闭包使用不同类型时，我们会得到类型错误。

## 捕获引用或移动所有权

闭包可以通过三种方式从它们的环境中捕获值，这三种方式直接对应函数接受参数的三种方式：不可变借用、可变借用和获取所有权。闭包将根据函数体如何处理捕获的值来决定使用哪一种。

在代码示例13-4中，我们定义了一个闭包，它捕获了对名为 `list` 的向量的不可变引用，因为它只需要一个不可变引用来打印值。

**代码示例 13-4：定义和调用捕获不可变引用的闭包**

```rust
fn main() {
    let list = vec![1, 2, 3];
    println!("Before defining closure: {list:?}");

    let only_borrows = || println!("From closure: {list:?}");

    println!("Before calling closure: {list:?}");
    only_borrows();
    println!("After calling closure: {list:?}");
}
```

这个例子还说明了一个变量可以绑定到闭包定义，我们以后可以通过使用变量名和括号来调用闭包，就像变量名是函数名一样。

因为我们可以同时拥有多个对 `list` 的不可变引用，所以 `list` 在闭包定义之前的代码中、在闭包定义之后但在闭包被调用之前、以及在闭包被调用之后仍然可以访问。这段代码编译、运行并打印：

```console
$ cargo run
   Compiling closure-example v0.1.0 (file:///projects/closure-example)
    Finished `dev` profile [unoptimized + debuginfo] target(s) in 0.43s
     Running `target/debug/closure-example`
Before defining closure: [1, 2, 3]
Before calling closure: [1, 2, 3]
From closure: [1, 2, 3]
After calling closure: [1, 2, 3]
```

接下来，在代码示例13-5中，我们改变闭包主体，使其向 `list` 向量添加一个元素。闭包现在捕获一个可变引用。

**代码示例 13-5：定义和调用捕获可变引用的闭包**

```rust
fn main() {
    let mut list = vec![1, 2, 3];
    println!("Before defining closure: {list:?}");

    let mut borrows_mutably = || list.push(7);

    borrows_mutably();
    println!("After calling closure: {list:?}");
}
```

这段代码编译、运行并打印：

```console
$ cargo run
   Compiling closure-example v0.1.0 (file:///projects/closure-example)
    Finished `dev` profile [unoptimized + debuginfo] target(s) in 0.43s
     Running `target/debug/closure-example`
Before defining closure: [1, 2, 3]
After calling closure: [1, 2, 3, 7]
```

注意，在 `borrows_mutably` 闭包的定义和调用之间不再有 `println!`：当 `borrows_mutably` 被定义时，它捕获了对 `list` 的可变引用。我们在闭包被调用后不再使用闭包，所以可变借用结束。在闭包定义和闭包调用之间，不允许不可变借用来打印，因为当有可变借用时，不允许其他借用。试着在那里添加一个 `println!`，看看你会得到什么错误信息！

如果你想强制闭包获取它在环境中使用的值的所有权，即使闭包主体并不严格需要所有权，你可以在参数列表前使用 `move` 关键字。

这种技术主要在将闭包传递给新线程以移动数据时有用，以便它由新线程拥有。我们将在第16章详细讨论线程以及为什么你想使用它们，但现在，让我们简要探讨使用需要 `move` 关键字的闭包生成一个新线程。代码示例13-6展示了修改后的代码示例13-4，在新线程中而不是在主线程中打印向量。

**代码示例 13-6：使用 `move` 强制线程的闭包获取 `list` 的所有权**

```rust
use std::thread;

fn main() {
    let list = vec![1, 2, 3];
    println!("Before defining closure: {list:?}");

    thread::spawn(move || println!("From thread: {list:?}"))
        .join()
        .unwrap();
}
```

我们生成一个新线程，给线程一个闭包作为参数运行。闭包主体打印出列表。在代码示例13-4中，闭包只使用不可变引用捕获 `list`，因为打印它只需要最少的 `list` 访问权限。在这个例子中，即使闭包主体仍然只需要不可变引用，我们需要通过在闭包定义的开头放置 `move` 关键字来指定 `list` 应该被移入闭包。如果主线程在调用新线程的 `join` 之前执行更多操作，新线程可能会在其余主线程完成之前完成，或者主线程可能先完成。如果主线程维护 `list` 的所有权但在新线程之前结束并丢弃 `list`，线程中的不可变引用将无效。因此，编译器要求 `list` 被移入给新线程的闭包，以便引用有效。试着移除 `move` 关键字或在闭包定义后在主线程中使用 `list`，看看你会得到什么编译器错误！

## 将捕获的值移出闭包

一旦闭包捕获了引用或从定义闭包的环境中捕获了值的所有权（从而影响什么（如果有的话）被移入 _闭包_ ），闭包主体中的代码定义了当闭包稍后评估时引用或值会发生什么（从而影响什么（如果有的话）被移出 _闭包_ ）。

闭包主体可以执行以下任何操作：将捕获的值移出闭包、改变捕获的值、既不移动也不改变值，或者一开始就不从环境中捕获任何内容。

闭包捕获和处理环境中值的方式影响闭包实现哪些 trait，而 trait 是函数和结构体可以指定它们可以使用哪种闭包的方式。闭包将自动实现这三个 `Fn` trait 中的一个、两个或全部，以累加方式，取决于闭包主体如何处理值：

* `FnOnce` 适用于可以被调用一次的闭包。所有闭包至少实现这个 trait，因为所有闭包都可以被调用。将捕获的值移出其主体的闭包将只实现 `FnOnce`，而不实现其他 `Fn` trait，因为它只能被调用一次。
* `FnMut` 适用于不将捕获的值移出其主体但可能改变捕获值的闭包。这些闭包可以被调用多次。
* `Fn` 适用于不将捕获的值移出其主体且不改变捕获值的闭包，以及不从其环境中捕获任何内容的闭包。这些闭包可以在不改变其环境的情况下被多次调用，这在诸如并发多次调用闭包的情况下很重要。

让我们看看我们在代码示例13-1中使用的 `Option<T>` 上 `unwrap_or_else` 方法的定义：

```rust
impl<T> Option<T> {
    pub fn unwrap_or_else<F>(self, f: F) -> T
    where
        F: FnOnce() -> T
    {
        match self {
            Some(x) => x,
            None => f(),
        }
    }
}
```

回想一下，`T` 是代表 `Option` 的 `Some` 变体中值类型的泛型类型。类型 `T` 也是 `unwrap_or_else` 函数的返回类型：例如，在 `Option<String>` 上调用 `unwrap_or_else` 的代码将得到一个 `String`。

接下来，注意 `unwrap_or_else` 函数有额外的泛型类型参数 `F`。`F` 类型是名为 `f` 的参数的类型，它是我们在调用 `unwrap_or_else` 时提供的闭包。

在泛型类型 `F` 上指定的 trait bound 是 `FnOnce() -> T`，这意味着 `F` 必须能够被调用一次，不带参数，并返回一个 `T`。在 trait bound 中使用 `FnOnce` 表达了 `unwrap_or_else` 不会调用 `f` 超过一次的约束。在 `unwrap_or_else` 的主体中，我们可以看到如果 `Option` 是 `Some`，`f` 不会被调用。如果 `Option` 是 `None`，`f` 会被调用一次。因为所有闭包都实现 `FnOnce`，`unwrap_or_else` 接受所有三种闭包，并尽可能灵活。

> 注意：如果我们想做的事情不需要从环境中捕获值，我们可以在需要实现 `Fn` trait 之一的地方使用函数名而不是闭包。例如，在 `Option<Vec<T>>` 值上，如果值是 `None`，我们可以调用 `unwrap_or_else(Vec::new)` 来获得一个新的空向量。编译器自动为函数定义实现适用的 `Fn` trait。

现在让我们看看标准库方法 `sort_by_key`，定义在切片上，看看它与 `unwrap_or_else` 有何不同，以及为什么 `sort_by_key` 对 trait bound 使用 `FnMut` 而不是 `FnOnce`。闭包以一个参数的形式获取对正在考虑的切片中当前项的引用，并返回一个可以排序的 `K` 类型值。当你想按每个项的特定属性对切片排序时，这个函数很有用。在代码示例13-7中，我们有一个 `Rectangle` 实例列表，我们使用 `sort_by_key` 按它们的 `width` 属性从低到高排序。

**代码示例 13-7：使用 `sort_by_key` 按宽度对矩形排序**

```rust
#[derive(Debug)]
struct Rectangle {
    width: u32,
    height: u32,
}

fn main() {
    let mut list = [
        Rectangle { width: 10, height: 1 },
        Rectangle { width: 3, height: 5 },
        Rectangle { width: 7, height: 12 },
    ];

    list.sort_by_key(|r| r.width);
    println!("{list:#?}");
}
```

这段代码打印：

```console
$ cargo run
   Compiling rectangles v0.1.0 (file:///projects/rectangles)
    Finished `dev` profile [unoptimized + debuginfo] target(s) in 0.41s
     Running `target/debug/rectangles`
[
    Rectangle {
        width: 3,
        height: 5,
    },
    Rectangle {
        width: 7,
        height: 12,
    },
    Rectangle {
        width: 10,
        height: 1,
    },
]
```

`sort_by_key` 被定义为接受 `FnMut` 闭包的原因是它多次调用闭包：切片中的每个项调用一次。闭包 `|r| r.width` 不从其环境中捕获、改变或移出任何内容，因此它满足 trait bound 要求。

相比之下，代码示例13-8展示了一个只实现 `FnOnce` trait 的闭包示例，因为它将值从环境中移出。编译器不会让我们将这个闭包与 `sort_by_key` 一起使用。

**代码示例 13-8：尝试将 `FnOnce` 闭包与 `sort_by_key` 一起使用**

```rust
#[derive(Debug)]
struct Rectangle {
    width: u32,
    height: u32,
}

fn main() {
    let mut list = [
        Rectangle { width: 10, height: 1 },
        Rectangle { width: 3, height: 5 },
        Rectangle { width: 7, height: 12 },
    ]

    let mut sort_operations = vec![];
    let value = String::from("closure called");

    list.sort_by_key(|r| {
        sort_operations.push(value);
        r.width
    });
    println!("{list:#?}");
}
```

这是一种人为的、复杂的方式（不起作用）来尝试计算 `sort_by_key` 在对 `list` 排序时调用闭包的次数。这段代码试图通过将 `value`（来自闭包环境的 `String`）推入 `sort_operations` 向量来完成这个计数。闭包捕获 `value`，然后通过将 `value` 的所有权转移给 `sort_operations` 向量来将 `value` 移出闭包。这个闭包可以被调用一次；尝试第二次调用它将不起作用，因为 `value` 将不再在环境中被推入 `sort_operations` 再次！因此，这个闭包只实现 `FnOnce`。当我们尝试编译这段代码时，我们得到这个错误，即 `value` 不能从闭包中移出，因为闭包必须实现 `FnMut`：

```console
$ cargo run
   Compiling rectangles v0.1.0 (file:///projects/rectangles)
error[E0507]: cannot move out of `value`, a captured variable in an `FnMut` closure
  --> src/main.rs:18:30
   |
15 |     let value = String::from("closure called");
   |         -----   ------------------------------ move occurs because `value` has type `String`, which does not implement the `Copy` trait
   |         |
   |         captured outer variable
16 |
17 |     list.sort_by_key(|r| {
   |                      --- captured by this `FnMut` closure
18 |         sort_operations.push(value);
   |                              ^^^^^ `value` is moved here
   |
help: consider cloning the value if the performance cost is acceptable
   |
18 |         sort_operations.push(value.clone());
   |                                   ++++++++

For more information about this error, try `rustc --explain E0507`.
error: could not compile `rectangles` (bin "rectangles") due to 1 previous error
```

错误指向闭包主体中将 `value` 移出环境的那一行。为了修复这个问题，我们需要改变闭包主体，使其不将值从环境中移出。在环境中保留一个计数器并在闭包主体中递增其值是计算闭包被调用次数的更直接方式。代码示例13-9中的闭包与 `sort_by_key` 一起工作，因为它只捕获对 `num_sort_operations` 计数器的可变引用，因此可以被调用多次。

**代码示例 13-9：允许使用 `FnMut` 闭包与 `sort_by_key`。**

```rust
#[derive(Debug)]
struct Rectangle {
    width: u32,
    height: u32,
}

fn main() {
    let mut list = [
        Rectangle { width: 10, height: 1 },
        Rectangle { width: 3, height: 5 },
        Rectangle { width: 7, height: 12 },
    ];

    let mut num_sort_operations = 0;
    list.sort_by_key(|r| {
        num_sort_operations += 1;
        r.width
    });
    println!("{list:#?}, sorted in {num_sort_operations} operations");
}
```

`Fn` trait 在定义或使用使用闭包的函数或类型时很重要。在下一节中，我们将讨论迭代器。许多迭代器方法接受闭包参数，所以在我们继续时请牢记这些闭包细节！

[unwrap-or-else]: https://doc.rust-lang.org/std/option/enum.Option.html#method.unwrap_or_else
