---
title: 2. 编写猜数字游戏
---

让我们通过动手实践一个项目来开始学习 Rust！本章将通过在一个真实程序中使用它们来向你介绍一些常见的 Rust 概念。你将学习 `let`、`match`、方法、关联函数、外部 crate 等！在后续章节中，我们将更详细地探讨这些概念。在本章中，你将只是练习基础知识。

我们将实现一个经典的初学者编程问题：猜数字游戏。工作原理如下：程序将生成一个 1 到 100 之间的随机整数。然后提示玩家输入一个猜测。输入猜测后，程序将指示猜测是太低还是太高。如果猜测正确，游戏将打印祝贺消息并退出。

## 建立新项目

要建立新项目，请进入你在第 1 章创建的 *projects* 目录，并使用 Cargo 创建一个新项目，如下所示：

```console
$ cargo new guessing_game
$ cd guessing_game
```

第一个命令 `cargo new` 以项目名称（`guessing_game`）作为第一个参数。第二个命令切换到新项目的目录。

查看生成的 *Cargo.toml* 文件：

*文件名：Cargo.toml*

```toml
[package]
name = "guessing_game"
version = "0.1.0"
edition = "2024"

# 有关更多键及其定义，请参见 https://doc.rust-lang.org/cargo/reference/manifest.html

[dependencies]
```

正如你在第 1 章所见，`cargo new` 为你生成了一个 "Hello, world!" 程序。查看 *src/main.rs* 文件：

*文件名：src/main.rs*

```rust
fn main() {
    println!("Hello, world!");
}
```

现在让我们使用 `cargo run` 命令一步编译并运行这个 "Hello, world!" 程序：

```console
$ cargo run
   Compiling guessing_game v0.1.0 (file:///projects/guessing_game)
    Finished `dev` profile [unoptimized + debuginfo] target(s) in 6.44s
     Running `target/debug/guessing_game`
Hello, world!
```

当你需要快速迭代一个项目时，`run` 命令非常方便，就像我们将在这个游戏中做的那样，在进入下一步之前快速测试每一次迭代。

重新打开 *src/main.rs* 文件。你将在这个文件中编写所有代码。

## 处理猜测

猜数字游戏程序的第一部分将要求用户输入，处理该输入，并检查输入是否符合预期格式。首先，我们将允许玩家输入一个猜测。在 *src/main.rs* 中输入清单 2-1 中的代码。

**清单 2-1**：从用户获取猜测并打印的代码（文件名：*src/main.rs*）

```rust
use std::io;

fn main() {
    println!("Guess the number!");

    println!("Please input your guess.");

    let mut guess = String::new();

    io::stdin()
        .read_line(&mut guess)
        .expect("Failed to read line");

    println!("You guessed: {guess}");
}
```

这段代码包含大量信息，让我们逐行讲解。要获取用户输入然后打印结果作为输出，我们需要将 `io` 输入/输出库引入作用域。`io` 库来自标准库，称为 `std`：

```rust
use std::io;
```

默认情况下，Rust 在标准库中定义了一组项目，它们会被引入每个程序的作用域。这组项目称为 *预导入*（prelude），你可以在[标准库文档][prelude]中看到其中的所有内容。

如果你想要使用的类型不在预导入中，你必须使用 `use` 语句显式将该类型引入作用域。使用 `std::io` 库为你提供了许多有用的功能，包括接受用户输入的能力。

正如你在第 1 章所见，`main` 函数是程序的入口点：

```rust
fn main() {

}
```

`fn` 语法声明了一个新函数；括号 `()` 表示没有参数；花括号 `{` 开始函数的主体。

正如你在第 1 章也学到的，`println!` 是一个将字符串打印到屏幕的宏：

```rust
println!("Guess the number!");

println!("Please input your guess.");
```

这段代码打印一个提示，说明游戏是什么并请求用户输入。

### 使用变量存储值

接下来，我们将创建一个 *变量* 来存储用户输入，像这样：

```rust
let mut guess = String::new();
```

现在程序变得有趣了！这一小段代码中发生了很多事情。我们使用 `let` 语句来创建变量。下面是另一个例子：

```rust
let apples = 5;
```

这一行创建了一个名为 `apples` 的新变量并将其绑定到值 `5`。在 Rust 中，变量默认是不可变的，这意味着一旦我们给变量一个值，该值就不会改变。我们将在[第 3 章的 "变量和可变性"][variables-and-mutability]部分详细讨论这个概念。要使变量可变，我们在变量名前添加 `mut`：

```rust
let apples = 5; // 不可变
let mut bananas = 5; // 可变
```

> 注意：`//` 语法开始一个注释，持续到行尾。Rust 忽略注释中的所有内容。我们将在[第 3 章][comments]更详细地讨论注释。

回到猜数字游戏程序，你现在知道 `let mut guess` 将引入一个名为 `guess` 的可变变量。等号（`=`）告诉 Rust 我们现在想要绑定一些东西到变量。等号右边是 `guess` 绑定的值，即调用 `String::new` 的结果，一个返回 `String` 新实例的函数。[`String`][string] 是标准库提供的一种字符串类型，是一个可增长的、UTF-8 编码的文本片段。

`::new` 这一行中的 `::` 语法表示 `new` 是 `String` 类型的关联函数。关联函数是在类型上实现的函数，在这个例子中是 `String`。这个 `new` 函数创建一个新的空字符串。你会在许多类型上找到 `new` 函数，因为它是一个创建某种新值的函数的常见名称。

总之，`let mut guess = String::new();` 这一行创建了一个可变变量，它当前绑定到一个新的、空的 `String` 实例。呼！

### 接收用户输入

回想一下，我们在程序的第一行用 `use std::io;` 包含了来自标准库的输入/输出功能。现在我们将调用 `io` 模块中的 `stdin` 函数，它将允许我们处理用户输入：

```rust
io::stdin()
    .read_line(&mut guess)
    .expect("Failed to read line");
```

如果我们没有在程序开头用 `use std::io;` 导入 `io` 模块，我们仍然可以通过将该函数调用写成 `std::io::stdin` 来使用该函数。`stdin` 函数返回一个 [`std::io::Stdin`][iostdin] 的实例，这是一个表示终端标准输入句柄的类型。

接下来，这一行 `.read_line(&mut guess)` 调用标准输入句柄上的 [`read_line`][read_line] 方法来获取用户输入。我们还传递 `&mut guess` 作为参数给 `read_line`，告诉它要将用户输入存储在哪个字符串中。`read_line` 的完整工作是将用户在标准输入中输入的任何内容追加到字符串中（不覆盖其内容），因此我们传递该字符串作为参数。字符串参数需要是可变的，以便方法可以更改字符串的内容。

`&` 表示这个参数是一个 *引用*，它让你可以让代码的多个部分访问一段数据而无需将该数据复制到内存中多次。引用是一个复杂的功能，而 Rust 的主要优势之一就是使用引用的安全性和简易性。你不需要知道很多这些细节就能完成这个程序。目前，你只需要知道，像变量一样，引用默认是不可变的。因此，你需要写 `&mut guess` 而不是 `&guess` 来使其可变。（第 4 章将更彻底地解释引用。）

### 使用 `Result` 处理潜在失败

我们仍在处理这行代码。我们现在讨论的是第三行文本，但注意它仍然是单个逻辑代码行的一部分。下一部分是这个方法：

```rust
    .expect("Failed to read line");
```

我们可以这样写这段代码：

```rust
io::stdin().read_line(&mut guess).expect("Failed to read line");
```

然而，一行太长的代码难以阅读，所以最好将其分割。当你使用 `.method_name()` 语法调用方法时，引入换行符和其他空白通常有助于分割长行。现在让我们讨论这行代码的作用。

如前所述，`read_line` 将用户输入的任何内容放入我们传递给它的字符串中，但它也返回一个 `Result` 值。[`Result`][result] 是一个[枚举][enums]，通常称为 *enum*，是一种可以处于多种可能状态之一的类型。我们将每种可能的状态称为一个 *变体*。

[第 6 章][enums] 将更详细地介绍枚举。这些 `Result` 类型的目的是编码错误处理信息。

`Result` 的变体是 `Ok` 和 `Err`。`Ok` 变体表示操作成功，它包含成功生成的值。`Err` 变体表示操作失败，它包含有关操作如何或为何失败的信息。

像任何类型的值一样，`Result` 类型的值定义了方法。`Result` 的实例有一个 [`expect` 方法][expect]，你可以调用它。如果这个 `Result` 实例是一个 `Err` 值，`expect` 将导致程序崩溃并显示你作为参数传递给 `expect` 的消息。如果 `read_line` 方法返回一个 `Err`，它很可能是底层操作系统错误的结果。如果这个 `Result` 实例是一个 `Ok` 值，`expect` 将取回 `Ok` 持有的返回值并将其返回给你以便使用。在这种情况下，该值是用户输入的字节数。

如果你不调用的 `expect`，程序会编译，但你会得到一个警告：

```console
$ cargo build
   Compiling guessing_game v0.1.0 (file:///projects/guessing_game)
warning: unused `Result` that must be used
  --> src/main.rs:10:5
   |
10 |     io::stdin().read_line(&mut guess);
   |     ^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^
   |
   = note: this `Result` may be an `Err` variant, which should be handled
   = note: `#[warn(unused_must_use)]` on by default
help: use `let _ = ...` to ignore the resulting value
   |
10 |     let _ = io::stdin().read_line(&mut guess);
   |         +++++

warning: `guessing_game` (bin "guessing_game") generated 1 warning
    Finished `dev` profile [unoptimized + debuginfo] target(s) in 6.44s
```

Rust 警告你没有使用 `read_line` 返回的 `Result` 值，表明程序没有处理可能的错误。

抑制警告的正确方法是实际编写错误处理代码，但在我们的情况下，我们只想在出现问题时让程序崩溃，所以我们可以使用 `expect`。你将在[第 9 章][recover]学习如何从错误中恢复。

### 使用 `println!` 占位符打印值

除了右花括号之外，到目前为止的代码中只有一行需要讨论：

```rust
println!("You guessed: {guess}");
```

这一行打印现在包含用户输入的字符串。`{}` 这组花括号是一个占位符：把 `{}` 想象成夹住值的小蟹钳。当打印变量的值时，变量名可以放在花括号内。当打印求值表达式的结果时，在格式字符串中放置空花括号，然后在格式字符串后面跟随逗号分隔的要打印的表达式列表，顺序与每个空花括号占位符相同。在一个 `println!` 调用中同时打印变量和表达式结果看起来像这样：

```rust
let x = 5;
let y = 10;

println!("x = {x} and y + 2 = {}", y + 2);
```

这段代码将打印 `x = 5 and y + 2 = 12`。

### 测试第一部分

让我们测试猜数字游戏的第一部分。使用 `cargo run` 运行它：

```console
$ cargo run
   Compiling guessing_game v0.1.0 (file:///projects/guessing_game)
    Finished `dev` profile [unoptimized + debuginfo] target(s) in 6.44s
     Running `target/debug/guessing_game`
Guess the number!
Please input your guess.
6
You guessed: 6
```

此时，游戏的第一部分完成了：我们正在从键盘获取输入并打印它。

## 生成秘密数字

接下来，我们需要生成一个用户尝试猜测的秘密数字。秘密数字应该每次都不同，这样游戏玩多次才有意思。我们将使用 1 到 100 之间的随机数，这样游戏不会太难。Rust 尚未在其标准库中包含随机数功能。然而，Rust 团队确实提供了一个 [`rand` crate][randcrate] 来实现该功能。

### 使用 Crate 增加功能

记住，crate 是 Rust 源代码文件的集合。我们一直在构建的项目是一个二进制 crate，是一个可执行文件。`rand` crate 是一个库 crate，包含旨在用于其他程序的代码，不能单独执行。

Cargo 协调外部 crate 是 Cargo 真正出彩的地方。在我们编写使用 `rand` 的代码之前，我们需要修改 *Cargo.toml* 文件以将 `rand` crate 作为依赖包含进来。立即打开该文件，在 Cargo 为你创建的 `[dependencies]` 节标题下方添加以下行。确保完全按照我们此处指定的方式指定 `rand`，包括此版本号，否则本教程中的代码示例可能无法工作：

*文件名：Cargo.toml*

```toml
[dependencies]
rand = "0.8.5"
```

在 *Cargo.toml* 文件中，标题后面的所有内容都属于该节，直到另一个节开始。在 `[dependencies]` 中，你告诉 Cargo 你的项目依赖哪些外部 crate 以及你需要这些 crate 的哪些版本。在这种情况下，我们使用语义版本说明符 `0.8.5` 指定 `rand` crate。Cargo 理解[语义版本控制][semver]（有时称为 *SemVer*），这是编写版本号的标准。说明符 `0.8.5` 实际上是 `^0.8.5` 的简写，意思是任何至少是 0.8.5 但低于 0.9.0 的版本。

Cargo 认为这些版本具有与 0.8.5 版本兼容的公共 API，此规范确保你将获得最新的补丁版本，该版本仍将与本章中的代码编译。任何 0.9.0 或更高版本都不能保证具有与以下示例使用的相同 API。

现在，在不更改任何代码的情况下，让我们构建项目，如清单 2-2 所示。

**清单 2-2**：添加 `rand` crate 作为依赖后运行 `cargo build` 的输出

```console
$ cargo build
  Updating crates.io index
   Locking 15 packages to latest Rust 1.85.0 compatible versions
    Adding rand v0.8.5 (available: v0.9.0)
 Compiling proc-macro2 v1.0.93
 Compiling unicode-ident v1.0.17
 Compiling libc v0.2.170
 Compiling cfg-if v1.0.0
 Compiling byteorder v1.5.0
 Compiling getrandom v0.2.15
 Compiling rand_core v0.6.4
 Compiling quote v1.0.38
 Compiling syn v2.0.98
 Compiling zerocopy-derive v0.7.35
 Compiling zerocopy v0.7.35
 Compiling ppv-lite86 v0.2.20
 Compiling rand_chacha v0.3.1
 Compiling rand v0.8.5
 Compiling guessing_game v0.1.0 (file:///projects/guessing_game)
  Finished `dev` profile [unoptimized + debuginfo] target(s) in 2.48s
```

你可能会看到不同的版本号（但由于 SemVer，它们都将与代码兼容！）和不同的行（取决于操作系统），行的顺序也可能不同。

当我们包含外部依赖时，Cargo 从 *registry* 获取该依赖所需的一切的最新版本，registry 是来自 [Crates.io][cratesio] 的数据副本。Crates.io 是 Rust 生态系统中人们发布他们的开源 Rust 项目供他人使用的地方。

更新 registry 后，Cargo 检查 `[dependencies]` 节并下载任何尚未下载的列出的 crate。在这种情况下，尽管我们只将 `rand` 列为依赖，Cargo 还获取了 `rand` 依赖的其他 crate 以正常工作。下载 crate 后，Rust 编译它们，然后用可用的依赖编译项目。

如果你立即再次运行 `cargo build` 而不做任何更改，除了 `Finished` 这一行之外你不会得到任何输出。Cargo 知道它已经下载并编译了依赖，而且你没有在 *Cargo.toml* 文件中更改任何关于它们的内容。Cargo 也知道你没有更改任何代码，所以它也不会重新编译。没有什么可做的，它只是退出。

如果你打开 *src/main.rs* 文件，做一个微小的更改，然后保存并再次构建，你只会看到两行输出：

```console
$ cargo build
   Compiling guessing_game v0.1.0 (file:///projects/guessing_game)
    Finished `dev` profile [unoptimized + debuginfo] target(s) in 0.13s
```

这些行表明 Cargo 只更新了你对 *src/main.rs* 文件所做微小更改的构建。你的依赖没有更改，所以 Cargo 知道它可以重用已经为那些下载和编译的内容。

#### 确保可重现的构建

Cargo 有一个机制可以确保你或任何其他人在构建你的代码时每次都能重建相同的产物：Cargo 将只使用你指定的依赖版本，直到你另行指示。例如，假设下周 `rand` crate 的 0.8.6 版本发布了，该版本包含一个重要的错误修复，但也包含一个会破坏你代码的回归。为了处理这种情况，Rust 在你第一次运行 `cargo build` 时创建 *Cargo.lock* 文件，所以我们现在在 *guessing_game* 目录中有这个文件。

当你第一次构建项目时，Cargo 会找出符合标准的所有依赖版本，然后将它们写入 *Cargo.lock* 文件。将来构建项目时，Cargo 会看到 *Cargo.lock* 文件存在，并将使用那里指定的版本，而不是重新做一遍确定版本的工作。这让你自动拥有可重现的构建。换句话说，由于 *Cargo.lock* 文件，你的项目将保持在 0.8.5 版本，直到你明确升级。因为 *Cargo.lock* 文件对于可重现的构建很重要，它通常与你的项目中的其余代码一起被检入源代码控制。

#### 更新 Crate 以获取新版本

当你*确实*想要更新一个 crate 时，Cargo 提供了 `update` 命令，它将忽略 *Cargo.lock* 文件并找出符合你在 *Cargo.toml* 中指定的最新版本。Cargo 然后将这些版本写入 *Cargo.lock* 文件。否则，默认情况下，Cargo 只会寻找大于 0.8.5 且小于 0.9.0 的版本。如果 `rand` crate 发布了两个新版本 0.8.6 和 0.999.0，如果你运行 `cargo update`，你会看到以下内容：

```console
$ cargo update
    Updating crates.io index
     Locking 1 package to latest Rust 1.85.0 compatible version
    Updating rand v0.8.5 -> v0.8.6 (available: v0.999.0)
```

Cargo 忽略了 0.999.0 版本。此时，你还会注意到 *Cargo.lock* 文件中的更改，指出你现在使用的 `rand` crate 版本是 0.8.6。要使用 `rand` 版本 0.999.0 或 0.999.*x* 系列中的任何版本，你必须像这样更新 *Cargo.toml* 文件（不要实际做这个更改，因为以下示例假设你使用的是 `rand` 0.8）：

```toml
[dependencies]
rand = "0.999.0"
```

下次运行 `cargo build` 时，Cargo 将更新可用的 crate registry 并根据你指定的新版本重新评估你的 `rand` 需求。

关于 [Cargo][doccargo] 和[其生态系统][doccratesio]还有很多要说的，我们将在第 14 章讨论，但目前，这就是你需要知道的全部。Cargo 使重用库变得非常容易，因此 Rustaceans 能够编写由多个包组装而成的小项目。

### 生成随机数

让我们开始使用 `rand` 来生成一个要猜测的数字。下一步是更新 *src/main.rs*，如清单 2-3 所示。

**清单 2-3**：添加生成随机数的代码（文件名：*src/main.rs*）

```rust
use std::io;

use rand::Rng;

fn main() {
    println!("Guess the number!");

    let secret_number = rand::thread_rng().gen_range(1..=100);

    println!("The secret number is: {secret_number}");

    println!("Please input your guess.");

    let mut guess = String::new();

    io::stdin()
        .read_line(&mut guess)
        .expect("Failed to read line");

    println!("You guessed: {guess}");
}
```

首先，我们添加行 `use rand::Rng;`。`Rng` trait 定义了随机数生成器实现的方法，这个 trait 必须在我们使用这些方法时在作用域内。第 10 章将详细介绍 trait。

接下来，我们在中间添加两行。在第一行中，我们调用 `rand::thread_rng` 函数，它给我们特定的随机数生成器：一个对应当前执行线程并由操作系统提供种子的随机数生成器。然后，我们在随机数生成器上调用 `gen_range` 方法。这个方法由我们通过 `use rand::Rng;` 语句引入作用域的 `Rng` trait 定义。`gen_range` 方法接受一个范围表达式作为参数并在该范围内生成一个随机数。我们这里使用的范围表达式采用 `start..=end` 的形式，并在下界和上界都包含，所以我们需要指定 `1..=100` 来请求 1 到 100 之间的一个数字。

> 注意：你不会仅仅知道要使用哪些 trait 以及从 crate 调用哪些方法和函数，所以每个 crate 都有关于如何使用它的文档。Cargo 的另一个简洁功能是运行 `cargo doc --open` 命令将在本地构建所有依赖提供的文档并在浏览器中打开。如果你对 `rand` crate 中的其他功能感兴趣，例如，运行 `cargo doc --open` 并点击左侧边栏中的 `rand`。

第二行新代码打印秘密数字。这在开发程序时能够测试它很有用，但我们会从最终版本中删除它。如果程序一开始就打印答案，那就不是游戏了！

尝试运行程序几次：

```console
$ cargo run
   Compiling guessing_game v0.1.0 (file:///projects/guessing_game)
    Finished `dev` profile [unoptimized + debuginfo] target(s) in 0.02s
     Running `target/debug/guessing_game`
Guess the number!
The secret number is: 7
Please input your guess.
4
You guessed: 4

$ cargo run
    Finished `dev` profile [unoptimized + debuginfo] target(s) in 0.02s
     Running `target/debug/guessing_game`
Guess the number!
The secret number is: 83
Please input your guess.
5
You guessed: 5
```

你应该得到不同的随机数，它们都应该在 1 到 100 之间的数字。干得好！

## 比较猜测与秘密数字

现在我们有了用户输入和一个随机数，我们可以比较它们。这一步如清单 2-4 所示。注意，这段代码还不能编译，正如我们将解释的。

**清单 2-4**：处理比较两个数字的可能返回值（文件名：*src/main.rs*）

```rust
use std::cmp::Ordering;
use std::io;

use rand::Rng;

fn main() {
    println!("Guess the number!");

    let secret_number = rand::thread_rng().gen_range(1..=100);

    println!("The secret number is: {secret_number}");

    println!("Please input your guess.");

    let mut guess = String::new();

    io::stdin()
        .read_line(&mut guess)
        .expect("Failed to read line");

    println!("You guessed: {guess}");

    match guess.cmp(&secret_number) {
        Ordering::Less => println!("Too small!"),
        Ordering::Greater => println!("Too big!"),
        Ordering::Equal => println!("You win!"),
    }
}
```

首先，我们添加另一个 `use` 语句，从标准库中引入一个名为 `std::cmp::Ordering` 的类型。`Ordering` 类型是另一个枚举，有变体 `Less`、`Greater` 和 `Equal`。这些是比较两个值时可能出现的三种结果。

然后，我们在底部添加了使用 `Ordering` 类型的五行新代码。`cmp` 方法比较两个值，可以在任何可以比较的东西上调用。它接受一个你想要比较的内容的引用：这里，它正在比较 `guess` 和 `secret_number`。然后，它返回我们从 `use` 语句引入作用域的 `Ordering` 枚举的一个变体。我们使用 [`match`][match] 表达式来决定下一步要做什么，基于从 `cmp` 调用返回的 `Ordering` 的哪个变体以及 `guess` 和 `secret_number` 中的值。

`match` 表达式由 *分支* 组成。一个分支由一个要匹配的 *模式* 和如果给 `match` 的值符合该分支的模式则应该运行的代码组成。Rust 接受给 `match` 的值并依次查看每个分支的模式。模式和 `match` 结构是强大的 Rust 功能：它们让你表达代码可能遇到的各种情况，并确保你处理所有这些情况。这些功能将在第 6 章和第 19 章分别详细介绍。

让我们用我们这里使用的 `match` 表达式来举一个例子。假设用户猜测了 50，而这次随机生成的秘密数字是 38。

当代码比较 50 和 38 时，`cmp` 方法将返回 `Ordering::Greater`，因为 50 大于 38。`match` 表达式获取 `Ordering::Greater` 值并开始检查每个分支的模式。它查看第一个分支的模式 `Ordering::Less`，发现值 `Ordering::Greater` 不匹配 `Ordering::Less`，所以它忽略该分支中的代码并移动到下一个分支。下一个分支的模式是 `Ordering::Greater`，它*确实*匹配 `Ordering::Greater`！该分支中的关联代码将执行并打印 `Too big!` 到屏幕。在这个场景中，`match` 表达式在第一次成功匹配后结束，所以它不会查看最后一个分支。

然而，清单 2-4 中的代码还不能编译。让我们试试：

```console
$ cargo build
   Compiling guessing_game v0.1.0 (file:///projects/guessing_game)
error[E0308]: mismatched types
  --> src/main.rs:26:21
   |
26 |     match guess.cmp(&secret_number) {
   |                     ^^^^^^^^^^^^^^
   |
   = note: expected reference `&String`
          found reference `&{integer}`

For more information about this error, try `rustc --explain E0308`.
error: could not compile `guessing_game` due to previous error
```

错误的核心指出有 *类型不匹配*。Rust 有强大的静态类型系统。然而，它也有类型推断。当我们写 `let mut guess = String::new()` 时，Rust 能够推断出 `guess` 应该是一个 `String` 而不需要我们写类型。另一方面，`secret_number` 是一个数字类型。Rust 的一些数字类型可以有 1 到 100 之间的值：`i32`，一个 32 位数字；`u32`，一个无符号 32 位数字；`i64`，一个 64 位数字；以及其他。除非另有说明，Rust 默认为 `i32`，这也是 `secret_number` 的类型，除非你在其他地方添加会导致 Rust 推断不同数字类型的类型信息。错误的原因是 Rust 不能比较字符串和数字类型。

最终，我们想要将程序读取输入的 `String` 转换为数字类型，以便我们可以将它与秘密数字进行数值比较。我们通过在 `main` 函数体中添加这一行来做到这一点：

*文件名：src/main.rs*

```rust
use std::cmp::Ordering;
use std::io;

use rand::Rng;

fn main() {
    println!("Guess the number!");

    let secret_number = rand::thread_rng().gen_range(1..=100);

    println!("The secret number is: {secret_number}");

    println!("Please input your guess.");

    let mut guess = String::new();

    io::stdin()
        .read_line(&mut guess)
        .expect("Failed to read line");

    let guess: u32 = guess.trim().parse().expect("Please type a number!");

    println!("You guessed: {guess}");

    match guess.cmp(&secret_number) {
        Ordering::Less => println!("Too small!"),
        Ordering::Greater => println!("Too big!"),
        Ordering::Equal => println!("You win!"),
    }
}
```

这一行是：

```rust
let guess: u32 = guess.trim().parse().expect("Please type a number!");
```

我们创建了一个名为 `guess` 的变量。等等，程序不是已经有一个名为 `guess` 的变量了吗？是的，但 Rust 允许我们用新值*遮蔽*（shadow）之前的 `guess` 值。遮蔽让我们可以重用 `guess` 变量名，而不必强制我们创建两个唯一的变量，例如 `guess_str` 和 `guess`。我们将在[第 3 章][shadowing]更详细地介绍这个，但目前，要知道当你想要将一个值从一种类型转换为另一种类型时，经常使用这个功能。

我们将这个新变量绑定到表达式 `guess.trim().parse()`。表达式中的 `guess` 指的是包含输入字符串的原始 `guess` 变量。`String` 实例上的 `trim` 方法将消除开头和结尾的任何空白，这在我们将字符串转换为只能包含数字数据的 `u32` 之前必须做。用户必须按 <kbd>enter</kbd> 来满足 `read_line` 并输入他们的猜测，这会向字符串添加一个换行符。例如，如果用户输入 <kbd>5</kbd> 并按 <kbd>enter</kbd>，`guess` 看起来像这样：`5\n`。`\n` 表示"换行"。（在 Windows 上，按 <kbd>enter</kbd> 会产生回车和换行，`\r\n`。）`trim` 方法消除 `\n` 或 `\r\n`，结果只有 `5`。

字符串上的 [`parse` 方法][parse] 将字符串转换为另一种类型。在这里，我们使用它将字符串转换为数字。我们需要通过使用 `let guess: u32` 告诉 Rust 我们想要的确切数字类型。`guess` 后面的冒号（`:`）告诉 Rust 我们将注解变量的类型。Rust 有一些内置数字类型；这里看到的 `u32` 是一个无符号 32 位整数。对于小正数来说，这是一个很好的默认选择。你将在[第 3 章][integers]了解其他数字类型。

此外，这个示例程序中的 `u32` 注解以及与 `secret_number` 的比较意味着 Rust 将推断 `secret_number` 也应该是 `u32`。所以，现在比较将在两个相同类型的值之间进行！

`parse` 方法只在可以逻辑转换为数字的字符上工作，因此很容易引起错误。如果，例如，字符串包含 `A👍%`，就没有办法将其转换为数字。因为它可能失败，`parse` 方法返回一个 `Result` 类型，就像 `read_line` 方法一样（前面在 ["使用 `Result` 处理潜在失败"](#使用-result-处理潜在失败) 中讨论的）。我们将通过再次使用 `expect` 方法来处理这个 `Result`。如果 `parse` 因为它无法从字符串创建数字而返回一个 `Err` `Result` 变体，`expect` 调用将使游戏崩溃并打印我们给它的消息。如果 `parse` 能够成功将字符串转换为数字，它将返回 `Result` 的 `Ok` 变体，`expect` 将从 `Ok` 值返回我们想要的数字。

现在让我们运行程序：

```console
$ cargo run
   Compiling guessing_game v0.1.0 (file:///projects/guessing_game)
    Finished `dev` profile [unoptimized + debuginfo] target(s) in 0.26s
     Running `target/debug/guessing_game`
Guess the number!
The secret number is: 58
Please input your guess.
  76
You guessed: 76
Too big!
```

很好！尽管在猜测前添加了空格，程序仍然发现用户猜测了 76。运行程序几次以验证不同类型输入的不同行为：正确猜测数字、猜测一个太高的数字、猜测一个太低的数字。

我们现在已经完成了游戏的大部分工作，但用户只能猜测一次。让我们通过添加一个循环来改变这一点！

## 使用循环允许多次猜测

`loop` 关键字创建一个无限循环。我们将添加一个循环，给用户更多猜测数字的机会：

*文件名：src/main.rs*

```rust
use std::cmp::Ordering;
use std::io;

use rand::Rng;

fn main() {
    println!("Guess the number!");

    let secret_number = rand::thread_rng().gen_range(1..=100);

    println!("The secret number is: {secret_number}");

    loop {
        println!("Please input your guess.");

        let mut guess = String::new();

        io::stdin()
            .read_line(&mut guess)
            .expect("Failed to read line");

        let guess: u32 = guess.trim().parse().expect("Please type a number!");

        println!("You guessed: {guess}");

        match guess.cmp(&secret_number) {
            Ordering::Less => println!("Too small!"),
            Ordering::Greater => println!("Too big!"),
            Ordering::Equal => println!("You win!"),
        }
    }
}
```

正如你所看到的，我们将从猜测输入提示开始的所有内容移到了循环中。确保缩进循环内的行再增加四个空格，然后再次运行程序。程序现在会永远要求另一个猜测，这实际上引入了一个新问题。看起来用户无法退出！

用户总是可以使用键盘快捷键 <kbd>ctrl</kbd>-<kbd>C</kbd> 来中断程序。但还有另一种方法可以逃离这个贪得无厌的怪物，正如在["比较猜测与秘密数字"](#比较猜测与秘密数字)中关于 `parse` 的讨论所提到的：如果用户输入非数字答案，程序将崩溃。我们可以利用这一点允许用户退出，如下所示：

```console
$ cargo run
   Compiling guessing_game v0.1.0 (file:///projects/guessing_game)
    Finished `dev` profile [unoptimized + debuginfo] target(s) in 0.23s
     Running `target/debug/guessing_game`
Guess the number!
The secret number is: 59
Please input your guess.
45
You guessed: 45
Too small!
Please input your guess.
60
You guessed: 60
Too big!
Please input your guess.
59
You guessed: 59
You win!
Please input your guess.
quit

thread 'main' panicked at src/main.rs:28:47:
Please type a number!: ParseIntError { kind: InvalidDigit }
note: run with `RUST_BACKTRACE=1` environment variable to display a backtrace
```

输入 `quit` 将退出游戏，但正如你将注意到的，输入任何其他非数字输入也会如此。这至少可以说是次优的；我们希望在猜中正确数字时游戏也停止。

### 猜中后退出

让我们编写程序在用户获胜时退出，通过添加一个 `break` 语句：

*文件名：src/main.rs*

```rust
use std::cmp::Ordering;
use std::io;

use rand::Rng;

fn main() {
    println!("Guess the number!");

    let secret_number = rand::thread_rng().gen_range(1..=100);

    loop {
        println!("Please input your guess.");

        let mut guess = String::new();

        io::stdin()
            .read_line(&mut guess)
            .expect("Failed to read line");

        let guess: u32 = guess.trim().parse().expect("Please type a number!");

        println!("You guessed: {guess}");

        match guess.cmp(&secret_number) {
            Ordering::Less => println!("Too small!"),
            Ordering::Greater => println!("Too big!"),
            Ordering::Equal => {
                println!("You win!");
                break;
            }
        }
    }
}
```

在 `You win!` 之后添加 `break` 行使程序在用户猜中秘密数字时退出循环。退出循环也意味着退出程序，因为循环是 `main` 的最后一部分。

### 处理无效输入

为了进一步完善游戏的行为，而不是在用户输入非数字时让程序崩溃，让我们让游戏忽略非数字，以便用户可以继续猜测。我们可以通过更改 `guess` 从 `String` 转换为 `u32` 的那一行来做到这一点，如清单 2-5 所示。

**清单 2-5**：忽略非数字猜测并要求另一个猜测，而不是让程序崩溃（文件名：*src/main.rs*）

```rust
use std::cmp::Ordering;
use std::io;

use rand::Rng;

fn main() {
    println!("Guess the number!");

    let secret_number = rand::thread_rng().gen_range(1..=100);

    loop {
        println!("Please input your guess.");

        let mut guess = String::new();

        io::stdin()
            .read_line(&mut guess)
            .expect("Failed to read line");

        let guess: u32 = match guess.trim().parse() {
            Ok(num) => num,
            Err(_) => continue,
        };

        println!("You guessed: {guess}");

        match guess.cmp(&secret_number) {
            Ordering::Less => println!("Too small!"),
            Ordering::Greater => println!("Too big!"),
            Ordering::Equal => {
                println!("You win!");
                break;
            }
        }
    }
}
```

我们从 `expect` 调用切换到一个 `match` 表达式，以从在错误时崩溃转变为处理错误。记住 `parse` 返回一个 `Result` 类型，而 `Result` 是一个具有变体 `Ok` 和 `Err` 的枚举。我们在这里使用 `match` 表达式，就像我们对 `cmp` 方法的 `Ordering` 结果所做的那样。

如果 `parse` 能够成功将字符串转换为数字，它将返回一个包含结果数字的 `Ok` 值。那个 `Ok` 值将匹配第一个分支的模式，`match` 表达式将只返回 `parse` 产生并放入 `Ok` 值中的 `num` 值。那个数字最终会在我们正在创建的新 `guess` 变量中，正好在我们想要的位置。

如果 `parse` *无法*将字符串转换为数字，它将返回一个包含有关错误的更多信息的 `Err` 值。`Err` 值不匹配第一个 `match` 分支中的 `Ok(num)` 模式，但它确实匹配第二个分支中的 `Err(_)` 模式。下划线 `_` 是一个捕获所有值；在这个例子中，我们说的是我们想要匹配所有 `Err` 值，无论它们内部有什么信息。所以，程序将执行第二个分支的代码，`continue`，它告诉程序进入 `loop` 的下一次迭代并要求另一个猜测。所以，实际上，程序忽略了 `parse` 可能遇到的所有错误！

现在程序中的一切应该按预期工作了。让我们试试：

```console
$ cargo run
   Compiling guessing_game v0.1.0 (file:///projects/guessing_game)
    Finished `dev` profile [unoptimized + debuginfo] target(s) in 0.13s
     Running `target/debug/guessing_game`
Guess the number!
The secret number is: 61
Please input your guess.
10
You guessed: 10
Too small!
Please input your guess.
99
You guessed: 99
Too big!
Please input your guess.
foo
Please input your guess.
61
You guessed: 61
You win!
```

太棒了！只需做一个小小的最终调整，我们就完成了猜数字游戏。回想一下，程序仍在打印秘密数字。这对测试很有效，但它破坏了游戏。让我们删除输出秘密数字的 `println!`。清单 2-6 显示了最终代码。

**清单 2-6**：完整的猜数字游戏代码（文件名：*src/main.rs*）

```rust
use std::cmp::Ordering;
use std::io;

use rand::Rng;

fn main() {
    println!("Guess the number!");

    let secret_number = rand::thread_rng().gen_range(1..=100);

    loop {
        println!("Please input your guess.");

        let mut guess = String::new();

        io::stdin()
            .read_line(&mut guess)
            .expect("Failed to read line");

        let guess: u32 = match guess.trim().parse() {
            Ok(num) => num,
            Err(_) => continue,
        };

        println!("You guessed: {guess}");

        match guess.cmp(&secret_number) {
            Ordering::Less => println!("Too small!"),
            Ordering::Greater => println!("Too big!"),
            Ordering::Equal => {
                println!("You win!");
                break;
            }
        }
    }
}
```

此时，你已经成功构建了猜数字游戏。恭喜！

## 小结

这个项目是一个动手实践的方式，向你介绍了许多新的 Rust 概念：`let`、`match`、函数、外部 crate 的使用等等。在接下来的几章中，你将更详细地了解这些概念。第 3 章涵盖大多数编程语言都有的概念，如变量、数据类型和函数，并展示如何在 Rust 中使用它们。第 4 章探讨所有权，这是使 Rust 有别于其他语言的特性。第 5 章讨论结构体和方法语法，第 6 章解释枚举如何工作。

[prelude]: ../std/prelude/index.html
[variables-and-mutability]: /rust-book/ch03-01-variables-and-mutability
[comments]: /rust-book/ch03-04-comments
[shadowing]: /rust-book/ch03-01-variables-and-mutability#遮蔽shadowing
[integers]: /rust-book/ch03-02-data-types#整数类型
