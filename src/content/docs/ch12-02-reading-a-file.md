---
title: 12.2. 读取文件
---

现在我们将添加读取 `file_path` 参数中指定的文件的功能。首先，我们需要一个样本文件来测试：我们将使用一个包含少量文本、多行并有一些重复词的文件。清单 12-3 有一首 Emily Dickinson 的诗，效果很好！在项目根级别创建一个名为 _poem.txt_ 的文件，并输入诗歌「I'm Nobody! Who are you?」

**清单 12-3**：Emily Dickinson 的诗是一个很好的测试用例（*文件名：poem.txt*）

```text
I'm nobody! Who are you?
Are you nobody, too?
Then there's a pair of us - don't tell!
They'd banish us, you know.

How dreary to be somebody!
How public, like a frog
To tell your name the livelong day
To an admiring bog!
```

文本准备就绪后，编辑 _src/main.rs_ 并添加读取文件的代码，如清单 12-4 所示。

**清单 12-4**：读取第二个参数指定的文件的内容（*文件名：src/main.rs*）

```rust
use std::env;
use std::fs;

fn main() {
    let args: Vec<String> = env::args().collect();

    let query = &args[1];
    let file_path = &args[2];

    println!("Searching for {query}");
    println!("In file {file_path}");

    let contents = fs::read_to_string(file_path)
        .expect("Should have been able to read the file");

    println!("With text:\n{contents}");
}
```

首先，我们用 `use` 语句引入标准库的相关部分：我们需要 `std::fs` 来处理文件。

在 `main` 中，新语句 `fs::read_to_string` 接收 `file_path`，打开该文件，并返回一个包含文件内容的 `std::io::Result<String>` 类型的值。

之后，我们再次添加一个临时的 `println!` 语句，在读取文件后打印 `contents` 的值，以便我们可以检查程序到目前为止是否正常工作。

让我们用任意字符串作为第一个命令行参数（因为我们还没有实现搜索部分）和 _poem.txt_ 文件作为第二个参数来运行这段代码：

```console
$ cargo run -- the poem.txt
   Compiling minigrep v0.1.0 (file:///projects/minigrep)
    Finished `dev` profile [unoptimized + debuginfo] target(s) in 0.0s
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

太好了！代码读取并打印了文件的内容。但代码有一些缺陷。目前，`main` 函数有多个职责：一般来说，如果每个函数只负责一个概念，函数会更清晰且更容易维护。另一个问题是我们没有尽可能好地处理错误。程序现在很小，所以这些缺陷不是什么大问题，但随着程序的增长，将更难干净地修复它们。在开发程序时尽早开始重构是一种好的做法，因为重构少量代码要容易得多。我们接下来就这样做。
