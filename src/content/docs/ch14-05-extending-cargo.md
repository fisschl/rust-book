---
title: 14.5. 使用自定义命令扩展 Cargo
---

Cargo 的设计允许你在不修改它的情况下用新的子命令扩展它。如果你的 `$PATH` 中有一个名为 `cargo-something` 的二进制文件，你可以通过运行 `cargo something` 来运行它，就像它是 Cargo 子命令一样。像这样的自定义命令也会在你运行 `cargo --list` 时列出。能够使用 `cargo install` 安装扩展，然后像内置的 Cargo 工具一样运行它们，是 Cargo 设计的一个超级方便的好处！

## 总结

与 Cargo 和 [crates.io](https://crates.io/) 分享代码是使 Rust 生态系统对许多不同任务有用的部分原因。Rust 的标准库小而稳定，但 crate 很容易分享、使用和在不同的时间线上改进。不要羞于在 [crates.io](https://crates.io/) 上分享对你有用的代码；它很可能对其他人也有用！
