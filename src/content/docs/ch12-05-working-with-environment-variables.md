---
title: 12.5. 使用环境变量
---

我们将通过添加一个额外功能来改进 `minigrep` 二进制文件：用户可以通过环境变量打开的区分大小写搜索选项。我们可以将此功能设为命令行选项，要求用户每次想要应用时都输入它，但通过将其设为环境变量，我们允许用户设置一次环境变量，并在该终端会话中的所有搜索都不区分大小写。

### 为区分大小写搜索编写失败测试

我们首先向 `minigrep` 库添加一个新的 `search_case_insensitive` 函数，当环境变量有值时调用它。我们将继续遵循 TDD 过程，所以第一步又是编写失败测试。我们将为新的 `search_case_insensitive` 函数添加一个新测试，并将我们的旧测试从 `one_result` 重命名为 `case_sensitive`，以澄清两个测试之间的差异，如**清单 12-20**所示。

**清单 12-20**：为我们即将添加的区分大小写函数添加新的失败测试（文件名：*src/lib.rs*）

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

#[cfg(test)]
mod tests {
    use super::*;

    #[test]
    fn case_sensitive() {
        let query = "duct";
        let contents = "\
Rust:
safe, fast, productive.
Pick three.
Duct tape.";

        assert_eq!(vec!["safe, fast, productive."], search(query, contents));
    }

    #[test]
    fn case_insensitive() {
        let query = "rUsT";
        let contents = "\
Rust:
safe, fast, productive.
Pick three.
Trust me.";

        assert_eq!(
            vec!["Rust:", "Trust me."],
            search_case_insensitive(query, contents)
        );
    }
}
```

请注意，我们也编辑了旧测试的 `contents`。我们添加了一行新文本 `"Duct tape."`，使用大写 _D_，在我们以区分大小写的方式搜索时，它不应该匹配查询 `"duct"`。这样更改旧测试有助于确保我们不会意外地破坏我们已经实现的区分大小写搜索功能。这个测试现在应该通过，并且在我们处理区分大小写搜索时应该继续通过。

区分大小写搜索的新测试使用 `"rUsT"` 作为其查询。在我们即将添加的 `search_case_insensitive` 函数中，查询 `"rUsT"` 应该匹配包含 `"Rust:"`（带大写 _R_）的行，以及匹配 `"Trust me."`，尽管两者的大小写与查询不同。这是我们的失败测试，由于我们还没有定义 `search_case_insensitive` 函数，它将无法编译。可以随意添加一个总是返回空向量的骨架实现，类似于我们在**清单 12-16**中对 `search` 函数所做的那样，以查看测试编译并失败。

### 实现 `search_case_insensitive` 函数

**清单 12-21** 中显示的 `search_case_insensitive` 函数将与 `search` 函数几乎相同。唯一的区别是我们在检查行是否包含查询之前，将 `query` 和每个 `line` 都转换为小写。

**清单 12-21**：定义 `search_case_insensitive` 函数以在比较之前将查询和行都转换为小写（文件名：*src/lib.rs*）

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

pub fn search_case_insensitive<'a>(
    query: &str,
    contents: &'a str,
) -> Vec<&'a str> {
    let query = query.to_lowercase();
    let mut results = Vec::new();

    for line in contents.lines() {
        if line.to_lowercase().contains(&query) {
            results.push(line);
        }
    }

    results
}
```

首先，我们将 `query` 字符串转换为小写，并将其存储在一个同名的新变量中，遮蔽原始 `query`。对查询调用 `to_lowercase` 是必要的，这样无论用户的查询是 `"rust"`、`"RUST"`、`"Rust"` 还是 `"rUsT"`，我们都将查询视为 `"rust"` 并对大小写不敏感。虽然 `to_lowercase` 会处理基本的 Unicode，但它不会是 100% 准确的。如果我们正在编写一个真实的应用程序，我们会在这里做更多的工作，但这一节是关于环境变量的，不是关于 Unicode 的，所以我们在这里就先这样了。

请注意，`query` 现在是一个 `String` 而不是字符串切片，因为调用 `to_lowercase` 会创建新数据而不是引用现有数据。假设查询是 `"rUsT"`，举个例子：该字符串切片不包含我们可以使用的小写 `u` 或 `t`，所以我们必须分配一个包含 `"rust"` 的新 `String`。现在当我们将 `query` 作为参数传递给 `contains` 方法时，我们需要添加一个 & 符号，因为 `contains` 的签名被定义为接受字符串切片。

接下来，我们在每一行 `line` 上添加对 `to_lowercase` 的调用，以将所有字符转换为小写。现在我们已经将 `line` 和 `query` 转换为小写，无论查询的大小写如何，我们都会找到匹配项。

让我们看看这个实现是否通过了测试：

```console
$ cargo test
   Compiling minigrep v0.1.0 (file:///projects/minigrep)
    Finished `test` profile [unoptimized + debuginfo] target(s) in 1.33s
     Running unittests src/lib.rs (target/debug/deps/minigrep-9cd200e5fac0fc94)

running 2 tests
test tests::case_insensitive ... ok
test tests::case_sensitive ... ok

test result: ok. 2 passed; 0 failed; 0 ignored; 0 measured; 0 filtered out; finished in 0.00s

     Running unittests src/main.rs (target/debug/deps/minigrep-9cd200e5fac0fc94)

running 0 tests

test result: ok. 0 passed; 0 failed; 0 ignored; 0 measured; 0 filtered out; finished in 0.00s

   Doc-tests minigrep

running 0 tests

test result: ok. 0 passed; 0 failed; 0 ignored; 0 measured; 0 filtered out; finished in 0.00s

```

太好了！它们通过了。现在让我们从 `run` 函数中调用新的 `search_case_insensitive` 函数。首先，我们将向 `Config` 结构体添加一个配置选项，以在区分大小写和不区分大小写搜索之间切换。添加此字段将导致编译错误，因为我们还没有在任何地方初始化此字段：

*文件名：src/main.rs*

```rust
pub struct Config {
    pub query: String,
    pub file_path: String,
    pub ignore_case: bool,
}
```

我们添加了保存布尔值的 `ignore_case` 字段。接下来，我们需要 `run` 函数检查 `ignore_case` 字段的值，并使用它来决定是调用 `search` 函数还是 `search_case_insensitive` 函数，如**清单 12-22**所示。这仍然不会编译。

**清单 12-22**：根据 `config.ignore_case` 中的值调用 `search` 或 `search_case_insensitive`（文件名：*src/main.rs*）

```rust
use minigrep::{search, search_case_insensitive};

// --snip--

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

最后，我们需要检查环境变量。处理环境变量的函数在标准库的 `env` 模块中，该模块已经在 *src/main.rs* 的顶部引入作用域。我们将使用 `env` 模块中的 `var` 函数来检查是否已为名为 `IGNORE_CASE` 的环境变量设置了任何值，如**清单 12-23**所示。

**清单 12-23**：检查名为 `IGNORE_CASE` 的环境变量中是否有任何值（文件名：*src/main.rs*）

```rust
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
```

在这里，我们创建了一个新变量 `ignore_case`。为了设置它的值，我们调用 `env::var` 函数并传递 `IGNORE_CASE` 环境变量的名称。如果环境变量设置为任何值，`env::var` 函数将返回成功的 `Ok` 变体，其中包含环境变量的值。如果环境变量未设置，它将返回 `Err` 变体。

我们在 `Result` 上使用 `is_ok` 方法来检查环境变量是否已设置，这意味着程序应该进行不区分大小写的搜索。如果 `IGNORE_CASE` 环境变量没有设置为任何值，`is_ok` 将返回 `false`，程序将执行区分大小写的搜索。我们不关心环境变量的 _值_ ，只关心它是否已设置或未设置，所以我们检查 `is_ok` 而不是使用 `unwrap`、`expect` 或我们在 `Result` 上见过的任何其他方法。

我们将 `ignore_case` 变量中的值传递给 `Config` 实例，以便 `run` 函数可以读取该值并决定是调用 `search_case_insensitive` 还是 `search`，正如我们在**清单 12-22**中实现的那样。

让我们试一试！首先，我们将在未设置环境变量的情况下运行程序，并使用查询 `to`，它应该匹配任何包含全小写单词 _to_ 的行：

```console
$ cargo run -- to poem.txt
   Compiling minigrep v0.1.0 (file:///projects/minigrep)
    Finished `dev` profile [unoptimized + debuginfo] target(s) in 0.0s
     Running `target/debug/minigrep to poem.txt`
Are you nobody, too?
How dreary to be somebody!

```

看起来仍然有效！现在让我们用 `IGNORE_CASE` 设置为 `1` 但使用相同的查询 `to` 来运行程序：

```console
$ IGNORE_CASE=1 cargo run -- to poem.txt
```

如果你使用的是 PowerShell，你需要将设置环境变量和运行程序作为单独的命令：

```console
PS> $Env:IGNORE_CASE=1; cargo run -- to poem.txt
```

这将使 `IGNORE_CASE` 在 shell 会话的剩余时间内保持。可以使用 `Remove-Item` cmdlet 取消设置：

```console
PS> Remove-Item Env:IGNORE_CASE
```

我们应该得到可能包含大写字母的包含 _to_ 的行：

```console
Are you nobody, too?
How dreary to be somebody!
To tell your name the livelong day
To an admiring bog!
```

太好了，我们还得到了包含 _To_ 的行！我们的 `minigrep` 程序现在可以进行由环境变量控制的不区分大小写搜索了。现在你知道如何使用命令行参数或环境变量来管理设置了选项的程序。

一些程序允许参数*和*环境变量用于相同的配置。在这些情况下，程序决定哪一个优先。作为另一个练习，尝试通过命令行参数或环境变量来控制大小写敏感性。决定如果程序运行时一个设置为区分大小写，另一个设置为忽略大小写，命令行参数还是环境变量应该优先。

`std::env` 模块包含许多更有用的处理环境变量的功能：查看其文档以了解可用的内容。
