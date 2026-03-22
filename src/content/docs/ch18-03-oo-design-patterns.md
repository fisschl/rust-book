---
title: 18.3. 实现面向对象设计模式
---

**状态模式** 是一种面向对象设计模式。该模式的核心是我们定义一个值内部可以拥有的一组状态。这些状态由一组 **状态对象** 表示，值的行为根据其状态而改变。我们将通过一个博客文章 struct 的示例来工作，它有一个字段来保存其状态，该状态将是来自集合"草稿"、"审核中"或"已发布"的状态对象之一。

状态对象共享功能：在 Rust 中，我们当然使用 struct 和 trait 而不是对象和继承。每个状态对象负责自己的行为以及管理何时应该转变为另一个状态。持有状态对象的值对状态的不同行为或何时在状态之间转换一无所知。

使用状态模式的优势在于，当程序的业务需求发生变化时，我们不需要更改持有状态的值的代码或使用该值的代码。我们只需要更新其中一个状态对象内部的代码来改变其规则，或者可能添加更多状态对象。

首先，我们将以更加传统的面向对象方式实现状态模式。然后，我们将使用一种在 Rust 中更自然的方法。让我们开始逐步使用状态模式实现博客文章工作流。

最终功能将如下所示：

1. 博客文章以空草稿开始。
2. 当草稿完成时，请求审核该文章。
3. 当文章被批准时，它会被发布。
4. 只有已发布的博客文章返回内容以供打印，这样未批准的文章就不会意外被发布。

对文章尝试的任何其他更改应该没有效果。例如，如果我们在请求审核之前尝试批准草稿博客文章，该文章应该保持为未发布的草稿。

## 尝试传统的面向对象风格

有无数种方式可以构建代码来解决同一个问题，每种方式都有不同的权衡。本节中的实现更像是传统的面向对象风格，这种风格在 Rust 中是可能的，但没有利用 Rust 的一些优势。稍后，我们将演示一种仍然使用面向对象设计模式但结构方式可能让有面向对象经验的程序员感到不那么熟悉的不同解决方案。我们将比较这两种解决方案，以体验以不同于其他语言代码的方式设计 Rust 代码的权衡。

清单 18-11 以代码形式展示了此工作流：这是我们将要在名为 `blog` 的库 crate 中实现的 API 的示例用法。这还不会编译，因为我们还没有实现 `blog` crate。

**清单 18-11**：演示我们希望 `blog` crate 具有的行为的代码（文件名：*src/main.rs*）

```rust
use blog::Post;

fn main() {
    let mut post = Post::new();

    post.add_text("I ate a salad for lunch today");
    assert_eq!("", post.content());

    post.request_review();
    assert_eq!("", post.content());

    post.approve();
    assert_eq!("I ate a salad for lunch today", post.content());
}
```

我们希望允许用户使用 `Post::new` 创建新的草稿博客文章。我们希望允许向博客文章添加文本。如果我们立即在批准之前尝试获取文章的内容，我们不应该获得任何文本，因为文章仍然是草稿。我们在代码中添加了 `assert_eq!` 用于演示目的。对此的一个很好的单元测试是断言草稿博客文章从 `content` 方法返回空字符串，但我们不会为这个例子编写测试。

接下来，我们希望启用对文章的审核请求，我们希望 `content` 在等待审核时返回空字符串。当文章收到批准时，它应该被发布，这意味着当调用 `content` 时将返回文章的文本。

请注意，我们从 crate 中交互的唯一类型是 `Post` 类型。该类型将使用状态模式，并将持有一个值，该值将是表示文章可以处于的各种状态的三个状态对象之一——草稿、审核中或已发布。从一个状态更改到另一个状态将在 `Post` 类型内部管理。状态响应于我们库的用户在 `Post` 实例上调用的方法而改变，但他们不必直接管理状态更改。此外，用户不会犯与状态相关的错误，例如在审核之前发布文章。

### 定义 `Post` 并创建新实例

让我们开始实现库吧！我们知道我们需要一个公共的 `Post` struct 来保存一些内容，因此我们将从 struct 的定义和一个相关的公共 `new` 函数开始，以创建 `Post` 的实例，如清单 18-12 所示。我们还将制作一个私有的 `State` trait，该 trait 将定义 `Post` 的所有状态对象必须具有的行为。

然后，`Post` 将在一个名为 `state` 的私有字段内的 `Option<T>` 中持有一个 `Box<dyn State>` 的 trait 对象。稍后你会明白为什么需要 `Option<T>`。

**清单 18-12**：`Post` struct、`new` 函数的定义，该函数创建一个新的 `Post` 实例，`State` trait 和 `Draft` struct（文件名：*src/lib.rs*）

```rust
pub struct Post {
    state: Option<Box<dyn State>>,
    content: String,
}

impl Post {
    pub fn new() -> Post {
        Post {
            state: Some(Box::new(Draft {})),
            content: String::new(),
        }
    }
}

trait State {}

struct Draft {}

impl State for Draft {}
```

`State` trait 定义了不同文章状态之间共享的行为。状态对象是 `Draft`、`PendingReview` 和 `Published`，它们都将实现 `State` trait。目前，trait 没有任何方法，我们首先只定义 `Draft` 状态，因为这是我们希望文章开始时的状态。

当我们创建一个新的 `Post` 时，我们将其 `state` 字段设置为一个 `Some` 值，该值持有一个 `Box`。这个 `Box` 指向一个 `Draft` struct 的新实例。这确保了每当我们创建一个新的 `Post` 实例时，它都会以草稿开始。因为 `Post` 的 `state` 字段是私有的，所以没有办法在其他状态下创建 `Post`！在 `Post::new` 函数中，我们将 `content` 字段设置为一个新的空 `String`。

### 存储文章内容的文本

我们在清单 18-11 中看到，我们希望能够调用一个名为 `add_text` 的方法并传递一个 `&str`，然后将其添加为博客文章的文本内容。我们将其实现为方法，而不是将 `content` 字段公开为 `pub`，这样稍后我们可以实现一个方法来控制如何读取 `content` 字段的数据。`add_text` 方法非常简单，所以让我们在清单 18-13 中将实现添加到 `impl Post` 块中。

**清单 18-13**：实现 `add_text` 方法以向文章的 `content` 添加文本（文件名：*src/lib.rs*）

```rust
impl Post {
    pub fn add_text(&mut self, text: &str) {
        self.content.push_str(text);
    }
}
```

`add_text` 方法接受一个对 `self` 的可变引用，因为我们正在更改我们调用 `add_text` 的 `Post` 实例。然后我们在 `content` 中的 `String` 上调用 `push_str` 并传递 `text` 参数以添加到保存的 `content` 中。这种行为不依赖于文章所处的状态，所以它不是状态模式的一部分。`add_text` 方法根本不 与 `state` 字段交互，但它是我们想要支持的行为的一部分。

### 确保草稿文章的内容为空

即使我们调用了 `add_text` 并添加了一些内容到我们的文章，我们仍然希望 `content` 方法返回一个空字符串切片，因为文章仍处于草稿状态，如清单 18-11 中的第一个 `assert_eq!` 所示。目前，让我们用最简单的东西来实现 `content` 方法以满足此要求：始终返回一个空字符串切片。一旦我们实现了改变文章状态的能力，以便它可以被发布，我们将稍后更改此实现。到目前为止，文章只能处于草稿状态，因此文章内容应该始终为空。清单 18-14 显示了此占位符实现。

**清单 18-14**：在 `Post` 上添加 `content` 方法的占位符实现，始终返回一个空字符串切片（文件名：*src/lib.rs*）

```rust
impl Post {
    pub fn content(&self) -> &str {
        ""
    }
}
```

添加了此 `content` 方法后，清单 18-11 中直到第一个 `assert_eq!` 的所有内容都按预期工作。

### 请求审核，这会改变文章的状态

接下来，我们需要添加功能以请求对文章进行审核，这应该将其状态从 `Draft` 更改为 `PendingReview`。清单 18-15 显示了此代码。

**清单 18-15**：在 `Post` 和 `State` trait 上实现 `request_review` 方法（文件名：*src/lib.rs*）

```rust
impl Post {
    pub fn request_review(&mut self) {
        if let Some(s) = self.state.take() {
            self.state = Some(s.request_review())
        }
    }
}

trait State {
    fn request_review(self: Box<Self>) -> Box<dyn State>;
}

struct Draft {}

impl State for Draft {
    fn request_review(self: Box<Self>) -> Box<dyn State> {
        Box::new(PendingReview {})
    }
}

struct PendingReview {}

impl State for PendingReview {
    fn request_review(self: Box<Self>) -> Box<dyn State> {
        self
    }
}
```

我们给 `Post` 一个名为 `request_review` 的公共方法，该方法将接受对 `self` 的可变引用。然后，我们在 `Post` 的当前状态上调用一个内部的 `request_review` 方法，这第二个 `request_review` 方法消耗当前状态并返回一个新状态。

我们将 `request_review` 方法添加到 `State` trait；所有实现该 trait 的类型现在都需要实现 `request_review` 方法。请注意，方法没有将 `self`、`&self` 或 `&mut self` 作为第一个参数，而是有 `self: Box<Self>`。这种语法意味着该方法仅在 `Box` 持有类型时被调用。这种语法获取 `Box<Self>` 的所有权，使旧状态失效，以便 `Post` 的状态值可以转换为新状态。

为了消耗旧状态，`request_review` 方法需要获取状态值的所有权。这就是 `Post` 的 `state` 字段中的 `Option` 发挥作用的地方：我们调用 `take` 方法从 `state` 字段中取出 `Some` 值并在其位置留下 `None`，因为 Rust 不允许我们在 struct 中有未填充的字段。这让我们可以将 `state` 值移出 `Post` 而不是借用。然后，我们将文章的 `state` 值设置为此操作的结果。

我们需要将 `state` 临时设置为 `None`，而不是直接使用像 `self.state = self.state.request_review();` 这样的代码来获取 `state` 值的所有权。这确保了我们已将旧 `state` 值转换为新状态后，`Post` 不能使用旧 `state` 值。

`Draft` 上的 `request_review` 方法返回一个代表文章等待审核时状态的新 `PendingReview` struct 的新装箱实例。`PendingReview` struct 也实现了 `request_review` 方法，但不执行任何转换。相反，它返回自身，因为当我们在已经处于 `PendingReview` 状态的文章上请求审核时，它应该保持在 `PendingReview` 状态。

现在我们开始看到状态模式的优势：`Post` 上的 `request_review` 方法无论其 `state` 值如何都是相同的。每个状态都负责自己的规则。

我们将 `Post` 上的 `content` 方法保持原样，返回一个空字符串切片。我们现在可以在 `PendingReview` 状态以及 `Draft` 状态下拥有一个 `Post`，但我们希望在 `PendingReview` 状态下有相同的行为。清单 18-11 现在可以工作到第二个 `assert_eq!` 调用！

### 添加 `approve` 来改变 `content` 的行为

`approve` 方法将类似于 `request_review` 方法：它将把 `state` 设置为当前状态说它在该状态被批准时应该拥有的值，如清单 18-16 所示。

**清单 18-16**：在 `Post` 和 `State` trait 上实现 `approve` 方法（文件名：*src/lib.rs*）

```rust
impl Post {
    pub fn approve(&mut self) {
        if let Some(s) = self.state.take() {
            self.state = Some(s.approve())
        }
    }
}

trait State {
    fn request_review(self: Box<Self>) -> Box<dyn State>;
    fn approve(self: Box<Self>) -> Box<dyn State>;
}

struct Draft {}

impl State for Draft {
    fn request_review(self: Box<Self>) -> Box<dyn State> {
        Box::new(PendingReview {})
    }

    fn approve(self: Box<Self>) -> Box<dyn State> {
        self
    }
}

struct PendingReview {}

impl State for PendingReview {
    fn request_review(self: Box<Self>) -> Box<dyn State> {
        self
    }

    fn approve(self: Box<Self>) -> Box<dyn State> {
        Box::new(Published {})
    }
}

struct Published {}

impl State for Published {
    fn request_review(self: Box<Self>) -> Box<dyn State> {
        self
    }

    fn approve(self: Box<Self>) -> Box<dyn State> {
        self
    }
}
```

我们将 `approve` 方法添加到 `State` trait 并添加一个实现 `State` 的新 struct，即 `Published` 状态。

类似于 `PendingReview` 上 `request_review` 的工作方式，如果我们在 `Draft` 上调用 `approve` 方法，它将没有任何效果，因为 `approve` 会返回 `self`。当我们在 `PendingReview` 上调用 `approve` 时，它返回一个 `Published` struct 的新装箱实例。`Published` struct 实现了 `State` trait，对于 `request_review` 方法和 `approve` 方法，它都返回自身，因为在这些情况下文章应该保持在 `Published` 状态。

现在我们需要更新 `Post` 上的 `content` 方法。我们希望从 `content` 返回的值取决于 `Post` 的当前状态，所以我们要让 `Post` 委托给其 `state` 上定义的 `content` 方法，如清单 18-17 所示。

**清单 18-17**：更新 `Post` 上的 `content` 方法以委托给 `State` 上的 `content` 方法（文件名：*src/lib.rs*）

```rust
impl Post {
    pub fn content(&self) -> &str {
        self.state.as_ref().unwrap().content(self)
    }
}
```

因为目标是将所有这些规则保留在实现 `State` 的 struct 内部，我们在 `state` 中的值上调用 `content` 方法并将文章实例（即 `self`）作为参数传递。然后，我们返回从在 `state` 值上使用 `content` 方法返回的值。

我们在 `Option` 上调用 `as_ref` 方法，因为我们想要对 `Option` 内部值的引用而不是该值的所有权。因为 `state` 是一个 `Option<Box<dyn State>>`，当我们调用 `as_ref` 时，会返回一个 `Option<&Box<dyn State>>`。如果我们不调用 `as_ref`，我们会得到一个错误，因为我们不能从函数参数的借用 `self` 中移出 `state`。

然后我们调用 `unwrap` 方法，我们知道它永远不会 panic，因为我们知道 `Post` 上的方法确保当这些方法完成时 `state` 始终包含一个 `Some` 值。这是我们在第 9 章的[当比编译器拥有更多信息时][more-info-than-rustc]一节中讨论过的情况之一，我们知道 `None` 值是不可能的，即使编译器无法理解这一点。

此时，当我们在 `&Box<dyn State>` 上调用 `content` 时，解引用强制转换将对 `&` 和 `Box` 生效，以便 `content` 方法最终将在实现 `State` trait 的类型上被调用。这意味着我们需要将 `content` 添加到 `State` trait 定义中，这就是我们将根据我们拥有的状态放置返回什么内容的逻辑的地方，如清单 18-18 所示。

**清单 18-18**：将 `content` 方法添加到 `State` trait（文件名：*src/lib.rs*）

```rust
trait State {
    fn request_review(self: Box<Self>) -> Box<dyn State>;
    fn approve(self: Box<Self>) -> Box<dyn State>;

    fn content<'a>(&self, post: &'a Post) -> &'a str {
        ""
    }
}

struct Published {}

impl State for Published {
    fn request_review(self: Box<Self>) -> Box<dyn State> {
        self
    }

    fn approve(self: Box<Self>) -> Box<dyn State> {
        self
    }

    fn content<'a>(&self, post: &'a Post) -> &'a str {
        &post.content
    }
}
```

我们为 `content` 方法添加了一个默认实现，返回一个空字符串切片。这意味着我们不需要在 `Draft` 和 `PendingReview` struct 上实现 `content`。`Published` struct 将覆盖 `content` 方法并返回 `post.content` 中的值。虽然方便，但在 `State` 上拥有确定 `Post` 内容的 `content` 方法模糊了 `State` 的职责和 `Post` 的职责之间的界限。

请注意，我们需要在这个方法上使用生命周期注解，正如我们在第 10 章中讨论的那样。我们接受对 `post` 的引用作为参数并返回对该 `post` 的一部分的引用，因此返回引用的生命周期与 `post` 参数的生命周期相关。

我们完成了——清单 18-11 现在全部都可以工作了！我们已经使用博客文章工作流的规则实现了状态模式。与规则相关的逻辑存在于状态对象内部，而不是分散在 `Post` 中。

> ### 为什么不用 Enum？
>
> 你可能一直在想为什么我们没有使用一个 enum，其不同可能的文章状态作为变体。这当然是一个可能的解决方案；尝试它并比较最终结果，看看你喜欢哪一个！使用 enum 的一个缺点是，检查 enum 值的每个地方都需要一个 `match` 表达式或类似的东西来处理每个可能的变体。这可能比这个 trait 对象解决方案更重复。

### 评估状态模式

我们已经证明 Rust 能够实现面向对象的状态模式来封装文章在每个状态下应该具有的不同行为。`Post` 上的方法对各种行为一无所知。由于我们组织代码的方式，我们只需要在一个地方查看以了解已发布文章可以表现的不同方式：`Published` struct 上 `State` trait 的实现。

如果我们创建一个不使用状态模式的替代实现，我们可能会在 `Post` 上的方法中甚至在检查文章状态并在那些地方改变行为的 `main` 代码中使用 `match` 表达式。这意味着我们需要在几个地方查看才能理解文章处于已发布状态的所有影响。

使用状态模式，`Post` 方法和我们使用 `Post` 的地方不需要 `match` 表达式，要添加一个新状态，我们只需要添加一个新 struct 并在该 struct 上的一个位置实现 trait 方法即可。

使用状态模式的实现很容易扩展以添加更多功能。要查看使用状态模式的代码维护的简单性，请尝试以下建议中的一些：

- 添加一个 `reject` 方法，将文章的状态从 `PendingReview` 更改回 `Draft`。
- 需要两次调用 `approve` 才能将状态更改为 `Published`。
- 仅当文章处于 `Draft` 状态时才允许用户添加文本内容。提示：让状态对象负责可能改变的内容，但不负责修改 `Post`。

状态模式的一个缺点是，因为状态实现了状态之间的转换，一些状态彼此耦合。如果我们在 `PendingReview` 和 `Published` 之间添加另一个状态，例如 `Scheduled`，我们必须更改 `PendingReview` 中的代码以转换为 `Scheduled`。如果 `PendingReview` 不需要随着新状态的添加而改变，工作量会更少，但这意味着切换到另一种设计模式。

另一个缺点是我们重复了一些逻辑。为了消除一些重复，我们可能会尝试为 `State` trait 上的 `request_review` 和 `approve` 方法创建默认实现，返回 `self`。然而，这行不通：当使用 `State` 作为 trait 对象时，trait 不知道具体 `self` 将是什么，因此返回类型在编译时是未知的。（这是前面提到的 dyn 兼容性规则之一。）

其他重复包括在 `Post` 上 `request_review` 和 `approve` 方法的类似实现。两种方法都使用 `Option::take` 处理 `Post` 的 `state` 字段，如果 `state` 是 `Some`，它们委托给包装值的相同方法实现并将 `state` 字段的新值设置为结果。如果我们在 `Post` 上有很多遵循这种模式的方法，我们可能会考虑定义一个宏来消除重复（参见第 20 章的 ["Macros"][macros] 一节）。

通过完全按照面向对象语言的定义实现状态模式，我们没有充分利用 Rust 的优势。让我们看看可以对 `blog` crate 进行哪些更改，以使无效状态和转换成为编译时错误。

## 将状态和行为编码为类型

我们将向你展示如何重新思考状态模式以获得一组不同的权衡。与其完全封装状态和转换以便外部代码对它们一无所知，我们将把状态编码为不同的类型。因此，Rust 的类型检查系统将阻止在只允许已发布文章的地方使用草稿文章的尝试，通过发出编译器错误。

让我们考虑清单 18-11 中 `main` 的第一部分：

```rust
use blog::Post;

fn main() {
    let mut post = Post::new();

    post.add_text("I ate a salad for lunch today");
    assert_eq!("", post.content());
}
```

我们仍然启用使用 `Post::new` 在草稿状态下创建新文章以及向文章内容添加文本的能力。但不是在草稿文章上有一个返回空字符串的 `content` 方法，我们将使草稿文章根本没有 `content` 方法。这样，如果我们尝试获取草稿文章的内容，我们会得到一个编译器错误告诉我们该方法不存在。因此，我们不可能意外地在生产环境中显示草稿文章内容，因为该代码甚至不会编译。清单 18-19 显示了 `Post` struct 和 `DraftPost` struct 的定义，以及每个 struct 上的方法。

**清单 18-19**：带有 `content` 方法的 `Post` 和不带 `content` 方法的 `DraftPost`（文件名：*src/lib.rs*）

```rust
pub struct Post {
    content: String,
}

pub struct DraftPost {
    content: String,
}

impl Post {
    pub fn new() -> DraftPost {
        DraftPost {
            content: String::new(),
        }
    }

    pub fn content(&self) -> &str {
        &self.content
    }
}

impl DraftPost {
    pub fn add_text(&mut self, text: &str) {
        self.content.push_str(text);
    }
}
```

`Post` 和 `DraftPost` struct 都有一个私有 `content` 字段来存储博客文章文本。struct 不再有 `state` 字段，因为我们正在将状态的编码移到 struct 的类型中。`Post` struct 将代表已发布的文章，它有一个返回 `content` 的 `content` 方法。

我们仍然有一个 `Post::new` 函数，但它不是返回 `Post` 的实例，而是返回 `DraftPost` 的实例。因为 `content` 是私有的，并且没有任何函数返回 `Post`，所以现在不可能创建 `Post` 的实例。

`DraftPost` struct 有一个 `add_text` 方法，所以我们可以像以前一样向 `content` 添加文本，但请注意，`DraftPost` 没有定义 `content` 方法！所以现在程序确保所有文章都以草稿文章开始，并且草稿文章没有可供显示的内容。任何试图绕过这些约束的尝试都会导致编译器错误。

### 将转换实现为转换为不同类型

那么，我们如何获得已发布的文章呢？我们希望强制执行草稿文章必须经过审核和批准才能发布的规则。处于待审核状态的文章仍然不应该显示任何内容。让我们通过添加另一个 struct `PendingReviewPost` 来实现这些约束，在 `DraftPost` 上定义 `request_review` 方法以返回 `PendingReviewPost`，并在 `PendingReviewPost` 上定义 `approve` 方法以返回 `Post`，如清单 18-20 所示。

**清单 18-20**：通过调用 `DraftPost` 上的 `request_review` 创建的 `PendingReviewPost` 以及将 `PendingReviewPost` 转换为已发布 `Post` 的 `approve` 方法（文件名：*src/lib.rs*）

```rust
impl DraftPost {
    pub fn add_text(&mut self, text: &str) {
        self.content.push_str(text);
    }

    pub fn request_review(self) -> PendingReviewPost {
        PendingReviewPost {
            content: self.content,
        }
    }
}

pub struct PendingReviewPost {
    content: String,
}

impl PendingReviewPost {
    pub fn approve(self) -> Post {
        Post {
            content: self.content,
        }
    }
}
```

`request_review` 和 `approve` 方法获取 `self` 的所有权，从而消耗 `DraftPost` 和 `PendingReviewPost` 实例，并将它们分别转换为 `PendingReviewPost` 和已发布的 `Post`。这样，在我们对它们调用 `request_review` 后，不会有任何剩余的 `DraftPost` 实例，等等。`PendingReviewPost` struct 上没有定义 `content` 方法，因此尝试读取其内容会导致编译器错误，就像 `DraftPost` 一样。因为获得具有定义的 `content` 方法的已发布 `Post` 实例的唯一方法是在 `PendingReviewPost` 上调用 `approve` 方法，而获得 `PendingReviewPost` 的唯一方法是在 `DraftPost` 上调用 `request_review` 方法，我们现在已将博客文章工作流编码到类型系统中。

但我们还必须对 `main` 做一些小的更改。`request_review` 和 `approve` 方法返回新实例而不是修改它们被调用的 struct，因此我们需要添加更多 `let post =` 遮蔽赋值来保存返回的实例。我们也不能对草稿和待审核文章的内容为空字符串进行断言，我们也不需要它们：我们不能再编译试图在那些状态下使用文章内容的代码。`main` 中的更新代码如清单 18-21 所示。

**清单 18-21**：对 `main` 的修改以使用博客文章工作流的新实现（文件名：*src/main.rs*）

```rust
use blog::Post;

fn main() {
    let mut post = Post::new();

    post.add_text("I ate a salad for lunch today");

    let post = post.request_review();

    let post = post.approve();

    assert_eq!("I ate a salad for lunch today", post.content());
}
```

我们需要对 `main` 进行更改以重新分配 `post` 意味着此实现不再完全遵循面向对象状态模式：状态之间的转换不再完全封装在 `Post` 实现内部。然而，我们的收获是现在由于类型系统和编译时发生的类型检查，无效状态变得不可能！这确保某些错误，例如显示未发布文章的内容，会在它们进入生产环境之前被发现。

在本节开头的建议任务中尝试在清单 18-21 之后的 `blog` crate 上，看看你对这个版本代码设计的看法。请注意，其中一些任务可能已经在此设计中完成。

我们已经看到，即使 Rust 能够实现面向对象设计模式，其他模式，例如将状态编码到类型系统中，在 Rust 中也是可用的。这些模式有不同的权衡。虽然你可能非常熟悉面向对象模式，但重新思考问题以利用 Rust 的特性可以提供好处，例如在编译时防止一些错误。由于某些特性（如所有权），面向对象模式在 Rust 中并不总是最佳解决方案，而这些特性是面向对象语言所没有的。

## 总结

无论你在阅读本章后是否认为 Rust 是一种面向对象语言，你现在都知道你可以使用 trait 对象在 Rust 中获得一些面向对象的特性。动态分发可以为你的代码提供一些灵活性，以换取一点运行时性能。你可以使用这种灵活性来实现面向对象的模式，这些模式可以帮助你的代码的可维护性。Rust 还有其他特性，如所有权，这是面向对象语言所没有的。面向对象模式并不总是利用 Rust 优势的最佳方式，但它是一个可用的选项。

接下来，我们将研究模式，这是 Rust 的另一项特性，可以实现很大的灵活性。我们在整本书中都简要地看过它们，但还没有看到它们的全部能力。让我们开始吧！

[more-info-than-rustc]: /rust-book/ch09-03-to-panic-or-not-to-panic#当比编译器拥有更多信息时
[macros]: /rust-book/ch20-05-macros
