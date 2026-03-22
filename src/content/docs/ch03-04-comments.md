---
title: 3.4. 注释
---

所有程序员都努力使他们的代码易于理解，但有时需要额外的解释。在这些情况下，程序员会在源代码中留下*注释*，编译器会忽略这些注释，但阅读源代码的人可能会发现它们有用。

这是一个简单的注释：

```rust
// hello, world
```

在 Rust 中，惯用的注释风格是用两个斜杠开始注释，注释持续到行尾。对于扩展到单行之外的注释，你需要在每行包含 `//`，如下所示：

```rust
// So we're doing something complicated here, long enough that we need
// multiple lines of comments to do it! Whew! Hopefully, this comment will
// explain what's going on.
```

注释也可以放在包含代码的行末：

*文件名：src/main.rs*

```rust
fn main() {
    let lucky_number = 7; // I'm feeling lucky today
}
```

但你更常看到它们以这种格式使用，注释在它注释的代码的上方单独一行：

*文件名：src/main.rs*

```rust
fn main() {
    // I'm feeling lucky today
    let lucky_number = 7;
}
```

Rust 还有另一种注释，文档注释，我们将在第14章的["将 Crate 发布到 Crates.io"][publishing]部分讨论。

[publishing]: https://doc.rust-lang.org/book/ch14-02-publishing-to-crates-io.html
