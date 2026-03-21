---
title: "定义枚举"
---

结构体提供了一种将相关字段和数据组合在一起的方式，例如具有 `width` 和 `height` 的 `Rectangle`，而枚举则提供了一种表示值是一组可能值之一的方式。例如，我们可能想说 `Rectangle` 是一组可能形状中的一种，这组形状还包括 `Circle` 和 `Triangle`。为此，Rust 允许我们将这些可能性编码为枚举。

让我们看一个我们可能想要在代码中表达的情况，并了解为什么枚举在这种情况下很有用且比结构体更合适。假设我们需要处理 IP 地址。目前，有两个主要标准用于 IP 地址：版本四和版本六。因为这些是我们的程序将遇到的 IP 地址的唯一可能，我们可以 *枚举* 所有可能的变体，这也是枚举这个名字的由来。

任何 IP 地址可以是版本四或版本六地址，但不能同时是两者。IP 地址的这一特性使枚举数据结构合适，因为枚举值只能是其变体之一。版本四和版本六地址从根本上说仍然是 IP 地址，因此当代码处理适用于任何类型 IP 地址的情况时，它们应被视为相同类型。

我们可以通过定义一个 `IpAddrKind` 枚举并在代码中列出 IP 地址可能的类型 `V4` 和 `V6` 来表达这个概念。这些是枚举的变体：

```rust
enum IpAddrKind {
    V4,
    V6,
}
```

`IpAddrKind` 现在是一个自定义数据类型，我们可以在代码的其他地方使用。

### 枚举值

我们可以像这样创建 `IpAddrKind` 两个变体的实例：

```rust
let four = IpAddrKind::V4;
let six = IpAddrKind::V6;
```

注意枚举的变体在其标识符下命名空间化，我们使用双冒号将两者分开。这很有用，因为现在 `IpAddrKind::V4` 和 `IpAddrKind::V6` 两个值都具有相同的类型：`IpAddrKind`。然后，例如，我们可以定义一个接受任何 `IpAddrKind` 的函数：

```rust
fn route(ip_kind: IpAddrKind) {}
```

并且我们可以用任一变体调用此函数：

```rust
route(IpAddrKind::V4);
route(IpAddrKind::V6);
```

使用枚举还有更多优势。进一步考虑我们的 IP 地址类型，目前我们没有办法存储实际的 IP 地址 *数据*；我们只知道它是什么 *类型*。鉴于你刚刚在第 5 章了解了结构体，你可能会忍不住用结构体来解决这个问题，如代码清单 6-1 所示。

**文件名：`src/main.rs`**

```rust
fn main() {
    enum IpAddrKind {
        V4,
        V6,
    }

    struct IpAddr {
        kind: IpAddrKind,
        address: String,
    }

    let home = IpAddr {
        kind: IpAddrKind::V4,
        address: String::from("127.0.0.1"),
    };

    let loopback = IpAddr {
        kind: IpAddrKind::V6,
        address: String::from("::1"),
    };
}
```

在这里，我们定义了一个结构体 `IpAddr`，它有两个字段：`kind` 字段的类型是 `IpAddrKind`（我们之前定义的枚举），`address` 字段的类型是 `String`。我们有两个此结构体的实例。第一个是 `home`，它的 `kind` 值为 `IpAddrKind::V4`，关联的地址数据为 `127.0.0.1`。第二个实例是 `loopback`。它的 `kind` 值为 `IpAddrKind` 的另一个变体 `V6`，关联的地址为 `::1`。我们使用结构体将 `kind` 和 `address` 值捆绑在一起，所以现在变体与值相关联。

然而，使用仅枚举来表示相同的概念更为简洁：与其使用结构体中的枚举，不如将数据直接放入每个枚举变体中。这个 `IpAddr` 枚举的新定义表明 `V4` 和 `V6` 两个变体都将具有关联的 `String` 值：

```rust
fn main() {
    enum IpAddr {
        V4(String),
        V6(String),
    }

    let home = IpAddr::V4(String::from("127.0.0.1"));

    let loopback = IpAddr::V6(String::from("::1"));
}
```

我们将数据直接附加到枚举的每个变体上，因此不需要额外的结构体。在这里，也更容易看到枚举工作的另一个细节：我们定义的每个枚举变体的名称也会变成一个构造该枚举实例的函数。也就是说，`IpAddr::V4()` 是一个函数调用，它接受一个 `String` 参数并返回 `IpAddr` 类型的实例。我们自动获得这个构造函数的定义，这是定义枚举的结果。

使用枚举而不是结构体还有另一个优势：每个变体可以具有不同类型和数量的关联数据。版本四 IP 地址将始终具有四个数值组件，其值在 0 到 255 之间。如果我们想将 `V4` 地址存储为四个 `u8` 值，但仍将 `V6` 地址表示为一个 `String` 值，我们无法用结构体做到这一点。枚举可以轻松处理这种情况：

```rust
fn main() {
    enum IpAddr {
        V4(u8, u8, u8, u8),
        V6(String),
    }

    let home = IpAddr::V4(127, 0, 0, 1);

    let loopback = IpAddr::V6(String::from("::1"));
}
```

我们展示了定义数据结构来存储版本四和版本六 IP 地址的几种不同方式。然而，事实证明，想要存储 IP 地址并编码它们是什么类型是如此常见，以至于[标准库有一个我们可以使用的定义！][IpAddr]<!-- ignore --> 让我们看看标准库如何定义 `IpAddr`。它具有我们定义和使用的完全相同的枚举和变体，但它将地址数据以两个不同结构体的形式嵌入到变体中，这两个结构体为每个变体分别定义：

```rust
struct Ipv4Addr {
    // --snip--
}

struct Ipv6Addr {
    // --snip--
}

enum IpAddr {
    V4(Ipv4Addr),
    V6(Ipv6Addr),
}
```

这段代码说明你可以在枚举变体中放入任何类型的数据：例如字符串、数值类型或结构体。你甚至可以包含另一个枚举！而且，标准库类型通常并不比你可能想出的复杂多少。

注意，即使标准库包含 `IpAddr` 的定义，我们仍然可以创建和使用我们自己的定义而不会冲突，因为我们没有将标准库的定义引入我们的作用域。我们将在第 7 章中更多地讨论将类型引入作用域。

让我们看看代码清单 6-2 中的另一个枚举示例：这个枚举的变体中嵌入了各种各样的类型。

**文件名：`src/main.rs`**

```rust
enum Message {
    Quit,
    Move { x: i32, y: i32 },
    Write(String),
    ChangeColor(i32, i32, i32),
}

fn main() {}
```

这个枚举有四个具有不同类型的变体：

- `Quit`：根本没有与之关联的数据
- `Move`：具有命名字段，就像结构体一样
- `Write`：包含一个 `String`
- `ChangeColor`：包含三个 `i32` 值

定义具有代码清单 6-2 中这样的变体的枚举类似于定义不同种类的结构体定义，只是枚举不使用 `struct` 关键字，所有变体都分组在 `Message` 类型下。以下结构体可以保存与前述枚举变体相同的数据：

```rust
struct QuitMessage; // 类单元结构体
struct MoveMessage {
    x: i32,
    y: i32,
}
struct WriteMessage(String); // 元组结构体
struct ChangeColorMessage(i32, i32, i32); // 元组结构体

fn main() {}
```

但如果我们使用不同的结构体，每个都有自己的类型，我们无法像使用代码清单 6-2 中定义的 `Message` 枚举（它是一个单一类型）那样轻松地定义一个函数来接受这些种类的消息中的任何一种。

枚举和结构体之间还有一个相似之处：正如我们能够使用 `impl` 在结构体上定义方法一样，我们也能够在枚举上定义方法。以下是一个我们可以定义在 `Message` 枚举上的名为 `call` 的方法：

```rust
fn main() {
    enum Message {
        Quit,
        Move { x: i32, y: i32 },
        Write(String),
        ChangeColor(i32, i32, i32),
    }

    impl Message {
        fn call(&self) {
            // 方法主体将在这里定义
        }
    }

    let m = Message::Write(String::from("hello"));
    m.call();
}
```

方法的主体会使用 `self` 来获取我们调用方法的值。在此示例中，我们创建了一个变量 `m`，其值为 `Message::Write(String::from("hello"))`，当 `m.call()` 运行时，这将是 `call` 方法主体中的 `self`。

让我们看看标准库中另一个非常常见且有用的枚举：`Option`。

### `Option` 枚举

本节探讨了 `Option` 的案例研究，它是由标准库定义的另一个枚举。`Option` 类型编码了值可能是某些内容，也可能是没有这一非常常见的情况。

例如，如果你请求非空列表中的第一项，你会得到一个值。如果你请求空列表中的第一项，你什么也得不到。用类型系统来表达这个概念意味着编译器可以检查你是否处理了所有应该处理的情况；这种功能可以防止在其他编程语言中极其常见的错误。

编程语言设计通常被认为是关于包含哪些特性，但你排除的特性也很重要。Rust 没有像许多其他语言那样的 null 特性。*Null* 是一个表示那里没有值的值。在具有 null 的语言中，变量总是可以处于两种状态之一：null 或非 null。

在 2009 年的演讲"空引用：十亿美元的错误"中，null 的发明者 Tony Hoare 是这样说的：

> 我称它为我十亿美元的错误。那时，我正在设计第一个面向对象语言中引用的综合类型系统。我的目标是确保所有引用的使用都应该是绝对安全的，由编译器自动执行检查。但我无法抗拒放入空引用的诱惑，只是因为它很容易实现。这导致了无数的错误、漏洞和系统崩溃，在过去四十年中可能造成了十亿美元的痛苦和损失。

null 值的问题在于，如果你试图将 null 值用作非 null 值，你会得到某种错误。因为这种 null 或非 null 属性无处不在，犯这种错误非常容易。

然而，null 试图表达的概念仍然是有用的：null 是由于某种原因当前无效或缺失的值。

问题实际上不在于概念，而在于特定的实现。因此，Rust 没有 null，但它确实有一个可以编码值存在或缺失概念的枚举。这个枚举是 `Option<T>`，它被[标准库定义为][option]<!-- ignore -->：

```rust
enum Option<T> {
    None,
    Some(T),
}
```

`Option<T>` 枚举非常有用，它甚至包含在预导入模块中；你不需要显式地将它引入作用域。它的变体也包含在预导入模块中：你可以直接使用 `Some` 和 `None` 而不需要 `Option::` 前缀。`Option<T>` 枚举仍然只是一个普通的枚举，`Some(T)` 和 `None` 仍然是 `Option<T>` 类型的变体。

`<T>` 语法是 Rust 中我们尚未讨论的一个特性。它是一个泛型类型参数，我们将在第 10 章中更详细地介绍泛型。目前，你需要知道的是 `<T>` 意味着 `Option` 枚举的 `Some` 变体可以容纳任何类型的一块数据，而且每个用于替代 `T` 的具体类型都会使整体 `Option<T>` 类型成为一个不同的类型。以下是使用 `Option` 值容纳数字类型和字符类型的一些示例：

```rust
fn main() {
    let some_number = Some(5);
    let some_char = Some('e');

    let absent_number: Option<i32> = None;
}
```

`some_number` 的类型是 `Option<i32>`。`some_char` 的类型是 `Option<char>`，这是一个不同的类型。Rust 可以推断这些类型，因为我们已经在 `Some` 变体中指定了值。对于 `absent_number`，Rust 要求我们标注整体 `Option` 类型：编译器不能只通过查看 `None` 值来推断相应 `Some` 变体将容纳的类型。这里，我们告诉 Rust 我们的意思是让 `absent_number` 为 `Option<i32>` 类型。

当我们有一个 `Some` 值时，我们知道存在一个值，并且该值存储在 `Some` 中。当我们有一个 `None` 值时，在某种意义上它与 null 的意思相同：我们没有有效的值。那么，拥有 `Option<T>` 比拥有 null 好在哪里呢？

简而言之，因为 `Option<T>` 和 `T`（其中 `T` 可以是任何类型）是不同的类型，编译器不会让我们将 `Option<T>` 值当作它肯定是一个有效值来使用。例如，这段代码不会编译，因为它试图将 `i8` 加到 `Option<i8>` 上：

```rust
fn main() {
    let x: i8 = 5;
    let y: Option<i8> = Some(5);

    let sum = x + y;
}
```

如果我们运行这段代码，我们会得到如下错误信息：

```console
$ cargo run
   Compiling enums v0.1.0 (file:///projects/enums)
error[E0277]: cannot add `Option<i8>` to `i8`
 --> src/main.rs:5:17
  |
5 |     let sum = x + y;
  |                 ^ no implementation for `i8 + Option<i8>`
  |
  = help: the trait `Add<Option<i8>>` is not implemented for `i8`
  = help: the following other types implement trait `Add<Rhs>`:
            `&i8` implements `Add<i8>`
            `&i8` implements `Add`
            `i8` implements `Add<&i8>`
            `i8` implements `Add`

For more information about this error, try `rustc --explain E0277`.
error: could not compile `enums` (bin "enums") due to 1 previous error
```

太强烈了！实际上，这个错误信息意味着 Rust 不理解如何将 `i8` 和 `Option<i8>` 相加，因为它们是不同的类型。当我们在 Rust 中有 `i8` 这样的类型的值时，编译器将确保我们总是有一个有效的值。我们可以充满信心地继续，而不必在使用该值之前检查 null。只有当我们有 `Option<i8>`（或我们正在处理的任何类型的值）时，我们才需要担心可能没有值，并且编译器会确保我们在使用该值之前处理这种情况。

换句话说，你必须将 `Option<T>` 转换为 `T`，然后才能用 `T` 来执行操作。一般来说，这有助于捕获 null 最常见的问题之一：假设某事物不是 null，而它实际上是。

消除错误地假设非 null 值的风险有助于你对代码更有信心。为了拥有一个可能为 null 的值，你必须通过使该值的类型为 `Option<T>` 来明确选择加入。然后，当你使用该值时，你将被要求显式处理该值为 null 的情况。在值具有不是 `Option<T>` 的类型的任何地方，你可以 *安全地* 假设该值不是 null。这是 Rust 的一个有意的设计决策，旨在限制 null 的普遍性并增加 Rust 代码的安全性。

那么，当你有 `Option<T>` 类型的值时，如何从 `Some` 变体中获取 `T` 值以便使用该值呢？`Option<T>` 枚举有大量在各种情况下有用的方法；你可以在[其文档][docs]<!-- ignore --> 中查看它们。熟悉 `Option<T>` 上的方法将对你学习 Rust 非常有用。

一般来说，为了使用 `Option<T>` 值，你希望有能够处理每个变体的代码。你希望有一些代码只在有 `Some(T)` 值时运行，并且允许这段代码使用内部的 `T`。你希望有其他一些代码只在有 `None` 值时运行，而且这段代码没有可用的 `T` 值。`match` 表达式是一种控制流构造，当与枚举一起使用时正是这样做的：它会根据枚举的哪个变体运行不同的代码，而且该代码可以使用匹配值内部的数据。
