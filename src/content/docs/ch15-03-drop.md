---
title: 15.3. 使用 Drop Trait 在清理时运行代码
---

对智能指针模式很重要的第二个 trait 是 `Drop`，它允许你自定义当值即将超出作用域时会发生什么。你可以为任何类型提供 `Drop` trait 的实现，该代码可用于释放文件或网络连接等资源。

我们在智能指针的上下文中介绍 `Drop`，因为 `Drop` trait 的功能几乎总是在实现智能指针时使用。例如，当 `Box<T>` 被释放时，它将释放 box 指向的堆上的空间。

在某些语言中，对于某些类型，程序员必须在使用完这些类型的实例后每次调用代码来释放内存或资源。示例包括文件句柄、套接字和锁。如果程序员忘记了，系统可能会超载并崩溃。在 Rust 中，你可以指定每当值超出作用域时运行特定代码，编译器将自动插入此代码。因此，你不必小心在程序中使用特定类型实例完成的每个地方放置清理代码——你仍然不会泄漏资源！

你通过实现 `Drop` trait 来指定当值超出作用域时要运行的代码。`Drop` trait 要求你实现一个名为 `drop` 的方法，该方法接受对 `self` 的可变引用。要查看 Rust 何时调用 `drop`，让我们现在用 `println!` 语句实现 `drop`。

清单 15-14 显示了一个 `CustomSmartPointer` 结构体，其唯一的自定义功能是当实例超出作用域时它将打印 `Dropping CustomSmartPointer!`，以显示 Rust 何时运行 `drop` 方法。

**代码示例 15-14**：实现 `Drop` trait 的 `CustomSmartPointer` 结构体，我们将在其中放置清理代码

```rust
struct CustomSmartPointer {
    data: String,
}

impl Drop for CustomSmartPointer {
    fn drop(&mut self) {
        println!("Dropping CustomSmartPointer with data `{}`!", self.data);
    }
}

fn main() {
    let c = CustomSmartPointer {
        data: String::from("my stuff"),
    };
    let d = CustomSmartPointer {
        data: String::from("other stuff"),
    };
    println!("CustomSmartPointers created");
}
```

`Drop` trait 包含在 prelude 中，因此我们不需要将其引入作用域。我们在 `CustomSmartPointer` 上实现 `Drop` trait，并为 `drop` 方法提供实现，该方法调用 `println!`。`drop` 方法的主体是放置你希望当类型实例超出作用域时运行的任何逻辑的地方。我们这里打印一些文本来直观地演示 Rust 何时将调用 `drop`。

在 `main` 中，我们创建了两个 `CustomSmartPointer` 实例，然后打印 `CustomSmartPointers created`。在 `main` 结束时，我们的 `CustomSmartPointer` 实例将超出作用域，Rust 将调用我们放在 `drop` 方法中的代码，打印我们的最终消息。注意，我们不需要显式调用 `drop` 方法。

当我们运行此程序时，我们将看到以下输出：

```console
$ cargo run
   Compiling drop-example v0.1.0 (file:///projects/drop-example)
    Finished `dev` profile [unoptimized + debuginfo] target(s) in 0.60s
     Running `target/debug/drop-example`
CustomSmartPointers created
Dropping CustomSmartPointer with data `other stuff`!
Dropping CustomSmartPointer with data `my stuff`!
```

当我们的实例超出作用域时，Rust 自动为我们调用了 `drop`，调用了我们指定的代码。变量以与创建相反的顺序被释放，因此 `d` 在 `c` 之前被释放。这个示例的目的是让你直观地了解 `drop` 方法如何工作；通常你会指定类型需要运行的清理代码而不是打印消息。

不幸的是，禁用自动 `drop` 功能并不简单。禁用 `drop` 通常不是必需的；`Drop` trait 的全部意义在于它是自动处理的。然而，有时你可能想提前清理值。一个例子是使用管理锁的智能指针：你可能想强制运行释放锁的 `drop` 方法，以便同一作用域中的其他代码可以获取锁。Rust 不让你手动调用 `Drop` trait 的 `drop` 方法；相反，如果你想在值的作用域结束前强制释放它，你必须调用标准库提供的 `std::mem::drop` 函数。

通过修改清单 15-14 的 `main` 函数手动尝试调用 `Drop` trait 的 `drop` 方法是行不通的，如清单 15-15 所示。

**代码示例 15-15**：尝试手动调用 `Drop` trait 的 `drop` 方法以提前清理

```rust
struct CustomSmartPointer {
    data: String,
}

impl Drop for CustomSmartPointer {
    fn drop(&mut self) {
        println!("Dropping CustomSmartPointer with data `{}`!", self.data);
    }
}

fn main() {
    let c = CustomSmartPointer {
        data: String::from("some data"),
    };
    println!("CustomSmartPointer created");
    c.drop();
    println!("CustomSmartPointer dropped before the end of main");
}
```

当我们尝试编译此代码时，我们会得到这个错误：

```console
$ cargo run
   Compiling drop-example v0.1.0 (file:///projects/drop-example)
error[E0040]: explicit use of destructor method
  --> src/main.rs:16:7
   |
16 |     c.drop();
   |       ^^^^ explicit destructor calls not allowed
   |
help: consider using `drop` function
   |
16 -     c.drop();
16 +     drop(c);
   |

For more information about this error, try `rustc --explain E0040`.
error: could not compile `drop-example` (bin "drop-example") due to 1 previous error
```

此错误消息指出我们不允许显式调用 `drop`。错误消息使用术语  _析构函数_ ，这是用于清理实例的函数的通用编程术语。 _析构函数_  类似于 _构造函数_，后者创建实例。Rust 中的 `drop` 函数是一种特定的析构函数。

Rust 不让我们显式调用 `drop`，因为 Rust 仍然会在 `main` 结束时自动对该值调用 `drop`。这将导致双重释放错误，因为 Rust 将尝试清理相同的值两次。

我们无法在值超出作用域时禁用 `drop` 的自动插入，也不能显式调用 `drop` 方法。因此，如果我们需要强制提前清理值，我们使用 `std::mem::drop` 函数。

`std::mem::drop` 函数不同于 `Drop` trait 中的 `drop` 方法。我们通过传递要强制释放的值作为参数来调用它。该函数在 prelude 中，因此我们可以修改清单 15-15 中的 `main` 来调用 `drop` 函数，如清单 15-16 所示。

**代码示例 15-16**：调用 `std::mem::drop` 在值超出作用域之前显式释放它

```rust
struct CustomSmartPointer {
    data: String,
}

impl Drop for CustomSmartPointer {
    fn drop(&mut self) {
        println!("Dropping CustomSmartPointer with data `{}`!", self.data);
    }
}

fn main() {
    let c = CustomSmartPointer {
        data: String::from("some data"),
    };
    println!("CustomSmartPointer created");
    drop(c);
    println!("CustomSmartPointer dropped before the end of main");
}
```

运行此代码将打印以下内容：

```console
$ cargo run
   Compiling drop-example v0.1.0 (file:///projects/drop-example)
    Finished `dev` profile [unoptimized + debuginfo] target(s) in 0.73s
     Running `target/debug/drop-example`
CustomSmartPointer created
Dropping CustomSmartPointer with data `some data`!
CustomSmartPointer dropped before the end of main
```

文本 ``Dropping CustomSmartPointer with data `some data`!`` 打印在 `CustomSmartPointer created` 和 `CustomSmartPointer dropped before the end of main` 文本之间，显示在该点调用了 `drop` 方法代码来释放 `c`。

你可以用多种方式使用在 `Drop` trait 实现中指定的代码来使清理变得方便和安全：例如，你可以用它来创建自己的内存分配器！使用 `Drop` trait 和 Rust 的所有权系统，你不必记住清理，因为 Rust 会自动完成。

你也不必担心因意外清理仍在使用的值而导致的问题：确保引用始终有效的所有权系统也确保 `drop` 仅在值不再被使用时才被调用一次。

现在我们已经检查了 `Box<T>` 和智能指针的一些特性，让我们看看标准库中定义的一些其他智能指针。
