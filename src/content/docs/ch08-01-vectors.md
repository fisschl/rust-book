---
title: 使用 Vector 存储值的列表
---

我们将要查看的第一个集合类型是 `Vec<T>`，也称为 vector。Vector 允许你在单个数据结构中存储多个值，该结构将所有值在内存中相邻放置。Vector 只能存储相同类型的值。当你有一个项目列表时，它们非常有用，例如文件中的文本行或购物车中物品的价格。

## 创建新的 Vector

要创建一个新的空 vector，我们调用 `Vec::new` 函数，如代码示例 8-1 所示。

**代码示例 8-1：创建一个新的空 vector 来保存 `i32` 类型的值**

```rust
let v: Vec<i32> = Vec::new();
```

请注意，我们在这里添加了类型注解。因为我们没有向这个 vector 插入任何值，Rust 不知道我们打算存储什么类型的元素。这是一个重要的点。Vector 是使用泛型实现的；我们将在第 10 章介绍如何在你自己的类型中使用泛型。现在，要知道标准库提供的 `Vec<T>` 类型可以保存任何类型。当我们创建一个 vector 来保存特定类型时，我们可以在尖括号中指定该类型。在代码示例 8-1 中，我们告诉 Rust `v` 中的 `Vec<T>` 将保存 `i32` 类型的元素。

更常见的情况是，你会使用初始值创建 `Vec<T>`，Rust 会推断你想要存储的值的类型，所以你很少需要做这个类型注解。Rust 方便地提供了 `vec!` 宏，它将创建一个保存你给定值的新 vector。代码示例 8-2 创建了一个保存值 `1`、`2` 和 `3` 的新 `Vec<i32>`。整数类型是 `i32`，因为这是默认的整数类型，正如我们在第 3 章的[数据类型][data-types]部分讨论的那样。

**代码示例 8-2：创建包含值的新 vector**

```rust
let v = vec![1, 2, 3];
```

因为我们给了初始的 `i32` 值，Rust 可以推断 `v` 的类型是 `Vec<i32>`，所以不需要类型注解。接下来，我们将看看如何修改 vector。

## 更新 Vector

要创建一个 vector 然后向其中添加元素，我们可以使用 `push` 方法，如代码示例 8-3 所示。

**代码示例 8-3：使用 `push` 方法向 vector 添加值**

```rust
let mut v = Vec::new();

v.push(5);
v.push(6);
v.push(7);
v.push(8);
```

与任何变量一样，如果我们希望能够更改其值，我们需要使用 `mut` 关键字使其可变，如第 3 章所述。我们放在里面的数字都是 `i32` 类型，Rust 从数据中推断出这一点，所以我们不需要 `Vec<i32>` 注解。

## 读取 Vector 的元素

有两种方式可以引用存储在 vector 中的值：通过索引或使用 `get` 方法。在以下示例中，为了更加清晰，我们标注了从这些函数返回的值的类型。

代码示例 8-4 展示了访问 vector 中值的两种方法，使用索引语法和 `get` 方法。

**代码示例 8-4：使用索引语法和使用 `get` 方法访问 vector 中的项**

```rust
let v = vec![1, 2, 3, 4, 5];

let third: &i32 = &v[2];
println!("第三个元素是 {third}");

let third: Option<&i32> = v.get(2);
match third {
    Some(third) => println!("第三个元素是 {third}"),
    None => println!("没有第三个元素。"),
}
```

请注意一些细节。我们使用索引值 `2` 来获取第三个元素，因为 vector 是按数字索引的，从零开始。使用 `&` 和 `[]` 可以给我们一个指向该索引值处元素的引用。当我们使用 `get` 方法并将索引作为参数传递时，我们得到一个可以与 `match` 一起使用的 `Option<&T>`。

Rust 提供这两种引用元素的方式，以便你可以选择当尝试使用超出现有元素范围的索引值时程序的行为。例如，假设我们有一个包含五个元素的 vector，然后我们尝试使用每种技术访问索引 100 处的元素，如代码示例 8-5 所示。

**代码示例 8-5：尝试访问包含五个元素的 vector 中索引 100 处的元素**

```rust
let v = vec![1, 2, 3, 4, 5];

let does_not_exist = &v[100];
let does_not_exist = v.get(100);
```

当我们运行此代码时，第一个 `[]` 方法将导致程序 panic，因为它引用了一个不存在的元素。当你希望如果有尝试访问 vector 末尾之外的元素时程序崩溃，最好使用这种方法。

当 `get` 方法被传递一个在 vector 之外的索引时，它会返回 `None` 而不会 panic。如果在正常情况下偶尔可能会发生访问超出 vector 范围的元素的情况，你会使用这种方法。然后你的代码将有逻辑来处理拥有 `Some(&element)` 或 `None` 的情况，如第 6 章所述。例如，索引可能来自一个人输入的数字。如果他们不小心输入了太大的数字，程序得到 `None` 值，你可以告诉用户当前 vector 中有多少项，并给他们另一次输入有效值的机会。那会比由于打字错误而导致程序崩溃更友好！

当程序有一个有效引用时，借用检查器会强制执行所有权和借用规则（在第 4 章中介绍），以确保这个引用和对 vector 内容的任何其他引用保持有效。回想一下规定你不能在同一作用域中同时拥有可变和不可变引用的规则。该规则适用于代码示例 8-6，在那里我们持有一个对 vector 中第一个元素的不可变引用，并尝试在末尾添加一个元素。如果我们还尝试在函数后面引用该元素，这个程序将不起作用。

**代码示例 8-6：在持有对某项的引用时尝试向 vector 添加元素**

```rust
let mut v = vec![1, 2, 3, 4, 5];

let first = &v[0];

v.push(6);

println!("第一个元素是：{first}");
```

编译此代码将导致以下错误：

```console
$ cargo run
   Compiling collections v0.1.0 (file:///projects/collections)
error[E0502]: cannot borrow `v` as mutable because it is also borrowed as immutable
 --> src/main.rs:6:5
  |
4 |     let first = &v[0];
  |                  - immutable borrow occurs here
  |
6 |     v.push(6);
  |     ^^^^^^^^^ mutable borrow occurs here
  |
8 |     println!("The first element is: {first}");
  |                                      ----- immutable borrow later used here

For more information about this error, try `rustc --explain E0502`.
error: could not compile `collections` (bin "collections") due to 1 previous error
```

代码示例 8-6 中的代码可能看起来应该可以工作：为什么对第一个元素的引用会关心 vector 末尾的变化呢？这个错误是由于 vector 的工作方式造成的：因为 vector 将值在内存中相邻放置，在 vector 末尾添加新元素可能需要分配新内存并将旧元素复制到新空间，如果当前存储 vector 的位置没有足够的空间将所有元素相邻放置的话。在这种情况下，对第一个元素的引用将指向已释放的内存。借用规则防止程序陷入这种情况。

> 注意：有关 `Vec<T>` 类型的实现细节的更多信息，请参阅[The Rustonomicon][nomicon]。

## 遍历 Vector 中的值

要依次访问 vector 中的每个元素，我们应该遍历所有元素，而不是使用索引一次访问一个。代码示例 8-7 展示了如何使用 `for` 循环来获取对 `i32` 值 vector 中每个元素的不可变引用并打印它们。

**代码示例 8-7：使用 `for` 循环遍历元素来打印 vector 中的每个元素**

```rust
let v = vec![100, 32, 57];
for i in &v {
    println!("{i}");
}
```

我们还可以遍历对可变 vector 中每个元素的可变引用，以便对所有元素进行更改。代码示例 8-8 中的 `for` 循环将向每个元素添加 `50`。

**代码示例 8-8：遍历对 vector 中元素的可变引用**

```rust
let mut v = vec![100, 32, 57];
for i in &mut v {
    *i += 50;
}
```

要更改可变引用所指向的值，我们必须使用 `*` 解引用运算符来获取 `i` 中的值，然后才能使用 `+=` 运算符。我们将在第 15 章的[跟随引用到值][deref]部分更详细地讨论解引用运算符。

遍历 vector，无论是不可变还是可变，都是安全的，因为借用检查器的规则。如果我们尝试在代码示例 8-7 和代码示例 8-8 的 `for` 循环体中插入或删除项，我们会得到一个与代码示例 8-6 中类似的编译器错误。`for` 循环持有的对 vector 的引用阻止了对整个 vector 的同时修改。

## 使用枚举存储多种类型

Vector 只能存储相同类型的值。这可能不方便；肯定有需要在列表中存储不同类型项目的情况。幸运的是，枚举的变体是在相同的枚举类型下定义的，所以当我们需要一种类型来表示不同类型的元素时，我们可以定义并使用一个枚举！

例如，假设我们想从电子表格中的一行获取值，其中行中的某些列包含整数，一些包含浮点数，还有一些包含字符串。我们可以定义一个枚举，其变体将保存不同的值类型，所有枚举变体将被视为相同的类型：即该枚举的类型。然后，我们可以创建一个 vector 来保存该枚举，从而最终保存不同的类型。我们在代码示例 8-9 中演示了这一点。

**代码示例 8-9：定义一个枚举以在一个 vector 中存储不同类型的值**

```rust
enum SpreadsheetCell {
    Int(i32),
    Float(f64),
    Text(String),
}

let row = vec![
    SpreadsheetCell::Int(3),
    SpreadsheetCell::Text(String::from("blue")),
    SpreadsheetCell::Float(10.12),
];
```

Rust 需要在编译时知道 vector 中将有哪些类型，以便它确切知道需要多少堆内存来存储每个元素。我们还必须明确允许此 vector 中的类型。如果 Rust 允许 vector 保存任何类型，那么一种或多种类型可能会导致对 vector 元素执行的操作出错。使用枚举加上 `match` 表达式意味着 Rust 将在编译时确保每个可能的情况都被处理，如第 6 章所述。

如果你不知道程序在运行时将获得用于存储在 vector 中的穷尽类型集合，枚举技术将不起作用。相反，你可以使用 trait 对象，我们将在第 18 章介绍。

现在我们已经讨论了一些使用 vector 的最常见方式，请务必查看 [`Vec<T>` 的 API 文档][vec-api]以了解标准库定义的许多有用的方法。例如，除了 `push`，`pop` 方法会移除并返回最后一个元素。

## 丢弃 Vector 会丢弃其元素

与任何其他 `struct` 一样，vector 在超出作用域时会被释放，如代码示例 8-10 所示。

**代码示例 8-10：显示 vector 及其元素被丢弃的位置**

```rust
{
    let v = vec![1, 2, 3, 4];

    // 使用 v 做一些事情
} // <- v 在这里超出作用域并被释放
```

当 vector 被丢弃时，其所有内容也会被丢弃，这意味着它持有的整数将被清理。借用检查器确保对 vector 内容的任何引用仅在 vector 本身有效时使用。

让我们继续下一个集合类型：`String`！

[data-types]: /rust-book/ch03-02-data-types#数据类型
[nomicon]: https://doc.rust-lang.org/nomicon/vec/vec.html
[vec-api]: https://doc.rust-lang.org/std/vec/struct.Vec.html
[deref]: /rust-book/ch15-02-deref#跟随指针到值通过解引用运算符
