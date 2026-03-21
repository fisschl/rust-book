---
title: 使用 Result 处理可恢复的错误
---

大多数错误不至于严重到需要程序完全停止。有时当函数失败时，是出于你可以轻松解释和响应的原因。例如，如果你尝试打开文件而该操作失败是因为文件不存在，你可能想创建文件而不是终止进程。

从第 2 章的[使用 `Result` 处理潜在失败][handle_failure]中回想，`Result` 枚举被定义为具有两个变体，`Ok` 和 `Err`，如下所示：

```rust
enum Result<T, E> {
    Ok(T),
    Err(E),
}
```

`T` 和 `E` 是泛型类型参数：我们将在第 10 章更详细地讨论泛型。你现在需要知道的是，`T` 表示在 `Ok` 变体中的成功情况下返回的值的类型，`E` 表示在 `Err` 变体中的失败情况下返回的错误类型。因为 `Result` 有这些泛型类型参数，我们可以在许多不同的情况下使用 `Result` 类型和定义在它上面的函数，其中我们想要返回的成功值和错误值可能不同。

让我们调用一个返回 `Result` 值的函数，因为该函数可能会失败。在代码示例 9-3 中，我们尝试打开一个文件。

**代码示例 9-3：打开文件**

```rust
use std::fs::File;

fn main() {
    let greeting_file_result = File::open("hello.txt");
}
```

`File::open` 的返回类型是 `Result<T, E>`。泛型参数 `T` 已被 `File::open` 的实现用成功值的类型 `std::fs::File`（文件句柄）填充。`E` 在错误值中使用的类型是 `std::io::Error`。这个返回类型意味着对 `File::open` 的调用可能成功并返回我们可以从中读取或写入的文件句柄。函数调用也可能失败：例如，文件可能不存在，或者我们可能没有访问文件的权限。`File::open` 函数需要有一种方式告诉我们它是成功还是失败，同时给我们文件句柄或错误信息。这些信息正是 `Result` 枚举传达的。

在 `File::open` 成功的情况下，变量 `greeting_file_result` 中的值将是包含文件句柄的 `Ok` 实例。在它失败的情况下，`greeting_file_result` 中的值将是包含有关发生的错误类型的更多信息的 `Err` 实例。

我们需要向代码示例 9-3 中的代码添加内容，以根据 `File::open` 返回的值采取不同的操作。代码示例 9-4 展示了使用基本工具处理 `Result` 的一种方式，即我们在第 6 章讨论的 `match` 表达式。

**代码示例 9-4：使用 `match` 表达式处理可能返回的 `Result` 变体**

```rust
use std::fs::File;

fn main() {
    let greeting_file_result = File::open("hello.txt");

    let greeting_file = match greeting_file_result {
        Ok(file) => file,
        Err(error) => panic!("Problem opening the file: {error:?}"),
    };
}
```

请注意，像 `Option` 枚举一样，`Result` 枚举及其变体已被预导入引入作用域，因此我们不需要在 `match` 分支中的 `Ok` 和 `Err` 变体前指定 `Result::`。

当结果是 `Ok` 时，这段代码将从 `Ok` 变体中返回内部的 `file` 值，然后我们将该文件句柄值赋给变量 `greeting_file`。在 `match` 之后，我们可以使用文件句柄进行读取或写入。

`match` 的另一个分支处理我们从 `File::open` 得到 `Err` 值的情况。在这个例子中，我们选择了调用 `panic!` 宏。如果当前目录中没有名为 _hello.txt_ 的文件并且我们运行此代码，我们将看到来自 `panic!` 宏的以下输出：

```console
$ cargo run
   Compiling error-handling v0.1.0 (file:///projects/error-handling)
    Finished `dev` profile [unoptimized + debuginfo] target(s) in 0.73s
     Running `target/debug/error-handling`

thread 'main' panicked at src/main.rs:8:23:
Problem opening the file: Os { code: 2, kind: NotFound, message: "No such file or directory" }
note: run with `RUST_BACKTRACE=1` environment variable to display a backtrace
```

像往常一样，这个输出准确地告诉我们出了什么问题。

### 匹配不同的错误

代码示例 9-4 中的代码将无论 `File::open` 失败的原因如何都会 `panic!`。然而，我们想对不同的失败原因采取不同的操作。如果 `File::open` 失败是因为文件不存在，我们想创建文件并返回新文件的句柄。如果 `File::open` 因任何其他原因失败——例如，因为我们没有权限打开文件——我们仍然希望代码像代码示例 9-4 中那样 `panic!`。为此，我们添加一个内部的 `match` 表达式，如代码示例 9-5 所示。

**代码示例 9-5：以不同方式处理不同类型的错误**

```rust
use std::fs::File;
use std::io::ErrorKind;

fn main() {
    let greeting_file_result = File::open("hello.txt");

    let greeting_file = match greeting_file_result {
        Ok(file) => file,
        Err(error) => match error.kind() {
            ErrorKind::NotFound => match File::create("hello.txt") {
                Ok(fc) => fc,
                Err(e) => panic!("Problem creating the file: {e:?}"),
            },
            _ => {
                panic!("Problem opening the file: {error:?}");
            }
        },
    };
}
```

`File::open` 在 `Err` 变体中返回的值的类型是 `io::Error`，这是标准库提供的结构体。这个结构体有一个方法 `kind`，我们可以调用它来获取 `io::ErrorKind` 值。枚举 `io::ErrorKind` 由标准库提供，具有表示可能由 `io` 操作导致的不同错误类型的变体。我们想要使用的变体是 `ErrorKind::NotFound`，它表示我们尝试打开的文件尚不存在。因此，我们匹配 `greeting_file_result`，但我们也在 `error.kind()` 上有一个内部匹配。

我们在内部匹配中想要检查的条件是 `error.kind()` 返回的值是否是 `ErrorKind` 枚举的 `NotFound` 变体。如果是，我们尝试使用 `File::create` 创建文件。然而，因为 `File::create` 也可能失败，我们需要在内部 `match` 表达式中有第二个分支。当文件无法创建时，会打印不同的错误消息。外部 `match` 的第二个分支保持不变，因此程序在除了缺少文件错误之外的任何错误上都会 panic。

> **使用 `Result<T, E>` 的 `match` 的替代方案**
>
> 那是很多的 `match`！`match` 表达式非常有用，但也非常原始。在第 13 章中，你将学习闭包，它们与许多定义在 `Result<T, E>` 上的方法一起使用。这些方法在处理代码中的 `Result<T, E>` 值时比使用 `match` 更简洁。
>
> 例如，这是编写与代码示例 9-5 所示相同逻辑的另一种方式，这次使用闭包和 `unwrap_or_else` 方法：
>
> ```rust
> use std::fs::File;
> use std::io::ErrorKind;
>
> fn main() {
>     let greeting_file = File::open("hello.txt").unwrap_or_else(|error| {
>         if error.kind() == ErrorKind::NotFound {
>             File::create("hello.txt").unwrap_or_else(|error| {
>                 panic!("Problem creating the file: {error:?}");
>             })
>         } else {
>             panic!("Problem opening the file: {error:?}");
>         }
>     });
> }
> ```
>
> 虽然这段代码与代码示例 9-5 具有相同的行为，但它不包含任何 `match` 表达式，并且更易读。在你阅读了第 13 章并查阅标准库文档中的 `unwrap_or_else` 方法后，再回来看这个例子。当你处理错误时，许多这样的方法可以清理庞大、嵌套的 `match` 表达式。

#### 错误时 Panic 的快捷方式

使用 `match` 足够好用，但它可能有点冗长，并且并不总是能很好地传达意图。`Result<T, E>` 类型定义了许多辅助方法来完成各种更具体的任务。`unwrap` 方法是一个快捷方法，实现方式与我们在代码示例 9-4 中编写的 `match` 表达式完全一样。如果 `Result` 值是 `Ok` 变体，`unwrap` 将返回 `Ok` 内部的值。如果 `Result` 是 `Err` 变体，`unwrap` 将为我们调用 `panic!` 宏。以下是 `unwrap` 的实际应用示例：

**src/main.rs**

```rust
use std::fs::File;

fn main() {
    let greeting_file = File::open("hello.txt").unwrap();
}
```

如果我们在没有 _hello.txt_ 文件的情况下运行此代码，我们将看到 `unwrap` 方法进行的 `panic!` 调用的错误消息：

```text
thread 'main' panicked at src/main.rs:4:49:
called `Result::unwrap()` on an `Err` value: Os { code: 2, kind: NotFound, message: "No such file or directory" }
```

类似地，`expect` 方法也让我们选择 `panic!` 错误消息。使用 `expect` 而不是 `unwrap` 并提供良好的错误消息可以传达你的意图，并使追踪 panic 的来源更容易。`expect` 的语法如下所示：

**src/main.rs**

```rust
use std::fs::File;

fn main() {
    let greeting_file = File::open("hello.txt")
        .expect("hello.txt should be included in this project");
}
```

我们以与 `unwrap` 相同的方式使用 `expect`：返回文件句柄或调用 `panic!` 宏。`expect` 在其对 `panic!` 的调用中使用的错误消息将是我们传递给 `expect` 的参数，而不是 `unwrap` 使用的默认 `panic!` 消息。它看起来像这样：

```text
thread 'main' panicked at src/main.rs:5:10:
hello.txt should be included in this project: Os { code: 2, kind: NotFound, message: "No such file or directory" }
```

在生产质量代码中，大多数 Rustacean 选择 `expect` 而不是 `unwrap`，并提供更多关于为什么操作应该总是成功的上下文。这样，如果你的假设被证明是错误的，你有更多信息用于调试。

### 传播错误

当函数的实现调用可能失败的东西时，你可以在函数本身内处理错误，也可以将错误返回给调用代码以便它可以决定做什么。这被称为 _传播_ 错误，并给予调用代码更多的控制权，在那里可能有比你代码上下文中可用的更多信息或逻辑来决定应该如何处理错误。

例如，代码示例 9-6 显示了一个从文件读取用户名的函数。如果文件不存在或无法读取，此函数会将这些错误返回给调用函数的代码。

**代码示例 9-6：使用 `match` 将错误返回给调用代码的函数**

```rust
use std::fs::File;
use std::io::{self, Read};

fn read_username_from_file() -> Result<String, io::Error> {
    let username_file_result = File::open("hello.txt");

    let mut username_file = match username_file_result {
        Ok(file) => file,
        Err(e) => return Err(e),
    };

    let mut username = String::new();

    match username_file.read_to_string(&mut username) {
        Ok(_) => Ok(username),
        Err(e) => Err(e),
    }
}

fn main() {
    let username = read_username_from_file().expect("Unable to get username");
}
```

这个函数可以用更短的方式编写，但我们将从手动完成大部分开始，以便探索错误处理；最后，我们会展示更短的方式。让我们先看看函数的返回类型：`Result<String, io::Error>`。这意味着函数返回一个 `Result<T, E>` 类型的值，其中泛型参数 `T` 已被具体类型 `String` 填充，泛型类型 `E` 已被具体类型 `io::Error` 填充。

如果这个函数成功没有任何问题，调用此函数的代码将收到一个包含 `String` 的 `Ok` 值——该函数从文件中读取的 `username`。如果这个函数遇到任何问题，调用代码将收到一个包含有关问题是什么的更多信息的 `io::Error` 实例的 `Err` 值。我们选择 `io::Error` 作为这个函数的返回类型，因为这恰好是我们在该函数体中调用的可能失败的两个操作返回的错误值的类型：`File::open` 函数和 `read_to_string` 方法。

函数体首先调用 `File::open` 函数。然后，我们使用类似于代码示例 9-4 中 `match` 的 `match` 处理 `Result` 值。如果 `File::open` 成功，模式变量 `file` 中的文件句柄成为可变变量 `username_file` 中的值，函数继续。在 `Err` 情况下，我们不调用 `panic!`，而是使用 `return` 关键字完全提前退出函数，并将来自 `File::open` 的错误值（现在在模式变量 `e` 中）作为此函数的错误值返回给调用代码。

因此，如果我们在 `username_file` 中有文件句柄，函数然后在变量 `username` 中创建一个新的 `String`，并在 `username_file` 中的文件句柄上调用 `read_to_string` 方法，将文件内容读入 `username`。`read_to_string` 方法也返回一个 `Result`，因为它可能失败，即使 `File::open` 成功了。因此，我们需要另一个 `match` 来处理那个 `Result`：如果 `read_to_string` 成功，那么我们的函数成功了，我们返回现在包含在 `username` 中的文件中的用户名，包装在 `Ok` 中。如果 `read_to_string` 失败，我们以与我们在处理 `File::open` 返回值的 `match` 中返回错误值相同的方式返回错误值。然而，我们不需要显式地说 `return`，因为这是函数中的最后一个表达式。

调用此代码的代码然后将处理获得包含用户名的 `Ok` 值或包含 `io::Error` 的 `Err` 值。这取决于调用代码来决定如何处理这些值。如果调用代码获得一个 `Err` 值，它可以调用 `panic!` 并使程序崩溃，使用默认用户名，或从文件以外的地方查找用户名，例如。我们没有足够的信息来了解调用代码实际试图做什么，因此我们将所有成功或错误信息向上传播，以便它适当地处理。

这种传播错误的模式在 Rust 中非常常见，以至于 Rust 提供了问号运算符 `?` 来使这更容易。

#### `?` 运算符快捷方式

代码示例 9-7 展示了 `read_username_from_file` 的实现，其功能与代码示例 9-6 相同，但此实现使用了 `?` 运算符。

**代码示例 9-7：使用 `?` 运算符将错误返回给调用代码的函数**

```rust
use std::fs::File;
use std::io::{self, Read};

fn read_username_from_file() -> Result<String, io::Error> {
    let mut username_file = File::open("hello.txt")?;
    let mut username = String::new();
    username_file.read_to_string(&mut username)?;
    Ok(username)
}

fn main() {
    let username = read_username_from_file().expect("Unable to get username");
}
```

放在 `Result` 值之后的 `?` 被定义为以几乎与我们定义的处理代码示例 9-6 中 `Result` 值的 `match` 表达式相同的方式工作。如果 `Result` 的值是 `Ok`，`Ok` 内部的值将从此表达式返回，程序将继续。如果值是 `Err`，`Err` 将从整个函数返回，就像我们已经使用了 `return` 关键字一样，以便错误值传播给调用代码。

代码示例 9-6 中的 `match` 表达式所做的与 `?` 运算符所做的之间存在差异：对其调用 `?` 运算符的错误值通过 `from` 函数，该函数在标准库的 `From` trait 中定义，用于将值从一种类型转换为另一种类型。当 `?` 运算符调用 `from` 函数时，接收到的错误类型被转换为当前函数返回类型中定义的错误类型。这很有用，当一个函数返回一个错误类型来表示函数可能失败的所有方式时，即使部分可能因许多不同的原因而失败。

例如，我们可以将代码示例 9-7 中的 `read_username_from_file` 函数更改为返回一个名为 `OurError` 的自定义错误类型，我们定义它。如果我们还定义 `impl From<io::Error> for OurError` 以从 `io::Error` 构造 `OurError` 实例，那么 `read_username_from_file` 函数体中的 `?` 运算符调用将调用 `from` 并转换错误类型，而无需向函数添加任何更多代码。

在代码示例 9-7 的上下文中，`File::open` 调用末尾的 `?` 将把 `Ok` 内部的值返回给变量 `username_file`。如果发生错误，`?` 运算符将从整个函数提前返回，并将任何 `Err` 值给调用代码。`read_to_string` 调用末尾的 `?` 也是如此。

`?` 运算符消除了大量样板代码，并使此函数的实现更简单。我们甚至可以通过在 `?` 之后立即链接方法调用来进一步缩短此代码，如代码示例 9-8 所示。

**代码示例 9-8：在 `?` 运算符之后链接方法调用**

```rust
use std::fs::File;
use std::io::{self, Read};

fn read_username_from_file() -> Result<String, io::Error> {
    let mut username = String::new();

    File::open("hello.txt")?.read_to_string(&mut username)?;

    Ok(username)
}

fn main() {
    let username = read_username_from_file().expect("Unable to get username");
}
```

我们将 `username` 中新的 `String` 的创建移到了函数的开头；那部分没有改变。我们没有创建变量 `username_file`，而是直接将 `read_to_string` 的调用链接到 `File::open("hello.txt")?` 的结果上。我们在 `read_to_string` 调用的末尾仍然有一个 `?`，当 `File::open` 和 `read_to_string` 都成功而不是返回错误时，我们仍然返回包含 `username` 的 `Ok` 值。功能再次与代码示例 9-6 和代码示例 9-7 中的相同；这只是编写它的不同、更符合人体工程学的方式。

代码示例 9-9 展示了使用 `fs::read_to_string` 使这更短的一种方式。

**代码示例 9-9：使用 `fs::read_to_string` 而不是打开然后读取文件**

```rust
use std::fs;
use std::io;

fn read_username_from_file() -> Result<String, io::Error> {
    fs::read_to_string("hello.txt")
}

fn main() {
    let username = read_username_from_file().expect("Unable to get username");
}
```

将文件读入字符串是一个相当常见的操作，因此标准库提供了方便的 `fs::read_to_string` 函数，它打开文件、创建新的 `String`、读取文件内容、将内容放入该 `String` 并返回它。当然，使用 `fs::read_to_string` 没有给我们机会解释所有错误处理，所以我们先用更长的方式进行。

#### 在哪里使用 `?` 运算符

`?` 运算符只能在返回类型与使用 `?` 的值兼容的函数中使用。这是因为 `?` 运算符被定义为执行从函数中提前返回值的操作，方式与我们在代码示例 9-6 中定义的 `match` 表达式相同。在代码示例 9-6 中，`match` 使用 `Result` 值，提前返回分支返回一个 `Err(e)` 值。函数的返回类型必须是 `Result`，以便与此 `return` 兼容。

在代码示例 9-10 中，让我们看看如果我们在返回类型与我们在其上使用 `?` 的值的类型不兼容的 `main` 函数中使用 `?` 运算符，我们会得到的错误。

**代码示例 9-10：尝试在返回 `()` 的 `main` 函数中使用 `?` 不会编译**

```rust
use std::fs::File;

fn main() {
    let greeting_file = File::open("hello.txt")?;
}
```

这段代码打开一个文件，这可能会失败。`?` 运算符跟随 `File::open` 返回的 `Result` 值，但此 `main` 函数的返回类型是 `()`，而不是 `Result`。当我们编译此代码时，我们得到以下错误消息：

```console
$ cargo run
   Compiling error-handling v0.1.0 (file:///projects/error-handling)
error[E0277]: the `?` operator can only be used in a function that returns `Result` or `Option` (or another type that implements `FromResidual`)
 --> src/main.rs:4:48
  |
3 | fn main() {
  | --------- this function should return `Result` or `Option` to accept `?`
4 |     let greeting_file = File::open("hello.txt")?;
  |                                                ^ cannot use the `?` operator in a function that returns `()`
  |
help: consider adding return type
  |
3 ~ fn main() -> Result<(), Box<dyn std::error::Error>> {
4 |     let greeting_file = File::open("hello.txt")?;
5 +     Ok(())
  |

For more information about this error, try `rustc --explain E0277`.
error: could not compile `error-handling` (bin "error-handling") due to 1 previous error
```

此错误指出，我们只允许在返回 `Result`、`Option` 或实现 `FromResidual` 的其他类型的函数中使用 `?` 运算符。

要修复错误，你有两个选择。一个选择是更改函数的返回类型以与你使用 `?` 运算符的值兼容，只要你没有阻止这样做的限制。另一个选择是使用 `match` 或 `Result<T, E>` 方法之一以适当的方式处理 `Result<T, E>`。

错误消息还提到 `?` 也可以与 `Option<T>` 值一起使用。与在 `Result` 上使用 `?` 一样，你只能在返回 `Option` 的函数中对 `Option` 使用 `?`。当在 `Option<T>` 上调用时，`?` 运算符的行为与其在 `Result<T, E>` 上调用时的行为类似：如果值是 `None`，`None` 将在此时从函数提前返回。如果值是 `Some`，`Some` 内部的值是表达式的结果值，函数继续。代码示例 9-11 有一个示例函数，用于查找给定文本中第一行的最后一个字符。

**代码示例 9-11**：在 `Option<T>` 值上使用 `?` 运算符

```rust
fn last_char_of_first_line(text: &str) -> Option<char> {
    text.lines().next()?.chars().last()
}

fn main() {
    assert_eq!(
        last_char_of_first_line("Hello, world\nHow are you today?"),
        Some('d')
    );

    assert_eq!(last_char_of_first_line(""), None);
    assert_eq!(last_char_of_first_line("\nhi"), None);
}
```

此函数返回 `Option<char>`，因为那里可能有一个字符，但也可能没有。此代码接受 `text` 字符串切片参数并在其上调用 `lines` 方法，该方法返回字符串中各行的迭代器。因为这个函数想要检查第一行，它在迭代器上调用 `next` 以从迭代器获取第一个值。如果 `text` 是空字符串，此次对 `next` 的调用将返回 `None`，在这种情况下我们使用 `?` 停止并从 `last_char_of_first_line` 返回 `None`。如果 `text` 不是空字符串，`next` 将返回一个包含 `text` 中第一行字符串切片的 `Some` 值。

`?` 提取字符串切片，我们可以在该字符串切片上调用 `chars` 以获取其字符的迭代器。我们对这第一行的最后一个字符感兴趣，因此我们调用 `last` 以返回迭代器中的最后一项。这是一个 `Option`，因为第一行可能是空字符串；例如，如果 `text` 以空行开头但在其他行上有字符，如 `"\nhi"`。然而，如果第一行上有最后一个字符，它将在 `Some` 变体中返回。中间的 `?` 运算符给了我们一种简洁的方式来表达此逻辑，允许我们用一行实现该函数。如果我们不能在 `Option` 上使用 `?` 运算符，我们将不得不使用更多方法调用或 `match` 表达式来实现此逻辑。

请注意，你可以在返回 `Result` 的函数中对 `Result` 使用 `?` 运算符，你可以在返回 `Option` 的函数中对 `Option` 使用 `?` 运算符，但你不能混合搭配。`?` 运算符不会自动将 `Result` 转换为 `Option` 或反之；在这些情况下，你可以使用像 `Result` 上的 `ok` 方法或 `Option` 上的 `ok_or` 方法之类的方法来显式进行转换。

到目前为止，我们使用的所有 `main` 函数都返回 `()`。`main` 函数是特殊的，因为它是可执行程序的入口点和出口点，对其返回类型可以是什么以使程序按预期行为有限制。

幸运的是，`main` 也可以返回 `Result<(), E>`。代码示例 9-12 有来自代码示例 9-10 的代码，但我们已将 `main` 的返回类型更改为 `Result<(), Box<dyn Error>>` 并在末尾添加了返回值 `Ok(())`。此代码现在将编译。

**代码示例 9-12**：将 `main` 改为返回 `Result<(), E>` 允许在 `Result` 值上使用 `?` 运算符

```rust
use std::error::Error;
use std::fs::File;

fn main() -> Result<(), Box<dyn Error>> {
    let greeting_file = File::open("hello.txt")?;

    Ok(())
}
```

`Box<dyn Error>` 类型是一个 trait 对象，我们将在第 18 章的[使用 Trait 对象抽象共享行为][trait-objects]中讨论。现在，你可以将 `Box<dyn Error>` 理解为"任何类型的错误"。在返回错误类型为 `Box<dyn Error>` 的 `main` 函数中对 `Result` 值使用 `?` 是允许的，因为它允许任何 `Err` 值提前返回。即使此 `main` 函数的主体只会返回 `std::io::Error` 类型的错误，通过指定 `Box<dyn Error>`，即使向 `main` 的主体添加了返回其他错误的更多代码，此签名也将保持正确。

当 `main` 函数返回 `Result<(), E>` 时，如果 `main` 返回 `Ok(())`，可执行文件将以值 `0` 退出，如果 `main` 返回 `Err` 值，则以非零值退出。用 C 编写的可执行文件在退出时返回整数：成功退出的程序返回整数 `0`，错误的程序返回 `0` 以外的某个整数。Rust 也从可执行文件返回整数，以与此约定兼容。

`main` 函数可以返回实现 `std::process::Termination` trait 的任何类型，其中包含一个返回 `ExitCode` 的函数 `report`。请查阅标准库文档，了解有关为自己的类型实现 `Termination` trait 的更多信息。

现在我们已经讨论了调用 `panic!` 或返回 `Result` 的细节，让我们回到如何在不同情况下决定哪个是适当的话题。

[handle_failure]: /rust-book/ch02-00-guessing-game-tutorial#使用-result-处理潜在失败
[trait-objects]: /rust-book/ch18-02-trait-objects#使用-trait-对象抽象共享行为
