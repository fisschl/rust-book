---
title: 使用发布配置自定义构建
---

在 Rust 中，_发布配置_是预定义的、可自定义的配置，具有不同的配置，允许程序员对编译代码的各种选项有更多控制。每个配置都独立于其他配置进行配置。

Cargo 有两个主要配置：当你运行 `cargo build` 时 Cargo 使用的 `dev` 配置，以及当你运行 `cargo build --release` 时 Cargo 使用的 `release` 配置。`dev` 配置为开发定义了良好的默认值，而 `release` 配置为发布构建定义了良好的默认值。

这些配置名称可能从你的构建输出中就很熟悉：

```console
$ cargo build
    Finished `dev` profile [unoptimized + debuginfo] target(s) in 0.00s
$ cargo build --release
    Finished `release` profile [optimized] target(s) in 0.32s
```

`dev` 和 `release` 是编译器使用的不同配置。

Cargo 为每个配置都有默认设置，当你没有在项目的 _Cargo.toml_ 文件中明确添加任何 `[profile.*]` 部分时，这些默认设置就会应用。通过为你想要自定义的任何配置添加 `[profile.*]` 部分，你可以覆盖任何默认设置的子集。例如，以下是 `dev` 和 `release` 配置的 `opt-level` 设置的默认值：

**文件名：Cargo.toml**

```toml
[profile.dev]
opt-level = 0

[profile.release]
opt-level = 3
```

`opt-level` 设置控制 Rust 将对你的代码应用多少优化，范围从 0 到 3。应用更多的优化会延长编译时间，所以如果你正在开发并且经常编译你的代码，你会想要更少的优化，以便编译更快，即使结果代码运行较慢。因此，`dev` 的默认 `opt-level` 是 `0`。当你准备发布你的代码时，最好花更多的时间编译。你只在发布模式下编译一次，但你会运行编译后的程序很多次，所以发布模式用更长的编译时间来换取运行更快的代码。这就是为什么 `release` 配置的默认 `opt-level` 是 `3`。

你可以通过在 _Cargo.toml_ 中为默认设置添加不同的值来覆盖它。例如，如果我们想在开发配置中使用优化级别 1，我们可以在项目的 _Cargo.toml_ 文件中添加这两行：

**文件名：Cargo.toml**

```toml
[profile.dev]
opt-level = 1
```

这段代码覆盖了 `0` 的默认设置。现在当我们运行 `cargo build` 时，Cargo 将使用 `dev` 配置的默认值加上我们对 `opt-level` 的自定义。因为我们把 `opt-level` 设置为 `1`，Cargo 将应用比默认更多的优化，但不如发布构建那么多。

有关每个配置的完整配置选项和默认值的列表，请参阅 [Cargo 的文档](https://doc.rust-lang.org/cargo/reference/profiles.html)。
