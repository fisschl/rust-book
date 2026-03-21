---
title: 使用 panic! 处理不可恢复的错误
---

有时候代码中会发生坏事，而你对此无能为力。在这些情况下，Rust 有 `panic!` 宏。实际上有两种方式可以引起 panic：通过采取导致代码 panic 的操作（例如访问数组末尾之外的内容）或通过显式调用 `panic!` 宏。在两种情况下，我们都会在程序中引起 panic。默认情况下，这些 panic 将打印失败消息、展开、清理堆栈并退出。通过环境变量，你还可以让 Rust 在 panic 发生时显示调用堆栈，以便更容易追踪 panic 的来源。

> ### 响应 Panic 时展开堆栈或中止
>
> 默认情况下，当 panic 发生时，程序开始 _展开_ ，这意味着 Rust 沿着堆栈回溯并清理它遇到的每个函数中的数据。然而，回溯和清理是大量的工作。因此，Rust 允许你选择另一种立即 _中止_ 的替代方案，这将结束程序而不清理。
>
> 程序正在使用的内存将需要由操作系统清理。如果在你的项目中你需要使生成的二进制文件尽可能小，你可以通过在 _Cargo.toml_ 文件的适当 `[profile]` 部分添加 `panic = 'abort'` 来从展开切换到在 panic 时中止。例如，如果你想在发布模式下 panic 时中止，添加以下内容：
>
> ```toml
> [profile.release]
> panic = 'abort'
> ```

让我们尝试在一个简单的程序中调用 `panic!`：

**src/main.rs**

```rust
fn main() {
    panic!("crash and burn");
}
```

当你运行程序时，你会看到类似这样的内容：

```console
$ cargo run
   Compiling panic v0.1.0 (file:///projects/panic)
    Finished `dev` profile [unoptimized + debuginfo] target(s) in 0.25s
     Running `target/debug/panic`

thread 'main' panicked at src/main.rs:2:5:
crash and burn
note: run with `RUST_BACKTRACE=1` environment variable to display a backtrace
```

对 `panic!` 的调用导致了最后两行中包含的错误消息。第一行显示了我们的 panic 消息以及 panic 在源代码中发生的位置：_src/main.rs:2:5_ 表示它位于我们 _src/main.rs_ 文件的第二行、第五字符。

在这种情况下，所指示的行是我们代码的一部分，如果我们前往该行，我们会看到 `panic!` 宏调用。在其他情况下，`panic!` 调用可能位于我们的代码调用的代码中，错误消息报告的文件名和行号将是其他人的代码中调用 `panic!` 宏的位置，而不是最终导致了 `panic!` 调用的我们的代码行。

我们可以使用 `panic!` 调用来自的函数的 backtrace 来确定代码中导致问题的部分。为了理解如何使用 `panic!` backtrace，让我们看另一个例子，看看当 `panic!` 调用来自库是因为我们代码中的 bug 而不是我们直接调用宏时的情况。代码示例 9-1 有一些代码尝试访问超出有效索引范围的 vector 中的索引。

**代码示例 9-1：尝试访问 vector 末尾之外的元素，这将导致调用 `panic!`**

```rust
fn main() {
    let v = vec![1, 2, 3];

    v[99];
}
```

在这里，我们尝试访问 vector 的第 100 个元素（位于索引 99，因为索引从零开始），但 vector 只有三个元素。在这种情况下，Rust 会 panic。使用 `[]` 应该返回一个元素，但如果你传递一个无效的索引，Rust 无法返回任何正确的元素。

在 C 中，尝试读取数据结构末尾之外的内容是未定义行为。你可能会得到内存中对应于数据结构中该元素位置的任何内容，即使该内存不属于该结构。这被称为 _缓冲区越界读取_ ，如果攻击者能够以某种方式操纵索引来读取他们不应该被允许读取的存储在数据结构之后的数据，则可能导致安全漏洞。

为了保护你的程序免受此类漏洞的影响，如果你尝试读取不存在的索引处的元素，Rust 将停止执行并拒绝继续。让我们尝试一下：

```console
$ cargo run
   Compiling panic v0.1.0 (file:///projects/panic)
    Finished `dev` profile [unoptimized + debuginfo] target(s) in 0.27s
     Running `target/debug/panic`

thread 'main' panicked at src/main.rs:4:6:
index out of bounds: the len is 3 but the index is 99
note: run with `RUST_BACKTRACE=1` environment variable to display a backtrace
```

这个错误指向我们 _main.rs_ 的第 4 行，我们在其中尝试访问 `v` 中索引 99 的 vector。

`note:` 行告诉我们，我们可以设置 `RUST_BACKTRACE` 环境变量来准确获取导致错误的 backtrace。_backtrace_ 是已调用的所有函数的列表，以到达这一点。Rust 中的 backtrace 与在其他语言中的工作方式相同：阅读 backtrace 的关键是从顶部开始阅读，直到看到您编写的文件。那就是问题起源的地方。该点以上的行是您的代码调用的代码；该点以下的行是调用您的代码的代码。这些前后的行可能包括核心 Rust 代码、标准库代码或您正在使用的 crate。让我们尝试通过将 `RUST_BACKTRACE` 环境变量设置为除 `0` 以外的任何值来获取 backtrace。代码示例 9-2 显示了类似于您将看到的输出。

**代码示例 9-2：当环境变量 `RUST_BACKTRACE` 设置时显示的由 `panic!` 调用生成的 backtrace**

```console
$ RUST_BACKTRACE=1 cargo run
thread 'main' panicked at src/main.rs:4:6:
index out of bounds: the len is 3 but the index is 99
stack backtrace:
   0: rust_begin_unwind
             at /rustc/4d91de4e48198da2e33413efdcd9cd2cc0c46688/library/std/src/panicking.rs:692:5
   1: core::panicking::panic_fmt
             at /rustc/4d91de4e48198da2e33413efdcd9cd2cc0c46688/library/core/src/panicking.rs:75:14
   2: core::panicking::panic_bounds_check
             at /rustc/4d91de4e48198da2e33413efdcd9cd2cc0c46688/library/core/src/panicking.rs:273:5
   3: <usize as core::slice::index::SliceIndex<[T]>>::index
             at file:///home/.rustup/toolchains/1.85/lib/rustlib/src/rust/library/core/src/slice/index.rs:274:10
   4: core::slice::index::<impl core::ops::index::Index<I> for [T]>::index
             at file:///home/.rustup/toolchains/1.85/lib/rustlib/src/rust/library/core/src/slice/index.rs:16:9
   5: <alloc::vec::Vec<T,A> as core::ops::index::Index<I>>::index
             at file:///home/.rustup/toolchains/1.85/lib/rustlib/src/rust/library/alloc/src/vec/mod.rs:3361:9
   6: panic::main
             at ./src/main.rs:4:6
   7: core::ops::function::FnOnce::call_once
             at file:///home/.rustup/toolchains/1.85/lib/rustlib/src/rust/library/core/src/ops/function.rs:250:5
note: Some details are omitted, run with `RUST_BACKTRACE=full` for a verbose backtrace.
```

那是很多输出！你看到的确切输出可能因操作系统和 Rust 版本而异。为了获取包含这些信息的 backtrace，必须启用调试符号。当使用 `cargo build` 或 `cargo run` 而不带 `--release` 标志时，调试符号默认启用，正如我们在这里所做的。

在代码示例 9-2 的输出中，backtrace 的第 6 行指向我们项目中导致问题的行：_src/main.rs_ 的第 4 行。如果我们不希望程序 panic，我们应该从第一条提及我们编写的文件的行所指向的位置开始调查。在代码示例 9-1 中，我们故意编写了会导致 panic 的代码，修复 panic 的方法是不要请求超出 vector 索引范围的元素。当你的代码将来 panic 时，你需要弄清楚代码正在采取什么操作以及使用什么值导致了 panic，以及代码应该做什么来代替。

我们将在本章后面的[panic! 还是不 panic!][to-panic-or-not-to-panic]部分回到 `panic!` 以及何时应该和不应该使用 `panic!` 来处理错误条件。接下来，我们将看看如何使用 `Result` 从错误中恢复。

[to-panic-or-not-to-panic]: /rust-book/ch09-03-to-panic-or-not-to-panic
