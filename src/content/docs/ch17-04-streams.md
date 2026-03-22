---
title: 17.4. Streams：按序列排列的 Futures
---

回想一下我们在本章早些时候在[消息传递部分][ch17-02-messages]如何使用异步通道的接收者。异步 `recv` 方法随着时间的推移产生一系列项目。这是被称为 *stream* 的更普遍模式的一个实例。许多概念自然地表示为 streams：队列中可用的项目、当完整数据集太大而无法放入计算机内存时从文件系统增量拉取的数据块，或者随着时间的推移通过网络到达的数据。因为 streams 是 futures，我们可以将它们与任何其他类型的 future 一起使用，并以有趣的方式组合它们。例如，我们可以批量处理事件以避免触发太多网络调用，为长时间运行的操作序列设置超时，或者限制用户界面事件以避免做不必要的工作。

我们在第13章[Iterator Trait 和 `next` 方法部分][ch13-02]看到了一系列项目，但迭代器和异步通道接收者之间有两个区别。第一个区别是时间：迭代器是同步的，而通道接收者是异步的。第二个区别是 API。直接使用 `Iterator` 时，我们调用它的同步 `next` 方法。对于特定的 `trpl::Receiver` stream，我们改为调用异步的 `recv` 方法。除此之外，这些 API 感觉非常相似，而且这种相似性并非巧合。stream 就像是迭代器的异步形式。而 `trpl::Receiver` 专门等待接收消息，通用 stream API 更广泛：它以 `Iterator` 的方式提供下一个项目，但是是异步的。

Rust 中迭代器和 streams 之间的相似性意味着我们实际上可以从任何迭代器创建一个 stream。与迭代器一样，我们可以通过调用它的 `next` 方法然后等待输出来处理 stream，如清单 17-21 所示，这还不能编译。

**清单 17-21**：从迭代器创建 stream 并打印其值

```rust
use trpl::StreamExt;

fn main() {
    trpl::block_on(async {
        let values = [1, 2, 3, 4, 5];
        let stream = trpl::stream_from_iter(values);
        
        while let Some(value) = stream.next().await {
            println!("{}", value);
        }
    });
}
```

我们从一个数字数组开始，然后使用 `trpl::stream_from_iter` 函数将其转换为 stream。接下来，我们使用 `while let` 循环遍历 stream 中的项目，当它们到达时。

不幸的是，当我们尝试运行代码时，它不能编译，而是报告没有 `next` 方法可用：

```text
error[E0599]: no method named `next` found for struct `tokio_stream::iter::Iter` in the current scope
  --> src/main.rs:10:40
   |
10 |         while let Some(value) = stream.next().await {
   |                                        ^^^^
   |
   = help: items from traits can only be used if the trait is in scope
help: the following traits which provide `next` are implemented but not in scope; perhaps you want to import one of them
   |
1  + use crate::trpl::StreamExt;
   |
1  + use futures_util::stream::stream::StreamExt;
   |
1  + use std::iter::Iterator;
   |
1  + use std::str::pattern::Searcher;
   |
help: there is a method `try_next` with a similar name
   |
10 |         while let Some(value) = stream.try_next().await {
   |                                        ~~~~~~~~
```

正如这个输出所解释的，编译器错误的原因是我们需要正确的 trait 在作用域内才能使用 `next` 方法。鉴于我们到目前为止的讨论，你可能会合理地期望那个 trait 是 `Stream`，但它实际上是 `StreamExt`。`Ext` 是 *extension* 的缩写，是 Rust 社区中扩展一个 trait 与另一个 trait 的常见模式。

`Stream` trait 定义了一个低级接口，有效地结合了 `Iterator` 和 `Future` trait。`StreamExt` 在 `Stream` 之上提供了一组更高级的 API，包括 `next` 方法以及类似于 `Iterator` trait 提供的其他实用方法。`Stream` 和 `StreamExt` 还不是 Rust 标准库的一部分，但大多数生态系统 crate 使用类似的定义。

修复编译器错误的方法是添加一个 `use` 语句来导入 `trpl::StreamExt`，如清单 17-22 所示。

**清单 17-22**：成功地将迭代器作为 stream 的基础使用

```rust
use trpl::StreamExt;

fn main() {
    trpl::block_on(async {
        let values = [1, 2, 3, 4, 5];
        let stream = trpl::stream_from_iter(values);
        
        while let Some(value) = stream.next().await {
            println!("{}", value);
        }
    });
}
```

将所有这些部分放在一起，这段代码按我们想要的方式工作！而且，现在我们有了 `StreamExt` 在作用域内，我们可以像使用迭代器一样使用它的所有实用方法。

[ch17-02-messages]: /rust-book/ch17-02-concurrency-with-async
[ch13-02]: /rust-book/ch13-02-iterators
