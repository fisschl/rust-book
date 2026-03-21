---
title: 重构以改进模块化和错误处理
---

为了改进我们的程序，我们将解决与程序结构和错误处理相关的四个问题。首先，我们的 `main` 函数目前执行了两个任务：解析参数和读取文件。随着程序的增长，`main` 函数处理的独立任务数量会增加。当一个函数承担更多责任时，它就变得更难以理解、更难测试，也更容易在修改时破坏某一部分。最好将功能分离，让每个函数只负责一个任务。

这个问题也与第二个问题相关：虽然 `query` 和 `file_path` 是我们程序的配置变量，但像 `contents` 这样的变量是用来执行程序逻辑的。`main` 函数越长，我们就需要引入更多变量到作用域中；作用域中的变量越多，就越难跟踪每个变量的用途。最好将配置变量组合成一个结构体，使其用途更加清晰。

第三个问题是我们使用 `expect` 在读取文件失败时打印错误消息，但错误消息只是打印"Should have been able to read the file"（应该能够读取文件）。读取文件可能以多种方式失败：例如，文件可能不存在，或者我们可能没有打开它的权限。现在，无论什么情况，我们都会为所有情况打印相同的错误消息，这不会给用户提供任何有用信息！

第四，我们使用 `expect` 来处理错误，如果用户运行我们的程序时没有指定足够的参数，他们会得到一个 Rust 的"index out of bounds"（索引越界）错误，这个错误没有清楚地解释问题。最好将所有错误处理代码放在一个地方，这样如果将来需要更改错误处理逻辑，维护者只需要查看一个地方的代码。将所有错误处理代码放在一个位置也能确保我们打印的消息对最终用户有意义。

让我们通过重构项目来解决这四个问题。

### 在二进制项目中分离关注点

将多个任务的责任分配给 `main` 函数的组织问题是许多二进制项目的共同问题。因此，当 `main` 函数开始变得庞大时，许多 Rust 程序员发现将二进制程序的不同关注点分离开来是有用的。这个过程包含以下步骤：

- 将程序分成 *main.rs* 文件和 *lib.rs* 文件，并将程序的逻辑移到 *lib.rs* 中。
- 只要命令行解析逻辑很简单，它就可以保留在 `main` 函数中。
- 当命令行解析逻辑开始变得复杂时，将其从 `main` 函数中提取到其他函数或类型中。

经过这个过程后，`main` 函数中保留的责任应该仅限于以下几点：

- 使用参数值调用命令行解析逻辑
- 设置任何其他配置
- 调用 *lib.rs* 中的 `run` 函数
- 如果 `run` 返回错误，处理该错误

这种模式是关于分离关注点的：*main.rs* 处理运行程序，*lib.rs* 处理手头的所有任务逻辑。因为你不能直接测试 `main` 函数，这种结构让你可以通过将逻辑移出 `main` 函数来测试程序的所有逻辑。保留在 `main` 函数中的代码将足够小，可以通过阅读来验证其正确性。让我们通过遵循这个过程来重构我们的程序。

#### 提取参数解析器

我们将提取解析参数的功能到一个 `main` 函数将调用的函数中。**清单 12-5** 显示了 `main` 函数的新开始，它调用了一个新函数 `parse_config`，我们将在 *src/main.rs* 中定义它。

**清单 12-5**：从 `main` 中提取 `parse_config` 函数（文件名：*src/main.rs*）

```rust
fn main() {
    let args: Vec<String> = env::args().collect();

    let (query, file_path) = parse_config(&args);

    // --snip--

    println!("Searching for {query}");
    println!("In file {file_path}");

    let contents = fs::read_to_string(file_path)
        .expect("Should have been able to read the file");

    println!("With text:\n{contents}");
}

fn parse_config(args: &[String]) -> (&str, &str) {
    let query = &args[1];
    let file_path = &args[2];

    (query, file_path)
}
```

我们仍然将命令行参数收集到一个向量中，但我们不再在 `main` 函数中将索引 1 的参数值赋给变量 `query`，将索引 2 的参数值赋给变量 `file_path`，而是将整个向量传递给 `parse_config` 函数。`parse_config` 函数然后持有确定哪个参数进入哪个变量的逻辑，并将值返回给 `main`。我们仍然在 `main` 中创建 `query` 和 `file_path` 变量，但 `main` 不再有确定命令行参数和变量如何对应的责任。

这个重构对于我们的小程序来说可能看起来有些过度，但我们是以小的、增量的步骤进行重构的。做出这个改变后，再次运行程序以验证参数解析仍然有效。经常检查进度是很好的，有助于在问题发生时找出原因。

#### 组合配置值

我们可以再迈出一小步来进一步改进 `parse_config` 函数。目前，我们返回一个元组，但随后我们立即又将这个元组分解成单独的部分。这可能表明我们还没有正确的抽象。

另一个显示有改进空间的指标是 `parse_config` 中的 "config" 部分，这暗示我们返回的两个值是相关的，都是同一个配置值的一部分。我们目前除了在结构上将这两个值组合成一个元组之外，没有以其他方式传达这种含义；我们将把这两个值放入一个结构体中，并为结构体的每个字段赋予有意义的名称。这样做将使将来的代码维护者更容易理解不同值之间的关系以及它们的用途。

**清单 12-6** 显示了对 `parse_config` 函数的改进。

**清单 12-6**：重构 `parse_config` 以返回 `Config` 结构体的实例（文件名：*src/main.rs*）

```rust
fn main() {
    let args: Vec<String> = env::args().collect();

    let config = parse_config(&args);

    println!("Searching for {}", config.query);
    println!("In file {}", config.file_path);

    let contents = fs::read_to_string(config.file_path)
        .expect("Should have been able to read the file");

    // --snip--

    println!("With text:\n{contents}");
}

struct Config {
    query: String,
    file_path: String,
}

fn parse_config(args: &[String]) -> Config {
    let query = args[1].clone();
    let file_path = args[2].clone();

    Config { query, file_path }
}
```

我们添加了一个名为 `Config` 的结构体，定义了名为 `query` 和 `file_path` 的字段。`parse_config` 的签名现在表明它返回一个 `Config` 值。在 `parse_config` 的主体中，我们以前返回引用 `args` 中 `String` 值的字符串切片，现在我们定义 `Config` 包含拥有的 `String` 值。`main` 中的 `args` 变量是参数值的所有者，只允许 `parse_config` 函数借用它们，这意味着如果 `Config` 试图取得 `args` 中值的所有权，我们将违反 Rust 的借用规则。

我们有多种方式来管理 `String` 数据；最简单但效率稍低的方法是调用值的 `clone` 方法。这将为 `Config` 实例拥有的数据制作一个完整的副本，这比存储对字符串数据的引用需要更多时间和内存。然而，克隆数据也使我们的代码非常直接，因为我们不需要管理引用的生命周期；在这种情况下，放弃一点性能来换取简单性是一个值得的权衡。

> ### 使用 `clone` 的权衡
>
> 许多 Rustaceans 倾向于避免使用 `clone` 来解决所有权问题，因为它的运行时成本。在第13章，你将学习如何在这种情况下使用更高效的方法。但现在，为了继续取得进展，复制几个字符串是可以的，因为你只会复制一次，而且你的文件路径和查询字符串都非常小。拥有一个运行良好但有些低效的程序，比试图在第一遍就超优化代码要好。随着你对 Rust 越来越有经验，从最有效的解决方案开始会更容易，但现在，调用 `clone` 是完全可接受的。

我们已经更新了 `main`，使其将 `parse_config` 返回的 `Config` 实例放入名为 `config` 的变量中，并且我们更新了以前使用单独的 `query` 和 `file_path` 变量的代码，使其现在使用 `Config` 结构体上的字段。

现在我们的代码更清楚地表明 `query` 和 `file_path` 是相关的，它们的目的是配置程序将如何工作。任何使用这些值的代码都知道在 `config` 实例中以它们用途命名的字段中找到它们。

#### 为 `Config` 创建构造函数

到目前为止，我们已经从 `main` 中提取了负责解析命令行参数的逻辑，并将其放入 `parse_config` 函数中。这样做帮助我们看到了 `query` 和 `file_path` 值是相关的，这种关系应该在代码中体现出来。然后我们添加了一个 `Config` 结构体来命名 `query` 和 `file_path` 的相关用途，并能够从 `parse_config` 函数中以结构体字段名的形式返回值的名称。

所以，现在 `parse_config` 函数的目的是创建一个 `Config` 实例，我们可以将 `parse_config` 从一个普通函数改为一个名为 `new` 的与 `Config` 结构体关联的函数。做出这个改变将使代码更符合习惯用法。我们可以通过调用 `String::new` 来创建标准库中类型的实例，例如 `String`。同样，通过将 `parse_config` 改为与 `Config` 关联的 `new` 函数，我们将能够通过调用 `Config::new` 来创建 `Config` 的实例。**清单 12-7** 显示了我们需要的改变。

**清单 12-7**：将 `parse_config` 改为 `Config::new`（文件名：*src/main.rs*）

```rust
fn main() {
    let args: Vec<String> = env::args().collect();

    let config = Config::new(&args);

    println!("Searching for {}", config.query);
    println!("In file {}", config.file_path);

    let contents = fs::read_to_string(config.file_path)
        .expect("Should have been able to read the file");

    println!("With text:\n{contents}");

    // --snip--
}

// --snip--

struct Config {
    query: String,
    file_path: String,
}

impl Config {
    fn new(args: &[String]) -> Config {
        let query = args[1].clone();
        let file_path = args[2].clone();

        Config { query, file_path }
    }
}
```

我们在调用 `parse_config` 的地方更新了 `main`，改为调用 `Config::new`。我们将 `parse_config` 的名称改为 `new` 并将其移入 `impl` 块中，这将 `new` 函数与 `Config` 关联起来。再次尝试编译这段代码以确保它能工作。

### 修复错误处理

现在我们将修复错误处理。回想一下，如果向量包含的项少于三个，尝试在索引 1 或索引 2 处访问 `args` 向量的值将导致程序 panic。尝试不带任何参数运行程序；它会像这样：

```console
$ cargo run
   Compiling minigrep v0.1.0 (file:///projects/minigrep)
    Finished `dev` profile [unoptimized + debuginfo] target(s) in 0.0s
     Running `target/debug/minigrep`

thread 'main' panicked at src/main.rs:27:21:
index out of bounds: the len is 1 but the index is 1
note: run with `RUST_BACKTRACE=1` environment variable to display a backtrace
```

`index out of bounds: the len is 1 but the index is 1` 这一行是面向程序员的错误消息。它不会帮助我们的最终用户理解他们应该做什么。让我们现在修复它。

#### 改进错误消息

在**清单 12-8**中，我们在 `new` 函数中添加了一个检查，在访问索引 1 和索引 2 之前验证切片是否足够长。如果切片不够长，程序会 panic 并显示更好的错误消息。

**清单 12-8**：添加参数数量检查（文件名：*src/main.rs*）

```rust
impl Config {
    // --snip--
    fn new(args: &[String]) -> Config {
        if args.len() < 3 {
            panic!("not enough arguments");
        }
        // --snip--

        let query = args[1].clone();
        let file_path = args[2].clone();

        Config { query, file_path }
    }
}
```

这段代码类似于[我们在清单 9-13 中编写的 `Guess::new` 函数][ch9-custom-types]，当 `value` 参数超出有效值范围时我们调用了 `panic!`。这里我们不是检查值的范围，而是检查 `args` 的长度是否至少为 `3`，函数的其余部分可以在这个条件已经满足的假设下运行。如果 `args` 的项少于三个，这个条件将为 `true`，我们会调用 `panic!` 宏立即结束程序。

在 `new` 中添加这几行额外的代码后，让我们再次不带任何参数运行程序，看看现在的错误是什么样子：

```console
$ cargo run
   Compiling minigrep v0.1.0 (file:///projects/minigrep)
    Finished `dev` profile [unoptimized + debuginfo] target(s) in 0.0s
     Running `target/debug/minigrep`

thread 'main' panicked at src/main.rs:26:13:
not enough arguments
note: run with `RUST_BACKTRACE=1` environment variable to display a backtrace
```

这个输出好多了：我们现在有了一个合理的错误消息。然而，我们也有一些不想给用户的多余信息。也许我们在**清单 9-13**中使用的技术在这里不是最好的：如第9章所讨论的，`panic!` 调用更适合编程问题而不是使用问题。相反，我们将使用你在第9章学到的另一种技术——[返回一个 `Result`][ch9-result] 来指示成功或错误。

#### 返回 `Result` 而不是调用 `panic!`

我们可以改为返回一个 `Result` 值，在成功的情况下包含一个 `Config` 实例，在错误的情况下描述问题。我们还将函数名称从 `new` 改为 `build`，因为许多程序员期望 `new` 函数永远不会失败。当 `Config::build` 与 `main` 通信时，我们可以使用 `Result` 类型来表明有问题。然后，我们可以改变 `main`，将 `Err` 变体转换为对用户更实用的错误，而不需要 `panic!` 调用所导致的 `thread 'main'` 和 `RUST_BACKTRACE` 周围的文本。

**清单 12-9** 显示了对我们现在称为 `Config::build` 的函数返回值的更改，以及返回 `Result` 所需的函数体。请注意，在我们也更新 `main` 之前，这段代码不会编译，我们将在下一个清单中这样做。

**清单 12-9**：从 `Config::build` 返回 `Result`（文件名：*src/main.rs*）

```rust
impl Config {
    fn build(args: &[String]) -> Result<Config, &'static str> {
        if args.len() < 3 {
            return Err("not enough arguments");
        }

        let query = args[1].clone();
        let file_path = args[2].clone();

        Ok(Config { query, file_path })
    }
}
```

我们的 `build` 函数在成功的情况下返回一个 `Result`，其中包含一个 `Config` 实例，在错误的情况下返回一个字符串字面量。我们的错误值将始终是具有 `'static` 生命周期的字符串字面量。

我们在函数体中做了两处更改：当用户没有传递足够的参数时，我们不再调用 `panic!`，而是返回一个 `Err` 值，并且我们将 `Config` 返回值包装在一个 `Ok` 中。这些更改使函数符合其新的类型签名。

从 `Config::build` 返回一个 `Err` 值允许 `main` 函数处理从 `build` 函数返回的 `Result` 值，并在错误情况下更干净地退出进程。

#### 调用 `Config::build` 并处理错误

为了处理错误情况并打印用户友好的消息，我们需要更新 `main` 以处理 `Config::build` 返回的 `Result`，如**清单 12-10**所示。我们还将把从 `panic!` 退出命令行工具并返回非零错误代码的责任改为手动实现。非零退出状态是一种约定，用来向调用我们程序的进程表明程序以错误状态退出。

**清单 12-10**：如果构建 `Config` 失败则退出并返回错误代码（文件名：*src/main.rs*）

```rust
use std::process;

fn main() {
    let args: Vec<String> = env::args().collect();

    let config = Config::build(&args).unwrap_or_else(|err| {
        println!("Problem parsing arguments: {err}");
        process::exit(1);
    });

    // --snip--

    println!("Searching for {}", config.query);
    println!("In file {}", config.file_path);

    let contents = fs::read_to_string(config.file_path)
        .expect("Should have been able to read the file");

    println!("With text:\n{contents}");
}
```

在这个清单中，我们使用了一个我们还没有详细介绍的方法：`unwrap_or_else`，它由标准库在 `Result<T, E>` 上定义。使用 `unwrap_or_else` 允许我们定义一些自定义的非 `panic!` 错误处理。如果 `Result` 是一个 `Ok` 值，这个方法的行为类似于 `unwrap`：它返回 `Ok` 包装的内部值。然而，如果值是一个 `Err` 值，这个方法会调用闭包中的代码，闭包是我们定义并作为参数传递给 `unwrap_or_else` 的匿名函数。我们将在第13章更详细地介绍闭包。现在，你只需要知道 `unwrap_or_else` 会将 `Err` 的内部值（在这种情况下是我们在**清单 12-9**中添加的静态字符串 `"not enough arguments"`）传递给我们闭包中出现在竖线之间的参数 `err`。闭包中的代码可以在运行时使用的值。

我们添加了一个新的 `use` 行，将标准库中的 `process` 引入作用域。在错误情况下将运行的闭包中的代码只有两行：我们打印 `err` 值，然后调用 `process::exit`。`process::exit` 函数将立即停止程序并返回作为退出状态码传递的数字。这类似于我们在**清单 12-8**中使用的基于 `panic!` 的处理，但我们不再得到所有额外的输出。让我们试试：

```console
$ cargo run
   Compiling minigrep v0.1.0 (file:///projects/minigrep)
    Finished `dev` profile [unoptimized + debuginfo] target(s) in 0.48s
     Running `target/debug/minigrep`
Problem parsing arguments: not enough arguments
```

太好了！这个输出对我们的用户友好多了。

### 从 `main` 中提取逻辑

现在我们已经完成了配置解析的重构，让我们转向程序的逻辑。正如我们在["在二进制项目中分离关注点"](#在二进制项目中分离关注点)中所述，我们将提取一个名为 `run` 的函数，它将持有当前 `main` 函数中所有不涉及设置配置或处理错误的逻辑。完成后，`main` 函数将简洁且易于通过检查验证，我们将能够为所有其他逻辑编写测试。

**清单 12-11** 显示了提取 `run` 函数的小增量改进。

**清单 12-11**：提取包含程序逻辑其余部分的 `run` 函数（文件名：*src/main.rs*）

```rust
fn main() {
    // --snip--

    let args: Vec<String> = env::args().collect();

    let config = Config::build(&args).unwrap_or_else(|err| {
        println!("Problem parsing arguments: {err}");
        process::exit(1);
    });

    println!("Searching for {}", config.query);
    println!("In file {}", config.file_path);

    run(config);
}

fn run(config: Config) {
    let contents = fs::read_to_string(config.file_path)
        .expect("Should have been able to read the file");

    println!("With text:\n{contents}");
}

// --snip--
```

`run` 函数现在包含 `main` 中所有剩余的逻辑，从读取文件开始。`run` 函数接受 `Config` 实例作为参数。

#### 从 `run` 函数返回错误

将剩余程序逻辑分离到 `run` 函数后，我们可以改进错误处理，就像我们在**清单 12-9**中对 `Config::build` 所做的那样。我们可以允许程序通过调用 `expect` 来 panic，`run` 函数将在出现问题时返回 `Result<T, E>`。这将使我们能够以用户友好的方式进一步整合 `main` 中的错误处理逻辑。**清单 12-12** 显示了对 `run` 的签名和主体需要做的更改。

**清单 12-12**：将 `run` 函数改为返回 `Result`（文件名：*src/main.rs*）

```rust
use std::error::Error;

// --snip--

fn run(config: Config) -> Result<(), Box<dyn Error>> {
    let contents = fs::read_to_string(config.file_path)?;

    println!("With text:\n{contents}");

    Ok(())
}
```

我们在这里做了三个重大改变。首先，我们将 `run` 函数的返回类型改为 `Result<(), Box<dyn Error>>`。这个函数以前返回单元类型 `()`，我们在 `Ok` 情况下保留它作为返回值。

对于错误类型，我们使用了 trait 对象 `Box<dyn Error>`（我们在顶部用 `use` 语句将 `std::error::Error` 引入作用域）。我们将在第18章介绍 trait 对象。现在，只需要知道 `Box<dyn Error>` 意味着函数将返回一个实现 `Error` trait 的类型，但我们不必指定返回值的具体类型是什么。这使我们在不同的错误情况下可以灵活地返回不同类型的错误值。`dyn` 关键字是 _dynamic_（动态）的缩写。

其次，我们用 `?` 运算符取代了 `expect` 调用，如我们在[第9章][ch9-question-mark]中讨论的那样。不是在错误时 `panic!`，`?` 会从当前函数返回错误值供调用者处理。

第三，`run` 函数现在在成功的情况下返回一个 `Ok` 值。我们在签名中将 `run` 函数的成功类型声明为 `()`，这意味着我们需要将单元类型的值包装在 `Ok` 值中。这个 `Ok(())` 语法一开始可能看起来有点奇怪。但像这样使用 `()` 是惯用的方式，表明我们调用 `run` 只是为了它的副作用；它不返回我们需要使用的值。

当你运行这段代码时，它会编译但会显示一个警告：

```console
$ cargo run -- the poem.txt
   Compiling minigrep v0.1.0 (file:///projects/minigrep)
warning: unused `Result` that must be used
  --> src/main.rs:19:5
   |
19 |     run(config);
   |     ^^^^^^^^^^^
   |
   = note: this `Result` may be an `Err` variant, which should be handled
   = note: `#[warn(unused_must_use)]` on by default
help: use `let _ = ...` to ignore the resulting value
   |
19 |     let _ = run(config);
   |     +++++++

warning: `minigrep` (bin "minigrep") generated 1 warning
    Finished `dev` profile [unoptimized + debuginfo] target(s) in 0.71s
     Running `target/debug/minigrep the poem.txt`
Searching for the
In file poem.txt
With text:
I'm nobody! Who are you?
Are you nobody, too?
Then there's a pair of us - don't tell!
They'd banish us, you know.

How dreary to be somebody!
How public, like a frog
To tell your name the livelong day
To an admiring bog!

```

Rust 告诉我们我们的代码忽略了 `Result` 值，`Result` 值可能表明发生了错误。但我们没有检查是否有错误，编译器提醒我们可能应该在这里有一些错误处理代码！让我们现在纠正这个问题。

#### 在 `main` 中处理 `run` 返回的错误

我们将使用类似于我们在**清单 12-10**中与 `Config::build` 一起使用的技术来检查错误并处理它们，但有一点不同：

*文件名：src/main.rs*

```rust
fn main() {
    // --snip--

    let args: Vec<String> = env::args().collect();

    let config = Config::build(&args).unwrap_or_else(|err| {
        println!("Problem parsing arguments: {err}");
        process::exit(1);
    });

    println!("Searching for {}", config.query);
    println!("In file {}", config.file_path);

    if let Err(e) = run(config) {
        println!("Application error: {e}");
        process::exit(1);
    }
}
```

我们使用 `if let` 而不是 `unwrap_or_else` 来检查 `run` 是否返回一个 `Err` 值，如果是，则调用 `process::exit(1)`。`run` 函数不返回一个我们想以 `Config::build` 返回 `Config` 实例的方式 `unwrap` 的值。因为 `run` 在成功的情况下返回 `()`，我们只关心检测错误，所以我们不需要 `unwrap_or_else` 来返回解包后的值，那只会是 `()`。

`if let` 和 `unwrap_or_else` 函数的主体在两种情况下是相同的：我们打印错误并退出。

### 将代码拆分为库 Crate

到目前为止，我们的 `minigrep` 项目看起来不错！现在我们将把 *src/main.rs* 文件拆分，把一些代码放入 *src/lib.rs* 文件中。这样，我们可以测试代码，并且有一个责任更少的 *src/main.rs* 文件。

让我们在 *src/lib.rs* 中定义负责搜索文本的代码，而不是在 *src/main.rs* 中，这将使我们（或任何其他使用我们的 `minigrep` 库的人）能够从比我们 `minigrep` 二进制文件更多的上下文中调用搜索函数。

首先，让我们在 *src/lib.rs* 中定义 `search` 函数签名，如**清单 12-13**所示，主体调用 `unimplemented!` 宏。当我们填充实现时，我们将更详细地解释签名。

**清单 12-13**：在 *src/lib.rs* 中定义 `search` 函数（文件名：*src/lib.rs*）

```rust
pub fn search<'a>(query: &str, contents: &'a str) -> Vec<&'a str> {
    unimplemented!();
}
```

我们在函数定义上使用了 `pub` 关键字，将 `search` 指定为我们库 crate 公共 API 的一部分。我们现在有了一个可以从我们的二进制 crate 使用并且可以测试的库 crate！

现在我们需要将 *src/lib.rs* 中定义的代码引入 *src/main.rs* 中二进制 crate 的作用域并调用它，如**清单 12-14**所示。

**清单 12-14**：在 *src/main.rs* 中使用 `minigrep` 库 crate 的 `search` 函数（文件名：*src/main.rs*）

```rust
// --snip--
use minigrep::search;

fn main() {
    // --snip--
    let args: Vec<String> = env::args().collect();

    let config = Config::build(&args).unwrap_or_else(|err| {
        println!("Problem parsing arguments: {err}");
        process::exit(1);
    });

    if let Err(e) = run(config) {
        println!("Application error: {e}");
        process::exit(1);
    }
}

// --snip--

fn run(config: Config) -> Result<(), Box<dyn Error>> {
    let contents = fs::read_to_string(config.file_path)?;

    for line in search(&config.query, &contents) {
        println!("{line}");
    }

    Ok(())
}
```

我们添加了一行 `use minigrep::search` 将 `search` 函数从库 crate 引入二进制 crate 的作用域。然后，在 `run` 函数中，我们不打印文件的内容，而是调用 `search` 函数并传递 `config.query` 值和 `contents` 作为参数。然后，`run` 将使用 `for` 循环打印从 `search` 返回的每个匹配查询的行。这也是一个好时机来删除 `main` 函数中显示查询和文件路径的 `println!` 调用，这样我们的程序只在搜索结果显示（如果没有错误发生）。

请注意，搜索函数将在任何打印发生之前将所有结果收集到它返回的向量中。当搜索大文件时，这种实现可能会很慢，因为结果不是找到时就打印的；我们将在第13章讨论使用迭代器来修复这个问题的一种可能方法。

唷！那是一项很大的工作，但我们为未来做好了准备。现在处理错误更容易了，我们也使代码更加模块化。从现在开始，几乎所有的工作都将在 *src/lib.rs* 中完成。

让我们利用这种新发现的模块化来做一些用旧代码很难但用新代码很容易做的事情：我们将编写一些测试！

[ch13]: /rust-book/ch13-00-functional-features/
[ch9-custom-types]: /rust-book/ch09-03-to-panic-or-not-to-panic/#创建自定义类型进行验证
[ch9-error-guidelines]: /rust-book/ch09-03-to-panic-or-not-to-panic/#错误处理指南
[ch9-result]: /rust-book/ch09-02-recoverable-errors-with-result/
[ch18]: /rust-book/ch18-00-oop/
[ch9-question-mark]: /rust-book/ch09-02-recoverable-errors-with-result/#-运算符快捷方式
