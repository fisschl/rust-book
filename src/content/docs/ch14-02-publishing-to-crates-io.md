---
title: 将 crate 发布到 Crates.io
---

我们已经使用来自 [crates.io](https://crates.io/) 的包作为我们项目的依赖项，但你也可以通过发布自己的包与其他人分享你的代码。[crates.io](https://crates.io/) 上的 crate 注册中心分发你包的源代码，因此它主要托管开源代码。

Rust 和 Cargo 有一些特性可以使你发布的包更容易被人们找到和使用。我们将在下面讨论其中一些特性，然后解释如何发布包。

## 编写有用的文档注释

准确地记录你的包将帮助其他用户知道如何以及何时使用它们，因此投入时间编写文档是值得的。在第3章中，我们讨论了如何使用两个斜杠 `//` 来注释 Rust 代码。Rust 还有一种特殊类型的注释用于文档，方便地称为 _文档注释_ ，它会生成 HTML 文档。HTML 显示公共 API 项的文档注释内容，这些内容是给有兴趣知道如何_使用_你的 crate 而不是你的 crate 如何_实现_的程序员看的。

文档注释使用三个斜杠 `///`，而不是两个，并支持 Markdown 符号来格式化文本。将文档注释放在它们要记录的项之前。代码示例14-1展示了一个名为 `my_crate` 的 crate 中 `add_one` 函数的文档注释。

**代码示例 14-1：函数的文档注释**

```rust
/// 将给定的数字加一。
///
/// # 示例
///
/// ```
/// let arg = 5;
/// let answer = my_crate::add_one(arg);
///
/// assert_eq!(6, answer);
/// ```
pub fn add_one(x: i32) -> i32 {
    x + 1
}
```

在这里，我们描述了 `add_one` 函数的作用，开始一个带有标题 `Examples` 的部分，然后提供演示如何使用 `add_one` 函数的代码。我们可以通过运行 `cargo doc` 从这些文档注释生成 HTML 文档。这个命令运行随 Rust 分发的 `rustdoc` 工具，并将生成的 HTML 文档放在 _target/doc_ 目录中。

为了方便起见，运行 `cargo doc --open` 将为你的当前 crate 的文档（以及你的 crate 的所有依赖项的文档）构建 HTML，并在 Web 浏览器中打开结果。导航到 `add_one` 函数，你会看到文档注释中的文本是如何呈现的，如图14-1所示。

![`my_crate` 的 `add_one` 函数的渲染 HTML 文档](img/trpl14-01.png)

**图 14-1**：`add_one` 函数的 HTML 文档

### 常用部分

我们在代码示例14-1中使用了 `# Examples` Markdown 标题来在 HTML 中创建一个标题为"Examples"的部分。以下是 crate 作者在其文档中常用的一些其他部分：

- **Panics**：记录被文档化的函数可能发生 panic 的场景。不希望程序 panic 的函数调用者应该确保他们在这些情况下不调用该函数。
- **Errors**：如果函数返回 `Result`，描述可能发生的错误类型以及可能导致返回这些错误的条件对调用者有帮助，这样他们就可以编写代码以不同方式处理不同类型的错误。
- **Safety**：如果函数调用是 `unsafe` 的（我们将在第20章讨论不安全），应该有一个部分解释为什么该函数是不安全的，并涵盖该函数期望调用者维护的不变量。

大多数文档注释不需要所有这些部分，但这是一个很好的清单，可以提醒你用户感兴趣的代码方面。

### 将文档注释作为测试

在你的文档注释中添加示例代码块可以帮助演示如何使用你的库，并且有一个额外的好处：运行 `cargo test` 会将你的文档中的代码示例作为测试运行！没有什么比带有示例的文档更好的了。但没有什么比示例不起作用更糟的了，因为代码自文档编写以来已经改变。如果我们用代码示例14-1中的 `add_one` 函数的文档运行 `cargo test`，我们将在测试结果中看到一个如下所示的部分：

```text
   Doc-tests my_crate

running 1 test
test src/lib.rs - add_one (line 5) ... ok

test result: ok. 1 passed; 0 failed; 0 ignored; 0 measured; 0 filtered out; finished in 0.27s
```

现在，如果我们更改函数或示例，使得示例中的 `assert_eq!` panic，然后再次运行 `cargo test`，我们将看到文档测试捕获到示例和代码不同步！

### 包含项的注释

文档注释风格 `//!` 将文档添加到 _包含_ 注释的项，而不是注释 _后面的_ 项。我们通常使用这些文档注释在 crate 根文件（按惯例是 _src/lib.rs_）或模块中，用于文档化整个 crate 或模块。

例如，为了添加描述包含 `add_one` 函数的 `my_crate` crate 目的的文档，我们将以 `//!` 开头的文档注释添加到 _src/lib.rs_ 文件的开头，如代码示例14-2所示。

**代码示例 14-2：整个 `my_crate` crate 的文档**

```rust
//! # My Crate
//!
//! `my_crate` 是一个工具集合，使执行某些计算更加方便。

/// 将给定的数字加一。
///
/// # 示例
///
/// ```
/// let arg = 5;
/// let answer = my_crate::add_one(arg);
///
/// assert_eq!(6, answer);
/// ```
pub fn add_one(x: i32) -> i32 {
    x + 1
}
```

注意在最后一行以 `//!` 开头之后没有任何代码。因为我们用 `//!` 而不是 `///` 开始注释，我们正在记录包含此注释的项，而不是此注释后面的项。在这种情况下，该项是 _src/lib.rs_ 文件，它是 crate 根。这些注释描述了整个 crate。

当我们运行 `cargo doc --open` 时，这些注释将显示在 `my_crate` 文档的首页上，位于 crate 中公共项列表的上方，如图14-2所示。

![带有描述整个 crate 注释的渲染 HTML 文档](img/trpl14-02.png)

**图 14-2**：`my_crate` 的渲染文档，包括描述整个 crate 的注释

项内的文档注释对于描述 crate 和模块特别有用。使用它们来解释容器的总体目的，以帮助你的用户理解 crate 的组织结构。

## 导出一个方便的公共 API

发布 crate 时，公共 API 的结构是一个主要考虑因素。使用你的 crate 的人没有你熟悉其结构，如果你的 crate 有一个大的模块层次结构，他们可能难以找到他们想要使用的部分。

在第7章中，我们介绍了如何使用 `pub` 关键字使项变为公共，以及如何使用 `use` 关键字将项引入作用域。然而，在你开发 crate 时有意义的结构可能对你的用户来说并不方便。你可能希望将结构组织在包含多个层次的层次结构中，但随后想要使用你在层次结构深处定义的类型的用户可能会难以发现该类型存在。他们也可能对必须在 `use` 语句中输入 `use my_crate::some_module::another_module::UsefulType;` 而不是 `use my_crate::UsefulType;` 感到恼火。

好消息是，如果结构对他人从另一个库使用不方便，你不必重新排列你的内部组织：相反，你可以使用 `pub use` 重新导出项，以创建一个与你的私有结构不同的公共结构。*重新导出* 将把一个位置的公共项在另一个位置也变成公共的，就像它是在另一个位置定义的一样。

例如，假设我们创建了一个名为 `art` 的库，用于建模艺术概念。在这个库中有两个模块：一个 `kinds` 模块，包含两个名为 `PrimaryColor` 和 `SecondaryColor` 的枚举，以及一个 `utils` 模块，包含一个名为 `mix` 的函数，如代码示例14-3所示。

**代码示例 14-3：将项组织到 `kinds` 和 `utils` 模块中的 `art` 库**

```rust
//! # Art
//!
//! 一个用于建模艺术概念的库。

pub mod kinds {
    /// 根据 RYB 颜色模型的原色。
    pub enum PrimaryColor {
        Red,
        Yellow,
        Blue,
    }

    /// 根据 RYB 颜色模型的次色。
    pub enum SecondaryColor {
        Orange,
        Green,
        Purple,
    }
}

pub mod utils {
    use crate::kinds::*;

    /// 将两种原色等量混合以创建
    /// 一种次色。
    pub fn mix(c1: PrimaryColor, c2: PrimaryColor) -> SecondaryColor {
        SecondaryColor::Orange
    }
}
```

图14-3显示了 `cargo doc` 为此 crate 生成的文档首页的样子。

![列出 `kinds` 和 `utils` 模块的 `art` crate 的渲染文档](img/trpl14-03.png)

**图 14-3**：`art` 的文档首页，列出 `kinds` 和 `utils` 模块

注意 `PrimaryColor` 和 `SecondaryColor` 类型没有列在首页上，`mix` 函数也没有。我们必须点击 `kinds` 和 `utils` 才能看到它们。

另一个依赖于这个库的 crate 需要 `use` 语句，将 `art` 中的项引入作用域，指定当前定义的模块结构。代码示例14-4展示了一个使用 `art` crate 的 `PrimaryColor` 和 `mix` 项的 crate 示例。

**代码示例 14-4：使用 `art` crate 的项及其内部结构导出的 crate**

```rust
use art::kinds::PrimaryColor;
use art::utils::mix;

fn main() {
    let red = PrimaryColor::Red;
    let yellow = PrimaryColor::Yellow;
    mix(red, yellow);
}
```

代码示例14-4中使用 `art` crate 的代码作者必须弄清楚 `PrimaryColor` 在 `kinds` 模块中，`mix` 在 `utils` 模块中。`art` crate 的模块结构对从事 `art` crate 工作的开发人员比对其使用者更相关。内部结构不包含任何对试图理解如何使用 `art` crate 的人有用的信息，反而会造成混淆，因为使用它的开发人员必须弄清楚在哪里查找，并且必须在 `use` 语句中指定模块名。

为了从公共 API 中移除内部组织，我们可以修改代码示例14-3中的 `art` crate 代码，添加 `pub use` 语句，在顶层重新导出项，如代码示例14-5所示。

**代码示例 14-5：添加 `pub use` 语句来重新导出项**

```rust
//! # Art
//!
//! 一个用于建模艺术概念的库。

pub use self::kinds::PrimaryColor;
pub use self::kinds::SecondaryColor;
pub use self::utils::mix;

pub mod kinds {
    /// 根据 RYB 颜色模型的原色。
    pub enum PrimaryColor {
        Red,
        Yellow,
        Blue,
    }

    /// 根据 RYB 颜色模型的次色。
    pub enum SecondaryColor {
        Orange,
        Green,
        Purple,
    }
}

pub mod utils {
    use crate::kinds::*;

    /// 将两种原色等量混合以创建
    /// 一种次色。
    pub fn mix(c1: PrimaryColor, c2: PrimaryColor) -> SecondaryColor {
        SecondaryColor::Orange
    }
}
```

`cargo doc` 为此 crate 生成的 API 文档现在将在首页上列出并链接重新导出，如图14-4所示，使 `PrimaryColor` 和 `SecondaryColor` 类型以及 `mix` 函数更容易找到。

![首页上带有重新导出的 `art` crate 的渲染文档](img/trpl14-04.png)

**图 14-4**：列出重新导出的 `art` 文档首页

`art` crate 的用户仍然可以看到并使用代码示例14-3中演示的内部结构，或者他们可以使用代码示例14-5中更方便的结构，如代码示例14-6所示。

**代码示例 14-6：使用 `art` crate 重新导出的项的程序**

```rust
use art::PrimaryColor;
use art::mix;

fn main() {
    let red = PrimaryColor::Red;
    let yellow = PrimaryColor::Yellow;
    mix(red, yellow);
}
```

在有许多嵌套模块的情况下，在顶层使用 `pub use` 重新导出类型可以对使用 crate 的人的体验产生重大影响。`pub use` 的另一个常见用途是在当前 crate 中重新导出依赖项的定义，以使该 crate 的定义成为你 crate 的公共 API 的一部分。

创建一个有用的公共 API 结构与其说是一门科学，不如说是一门艺术，你可以迭代以找到对你的用户最有效的 API。选择 `pub use` 让你在如何内部组织你的 crate 方面具有灵活性，并将该内部结构与你向用户展示的内容解耦。查看你安装的一些 crate 的代码，看看它们的内部结构是否与它们的公共 API 不同。

## 设置 Crates.io 账户

在你可以发布任何 crate 之前，你需要在 [crates.io](https://crates.io/) 上创建一个账户并获取一个 API 令牌。为此，请访问 [crates.io](https://crates.io/) 主页，通过 GitHub 账户登录。（GitHub 账户目前是必需的，但该网站将来可能会支持其他创建账户的方式。）登录后，访问你在 [https://crates.io/me/](https://crates.io/me/) 的账户设置并获取你的 API 密钥。然后，运行 `cargo login` 命令并在提示时粘贴你的 API 密钥，如下所示：

```console
$ cargo login
abcdefghijklmnopqrstuvwxyz012345
```

此命令将通知 Cargo 你的 API 令牌，并将其本地存储在 _~/.cargo/credentials.toml_ 中。请注意，此令牌是一个秘密：不要与任何其他人分享。如果你因任何原因与他人分享，你应该撤销它并在 [crates.io](https://crates.io/) 上生成一个新令牌。

## 向新 crate 添加元数据

假设你有一个想要发布的 crate。在发布之前，你需要在 crate 的 _Cargo.toml_ 文件的 `[package]` 部分添加一些元数据。

你的 crate 需要一个唯一的名称。当你在本地处理 crate 时，你可以随意命名 crate。然而，[crates.io](https://crates.io/) 上的 crate 名称是按照先到先得的原则分配的。一旦一个 crate 名称被占用，其他人就不能再用该名称发布 crate。在尝试发布 crate 之前，搜索你想要使用的名称。如果该名称已被使用，你需要找到另一个名称，并编辑 _Cargo.toml_ 文件中 `[package]` 部分下的 `name` 字段以使用新名称进行发布，如下所示：

**文件名：Cargo.toml**

```toml
[package]
name = "guessing_game"
```

即使你选择了一个唯一的名称，当你此时运行 `cargo publish` 来发布 crate 时，你会得到一个警告，然后是一个错误：

```console
$ cargo publish
    Updating crates.io index
warning: manifest has no description, license, license-file, documentation, homepage or repository.
See https://doc.rust-lang.org/cargo/reference/manifest.html#package-metadata for more info.
--snip--
error: failed to publish to registry at https://crates.io

Caused by:
  the remote server responded with an error (status 400 Bad Request): missing or empty metadata fields: description, license. Please see https://doc.rust-lang.org/cargo/reference/manifest.html for more information on configuring these fields
```

这会导致错误，因为你缺少一些关键信息：描述和许可是必需的，这样人们才会知道你的 crate 是做什么的，以及在什么条款下他们可以使用它。在 _Cargo.toml_ 中，添加一个只有一两句话的描述，因为它将与你的 crate 一起在搜索结果中显示。对于 `license` 字段，你需要给出一个_许可证标识符值_。[Linux 基金会的软件包数据交换（SPDX）][spdx]列出了你可以用于此值的标识符。例如，要指定你使用 MIT 许可证许可你的 crate，添加 `MIT` 标识符：

**文件名：Cargo.toml**

```toml
[package]
name = "guessing_game"
license = "MIT"
```

如果你想使用 SPDX 中没有的许可证，你需要将该许可证的文本放在一个文件中，将该文件包含在你的项目中，然后使用 `license-file` 来指定该文件的名称，而不是使用 `license` 键。

关于哪个许可证适合你的项目的指导超出了本书的范围。Rust 社区中的许多人以与 Rust 相同的方式许可他们的项目，即使用 `MIT OR Apache-2.0` 的双许可证。这种做法表明，你也可以用 `OR` 分隔指定多个许可证标识符，为你的项目设置多个许可证。

添加了唯一的名称、版本、描述和许可证后，准备发布的项目的 _Cargo.toml_ 文件可能如下所示：

**文件名：Cargo.toml**

```toml
[package]
name = "guessing_game"
version = "0.1.0"
edition = "2024"
description = "一个有趣的游戏，你猜电脑选了什么数字。"
license = "MIT OR Apache-2.0"

[dependencies]
```

[Cargo 的文档](https://doc.rust-lang.org/cargo/) 描述了你可以指定的其他元数据，以确保其他人可以轻松地发现和使用你的 crate。

## 发布到 Crates.io

现在你已经创建了账户，保存了 API 令牌，为你的 crate 选择了名称，并指定了所需的元数据，你已经准备好发布了！发布 crate 将特定版本上传到 [crates.io](https://crates.io/) 供其他人使用。

要小心，因为发布是 _永久的_ 。版本永远不能被覆盖，代码也不能被删除，除非在某些情况下。Crates.io 的一个主要目标是作为代码的永久存档，以便所有依赖于 [crates.io](https://crates.io/) crate 的项目的构建将继续工作。允许版本删除将使实现该目标变得不可能。然而，你可以发布的 crate 版本数量没有限制。

再次运行 `cargo publish` 命令。现在它应该会成功：

```console
$ cargo publish
    Updating crates.io index
   Packaging guessing_game v0.1.0 (file:///projects/guessing_game)
    Packaged 6 files, 1.2KiB (895.0B compressed)
   Verifying guessing_game v0.1.0 (file:///projects/guessing_game)
   Compiling guessing_game v0.1.0
(file:///projects/guessing_game/target/package/guessing_game-0.1.0)
    Finished `dev` profile [unoptimized + debuginfo] target(s) in 0.19s
   Uploading guessing_game v0.1.0 (file:///projects/guessing_game)
    Uploaded guessing_game v0.1.0 to registry `crates-io`
note: waiting for `guessing_game v0.1.0` to be available at registry
`crates-io`.
You may press ctrl-c to skip waiting; the crate should be available shortly.
   Published guessing_game v0.1.0 at registry `crates-io`
```

恭喜你！你现在已与 Rust 社区分享了你的代码，任何人都可以轻松地将你的 crate 作为他们项目的依赖项添加。

## 发布现有 crate 的新版本

当你对 crate 进行了更改并准备发布新版本时，你更改 _Cargo.toml_ 文件中指定的 `version` 值并重新发布。根据你所做的更改类型，使用[语义化版本规则][semver]来决定适当的下一个版本号是什么。然后，运行 `cargo publish` 上传新版本。

## 从 Crates.io 弃用版本

虽然你不能删除 crate 的先前版本，但你可以阻止任何未来的项目将它们添加为新的依赖项。当 crate 版本由于某种原因损坏时，这很有用。在这种情况下，Cargo 支持撤回 crate 版本。

_撤回_ 一个版本会阻止新项目依赖于该版本，同时允许所有现有依赖于它的项目继续。本质上，撤回意味着所有带有 _Cargo.lock_ 的项目都不会中断，并且任何未来生成的 _Cargo.lock_ 文件都不会使用撤回的版本。

要撤回 crate 的版本，在你之前发布过的 crate 的目录中，运行 `cargo yank` 并指定你要撤回的版本。例如，如果我们已经发布了名为 `guessing_game` 版本 1.0.1 的 crate，我们想撤回它，那么我们在 `guessing_game` 的项目目录中运行以下命令：

```console
$ cargo yank --vers 1.0.1
    Updating crates.io index
        Yank guessing_game@1.0.1
```

通过在命令中添加 `--undo`，你也可以撤回撤回并允许项目再次开始依赖某个版本：

```console
$ cargo yank --vers 1.0.1 --undo
    Updating crates.io index
      Unyank guessing_game@1.0.1
```

撤回 _不会_ 删除任何代码。例如，它不能删除意外上传的机密。如果发生这种情况，你必须立即重置这些机密。

[spdx]: https://spdx.org/licenses/
[semver]: https://semver.org/
