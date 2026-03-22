---
title: 18.1. 面向对象语言的特性
---

编程社区对于一门语言必须具备哪些特性才能被视为面向对象语言并没有达成共识。Rust 受到多种编程范式的影响，包括面向对象；例如，我们在第 13 章探讨了来自函数式编程的特性。可以说，面向对象语言共享某些共同的特征——即对象、封装和继承。让我们看看这些特征各自的含义，以及 Rust 是否支持它们。

## 对象包含数据和行为

Erich Gamma、Richard Helm、Ralph Johnson 和 John Vlissides（Addison-Wesley，1994）合著的《设计模式：可复用面向对象软件的基础》一书，俗称《四人帮》（ *Gang of Four* ）之书，是一本面向对象设计模式的目录。它这样定义面向对象：

> 面向对象的程序由对象组成。一个 **对象** 将数据和对这些数据的操作过程打包在一起。这些过程通常称为 **方法** 或 **操作** 。

根据这个定义，Rust 是面向对象的：struct 和 enum 拥有数据，而 `impl` 块为 struct 和 enum 提供方法。尽管带有方法的 struct 和 enum 并不 *被称* 为对象，但根据四人帮对对象的定义，它们提供了相同的功能。

## 封装隐藏实现细节

另一个常与面向对象相关的方面是 **封装** 的概念，即对象的实现细节对使用该对象的代码不可访问。因此，与对象交互的唯一方式是通过其公共 API；使用该对象的代码不应该能够直接访问对象的内部并改变数据或行为。这使得程序员能够在不改变使用该对象的代码的情况下修改和重构对象的内部实现。

我们在第 7 章讨论了如何控制封装：我们可以使用 `pub` 关键字来决定代码中的哪些模块、类型、函数和方法应该是公共的，而默认情况下其他一切都是私有的。例如，我们可以定义一个名为 `AveragedCollection` 的 struct，它有一个包含 `i32` 值向量的字段。该 struct 还可以有一个包含向量中值的平均值的字段，这意味着每当有人需要平均值时，不必即时计算。换句话说，`AveragedCollection` 将为我们缓存计算出的平均值。清单 18-1 展示了 `AveragedCollection` struct 的定义。

**清单 18-1**：一个维护整数列表和集合中项目平均值的 `AveragedCollection` struct（文件名：*src/lib.rs*）

```rust
pub struct AveragedCollection {
    list: Vec<i32>,
    average: f64,
}
```

该 struct 被标记为 `pub`，以便其他代码可以使用它，但 struct 内的字段保持私有。这在当前情况下很重要，因为我们希望确保每当向列表添加或移除值时，平均值也得到更新。我们通过在 struct 上实现 `add`、`remove` 和 `average` 方法来实现这一点，如清单 18-2 所示。

**清单 18-2**：在 `AveragedCollection` 上实现公共方法 `add`、`remove` 和 `average`（文件名：*src/lib.rs*）

```rust
pub struct AveragedCollection {
    list: Vec<i32>,
    average: f64,
}

impl AveragedCollection {
    pub fn add(&mut self, value: i32) {
        self.list.push(value);
        self.update_average();
    }

    pub fn remove(&mut self) -> Option<i32> {
        let result = self.list.pop();
        match result {
            Some(value) => {
                self.update_average();
                Some(value)
            }
            None => None,
        }
    }

    pub fn average(&self) -> f64 {
        self.average
    }

    fn update_average(&mut self) {
        let total: i32 = self.list.iter().sum();
        self.average = total as f64 / self.list.len() as f64;
    }
}
```

公共方法 `add`、`remove` 和 `average` 是访问或修改 `AveragedCollection` 实例中数据的唯一方式。当使用 `add` 方法向 `list` 添加项目或使用 `remove` 方法移除项目时，每个方法的实现都会调用私有的 `update_average` 方法来处理 `average` 字段的更新。

我们将 `list` 和 `average` 字段保持私有，这样外部代码就无法直接向 `list` 字段添加或移除项目；否则，当 `list` 改变时，`average` 字段可能会变得不同步。`average` 方法返回 `average` 字段中的值，允许外部代码读取 `average` 但不能修改它。

因为我们封装了 `AveragedCollection` struct 的实现细节，所以我们可以轻松地改变某些方面，例如未来改变数据结构。例如，我们可以用 `HashSet<i32>` 代替 `Vec<i32>` 作为 `list` 字段。只要 `add`、`remove` 和 `average` 公共方法的签名保持不变，使用 `AveragedCollection` 的代码就不需要改变。如果我们让 `list` 变为公共的，情况就不一定如此：`HashSet<i32>` 和 `Vec<i32>` 有不同的添加和移除项目的方法，所以如果外部代码直接修改 `list`，很可能需要改变。

如果封装是一门语言被视为面向对象的必需特性，那么 Rust 满足这一要求。对代码的不同部分选择是否使用 `pub` 的选项使得实现细节的封装成为可能。

## 继承作为类型系统和代码共享

**继承** 是一种机制，通过它，一个对象可以从另一个对象的定义中继承元素，从而获得父对象的数据和行为，而无需你再次定义它们。

如果一门语言必须拥有继承才能是面向对象的，那么 Rust 不是这样的语言。除了使用宏之外，没有办法定义一个继承父 struct 的字段和方法实现的 struct。

然而，如果你习惯在编程工具箱中使用继承，你可以根据最初使用继承的原因，在 Rust 中使用其他解决方案。

你会出于两个主要原因选择继承。一是为了代码复用：你可以为一种类型实现特定的行为，而继承使你能够为另一种类型复用该实现。你可以在 Rust 代码中以有限的方式使用默认 trait 方法实现来做到这一点，正如我们在代码示例 10-14 中看到的那样，当时在 `Summary` trait 上添加了 `summarize` 方法的默认实现。任何实现 `Summary` trait 的类型都可以使用 `summarize` 方法而无需任何额外的代码。这类似于父类拥有某个方法的实现，而继承的子类也拥有该方法的实现。当实现 `Summary` trait 时，我们也可以覆盖 `summarize` 方法的默认实现，这类似于子类覆盖从父类继承的方法的实现。

使用继承的另一个原因与类型系统有关：使子类型能够在与父类型相同的地方使用。这也称为 **多态** ，意味着你可以在运行时如果多个对象共享某些特征，就可以用它们相互替代。

> ### 多态
>
> 对许多人来说，多态与继承是同义词。但它实际上是一个更普遍的概念，指的是能够处理多种类型数据的代码。对于继承来说，这些类型通常是子类。
>
> Rust 转而使用泛型来抽象不同的可能类型，并使用 trait bound 来约束这些类型必须提供什么。这有时被称为 **有界参数化多态** 。

Rust 通过不提供继承，选择了一组不同的权衡。继承常常有共享过多代码的风险。子类不应该总是共享父类的所有特征，但继承会使它们这样做。这可能使程序的设计变得不够灵活。它还引入了在子类上调用没有意义或会导致错误的方法的可能性，因为这些方法不适用于子类。此外，有些语言只允许 **单继承** （意味着子类只能从一个类继承），进一步限制了程序设计的灵活性。

由于这些原因，Rust 采取了不同的方法，使用 trait 对象而不是继承来实现运行时的多态。让我们看看 trait 对象是如何工作的。
