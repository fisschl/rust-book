---
title: 20.3. 高级类型
---

Rust 类型系统有一些我们迄今为止提到过但尚未讨论的特性。我们将首先讨论 newtype 的一般概念，并研究为什么它们作为类型很有用。然后，我们将转向类型别名，这是一个与 newtype 类似但语义略有不同的特性。我们还将讨论 `!` 类型和动态大小类型。

## 使用 Newtype 模式确保类型安全和抽象

本节假设你已经阅读了前面的[使用 Newtype 模式实现外部 Trait][newtype]一节。newtype 模式对于超出我们迄今为止讨论的任务也很有用，包括静态地强制确保值永远不会被混淆，以及指示值的单位。你在清单 20-16 中看到了使用 newtype 来指示单位的例子：回想一下，`Millimeters` 和 `Meters` struct 在 newtype 中包装了 `u32` 值。如果我们编写一个参数类型为 `Millimeters` 的函数，我们将无法编译一个意外尝试用 `Meters` 类型或普通 `u32` 值调用该函数的程序。

我们还可以使用 newtype 模式来抽象掉类型的某些实现细节：新类型可以暴露一个与内部私有类型 API 不同的公共 API。

Newtype 还可以隐藏内部实现。例如，我们可以提供一个 `People` 类型来包装一个 `HashMap<i32, String>`，该 HashMap 存储一个人的 ID 与其姓名的关联。使用 `People` 的代码只会与我们提供的公共 API 交互，例如向 `People` 集合添加姓名字符串的方法；该代码不需要知道我们在内部为姓名分配了一个 `i32` ID。newtype 模式是一种实现封装以隐藏实现细节的轻量级方式，我们在第 18 章的[隐藏实现细节的封装][encapsulation-that-hides-implementation-details]一节中讨论过这一点。

## 类型同义词和类型别名

Rust 提供了声明 **类型别名** 的能力，为现有类型赋予另一个名称。为此，我们使用 `type` 关键字。例如，我们可以创建 `Kilometers` 作为 `i32` 的别名，如下所示：

**文件名：src/main.rs**

```rust
type Kilometers = i32;
```

现在别名 `Kilometers` 是 `i32` 的 **同义词** ；与我们之前在清单 20-16 中创建的 `Millimeters` 和 `Meters` 类型不同，`Kilometers` 不是一个单独的、新的类型。具有 `Kilometers` 类型的值将被视为与 `i32` 类型的值相同：

**文件名：src/main.rs**

```rust
type Kilometers = i32;

let x: i32 = 5;
let y: Kilometers = 5;

println!("x + y = {}", x + y);
```

因为 `Kilometers` 和 `i32` 是同一类型，我们可以将两种类型的值相加，并且可以将 `Kilometers` 值传递给接受 `i32` 参数的函数。然而，使用这种方法，我们无法获得之前讨论的 newtype 模式提供的类型检查好处。换句话说，如果我们在某处混淆了 `Kilometers` 和 `i32` 值，编译器不会给我们错误。

类型同义词的主要用例是减少重复。例如，我们可能有这样一个冗长的类型：

```rust
Box<dyn Fn() + Send + 'static>
```

在函数签名和整个代码中作为类型注释来编写这个冗长的类型可能会令人厌烦且容易出错。想象一下拥有一个充满清单 20-25 中那样代码的项目。

**清单 20-25**：在许多地方使用长类型

**文件名：src/main.rs**

```rust
fn main() {
    let f: Box<dyn Fn() + Send + 'static> = Box::new(|| println!("hi"));

    fn takes_long_type(f: Box<dyn Fn() + Send + 'static>) {
        // --snip--
    }

    fn returns_long_type() -> Box<dyn Fn() + Send + 'static> {
        // --snip--
        Box::new(|| ())
    }
}
```

类型别名通过减少重复使这段代码更易于管理。在清单 20-26 中，我们为冗长类型引入了一个名为 `Thunk` 的别名，并可以用较短的别名 `Thunk` 替换该类型的所有使用。

**清单 20-26**：引入类型别名 `Thunk` 以减少重复

**文件名：src/main.rs**

```rust
fn main() {
    type Thunk = Box<dyn Fn() + Send + 'static>;

    let f: Thunk = Box::new(|| println!("hi"));

    fn takes_long_type(f: Thunk) {
        // --snip--
    }

    fn returns_long_type() -> Thunk {
        // --snip--
        Box::new(|| ())
    }
}
```

这段代码更容易阅读和编写！为类型别名选择一个有意义的名称可以帮助传达你的意图（_thunk_ 是一个表示稍后评估的代码的词，因此对于存储的闭包来说是一个合适的名称）。

类型别名也常与 `Result<T, E>` 类型一起使用以减少重复。考虑标准库中的 `std::io` 模块。I/O 操作通常返回一个 `Result<T, E>` 来处理操作失败的情况。这个库有一个 `std::io::Error` struct，代表所有可能的 I/O 错误。`std::io` 中的许多函数将返回 `Result<T, E>`，其中 `E` 是 `std::io::Error`，例如 `Write` Trait 中的这些函数：

```rust
use std::fmt;
use std::io::Error;

pub trait Write {
    fn write(&mut self, buf: &[u8]) -> Result<usize, Error>;
    fn flush(&mut self) -> Result<(), Error>;

    fn write_all(&mut self, buf: &[u8]) -> Result<(), Error>;
    fn write_fmt(&mut self, fmt: fmt::Arguments) -> Result<(), Error>;
}
```

`Result<..., Error>` 重复了很多次。因此，`std::io` 有这个类型别名声明：

```rust
type Result<T> = std::result::Result<T, std::io::Error>;
```

因为这个声明在 `std::io` 模块中，我们可以使用完全限定别名 `std::io::Result<T>`；也就是说，一个 `E` 填充为 `std::io::Error` 的 `Result<T, E>`。`Write` Trait 的函数签名最终看起来像这样：

```rust
pub trait Write {
    fn write(&mut self, buf: &[u8]) -> Result<usize>;
    fn flush(&mut self) -> Result<()>;

    fn write_all(&mut self, buf: &[u8]) -> Result<()>;
    fn write_fmt(&mut self, fmt: fmt::Arguments) -> Result<()>;
}
```

类型别名在两方面有帮助：它使代码更容易编写 **并且** 为我们提供了跨整个 `std::io` 的一致接口。因为它是一个别名，它只是另一个 `Result<T, E>`，这意味着我们可以在它上面使用任何适用于 `Result<T, E>` 的方法，以及像 `?` 运算符这样的特殊语法。

## 永不返回的 Never 类型

Rust 有一个名为 `!` 的特殊类型，在类型理论术语中被称为 **空类型** ，因为它没有值。我们更喜欢称它为 **never 类型** ，因为它在函数永远不会返回时作为返回类型的占位符。这里有一个例子：

```rust
fn bar() -> ! {
    // --snip--
    panic!();
}
```

这段代码被读作 "函数 `bar` 返回 never"。返回 never 的函数被称为 **发散函数** 。我们无法创建类型 `!` 的值，所以 `bar` 永远不可能返回。

但是一个你永远无法为其创建值的类型有什么用呢？回想一下清单 2-5 中的代码，猜数字游戏的一部分；我们在清单 20-27 中复制了其中的一部分。

**清单 20-27**：一个以 `continue` 结尾的分支的 `match`

**文件名：src/main.rs**

```rust
let guess: u32 = match guess.trim().parse() {
    Ok(num) => num,
    Err(_) => continue,
};
```

当时，我们跳过了这段代码中的一些细节。在第 6 章的[`match` 控制流结构][the-match-control-flow-construct]一节中，我们讨论了 `match` 分支必须都返回相同的类型。所以，例如，以下代码不起作用：

```rust
let guess = match guess.trim().parse() {
    Ok(_) => 5,
    Err(_) => "hello",
};
```

这段代码中 `guess` 的类型必须是整数 **和** 字符串，而 Rust 要求 `guess` 只有一种类型。那么，`continue` 返回什么？我们是如何被允许从一个分支返回 `u32` 并在清单 20-27 中有另一个以 `continue` 结尾的分支的？

正如你可能猜到的，`continue` 有一个 `!` 值。也就是说，当 Rust 计算 `guess` 的类型时，它查看两个 match 分支，前者值为 `u32`，后者值为 `!`。因为 `!` 永远不可能有值，Rust 决定 `guess` 的类型是 `u32`。

描述这种行为的正式方式是，类型为 `!` 的表达式可以被强制转换为任何其他类型。我们被允许以 `continue` 结束这个 `match` 分支，因为 `continue` 不返回值；相反，它将控制权移回循环顶部，所以在 `Err` 情况下，我们永远不会给 `guess` 赋值。

never 类型与 `panic!` 宏一起也很有用。回想一下我们在 `Option<T>` 值上调用的 `unwrap` 函数，用于产生一个值或 panic，其定义如下：

```rust
impl<T> Option<T> {
    pub fn unwrap(self) -> T {
        match self {
            Some(val) => val,
            None => panic!("called `Option::unwrap()` on a `None` value"),
        }
    }
}
```

在这段代码中，与清单 20-27 中的 `match` 发生的情况相同：Rust 看到 `val` 具有类型 `T`，`panic!` 具有类型 `!`，所以整个 `match` 表达式的结果是 `T`。这段代码有效是因为 `panic!` 不产生值；它结束程序。在 `None` 情况下，我们不会从 `unwrap` 返回值，所以这段代码是有效的。

最后一个具有类型 `!` 的表达式是循环：

```rust
print!("forever ");

loop {
    print!("and ever ");
}
```

这里，循环永远不会结束，所以 `!` 是表达式的值。然而，如果我们包含一个 `break`，情况就不会是这样，因为循环会在到达 `break` 时终止。

## 动态大小类型和 `Sized` Trait

Rust 需要知道关于其类型的某些细节，例如为特定类型的值分配多少空间。这使其类型系统的一个角落一开始有点令人困惑： **动态大小类型** 的概念。有时被称为 **DST** 或 **无大小类型** ，这些类型允许我们编写使用值的代码，这些值的大小我们只能知道在运行时。

让我们深入研究一个名为 `str` 的动态大小类型的细节，我们在整本书中一直在使用它。没错，不是 `&str`，而是单独的 `str`，是一个 DST。在许多情况下，例如存储用户输入的文本时，我们直到运行时才知道字符串有多长。这意味着我们无法创建 `str` 类型的变量，也无法接受 `str` 类型的参数。考虑以下不起作用的代码：

```rust
let s1: str = "Hello there!";
let s2: str = "How's it going?";
```

Rust 需要知道为特定类型的任何值分配多少内存，并且一种类型的所有值必须使用相同数量的内存。如果 Rust 允许我们编写这段代码，这两个 `str` 值将需要占用相同数量的空间。但它们有不同的长度：`s1` 需要 12 字节的存储空间，`s2` 需要 15 字节。这就是为什么无法创建保存动态大小类型的变量的原因。

那么，我们该怎么办？在这种情况下，你已经知道答案了：我们将 `s1` 和 `s2` 的类型设置为字符串切片（`&str`）而不是 `str`。回想一下第 4 章的[字符串切片][string-slices]一节，切片数据结构只存储切片的起始位置和长度。因此，虽然 `&T` 是一个存储 `T` 所在内存地址的单个值，但字符串切片是 **两个** 值：`str` 的地址及其长度。因此，我们可以在编译时知道字符串切片值的大小：它是 `usize` 长度的两倍。也就是说，无论它引用的字符串有多长，我们总是知道字符串切片的大小。一般来说，这就是动态大小类型在 Rust 中的使用方式：它们有一个额外的元数据位，用于存储动态信息的大小。动态大小类型的黄金法则是，我们必须始终将动态大小类型的值放在某种指针后面。

我们可以将 `str` 与各种指针结合使用：例如，`Box<str>` 或 `Rc<str>`。事实上，你以前见过这个，但是用不同的动态大小类型：Trait。每个 Trait 都是一个动态大小类型，我们可以通过使用 Trait 的名称来引用它。在第 18 章的[使用 Trait 对象抽象共享行为][using-trait-objects-to-abstract-over-shared-behavior]一节中，我们提到要将 Trait 用作 Trait 对象，我们必须将它们放在指针后面，例如 `&dyn Trait` 或 `Box<dyn Trait>`（`Rc<dyn Trait>` 也可以）。

为了处理 DST，Rust 提供了 `Sized` Trait 来确定类型的大小是否在编译时已知。这个 Trait 自动为所有在编译时大小已知的事物实现。此外，Rust 隐式地为每个泛型函数添加了 `Sized` 的 bound。也就是说，像这样的泛型函数定义：

```rust
fn generic<T>(t: T) {
    // --snip--
}
```

实际上被当作这样处理：

```rust
fn generic<T: Sized>(t: T) {
    // --snip--
}
```

默认情况下，泛型函数只对在编译时具有已知大小的类型有效。然而，你可以使用以下特殊语法来放宽此限制：

```rust
fn generic<T: ?Sized>(t: &T) {
    // --snip--
}
```

`?Sized` 上的 Trait bound 表示 "`T` 可能是 `Sized`，也可能不是 `Sized`"，这种表示法覆盖了泛型类型必须在编译时具有已知大小的默认值。`?Trait` 语法具有此含义仅适用于 `Sized`，不适用于任何其他 Trait。

还要注意，我们将 `t` 参数的类型从 `T` 切换到了 `&T`。因为该类型可能不是 `Sized`，我们需要在某种指针后面使用它。在这种情况下，我们选择了引用。

接下来，我们将讨论函数和闭包！

[newtype]: /rust-book/ch20-02-advanced-traits#使用-newtype-模式实现外部-trait
[encapsulation-that-hides-implementation-details]: /rust-book/ch18-01-what-is-oo#隐藏实现细节的封装
[the-match-control-flow-construct]: /rust-book/ch06-02-match#match-控制流结构
[string-slices]: /rust-book/ch04-03-slices#字符串切片
[using-trait-objects-to-abstract-over-shared-behavior]: /rust-book/ch18-02-trait-objects#使用-trait-对象抽象共享行为
