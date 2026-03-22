---
title: 13.3. 改进我们的 I/O 项目
---

借助这些关于迭代器的新知识，我们可以通过使用迭代器使代码中的某些地方更清晰、更简洁，从而改进第12章中的I/O项目。让我们看看迭代器如何改进 `Config::build` 函数和 `search` 函数的实现。

## 使用迭代器移除 `clone`

在代码示例12-6中，我们添加了代码，它接受一个 `String` 值的切片，并通过索引到切片并克隆值来创建一个 `Config` 结构体的实例，允许 `Config` 结构体拥有这些值。在代码示例13-17中，我们复制了代码示例12-23中 `Config::build` 函数的实现。

**代码示例 13-17：复制代码示例12-23中的 `Config::build` 函数**

```rust
use std::env;
use std::error::Error;
use std::fs;
use std::process;

use minigrep::{search, search_case_insensitive};

fn main() {
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

pub struct Config {
    pub query: String,
    pub file_path: String,
    pub ignore_case: bool,
}

impl Config {
    fn build(args: &[String]) -> Result<Config, &'static str> {
        if args.len() < 3 {
            return Err("not enough arguments");
        }

        let query = args[1].clone();
        let file_path = args[2].clone();

        let ignore_case = env::var("IGNORE_CASE").is_ok();

        Ok(Config {
            query,
            file_path,
            ignore_case,
        })
    }
}

fn run(config: Config) -> Result<(), Box<dyn Error>> {
    let contents = fs::read_to_string(config.file_path)?;

    let results = if config.ignore_case {
        search_case_insensitive(&config.query, &contents)
    } else {
        search(&config.query, &contents)
    };

    for line in results {
        println!("{line}");
    }

    Ok(())
}
```

当时，我们说不要担心低效的 `clone` 调用，因为我们将来会移除它们。好吧，现在是时候了！

我们在这里需要 `clone`，因为我们在参数 `args` 中有一个带有 `String` 元素的切片，但 `build` 函数不拥有 `args`。为了返回 `Config` 实例的所有权，我们必须从 `Config` 的 `query` 和 `file_path` 字段克隆值，以便 `Config` 实例可以拥有它的值。

凭借我们关于迭代器的新知识，我们可以改变 `build` 函数，让它取得一个迭代器的所有权作为参数，而不是借用切片。我们将使用迭代器功能，而不是检查切片长度并索引到特定位置的代码。这将阐明 `Config::build` 函数在做什么，因为迭代器将访问值。

一旦 `Config::build` 取得了迭代器的所有权并停止使用借用的索引操作，我们就可以将 `String` 值从迭代器移入 `Config`，而不是调用 `clone` 并进行新的分配。

### 直接使用返回的迭代器

打开你的 I/O 项目的 _src/main.rs_ 文件，它应该如下所示：

**文件名：src/main.rs**

```rust
use std::env;
use std::error::Error;
use std::fs;
use std::process;

use minigrep::{search, search_case_insensitive};

fn main() {
    let args: Vec<String> = env::args().collect();

    let config = Config::build(&args).unwrap_or_else(|err| {
        eprintln!("Problem parsing arguments: {err}");
        process::exit(1);
    });

    // --snip--

    if let Err(e) = run(config) {
        eprintln!("Application error: {e}");
        process::exit(1);
    }
}

pub struct Config {
    pub query: String,
    pub file_path: String,
    pub ignore_case: bool,
}

impl Config {
    fn build(args: &[String]) -> Result<Config, &'static str> {
        if args.len() < 3 {
            return Err("not enough arguments");
        }

        let query = args[1].clone();
        let file_path = args[2].clone();

        let ignore_case = env::var("IGNORE_CASE").is_ok();

        Ok(Config {
            query,
            file_path,
            ignore_case,
        })
    }
}

fn run(config: Config) -> Result<(), Box<dyn Error>> {
    let contents = fs::read_to_string(config.file_path)?;

    let results = if config.ignore_case {
        search_case_insensitive(&config.query, &contents)
    } else {
        search(&config.query, &contents)
    };

    for line in results {
        println!("{line}");
    }

    Ok(())
}
```

我们首先将代码示例12-24中的 `main` 函数的开头更改为代码示例13-18，这次使用迭代器。在我们更新 `Config::build` 之前，这不会编译。

**代码示例 13-18：将 `env::args` 的返回值传递给 `Config::build`**

```rust
fn main() {
    let config = Config::build(env::args()).unwrap_or_else(|err| {
        eprintln!("Problem parsing arguments: {err}");
        process::exit(1);
    });

    // --snip--
}
```

`env::args` 函数返回一个迭代器！我们不是将迭代器值收集到一个向量中，然后将切片传递给 `Config::build`，而是直接将 `env::args` 返回的迭代器的所有权传递给 `Config::build`。

接下来，我们需要更新 `Config::build` 的定义。让我们更改 `Config::build` 的签名，使其看起来像代码示例13-19。这仍然不会编译，因为我们需要更新函数主体。

**代码示例 13-19：更新 `Config::build` 的签名以期望一个迭代器**

```rust
impl Config {
    fn build(
        mut args: impl Iterator<Item = String>,
    ) -> Result<Config, &'static str> {
        // --snip--
```

`env::args` 函数的标准库文档显示，它返回的迭代器类型是 `std::env::Args`，该类型实现了 `Iterator` trait 并返回 `String` 值。

我们已经更新了 `Config::build` 函数的签名，使得参数 `args` 的泛型类型具有 trait bound `impl Iterator<Item = String>`，而不是 `&[String]`。我们在第10章的["使用 Trait 作为参数"][impl-trait]部分讨论的 `impl Trait` 语法的这种用法意味着 `args` 可以是任何实现 `Iterator` trait 并返回 `String` 项的类型。

因为我们取得了 `args` 的所有权，并且我们将通过迭代它来改变 `args`，所以我们可以将 `mut` 关键字添加到 `args` 参数的规范中，使其可变。

### 使用 `Iterator` Trait 方法

接下来，我们将修复 `Config::build` 的主体。因为 `args` 实现了 `Iterator` trait，我们知道我们可以在它上面调用 `next` 方法！代码示例13-20更新了代码示例12-23中的代码以使用 `next` 方法。

**代码示例 13-20：更改 `Config::build` 的主体以使用迭代器方法**

```rust
impl Config {
    fn build(
        mut args: impl Iterator<Item = String>,
    ) -> Result<Config, &'static str> {
        args.next();

        let query = match args.next() {
            Some(arg) => arg,
            None => return Err("Didn't get a query string"),
        };

        let file_path = match args.next() {
            Some(arg) => arg,
            None => return Err("Didn't get a file path"),
        };

        let ignore_case = env::var("IGNORE_CASE").is_ok();

        Ok(Config {
            query,
            file_path,
            ignore_case,
        })
    }
}
```

记住，`env::args` 返回值中的第一个值是程序的名称。我们想忽略它并获取下一个值，所以我们首先调用 `next` 并不对返回值做任何处理。然后，我们调用 `next` 来获取我们想要放入 `Config` 的 `query` 字段的值。如果 `next` 返回 `Some`，我们使用 `match` 来提取值。如果它返回 `None`，这意味着没有给出足够的参数，我们提前返回一个 `Err` 值。我们对 `file_path` 值做同样的事情。

## 使用迭代器适配器澄清代码

我们还可以在我们的 I/O 项目的 `search` 函数中利用迭代器，这里在代码示例13-21中复制为代码示例12-19中的样子。

**代码示例 13-21：代码示例12-19中 `search` 函数的实现**

```rust
pub fn search<'a>(query: &str, contents: &'a str) -> Vec<&'a str> {
    let mut results = Vec::new();

    for line in contents.lines() {
        if line.contains(query) {
            results.push(line);
        }
    }

    results
}
```

我们可以使用迭代器适配器方法以更简洁的方式编写这段代码。这样做还可以让我们避免拥有一个可变的中间 `results` 向量。函数式编程风格倾向于最小化可变状态的数量，以使代码更清晰。移除可变状态可能使将来的增强功能能够实现并行搜索，因为我们不必管理对 `results` 向量的并发访问。代码示例13-22展示了这一更改。

**代码示例 13-22：在 `search` 函数的实现中使用迭代器适配器方法**

```rust
pub fn search<'a>(query: &str, contents: &'a str) -> Vec<&'a str> {
    contents
        .lines()
        .filter(|line| line.contains(query))
        .collect()
}
```

回想一下，`search` 函数的目的是返回 `contents` 中包含 `query` 的所有行。类似于代码示例13-16中的 `filter` 示例，这段代码使用 `filter` 适配器来只保留 `line.contains(query)` 返回 `true` 的行。然后我们用 `collect` 将匹配的行收集到另一个向量中。简单多了！随意在 `search_case_insensitive` 函数中也做同样的更改来使用迭代器方法。

为了进一步改进，通过移除对 `collect` 的调用并将返回类型更改为 `impl Iterator<Item = &'a str>`，使 `search` 函数返回一个迭代器，从而使该函数成为一个迭代器适配器。注意，你还需要更新测试！在做出此更改之前和之后，使用你的 `minigrep` 工具搜索一个大文件，观察行为的差异。在此更改之前，程序在收集所有结果之前不会打印任何结果，但在更改之后，结果将在找到每个匹配行时打印，因为 `run` 函数中的 `for` 循环能够利用迭代器的惰性。

## 在循环和迭代器之间选择

下一个合乎逻辑的问题是，你应该在自己的代码中选择哪种风格以及为什么：代码示例13-21中的原始实现，还是代码示例13-22中使用迭代器的版本（假设我们在返回它们之前收集所有结果，而不是返回迭代器）。大多数 Rust 程序员更喜欢使用迭代器风格。一开始掌握它有点困难，但一旦你习惯了各种迭代器适配器及其功能，迭代器可能更容易理解。与摆弄循环的各个部分和构建新向量的代码不同，代码专注于循环的高级目标。这抽象掉了一些常见的代码，因此更容易看到这段代码独有的概念，例如迭代器中每个元素必须通过的条件。

但是这两个实现真的等价吗？直观的假设可能是较低级别的循环会更快。让我们谈谈性能。

[impl-trait]: /rust-book/ch10-02-traits#trait-作为参数
