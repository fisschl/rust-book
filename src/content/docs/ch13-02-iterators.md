---
title: 使用迭代器处理一系列项
---

迭代器模式允许你依次对一系列项执行某些任务。迭代器负责遍历每个项的逻辑，并确定序列何时结束。当你使用迭代器时，你不必自己重新实现该逻辑。

在 Rust 中，迭代器是 _惰性_ 的，这意味着它们在调用消耗迭代器的方法之前不会有任何效果。例如，代码示例13-10通过调用在 `Vec<T>` 上定义的 `iter` 方法创建了一个遍历向量 `v1` 中项的迭代器。这段代码本身不做任何有用的事情。

**代码示例 13-10：创建一个迭代器**

```rust
fn main() {
    let v1 = vec![1, 2, 3];

    let v1_iter = v1.iter();
}
```

迭代器存储在 `v1_iter` 变量中。一旦我们创建了迭代器，我们就可以以各种方式使用它。在代码示例3-5中，我们使用 `for` 循环遍历一个数组，对其每个项执行一些代码。在底层，这隐式地创建并消耗了一个迭代器，但直到现在我们才详细说明这是如何工作的。

在代码示例13-11的例子中，我们将迭代器的创建与在 `for` 循环中使用迭代器分开。当使用 `v1_iter` 中的迭代器调用 `for` 循环时，迭代器中的每个元素在循环的一次迭代中使用，这会打印出每个值。

**代码示例 13-11：在 `for` 循环中使用迭代器**

```rust
fn main() {
    let v1 = vec![1, 2, 3];

    let v1_iter = v1.iter();

    for val in v1_iter {
        println!("Got: {val}");
    }
}
```

在没有由标准库提供迭代器的语言中，你可能会通过从索引0开始一个变量，使用该变量索引到向量以获取值，并在循环中递增变量值，直到它达到向量中项的总数来实现相同的功能。

迭代器为你处理所有这些逻辑，减少了你可能搞乱的重复代码。迭代器为你提供了更大的灵活性，可以在许多不同类型的序列中使用相同的逻辑，而不仅仅是可以索引的数据结构，比如向量。让我们检查迭代器是如何做到这一点的。

## `Iterator` Trait 和 `next` 方法

所有迭代器都实现了一个名为 `Iterator` 的 trait，它在标准库中定义。该 trait 的定义如下所示：

```rust
pub trait Iterator {
    type Item;

    fn next(&mut self) -> Option<Self::Item>;

    // 具有默认实现的方法省略
}
```

注意这个定义使用了一些新语法：`type Item` 和 `Self::Item`，它们正在定义与此 trait 关联的关联类型。我们将在第20章深入讨论关联类型。现在，你只需要知道这段代码说实现 `Iterator` trait 需要你同时定义一个 `Item` 类型，这个 `Item` 类型在 `next` 方法的返回类型中使用。换句话说，`Item` 类型将是迭代器返回的类型。

`Iterator` trait 只要求实现者定义一个方法：`next` 方法，它每次返回迭代器的一个项，包装在 `Some` 中，当迭代结束时，返回 `None`。

我们可以直接在迭代器上调用 `next` 方法；代码示例13-12演示了在从向量创建的迭代器上重复调用 `next` 时返回的值。

**代码示例 13-12：在迭代器上调用 `next` 方法**

```rust
#[cfg(test)]
mod tests {
    #[test]
    fn iterator_demonstration() {
        let v1 = vec![1, 2, 3];

        let mut v1_iter = v1.iter();

        assert_eq!(v1_iter.next(), Some(&1));
        assert_eq!(v1_iter.next(), Some(&2));
        assert_eq!(v1_iter.next(), Some(&3));
        assert_eq!(v1_iter.next(), None);
    }
}
```

注意，我们需要将 `v1_iter` 设为可变：在迭代器上调用 `next` 方法会改变迭代器用来跟踪它在序列中位置的内部状态。换句话说，这段代码 _消耗_ 或使用迭代器。每次调用 `next` 都会消耗迭代器中的一个项。当我们使用 `for` 循环时，我们不需要将 `v1_iter` 设为可变，因为循环取得了 `v1_iter` 的所有权，并在幕后使其可变。

还要注意，我们从 `next` 的调用中获得的值是向量中值的不可变引用。`iter` 方法产生一个遍历不可变引用的迭代器。如果我们想创建一个获取 `v1` 所有权并返回拥有值的迭代器，我们可以调用 `into_iter` 而不是 `iter`。类似地，如果我们想遍历可变引用，我们可以调用 `iter_mut` 而不是 `iter`。

## 消耗迭代器的方法

`Iterator` trait 有许多标准库提供的具有默认实现的不同方法；你可以通过查看标准库 API 文档中 `Iterator` trait 的说明来了解这些方法。其中一些方法在它们的定义中调用 `next` 方法，这就是为什么你在实现 `Iterator` trait 时需要实现 `next` 方法。

调用 `next` 的方法被称为 _消费适配器_ ，因为调用它们会消耗迭代器。一个例子是 `sum` 方法，它取得迭代器的所有权，并通过重复调用 `next` 遍历项，从而消耗迭代器。当它遍历时，它将每个项添加到运行总计中，并在迭代完成时返回总计。代码示例13-13有一个测试，演示了 `sum` 方法的使用。

**代码示例 13-13：调用 `sum` 方法获取迭代器中所有项的总和**

```rust
#[cfg(test)]
mod tests {
    #[test]
    fn iterator_sum() {
        let v1 = vec![1, 2, 3];

        let v1_iter = v1.iter();

        let total: i32 = v1_iter.sum();

        assert_eq!(total, 6);
    }
}
```

在调用 `sum` 后，我们不允许使用 `v1_iter`，因为 `sum` 取得了我们调用它的迭代器的所有权。

## 产生其他迭代器的方法

 _迭代器适配器_ 是在 `Iterator` trait 上定义的方法，不消耗迭代器。相反，它们通过改变原始迭代器的某些方面来产生不同的迭代器。

代码示例13-14展示了一个调用迭代器适配器方法 `map` 的例子，它接受一个闭包，在项被遍历遍历时对每个项调用。`map` 方法返回一个新的迭代器，产生修改后的项。这里的闭包创建了一个新的迭代器，其中向量中的每个项都将增加1。

**代码示例 13-14：调用迭代器适配器 `map` 来创建一个新的迭代器**

```rust
fn main() {
    let v1: Vec<i32> = vec![1, 2, 3];

    v1.iter().map(|x| x + 1);
}
```

然而，这段代码产生了一个警告：

```console
$ cargo run
   Compiling iterators v0.1.0 (file:///projects/iterators)
warning: unused `Map` that must be used
 --> src/main.rs:4:5
  |
4 |     v1.iter().map(|x| x + 1);
  |     ^^^^^^^^^^^^^^^^^^^^^^^^
  |
  = note: iterators are lazy and do nothing unless consumed
  = note: `#[warn(unused_must_use)]` on by default
help: use `let _ = ...` to ignore the resulting value
  |
4 |     let _ = v1.iter().map(|x| x + 1);
  |     +++++++

warning: `iterators` (bin "iterators") generated 1 warning
    Finished `dev` profile [unoptimized + debuginfo] target(s) in 0.47s
     Running `target/debug/iterators`
```

代码示例13-14中的代码没有任何作用；我们指定的闭包从未被调用。警告提醒我们原因：迭代器适配器是惰性的，我们需要在这里消耗迭代器。

为了修复这个警告并消耗迭代器，我们将使用 `collect` 方法，我们在代码示例12-1中与 `env::args` 一起使用过这个方法。这个方法消耗迭代器，并将结果值收集到一个集合数据类型中。

在代码示例13-15中，我们将从对 `map` 的调用返回的迭代器遍历的结果收集到一个向量中。这个向量最终将包含原始向量中的每个项，增加1。

**代码示例 13-15：调用 `map` 方法来创建一个新的迭代器，然后调用 `collect` 方法来消耗新的迭代器并创建一个向量**

```rust
fn main() {
    let v1: Vec<i32> = vec![1, 2, 3];

    let v2: Vec<_> = v1.iter().map(|x| x + 1).collect();

    assert_eq!(v2, vec![2, 3, 4]);
}
```

因为 `map` 接受一个闭包，我们可以指定要对每个项执行的任何操作。这是闭包如何让你自定义某些行为，同时重用 `Iterator` trait 提供的迭代行为的一个很好的例子。

你可以链式调用多个迭代器适配器，以可读的方式执行复杂的操作。但因为所有迭代器都是惰性的，你必须调用一个消耗适配器方法来从对迭代器适配器的调用中获取结果。

## 捕获其环境的闭包

许多迭代器适配器接受闭包作为参数，通常我们指定为迭代器适配器参数的闭包将是捕获其环境的闭包。

对于这个例子，我们将使用 `filter` 方法，它接受一个闭包。闭包从迭代器中获取一个项并返回一个 `bool`。如果闭包返回 `true`，该值将被包含在 `filter` 产生的迭代中。如果闭包返回 `false`，该值将不会被包含。

在代码示例13-16中，我们使用 `filter` 和一个从环境中捕获 `shoe_size` 变量的闭包来遍历 `Shoe` 结构体实例的集合。它将只返回指定尺码的鞋子。

**代码示例 13-16：使用带有捕获 `shoe_size` 的闭包的 `filter` 方法**

```rust
#[derive(PartialEq, Debug)]
struct Shoe {
    size: u32,
    style: String,
}

fn shoes_in_size(shoes: Vec<Shoe>, shoe_size: u32) -> Vec<Shoe> {
    shoes.into_iter().filter(|s| s.size == shoe_size).collect()
}

#[cfg(test)]
mod tests {
    use super::*;

    #[test]
    fn filters_by_size() {
        let shoes = vec![
            Shoe {
                size: 10,
                style: String::from("sneaker"),
            },
            Shoe {
                size: 13,
                style: String::from("sandal"),
            },
            Shoe {
                size: 10,
                style: String::from("boot"),
            },
        ];

        let in_my_size = shoes_in_size(shoes, 10);

        assert_eq!(
            in_my_size,
            vec![
                Shoe {
                    size: 10,
                    style: String::from("sneaker")
                },
                Shoe {
                    size: 10,
                    style: String::from("boot")
                },
            ]
        );
    }
}
```

`shoes_in_size` 函数接受一个鞋子向量和一个鞋子尺码作为参数。它返回一个只包含指定尺码鞋子的向量。

在 `shoes_in_size` 的主体中，我们调用 `into_iter` 来创建一个获取向量所有权的迭代器。然后，我们调用 `filter` 将该迭代器适配成一个只包含闭包返回 `true` 的元素的新迭代器。

闭包从环境中捕获 `shoe_size` 参数，并将该值与每只鞋子的尺码进行比较，只保留指定尺码的鞋子。最后，调用 `collect` 将适配的迭代器返回的值收集到一个由函数返回的向量中。

测试显示，当我们调用 `shoes_in_size` 时，我们只拿回与我们指定的值尺码相同的鞋子。
