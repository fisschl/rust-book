---
title: 20.1. Unsafe Rust
---

到目前为止，我们讨论的所有代码都在编译时强制执行 Rust 的内存安全保证。然而，Rust 内部隐藏着第二种语言，它不强制执行这些内存安全保证：它被称为 **Unsafe Rust** ，它的工作方式与普通 Rust 相同，但赋予了我们额外的超能力。

Unsafe Rust 的存在是因为，就其本质而言，静态分析是保守的。当编译器试图确定代码是否维护保证时，它最好拒绝一些有效的程序，而不是接受一些无效的程序。尽管代码 *可能* 没问题，但如果 Rust 编译器没有足够的信息来确定，它就会拒绝该代码。在这些情况下，你可以使用不安全代码告诉编译器："相信我，我知道我在做什么。"但请注意，使用 Unsafe Rust 的风险自负：如果你不正确地使用不安全代码，可能会由于内存不安全而发生问题，例如空指针解引用。

Rust 具有不安全化身的另一个原因是底层计算机硬件本质上是不安全的。如果 Rust 不让你执行不安全的操作，你就无法完成某些任务。Rust 需要允许你进行底层系统编程，例如直接与操作系统交互，甚至编写你自己的操作系统。进行底层系统编程是该语言的目标之一。让我们探索我们可以用 Unsafe Rust 做什么以及如何去做。

## 执行 Unsafe 超能力

要切换到 Unsafe Rust，请使用 `unsafe` 关键字，然后启动一个包含不安全代码的新块。你可以在 Unsafe Rust 中执行五个在 Safe Rust 中无法执行的操作，我们称之为 **unsafe 超能力** 。这些超能力包括：

1. 解引用原始指针
2. 调用不安全的函数或方法
3. 访问或修改可变静态变量
4. 实现不安全的 Trait
5. 访问 `union` 的字段

重要的是要理解 `unsafe` 不会关闭借用检查器或禁用 Rust 的任何其他安全检查：如果你在 unsafe 代码中使用引用，它仍会被检查。`unsafe` 关键字只是让你能够访问这五个特性，然后编译器不会检查内存安全性。在 Unsafe 块中你仍然会得到一定程度的安全性。

此外，`unsafe` 并不意味着块内的代码必然是危险的，或者它肯定会有内存安全问题：意图是作为程序员，你将确保 `unsafe` 块内的代码将以有效的方式访问内存。

人是会犯错的，错误会发生，但通过要求这五个不安全操作必须位于用 `unsafe` 注释的块内，你将知道与内存安全相关的任何错误都必须在 `unsafe` 块内。保持 `unsafe` 块小巧；当你调查内存错误时，你会感激这一点。

为了尽可能隔离 Unsafe 代码，最好将此类代码封装在安全抽象内并提供安全 API，我们将在本章后面讨论 Unsafe 函数和方法时讨论这一点。标准库的某些部分被实现为经过审计的 Unsafe 代码之上的安全抽象。将 Unsafe 代码包装在安全抽象中可以防止 `unsafe` 的使用泄漏到你或你的用户可能想要使用 `unsafe` 代码实现的功能的所有地方，因为使用安全抽象是安全的。

让我们依次查看这五个 unsafe 超能力。我们还将介绍一些为 Unsafe 代码提供安全接口的抽象。

## 解引用原始指针

在第 4 章的[悬垂引用][dangling-references]一节中，我们提到编译器确保引用始终有效。Unsafe Rust 有两种称为 **原始指针** 的新类型，它们类似于引用。与引用一样，原始指针可以是不可变或可变的，分别写为 `*const T` 和 `*mut T`。星号不是解引用运算符；它是类型名称的一部分。在原始指针的上下文中， **不可变** 意味着指针在解引用后不能直接赋值。

与引用和智能指针不同，原始指针：

- 可以通过拥有对同一位置的不可变和可变指针或多个可变指针来忽略借用规则
- 不保证指向有效的内存
- 允许为空
- 不实现任何自动清理

通过选择不让 Rust 强制执行这些保证，你可以放弃有保证的安全性，以换取更高的性能或与另一种语言或硬件交互的能力，而 Rust 的保证在那里不适用。

清单 20-1 展示了如何创建不可变和可变原始指针。

**清单 20-1**：使用原始借用运算符创建原始指针

```rust
fn main() {
    let mut num = 5;

    let r1 = &raw const num;
    let r2 = &raw mut num;
}
```

请注意，我们在此代码中不包含 `unsafe` 关键字。我们可以在安全代码中创建原始指针；我们只是不能在 Unsafe 块之外解引用原始指针，稍后你会看到。

我们使用原始借用运算符创建了原始指针：`&raw const num` 创建一个 `*const i32` 不可变原始指针，`&raw mut num` 创建一个 `*mut i32` 可变原始指针。因为我们直接从局部变量创建了它们，所以我们知道这些特定的原始指针是有效的，但我们不能对任何原始指针做出这种假设。

为了证明这一点，接下来我们将创建一个我们无法如此确定其有效性的原始指针，使用关键字 `as` 来转换值，而不是使用原始借用运算符。清单 20-2 展示了如何在内存的任意位置创建原始指针。尝试使用任意内存是未定义的：该地址可能有数据，也可能没有，编译器可能会优化代码，使得没有内存访问，或者程序可能会因段错误而终止。通常，编写这样的代码没有充分的理由，尤其是在你可以使用原始借用运算符的情况下，但这是可能的。

**清单 20-2**：创建指向任意内存地址的原始指针

```rust
fn main() {
    let address = 0x012345usize;
    let r = address as *const i32;
}
```

回想一下，我们可以在安全代码中创建原始指针，但我们不能解引用原始指针并读取指向的数据。在清单 20-3 中，我们在需要 `unsafe` 块的原始指针上使用解引用运算符 `*`。

**清单 20-3**：在 `unsafe` 块内解引用原始指针

```rust
fn main() {
    let mut num = 5;

    let r1 = &raw const num;
    let r2 = &raw mut num;

    unsafe {
        println!("r1 is: {}", *r1);
        println!("r2 is: {}", *r2);
    }
}
```

创建指针不会造成任何伤害；只有当我们尝试访问它指向的值时，我们才可能最终处理无效值。

还要注意，在清单 20-1 和 20-3 中，我们创建了指向同一内存位置的 `*const i32` 和 `*mut i32` 原始指针，其中存储着 `num`。如果我们尝试创建对 `num` 的不可变和可变引用，代码将不会编译，因为 Rust 的所有权规则不允许在任何不可变引用的同时拥有可变引用。使用原始指针，我们可以创建指向同一位置的可变指针和不可变指针，并通过可变指针更改数据，可能会产生数据竞争。要小心！

鉴于所有这些危险，为什么你会使用原始指针？一个主要用例是与 C 代码交互，如你在下一节中所见。另一个用例是构建借用检查器不理解的安全抽象。我们将介绍不安全的函数，然后看看使用不安全代码的安全抽象示例。

## 调用不安全的函数或方法

你可以在 Unsafe 块中执行的第二种操作是调用不安全的函数。不安全的函数和方法看起来与常规函数和方法完全相同，但它们在定义的其余部分之前有一个额外的 `unsafe`。此上下文中的 `unsafe` 关键字表示该函数有我们在调用此函数时需要维护的要求，因为 Rust 无法保证我们已满足这些要求。通过在 `unsafe` 块内调用不安全的函数，我们表示我们已经阅读了该函数的文档，并承担维护该函数约定的责任。

以下是一个名为 `dangerous` 的不安全函数，其主体中不执行任何操作：

```rust
fn main() {
    unsafe fn dangerous() {}

    unsafe {
        dangerous();
    }
}
```

我们必须在单独的 `unsafe` 块内调用 `dangerous` 函数。如果我们尝试在没有 `unsafe` 块的情况下调用 `dangerous`，我们会得到一个错误：

```console
$ cargo run
   Compiling unsafe-example v0.1.0 (file:///projects/unsafe-example)
error[E0133]: call to unsafe function `dangerous` is unsafe and requires unsafe block
 --> src/main.rs:4:5
  |
4 |     dangerous();
  |     ^^^^^^^^^^^ call to unsafe function
  |
  = note: consult the function's documentation for information on how to avoid undefined behavior

For more information about this error, try `rustc --explain E0133`.
error: could not compile `unsafe-example` (bin "unsafe-example") due to 1 previous error
```

使用 `unsafe` 块，我们向 Rust 保证我们已经阅读了函数的文档，了解如何正确使用它，并验证我们正在履行函数的约定。

要在 `unsafe` 函数的主体中执行不安全操作，你仍然需要使用 `unsafe` 块，就像在常规函数中一样，如果你忘记了，编译器会警告你。这有助于我们保持 `unsafe` 块尽可能小，因为不安全操作可能不需要在整个函数体中使用。

### 在 Unsafe 代码上创建安全抽象

仅仅因为函数包含不安全代码并不意味着我们需要将整个函数标记为不安全。事实上，将不安全代码包装在安全函数中是一种常见的抽象。作为示例，让我们研究标准库中的 `split_at_mut` 函数，它需要一些不安全代码。我们将探索我们如何实现它。这种安全方法定义在可变切片上：它获取一个切片并通过在给定索引处拆分切片将其分成两个。清单 20-4 展示了如何使用 `split_at_mut`。

**清单 20-4**：使用安全的 `split_at_mut` 函数

```rust
fn main() {
    let mut v = vec![1, 2, 3, 4, 5, 6];

    let r = &mut v[..];

    let (a, b) = r.split_at_mut(3);

    assert_eq!(a, &mut [1, 2, 3]);
    assert_eq!(b, &mut [4, 5, 6]);
}
```

我们无法仅使用 Safe Rust 实现此函数。尝试可能看起来像清单 20-5，它不会编译。为简单起见，我们将 `split_at_mut` 实现为函数而不是方法，并且仅针对 `i32` 值的切片，而不是泛型类型 `T`。

**清单 20-5**：尝试仅使用 Safe Rust 实现 `split_at_mut`

```rust
fn split_at_mut(values: &mut [i32], mid: usize) -> (&mut [i32], &mut [i32]) {
    let len = values.len();

    assert!(mid <= len);

    (&mut values[..mid], &mut values[mid..])
}

fn main() {
    let mut vector = vec![1, 2, 3, 4, 5, 6];
    let (left, right) = split_at_mut(&mut vector, 3);
}
```

此函数首先获取切片的总长度。然后，它通过检查它是否小于或等于长度来断言作为参数给出的索引在切片内。断言意味着如果我们传递一个大于要拆分切片的长度的索引，函数将在尝试使用该索引之前 panic。

然后，我们在元组中返回两个可变切片：一个从原始切片的开始到 `mid` 索引，另一个从 `mid` 到切片的末尾。

当我们尝试编译清单 20-5 中的代码时，我们会得到一个错误：

```console
$ cargo run
   Compiling unsafe-example v0.1.0 (file:///projects/unsafe-example)
error[E0499]: cannot borrow `*values` as mutable more than once at a time
 --> src/main.rs:6:31
  |
1 | fn split_at_mut(values: &mut [i32], mid: usize) -> (&mut [i32], &mut [i32]) {
  |                         - let's call the lifetime of this reference `'1`
...
6 |     (&mut values[..mid], &mut values[mid..])
  |     --------------------------^^^^^^--------
  |     |     |                   |
  |     |     |                   second mutable borrow occurs here
  |     |     first mutable borrow occurs here
  |     returning this value requires that `*values` is borrowed for `'1`
  |
  = help: use `.split_at_mut(position)` to obtain two mutable non-overlapping sub-slices

For more information about this error, try `rustc --explain E0499`.
error: could not compile `unsafe-example` (bin "unsafe-example") due to 1 previous error
```

Rust 的借用检查器无法理解我们正在借用切片的不同部分；它只知道我们从同一个切片借用了两次。借用切片的不同部分从根本上说是可以的，因为两个切片不重叠，但 Rust 不够聪明，无法知道这一点。当我们知道代码没问题，但 Rust 不知道时，是时候使用不安全代码了。

清单 20-6 展示了如何使用 `unsafe` 块、原始指针和一些对不安全函数的调用来使 `split_at_mut` 的实现工作。

**清单 20-6**：在 `split_at_mut` 函数的实现中使用不安全代码

```rust
use std::slice;

fn split_at_mut(values: &mut [i32], mid: usize) -> (&mut [i32], &mut [i32]) {
    let len = values.len();
    let ptr = values.as_mut_ptr();

    assert!(mid <= len);

    unsafe {
        (
            slice::from_raw_parts_mut(ptr, mid),
            slice::from_raw_parts_mut(ptr.add(mid), len - mid),
        )
    }
}

fn main() {
    let mut vector = vec![1, 2, 3, 4, 5, 6];
    let (left, right) = split_at_mut(&mut vector, 3);
}
```

回想一下第 4 章的[切片类型][the-slice-type]一节，切片是指向某些数据的指针和切片的长度。我们使用 `len` 方法获取切片的长度，使用 `as_mut_ptr` 方法访问切片的原始指针。在这种情况下，因为我们有一个指向 `i32` 值的可变切片，`as_mut_ptr` 返回一个类型为 `*mut i32` 的原始指针，我们将其存储在变量 `ptr` 中。

我们保留 `mid` 索引在切片内的断言。然后，我们到达不安全代码：`slice::from_raw_parts_mut` 函数接受一个原始指针和一个长度，并创建一个切片。我们使用此函数创建一个从 `ptr` 开始且长度为 `mid` 的切片。然后，我们在 `ptr` 上调用 `add` 方法，以 `mid` 作为参数，以获得从 `mid` 开始的原始指针，我们使用该指针和 `mid` 之后的剩余项目数作为长度创建一个切片。

函数 `slice::from_raw_parts_mut` 是不安全的，因为它接受一个原始指针，必须信任该指针是有效的。原始指针上的 `add` 方法也是不安全的，因为它必须信任偏移位置也是有效的指针。因此，我们必须在调用 `slice::from_raw_parts_mut` 和 `add` 时放置一个 `unsafe` 块，以便我们可以调用它们。通过查看代码并添加 `mid` 必须小于或等于 `len` 的断言，我们可以判断 `unsafe` 块中使用的所有原始指针都将是指向切片内数据的有效指针。这是 `unsafe` 的可接受和适当的使用。

请注意，我们不需要将生成的 `split_at_mut` 函数标记为 `unsafe`，我们可以从 Safe Rust 调用此函数。我们使用以安全方式使用 `unsafe` 代码的函数实现创建了一个到不安全代码的安全抽象，因为它仅从该函数有权访问的数据创建有效指针。

相反，清单 20-7 中 `slice::from_raw_parts_mut` 的使用可能会在切片使用时崩溃。此代码采用任意内存位置并创建一个包含 10,000 个项目的切片。

**清单 20-7**：从任意内存位置创建切片

```rust
fn main() {
    use std::slice;

    let address = 0x01234usize;
    let r = address as *mut i32;

    let values: &[i32] = unsafe { slice::from_raw_parts_mut(r, 10000) };
}
```

我们不拥有此任意位置的内存，并且无法保证此代码创建的切片包含有效的 `i32` 值。尝试像使用有效切片一样使用 `values` 会导致未定义行为。

### 使用 `extern` 函数调用外部代码

有时你的 Rust 代码可能需要与用另一种语言编写的代码交互。为此，Rust 有 `extern` 关键字，它有助于创建和使用 **外部函数接口（FFI）** ，这是一种编程语言定义函数并使不同（外部）编程语言能够调用这些函数的方式。

清单 20-8 演示了如何设置与 C 标准库中的 `abs` 函数的集成。在 `extern` 块内声明的函数通常从 Rust 代码调用是不安全的，因此 `extern` 块也必须标记为 `unsafe`。原因是其他语言不强制执行 Rust 的规则和保证，Rust 无法检查它们，因此责任落在程序员身上以确保安全。

**清单 20-8**：声明和调用在另一种语言中定义的 `extern` 函数（文件名：*src/main.rs*）

```rust
unsafe extern "C" {
    fn abs(input: i32) -> i32;
}

fn main() {
    unsafe {
        println!("Absolute value of -3 according to C: {}", abs(-3));
    }
}
```

在 `unsafe extern "C"` 块内，我们列出要从另一种语言调用的外部函数的名称和签名。`"C"` 部分定义了外部函数使用的 **应用程序二进制接口（ABI）** ：ABI 定义了如何在汇编级别调用该函数。`"C"` ABI 是最常见的，遵循 C 编程语言的 ABI。有关 Rust 支持的所有 ABI 的信息可在 [Rust 参考文档][ABI] 中找到。

在 `unsafe extern` 块内声明的每个项目都隐式地是不安全的。但是，一些 FFI 函数 *是* 安全调用的。例如，C 标准库中的 `abs` 函数没有任何内存安全考虑，我们知道它可以用任何 `i32` 调用。在这种情况下，我们可以使用 `safe` 关键字来说明此特定函数是安全的，即使它在 `unsafe extern` 块中。一旦我们做出该更改，调用它就不再需要 `unsafe` 块，如清单 20-9 所示。

**清单 20-9**：在 `unsafe extern` 块内显式地将函数标记为 `safe` 并安全地调用它（文件名：*src/main.rs*）

```rust
unsafe extern "C" {
    safe fn abs(input: i32) -> i32;
}

fn main() {
    println!("Absolute value of -3 according to C: {}", abs(-3));
}
```

将函数标记为 `safe` 并不会使它本质上安全！相反，这就像你向 Rust 做出的承诺，表明它是安全的。你仍然有责任确保这个承诺得到遵守！

### 从其他语言调用 Rust 函数

我们还可以使用 `extern` 创建一个接口，允许其他语言调用 Rust 函数。我们不创建整个 `extern` 块，而是在相关函数的 `fn` 关键字之前添加 `extern` 关键字并指定要使用的 ABI。我们还需要添加一个 `#[unsafe(no_mangle)]` 属性，以告诉 Rust 编译器不要混淆此函数的名称。 **混淆** 是指编译器将我们给定的函数名称更改为包含更多信息的另一个名称，以供编译过程的其他部分使用，但人类可读性较差。每种编程语言编译器对名称的混淆方式略有不同，因此为了让 Rust 函数能够被其他语言命名，我们必须禁用 Rust 编译器的名称混淆。这是不安全的，因为如果没有内置混淆，库之间可能会发生名称冲突，因此我们有责任确保我们选择的名称在不混淆的情况下可以安全导出。

在以下示例中，我们使 `call_from_c` 函数可以从 C 代码访问，在它被编译为共享库并从 C 链接之后：

```rust
#[unsafe(no_mangle)]
pub extern "C" fn call_from_c() {
    println!("Just called a Rust function from C!");
}
```

这种 `extern` 的用法只需要在属性中使用 `unsafe`，而不需要在 `extern` 块上。

## 访问或修改可变静态变量

在本书中，我们还没有讨论全局变量，Rust 确实支持全局变量，但它们可能与 Rust 的所有权规则存在问题。如果两个线程正在访问同一个可变全局变量，可能会导致数据竞争。

在 Rust 中，全局变量被称为 **静态变量** 。清单 20-10 展示了一个声明和使用静态变量的示例，该变量以字符串切片作为值。

**清单 20-10**：定义和使用不可变静态变量（文件名：*src/main.rs*）

```rust
static HELLO_WORLD: &str = "Hello, world!";

fn main() {
    println!("value is: {HELLO_WORLD}");
}
```

静态变量类似于常量，我们在第 3 章的[声明常量][constants]一节中讨论过。静态变量的名称按约定使用 `SCREAMING_SNAKE_CASE` 。静态变量只能存储具有 `'static` 生命周期的引用，这意味着 Rust 编译器可以计算出生命周期，我们不需要显式注释它。访问不可变静态变量是安全的。

常量和不可变静态变量之间的一个细微差别是静态变量中的值在内存中具有固定地址。使用该值将始终访问相同的数据。另一方面，常量允许在使用时复制其数据。另一个区别是静态变量可以是可变的。访问和修改可变静态变量是 **不安全的** 。清单 20-11 展示了如何声明、访问和修改名为 `COUNTER` 的可变静态变量。

**清单 20-11**：从可变静态变量读取或写入是不安全的。（文件名：*src/main.rs*）

```rust
static mut COUNTER: u32 = 0;

/// SAFETY: 从多个线程同时调用这是未定义行为，
/// 因此你必须保证你只从一个线程调用它。
unsafe fn add_to_count(inc: u32) {
    unsafe {
        COUNTER += inc;
    }
}

fn main() {
    unsafe {
        // SAFETY: 这仅在 `main` 中从单个线程调用。
        add_to_count(3);
        println!("COUNTER: {}", *(&raw const COUNTER));
    }
}
```

与常规变量一样，我们使用 `mut` 关键字指定可变性。任何从 `COUNTER` 读取或写入的代码必须位于 `unsafe` 块内。清单 20-11 中的代码编译并打印 `COUNTER: 3`，正如我们所期望的，因为它是单线程的。让多个线程访问 `COUNTER` 可能会导致数据竞争，因此这是未定义行为。因此，我们需要将整个函数标记为 `unsafe` 并记录安全限制，以便任何调用该函数的人都知道他们被允许和不被允许做什么。

每当我们编写不安全的函数时，用 `SAFETY` 开头写一个注释来解释调用者需要做什么以安全地调用该函数是惯用的。同样，每当我们执行不安全的操作时，用 `SAFETY` 开头写一个注释来解释安全规则是如何得到维护的是惯用的。

此外，编译器默认会通过编译器 lint 拒绝任何尝试创建对可变静态变量的引用。你必须通过添加 `#[allow(static_mut_refs)]` 属性显式选择退出该 lint 的保护，或者通过使用原始借用运算符之一创建的原始指针访问可变静态变量。这包括在引用不可见地创建的情况下，如在此代码清单中的 `println!` 中。要求通过原始指针创建对静态可变变量的引用有助于使使用它们的安全要求更加明显。

对于全局可访问的可变数据，很难确保没有数据竞争，这就是为什么 Rust 认为可变静态变量是不安全的。在可能的情况下，最好使用我们在第 16 章中讨论的并发技术和线程安全智能指针，以便编译器检查来自不同线程的数据访问是否安全地完成。

## 实现不安全的 Trait

我们可以使用 `unsafe` 来实现不安全的 Trait。当 Trait 的至少一个方法具有编译器无法验证的不变条件时，该 Trait 是不安全的。我们通过在 `trait` 之前添加 `unsafe` 关键字来声明 Trait 是 `unsafe`，并将 Trait 的实现标记为 `unsafe`，如清单 20-12 所示。

**清单 20-12**：定义和实现不安全的 trait

```rust
unsafe trait Foo {
    // 方法在这里
}

unsafe impl Foo for i32 {
    // 方法实现在这里
}

fn main() {}
```

通过使用 `unsafe impl`，我们承诺我们将维护编译器无法验证的不变条件。

作为示例，回想一下我们在第 16 章的[使用 `Send` 和 `Sync` 实现可扩展并发][send-and-sync]一节中讨论的 `Send` 和 `Sync` 标记 trait：如果我们的类型完全由实现 `Send` 和 `Sync` 的其他类型组成，编译器会自动实现这些 trait。如果我们实现一个包含不实现 `Send` 或 `Sync` 的类型的类型，例如原始指针，并且我们想将该类型标记为 `Send` 或 `Sync`，我们必须使用 `unsafe`。Rust 无法验证我们的类型是否维护可以安全地跨线程发送或从多个线程访问的保证；因此，我们需要手动进行这些检查并用 `unsafe` 表示。

## 访问联合体的字段

仅在 `unsafe` 下工作的最后一个操作是访问联合体的字段。 **联合体** 类似于 `struct`，但在特定实例中一次只使用一个声明的字段。联合体主要用于与 C 代码中的联合体交互。访问联合体字段是不安全的，因为 Rust 无法保证当前存储在联合体实例中的数据类型。你可以在 [Rust 参考文档][unions] 中了解更多关于联合体的信息。

## 使用 Miri 检查 Unsafe 代码

在编写不安全代码时，你可能想检查你编写的内容是否确实是安全和正确的。最好的方法是使用 Miri，一个用于检测未定义行为的官方 Rust 工具。借用检查器是一个 **静态** 工具，在编译时工作，而 Miri 是一个 **动态** 工具，在运行时工作。它通过运行你的程序或其测试套件并检测你何时违反了它理解的关于 Rust 应该如何工作的规则来检查你的代码。

使用 Miri 需要 Rust 的夜间构建版本（我们将在 [附录 G：Rust 是如何制作的以及"Nightly Rust"][nightly] 中更多地讨论）。你可以通过键入 `rustup +nightly component add miri` 来安装 Rust 的夜间版本和 Miri 工具。这不会改变你的项目使用的 Rust 版本；它只将工具添加到你的系统，以便你可以在需要时使用它。你可以通过键入 `cargo +nightly miri run` 或 `cargo +nightly miri test` 在项目上的运行 Miri。

关于这有多么有用的一个例子，考虑当我们针对清单 20-7 运行它时会发生什么。

```console
$ cargo +nightly miri run
   Compiling unsafe-example v0.1.0 (file:///projects/unsafe-example)
    Finished `dev` profile [unoptimized + debuginfo] target(s) in 0.01s
     Running `file:///home/.rustup/toolchains/nightly/bin/cargo-miri runner target/miri/debug/unsafe-example`
warning: integer-to-pointer cast
 --> src/main.rs:5:13
  |
5 |     let r = address as *mut i32;
  |             ^^^^^^^^^^^^^^^^^^^ integer-to-pointer cast
  |
  = help: this program is using integer-to-pointer casts or (equivalently) `ptr::with_exposed_provenance`, which means that Miri might miss pointer bugs in this program
  = help: see https://doc.rust-lang.org/nightly/std/ptr/fn.with_exposed_provenance.html for more details on that operation
  = help: to ensure that Miri does not miss bugs in your program, use Strict Provenance APIs (https://doc.rust-lang.org/nightly/std/ptr/index.html#strict-provenance, https://crates.io/crates/sptr) instead
  = help: you can then set `MIRIFLAGS=-Zmiri-strict-provenance` to ensure you are not relying on `with_exposed_provenance` semantics
  = help: alternatively, `MIRIFLAGS=-Zmiri-permissive-provenance` can disable this warning
  = note: BACKTRACE:
  = note: inside `main` at src/main.rs:5:13: 5:32

error: Undefined Behavior: pointer not dereferenceable: pointer must be dereferenceable for 40000 bytes, but got 0x1234[noalloc] which is a dangling pointer (it has no provenance)
 --> src/main.rs:7:35
  |
7 |     let values: &[i32] = unsafe { slice::from_raw_parts_mut(r, 10000) };
  |                                   ^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^ Undefined Behavior occurred here
  |
  = help: this indicates a bug in the program: it performed an invalid operation, and caused Undefined Behavior
  = help: see https://doc.rust-lang.org/nightly/reference/behavior-considered-undefined.html for further information
  = note: BACKTRACE:
  = note: inside `main` at src/main.rs:7:35: 7:70

note: some details are omitted, run with `MIRIFLAGS=-Zmiri-backtrace=full` for a verbose backtrace

error: aborting due to 1 previous error; 1 warning emitted
```

Miri 正确地警告我们正在将整数转换为指针，这可能是一个问题，但 Miri 无法确定是否存在问题，因为它不知道指针是如何产生的。然后，Miri 返回一个错误，其中清单 20-7 有未定义行为，因为我们有一个悬垂指针。多亏了 Miri，我们现在知道存在未定义行为的风险，我们可以考虑如何使代码安全。在某些情况下，Miri 甚至可以提出如何修复错误的建议。

Miri 不会捕获你在编写不安全代码时可能出错的所有内容。Miri 是一个动态分析工具，因此它只捕获实际运行的代码的问题。这意味着你需要将它与良好的测试技术结合使用，以增加对你编写的不安全代码的信心。Miri 也没有涵盖你的代码可能不合理的每一种可能方式。

换句话说：如果 Miri *确实* 捕获了问题，你就知道有错误，但仅仅因为 Miri *没有* 捕获错误并不意味着没有问题。它可以捕获很多，不过。尝试在本章的其他不安全代码示例上运行它，看看它怎么说！

你可以在 [其 GitHub 仓库][miri] 了解更多关于 Miri 的信息。

## 正确使用 Unsafe 代码

使用 `unsafe` 来使用刚才讨论的五个超能力之一并没有错，甚至不受欢迎，但让 `unsafe` 代码正确更棘手，因为编译器无法帮助维护内存安全。当你有理由使用 `unsafe` 代码时，你可以这样做，并且拥有显式的 `unsafe` 注释使得在问题发生时更容易追踪问题的来源。每当你编写不安全代码时，你可以使用 Miri 来帮助你更有信心，你编写的代码维护了 Rust 的规则。

关于如何有效地与 Unsafe Rust 合作的更深入探索，请阅读 Rust 关于 `unsafe` 的官方指南 [The Rustonomicon][nomicon]。

[dangling-references]: /rust-book/ch04-02-references-and-borrowing#悬空引用
[ABI]: https://doc.rust-lang.org/reference/items/external-blocks.html#abi
[constants]: /rust-book/ch03-01-variables-and-mutability#声明常量
[send-and-sync]: /rust-book/ch16-04-extensible-concurrency-sync-and-send
[the-slice-type]: /rust-book/ch04-03-slices
[unions]: https://doc.rust-lang.org/reference/items/unions.html
[miri]: https://github.com/rust-lang/miri
[nightly]: /rust-book/appendix-07-nightly-rust
[nomicon]: https://doc.rust-lang.org/nomicon/
