---
title: 使用 `cargo install` 安装二进制文件
sidebar:
  label: 使用 cargo install 安装二进制文件
---

`cargo install` 命令允许你在本地安装和使用二进制 crate。这不是为了取代系统包；它是 Rust 开发人员安装其他人在 [crates.io](https://crates.io/) 上分享的工具的一种便捷方式。注意，你只能安装具有二进制目标的包。 _二进制目标_ 是如果 crate 有 _src/main.rs_ 文件或另一个文件指定为二进制文件时创建的可运行程序，而不是不能单独运行但适合包含在其他程序中的库目标。通常，crate 在 README 文件中有关于 crate 是库、有二进制目标还是两者的信息。

所有用 `cargo install` 安装的二进制文件都存储在安装根目录的 _bin_ 文件夹中。如果你使用 _rustup.rs_ 安装了 Rust 且没有任何自定义配置，这个目录将是 *$HOME/.cargo/bin*。确保这个目录在你的 `$PATH` 中，以便能够运行你用 `cargo install` 安装的程序。

例如，在第12章中我们提到，有一个名为 `ripgrep` 的 Rust 实现的 `grep` 工具用于搜索文件。要安装 `ripgrep`，我们可以运行以下命令：

```console
$ cargo install ripgrep
    Updating crates.io index
  Downloaded ripgrep v14.1.1
  Downloaded 1 crate (213.6 KB) in 0.40s
  Installing ripgrep v14.1.1
--snip--
   Compiling grep v0.3.2
    Finished `release` profile [optimized + debuginfo] target(s) in 6.73s
  Installing ~/.cargo/bin/rg
   Installed package `ripgrep v14.1.1` (executable `rg`)
```

输出的倒数第二行显示了安装的二进制文件的位置和名称，在 `ripgrep` 的情况下是 `rg`。只要安装目录在你的 `$PATH` 中，如前所述，你就可以运行 `rg --help` 并开始使用一个更快、更 Rust 的文件搜索工具！
