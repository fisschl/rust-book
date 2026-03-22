---
title: 8.3. 在 Hash Map 中存储键与关联值
---

我们常见的集合中最后一个是 hash map。类型 `HashMap<K, V>` 使用 _哈希函数_ 存储键类型 `K` 到值类型 `V` 的映射，该函数确定如何将这些键和值放入内存。许多编程语言支持这种数据结构，但它们通常使用不同的名称，例如 _hash_ 、 _map_ 、 _object_ 、 _hash table_ 、 _dictionary_  或  _associative array_ ，仅举几例。

当你想不使用索引查找数据时，hash map 很有用，就像你可以用 vector 那样，而是使用可以是任何类型的键。例如，在游戏中，你可以在 hash map 中跟踪每个团队的分数，其中每个键是团队名称，值是每个团队的分数。给定团队名称，你可以检索其分数。

我们将在本节中介绍 hash map 的基本 API，但标准库在 `HashMap<K, V>` 上定义的函数中隐藏着更多好东西。与往常一样，查看标准库文档以获取更多信息。

## 创建新的 Hash Map

创建空 hash map 的一种方法是使用 `new` 并使用 `insert` 添加元素。在代码示例 8-20 中，我们正在跟踪两个团队的分数，它们的名称是 _Blue_ 和 _Yellow_。Blue 队以 10 分开始，Yellow 队以 50 分开始。

**代码示例 8-20：创建一个新的 hash map 并插入一些键和值**

```rust
use std::collections::HashMap;

let mut scores = HashMap::new();

scores.insert(String::from("Blue"), 10);
scores.insert(String::from("Yellow"), 50);
```

请注意，我们需要首先从标准库的集合部分 `use` `HashMap`。在我们的三个常见集合中，这个最不常用，所以它不包含在预导入中自动引入作用域的功能里。Hash map 也从标准库获得较少的支持；例如，没有内置宏来构造它们。

与 vector 一样，hash map 将其数据存储在堆上。这个 `HashMap` 有 `String` 类型的键和 `i32` 类型的值。像 vector 一样，hash map 是同质的：所有键必须具有相同的类型，所有值必须具有相同的类型。

## 访问 Hash Map 中的值

我们可以通过向 `get` 方法提供其键来从 hash map 中获取值，如代码示例 8-21 所示。

**代码示例 8-21：访问存储在 hash map 中的 Blue 队的分数**

```rust
use std::collections::HashMap;

let mut scores = HashMap::new();

scores.insert(String::from("Blue"), 10);
scores.insert(String::from("Yellow"), 50);

let team_name = String::from("Blue");
let score = scores.get(&team_name).copied().unwrap_or(0);
```

这里，`score` 将具有与 Blue 队关联的值，结果将是 `10`。`get` 方法返回一个 `Option<&V>`；如果 hash map 中没有该键的值，`get` 将返回 `None`。这个程序通过调用 `copied` 来获取 `Option<i32>` 而不是 `Option<&i32>`，然后使用 `unwrap_or` 在 `scores` 没有该键的条目时将 `score` 设置为零。

我们可以使用 `for` 循环以类似于我们对 vector 的方式遍历 hash map 中的每个键值对：

```rust
use std::collections::HashMap;

let mut scores = HashMap::new();

scores.insert(String::from("Blue"), 10);
scores.insert(String::from("Yellow"), 50);

for (key, value) in &scores {
    println!("{key}: {value}");
}
```

这段代码将以任意顺序打印每对：

```text
Yellow: 50
Blue: 10
```

## 管理 Hash Map 中的所有权

对于实现了 `Copy` trait 的类型，如 `i32`，值被复制到 hash map 中。对于拥有的值如 `String`，值将被移动，hash map 将成为这些值的所有者，如代码示例 8-22 所示。

**代码示例 8-22：展示键和值在插入后由 hash map 拥有**

```rust
use std::collections::HashMap;

let field_name = String::from("Favorite color");
let field_value = String::from("Blue");

let mut map = HashMap::new();
map.insert(field_name, field_value);
// field_name 和 field_value 在此处无效，尝试使用它们看看会得到什么编译器错误！
```

在通过调用 `insert` 将它们移入 hash map 后，我们无法使用变量 `field_name` 和 `field_value`。

如果我们将对值的引用插入到 hash map 中，值不会被移入 hash map。引用指向的值必须在 hash map 有效的整个期间内保持有效。我们将在第 10 章的[用生命周期验证引用][validating-references-with-lifetimes]中更多地讨论这些问题。

## 更新 Hash Map

虽然键值对的数量是可增长的，但每个唯一键一次只能有一个值与之关联（但反之则不然：例如，Blue 队和 Yellow 队都可以在 `scores` hash map 中存储值 `10`）。

当你想更改 hash map 中的数据时，你必须决定如何处理键已经有值分配的情况。你可以用新值替换旧值，完全忽略旧值。你可以保留旧值并忽略新值，只有当键 _还没有_ 值时才添加新值。或者你可以组合旧值和新值。让我们看看如何做这些！

### 覆盖值

如果我们将一个键和一个值插入到 hash map 中，然后用不同的值插入相同的键，与该键关联的值将被替换。尽管代码示例 8-23 中的代码调用了两次 `insert`，hash map 将只包含一个键值对，因为我们两次都是为 Blue 队的键插入值。

**代码示例 8-23：替换存储在特定键处的值**

```rust
use std::collections::HashMap;

let mut scores = HashMap::new();

scores.insert(String::from("Blue"), 10);
scores.insert(String::from("Blue"), 25);

println!("{scores:?}");
```

这段代码将打印 `{"Blue": 25}`。原来的值 `10` 已被覆盖。

### 仅在键没有值时添加键和值

通常需要检查特定键是否已经在 hash map 中有值，然后采取以下操作：如果键确实存在于 hash map 中，现有值应保持不变；如果键不存在，则插入它和它的值。

Hash map 为此提供了一个特殊的 API，称为 `entry`，它接受你想要检查的键作为参数。`entry` 方法的返回值是一个名为 `Entry` 的枚举，表示可能存在也可能不存在的值。假设我们想检查 Yellow 队的键是否有关联的值。如果没有，我们想插入值 `50`，Blue 队也一样。使用 `entry` API，代码如代码示例 8-24 所示。

**代码示例 8-24：使用 `entry` 方法仅在键还没有值时插入**

```rust
use std::collections::HashMap;

let mut scores = HashMap::new();
scores.insert(String::from("Blue"), 10);

scores.entry(String::from("Yellow")).or_insert(50);
scores.entry(String::from("Blue")).or_insert(50);

println!("{scores:?}");
```

`Entry` 上的 `or_insert` 方法被定义为：如果该键存在，则返回对应 `Entry` 键的值的可变引用；如果不存在，则将参数作为此键的新值插入，并返回新值的可变引用。这种技术比自己编写逻辑要干净得多，而且另外，与借用检查器配合得更好。

运行代码示例 8-24 中的代码将打印 `{"Yellow": 50, "Blue": 10}`。第一次调用 `entry` 将插入 Yellow 队的键，值为 `50`，因为 Yellow 队还没有值。第二次调用 `entry` 不会更改 hash map，因为 Blue 队已经有值 `10`。

### 基于旧值更新值

Hash map 的另一个常见用例是查找键的值，然后根据旧值更新它。例如，代码示例 8-25 展示了计算每个单词在某些文本中出现次数的代码。我们使用以单词为键的 hash map，并递增该值以跟踪我们看到该单词的次数。如果这是我们第一次看到某个单词，我们首先插入值 `0`。

**代码示例 8-25：使用存储单词和计数的 hash map 计算单词出现次数**

```rust
use std::collections::HashMap;

let text = "hello world wonderful world";

let mut map = HashMap::new();

for word in text.split_whitespace() {
    let count = map.entry(word).or_insert(0);
    *count += 1;
}

println!("{map:?}");
```

这段代码将打印 `{"world": 2, "hello": 1, "wonderful": 1}`。你可能会看到键值对以不同的顺序打印：从[访问 Hash Map 中的值](#访问-hash-map-中的值)中回想，遍历 hash map 以任意顺序进行。

`split_whitespace` 方法返回一个迭代器，该迭代器遍历 `text` 中的值按空白分隔的子切片。`or_insert` 方法返回对指定键的值的可变引用（`&mut V`）。这里，我们将该可变引用存储在 `count` 变量中，因此为了赋值给该值，我们必须首先使用星号（`*`）解引用 `count`。可变引用在 `for` 循环结束时超出作用域，所以所有这些更改都是安全的，并且被借用规则允许。

## 哈希函数

默认情况下，`HashMap` 使用一种名为 _SipHash_ 的哈希函数，可以提供对涉及哈希表的拒绝服务（DoS）攻击的抵抗力。这不是最快的哈希算法，但为了更好的安全性而牺牲性能是值得的。如果你分析你的代码并发现默认的哈希函数对你的目的来说太慢，你可以通过指定不同的哈希器来切换到另一个函数。_哈希器_是一种实现 `BuildHasher` trait 的类型。我们将在第 10 章讨论 trait 以及如何实现它们。你不一定必须从头开始实现自己的哈希器；[crates.io](https://crates.io/)上有其他 Rust 用户共享的库，提供了实现许多常见哈希算法的哈希器。

## 总结

Vector、string 和 hash map 将在你需要存储、访问和修改数据时为程序提供大量必要的功能。以下是你现在应该有能力解决的一些练习：

1. 给定一个整数列表，使用 vector 并返回列表的中位数（排序后，中间位置的值）和众数（出现频率最高的值；hash map 在这里会有帮助）。

2. 将字符串转换为 Pig Latin。每个单词的第一个辅音被移到单词末尾并添加 _ay_，所以 _first_ 变成 _irst-fay_。以元音开头的单词改为在末尾添加 _hay_（_apple_ 变成 _apple-hay_）。记住关于 UTF-8 编码的细节！

3. 使用 hash map 和 vector，创建一个文本界面，允许用户向公司部门添加员工姓名；例如，"Add Sally to Engineering" 或 "Add Amir to Sales"。然后让用户按部门检索部门中所有人的列表或公司中所有人的列表，按字母顺序排序。

标准库 API 文档描述了 vector、string 和 hash map 拥有的方法，这些方法对这些练习很有帮助！

我们正在进入操作可能失败的更复杂的程序，所以是时候讨论错误处理了。接下来我们就来讨论！

[validating-references-with-lifetimes]: /rust-book/ch10-03-lifetime-syntax#用生命周期验证引用
