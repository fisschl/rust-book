---
title: 使用 Trait 定义共享行为
---

 _trait_  定义特定类型具有的功能，并且可以与其他类型共享。我们可以使用 trait 以抽象方式定义共享行为。我们可以使用_trait 约束_来指定泛型类型可以是具有某些行为的任何类型。

> 注意：Trait 类似于其他语言中通常称为 _接口_ 的功能，尽管有一些差异。

## 定义 Trait

类型的行为由我们可以在该类型上调用的方法组成。如果我们可以在所有这些类型上调用相同的方法，不同的类型就共享相同的行为。Trait 定义是将方法签名分组在一起以定义完成某个目的所需的一组行为的方式。

例如，假设我们有多个结构体，它们保存各种类型和数量的文本：一个保存特定位置提交的新闻报道的 `NewsArticle` 结构体，以及一个最多可以有 280 个字符以及一些元数据的 `SocialPost`，这些元数据表明它是新帖子、转发还是回复另一个帖子。

我们想创建一个名为 `aggregator` 的媒体聚合器库 crate，可以显示可能存储在 `NewsArticle` 或 `SocialPost` 实例中的数据的摘要。为此，我们需要每种类型的摘要，我们将通过在实例上调用 `summarize` 方法来请求该摘要。代码示例 10-12 显示了公共 `Summary` trait 的定义，它表达了这种行为。

**代码示例 10-12：由 `summarize` 方法提供的行为组成的 `Summary` trait**

```rust
pub trait Summary {
    fn summarize(&self) -> String;
}
```

在这里，我们使用 `trait` 关键字声明 trait，然后是 trait 的名称，在本例中是 `Summary`。我们还将 trait 声明为 `pub`，以便依赖此 crate 的 crate 也可以使用此 trait，正如我们将在几个示例中看到的。在大括号内，我们声明描述实现此 trait 的类型的行为的方法签名，在本例中是 `fn summarize(&self) -> String`。

在方法签名之后，我们不提供大括号内的实现，而是使用分号。实现此 trait 的每种类型都必须为方法体提供自己的自定义行为。编译器将强制执行任何具有 `Summary` trait 的类型都将具有精确定义为此签名的 `summarize` 方法。

trait 可以在其主体中具有多个方法：方法签名每行列出一个，每行以分号结尾。

## 在类型上实现 Trait

现在我们已经定义了 `Summary` trait 方法的期望签名，我们可以在媒体聚合器中的类型上实现它。代码示例 10-13 显示了在 `NewsArticle` 结构体上使用标题、作者和位置创建 `summarize` 返回值的 `Summary` trait 实现。对于 `SocialPost` 结构体，我们将 `summarize` 定义为用户名后跟帖子的整个文本，假设帖子内容已经限制在 280 字符以内。

**代码示例 10-13：在 `NewsArticle` 和 `SocialPost` 类型上实现 `Summary` trait**

```rust
pub struct NewsArticle {
    pub headline: String,
    pub location: String,
    pub author: String,
    pub content: String,
}

impl Summary for NewsArticle {
    fn summarize(&self) -> String {
        format!("{}, by {} ({})", self.headline, self.author, self.location)
    }
}

pub struct SocialPost {
    pub username: String,
    pub content: String,
    pub reply: bool,
    pub repost: bool,
}

impl Summary for SocialPost {
    fn summarize(&self) -> String {
        format!("{}: {}", self.username, self.content)
    }
}
```

在类型上实现 trait 类似于实现常规方法。区别在于在 `impl` 之后，我们放置我们想要实现的 trait 名称，然后使用 `for` 关键字，然后指定我们想要为其实现 trait 的类型名称。在 `impl` 块内，我们放置 trait 定义已定义的方法签名。我们不在每个签名后添加分号，而是使用大括号并填充方法体，其中包含我们希望 trait 的方法为特定类型具有的特定行为。

现在库已在 `NewsArticle` 和 `SocialPost` 上实现了 `Summary` trait，crate 的用户可以以我们调用常规方法相同的方式在 `NewsArticle` 和 `SocialPost` 的实例上调用 trait 方法。唯一的区别是用户必须将 trait 引入作用域以及类型。以下是一个二进制 crate 如何使用我们的 `aggregator` 库 crate 的示例：

```rust
use aggregator::{Summary, SocialPost};

fn main() {
    let post = SocialPost {
        username: String::from("horse_ebooks"),
        content: String::from(
            "of course, as you probably already know, people",
        ),
        reply: false,
        repost: false,
    };

    println!("1 new post: {}", post.summarize());
}
```

这段代码打印 `1 new post: horse_ebooks: of course, as you probably already know, people`。

依赖 `aggregator` crate 的其他 crate 也可以将 `Summary` trait 引入作用域，以便在他们自己的类型上实现 `Summary`。需要注意的是，trait 和实现 trait 的类型都必须在作用域中，trait 的方法才能被使用。

## 默认实现

有时为 trait 中的某些或所有方法提供默认行为是有用的，而不是要求在每个类型上实现所有方法。然后，当我们在特定类型上实现 trait 时，可以为每个方法保留或覆盖默认行为。

代码示例 10-14 展示了如何为 `Summary` trait 的 `summarize` 方法指定默认字符串，而不是像代码示例 10-12 那样只定义方法签名。

**代码示例 10-14：`Summary` trait 的定义，其中 `summarize` 方法具有默认实现**

```rust
pub trait Summary {
    fn summarize(&self) -> String {
        String::from("(Read more...)")
    }
}
```

要使用此默认实现来总结 `SocialPost` 的实例，我们在 `impl` 块中使用空实现 `impl Summary for SocialPost {}`。

即使我们不再直接为 `SocialPost` 定义 `summarize` 方法，因为我们提供了默认实现并声明了 `SocialPost` 实现了 `Summary` trait，我们仍然可以在 `SocialPost` 的实例上调用 `summarize` 方法。

创建默认实现不会要求我们改变代码示例 10-13 中 `NewsArticle` 或 `SocialPost` 上 `Summary` 的任何内容。覆盖实现的语法与没有默认实现时实现 trait 方法的语法相同。

## Trait 作为参数

知道了如何定义 trait 和在这些 trait 上实现类型后，我们可以探索如何使用 trait 来接受多种类型的参数。

例如，假设我们想要创建一个函数 `notify`，它为 `Summary` trait 的调用者实现调用 `summarize` 方法。为此，我们可以使用 `impl Trait` 语法，如代码示例 10-15 所示。

**代码示例 10-15：`notify` 函数定义，它在其 `item` 参数上调用 `summarize`，使用 `impl Trait` 语法**

```rust
pub fn notify(item: &impl Summary) {
    println!("Breaking news! {}", item.summarize());
}
```

## Trait 约束

`impl Trait` 语法适用于简单情况，但实际上是更冗长形式的语法糖，称为 _trait 约束_ 。trait 约束与泛型类型参数一起使用，以指定类型参数必须实现 trait。

代码示例 10-16 展示了如何使用 trait 约束重写 `notify` 函数。

**代码示例 10-16：使用 `impl Trait` 语法的 `notify` 函数定义，重写成使用 trait 约束的等效形式**

```rust
pub fn notify<T: Summary>(item: &T) {
    println!("Breaking news! {}", item.summarize());
}
```

泛型类型参数声明 `<T: Summary>` 指定 `T` 必须是实现 `Summary` trait 的类型。这样做使函数能够在 `item` 上调用 `summarize`。

## 使用多个 Trait 约束

我们还可以指定多个 trait 约束。假设我们想要将 `notify` 定义为使用 `Display` trait 的格式化以及 `Summary` 的 `summarize` 方法。我们可以通过在尖括号中指定两个 trait 约束来做到这一点。

代码示例 10-17 展示了 `notify` 的签名，它要求两个 trait 约束。

**代码示例 10-17：使用 `+` 语法指定多个 trait 约束**

```rust
pub fn notify<T: Summary + Display>(item: &T) {
    println!("Breaking news! {}", item.summarize());
    println!("Notify via {}", item);
}
```

使用 `+` 语法指定 `T` 必须实现 `Summary` 和 `Display`。

## 使用 `where` 子句简化代码

使用太多 trait 约束有其缺点。每个泛型都有自己的 trait 约束，因此具有多个泛型类型参数的函数可以包含大量的 trait 约束信息在函数签名中，使函数签名难以阅读。因此，Rust 有替代的语法用于在 `where` 子句中指定 trait 约束。

代码示例 10-18 显示了 `where` 子句的使用。

**代码示例 10-18：在 `where` 子句中使用 trait 约束**

```rust
fn some_function<T, U>(t: &T, u: &U) -> i32
where
    T: Display + Clone,
    U: Clone + Debug,
{
    // 函数体
    0
}
```

## 返回实现 Trait 的类型

我们还可以使用 `impl Trait` 语法在返回位置返回实现 trait 的某些类型的值。

**代码示例 10-19：在返回类型中使用 `impl Summary`**

```rust
fn returns_summarizable() -> impl Summary {
    SocialPost {
        username: String::from("horse_ebooks"),
        content: String::from(
            "of course, as you probably already know, people",
        ),
        reply: false,
        repost: false,
    }
}
```

## 使用 Trait 约束有条件地实现方法

通过使用与泛型类型参数一起的 trait 约束，我们可以为实现了特定 trait 的类型有条件地实现方法。例如，代码示例 10-20 中的类型 `Pair<T>` 总是实现 `new` 方法来返回 `Pair<T>` 的新实例。但在下一个 `impl` 块中，`Pair<T>` 仅为其内部类型 `T` 实现 `Display` trait 和 `PartialOrd` trait 的类型实现 `cmp_display` 方法。

**代码示例 10-20：根据 trait 约束在泛型类型上有条件地实现方法**

```rust
use std::fmt::Display;

struct Pair<T> {
    x: T,
    y: T,
}

impl<T> Pair<T> {
    fn new(x: T, y: T) -> Self {
        Self { x, y }
    }
}

impl<T: Display + PartialOrd> Pair<T> {
    fn cmp_display(&self) {
        if self.x >= self.y {
            println!("最大的成员是 x = {}", self.x);
        } else {
            println!("最大的成员是 y = {}", self.y);
        }
    }
}
```

## 使用 blanket 实现实现 Trait

对满足 trait 约束的任何类型有条件地实现 trait 被称为 blanket 实现，在 Rust 文档中广泛使用。例如，标准库为任何实现了 `Display` trait 的类型实现了 `ToString` trait。

```rust
impl<T: Display> ToString for T {
    // --snip--
}
```

因为标准库具有这个 blanket 实现，我们可以对任何实现了 `Display` trait 的类型调用 `to_string` 方法。

## 总结

Trait 和 trait 约束让我们能够使用泛型类型参数编写减少重复的代码，同时向编译器指定我们希望泛型类型具有的行为。然后编译器可以使用 trait 约束信息来检查我们的代码使用的所有具体类型是否提供了正确的行为。在动态类型语言中，如果我们在未实现某个类型定义的方法的类型上调用该方法，我们可能会在运行时收到错误。但 Rust 将这些错误移动到编译时，因此我们在代码部署到生产之前就必须修复问题。

我们已经讨论了泛型、trait 和 trait 约束，现在让我们讨论生命周期。
