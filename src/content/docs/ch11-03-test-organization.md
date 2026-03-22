---
title: 11.3. 测试的组织结构
---

正如本章开头提到的，测试是一个复杂的学科，不同的人使用不同的术语和组织方式。Rust 社区主要从两个主要类别来考虑测试：单元测试和集成测试。 _单元测试_ 小而专注，一次测试一个模块，可以测试私有接口。 _集成测试_ 完全在你的库外部，以任何其他外部代码使用你的代码的方式使用它，只使用公共接口，可能每个测试都练习多个模块。

编写这两种测试对于确保你的库的各个部分在单独和一起时都能按你的预期工作很重要。

### 单元测试

单元测试的目的是在隔离其他代码的情况下测试每个代码单元，以快速 pinpoint 代码在哪里工作正常和在哪里没有按预期工作。你将单元测试放在 _src_ 目录下的每个文件中，与它们正在测试的代码放在一起。约定是在每个文件中创建一个名为 `tests` 的模块来包含测试函数，并用 `cfg(test)` 注解该模块。

#### `tests` 模块和 `#[cfg(test)]`

`tests` 模块上的 `#[cfg(test)]` 注解告诉 Rust 只在运行 `cargo test` 时编译和运行测试代码，而不是在运行 `cargo build` 时。这在你只想构建库时节省编译时间，并且节省生成的编译产物中的空间，因为测试不包括在内。你会看到，因为集成测试放在不同的目录中，它们不需要 `#[cfg(test)]` 注解。然而，因为单元测试与代码放在同一个文件中，你会使用 `#[cfg(test)]` 来指定它们不应该包含在编译结果中。

回想一下，当我们在本章的第一节生成新的 `adder` 项目时，Cargo 为我们生成了这段代码：

*文件名：src/lib.rs*

```rust
pub fn add(left: u64, right: u64) -> u64 {
    left + right
}

#[cfg(test)]
mod tests {
    use super::*;

    #[test]
    fn it_works() {
        let result = add(2, 2);
        assert_eq!(result, 4);
    }
}
```

在自动生成的 `tests` 模块上，属性 `cfg` 代表 _配置_ ，告诉 Rust 只有在给定某个配置选项时，才应该包含以下项目。在这种情况下，配置选项是 `test`，这是 Rust 为编译和运行测试提供的。通过使用 `cfg` 属性，Cargo 只有在我们主动使用 `cargo test` 运行测试时才编译我们的测试代码。这包括该模块内可能存在的任何辅助函数，以及用 `#[test]` 注解的函数。

#### 私有函数测试

测试社区内对是否应该直接测试私有函数存在争论，而其他语言使测试私有函数变得困难或不可能。无论你遵循哪种测试意识形态，Rust 的隐私规则确实允许你测试私有函数。考虑清单 11-12 中带有私有函数 `internal_adder` 的代码。

**清单 11-12**：测试私有函数（*文件名：src/lib.rs*）

```rust
pub fn add_two(a: u64) -> u64 {
    internal_adder(a, 2)
}

fn internal_adder(left: u64, right: u64) -> u64 {
    left + right
}

#[cfg(test)]
mod tests {
    use super::*;

    #[test]
    fn internal() {
        let result = internal_adder(2, 2);
        assert_eq!(result, 4);
    }
}
```

注意 `internal_adder` 函数没有标记为 `pub`。测试只是 Rust 代码，`tests` 模块只是另一个模块。正如我们在[「路径引用模块树中的项」][paths]中讨论的，子模块中的项可以使用其祖先模块中的项。在这个测试中，我们用 `use super::*` 将属于 `tests` 模块父模块的所有项引入作用域，然后测试可以调用 `internal_adder`。如果你认为不应该测试私有函数，Rust 中没有什么会强迫你这样做。

### 集成测试

在 Rust 中，集成测试完全在你的库外部。它们以任何其他代码使用你的库的方式使用它，这意味着它们只能调用作为你库公共 API 一部分的函数。它们的目的是测试你库的许多部分是否能正确协同工作。单独正常工作的代码单元在集成时可能有问题，因此对集成代码的测试覆盖也很重要。要创建集成测试，你首先需要一个 _tests_ 目录。

#### _tests_ 目录

我们在项目目录的顶层创建 _tests_ 目录，与 _src_ 同级。Cargo 知道在这个目录中查找集成测试文件。然后我们可以创建任意数量的测试文件，Cargo 会将每个文件编译为一个单独的 crate。

让我们创建一个集成测试。清单 11-12 中的代码仍然在 _src/lib.rs_ 文件中，创建一个 _tests_ 目录，并创建一个名为 _tests/integration_test.rs_ 的新文件。你的目录结构应该如下所示：

```text
adder
├── Cargo.lock
├── Cargo.toml
├── src
│   └── lib.rs
└── tests
    └── integration_test.rs
```

将清单 11-13 中的代码输入到 _tests/integration_test.rs_ 文件中。

**清单 11-13**：`adder` crate 中函数的集成测试（*文件名：tests/integration_test.rs*）

```rust
use adder::add_two;

#[test]
fn it_adds_two() {
    let result = add_two(2);
    assert_eq!(result, 4);
}
```

_tests_ 目录中的每个文件都是一个单独的 crate，因此我们需要将我们的库引入每个测试 crate 的作用域。因此，我们在代码顶部添加 `use adder::add_two;`，这在单元测试中是不需要的。

我们不需要用 `#[cfg(test)]` 注解 _tests/integration_test.rs_ 中的任何代码。Cargo 特殊对待 _tests_ 目录，只有在我们运行 `cargo test` 时才编译该目录中的文件。现在运行 `cargo test`：

```console
$ cargo test
   Compiling adder v0.1.0 (file:///projects/adder)
    Finished `test` profile [unoptimized + debuginfo] target(s) in 1.31s
     Running unittests src/lib.rs (target/debug/deps/adder-1082c4b063a8fbe6)

running 1 test
test tests::internal ... ok

test result: ok. 1 passed; 0 failed; 0 ignored; 0 measured; 0 filtered out; finished in 0.00s

     Running tests/integration_test.rs (target/debug/deps/integration_test-1082c4b063a8fbe6)

running 1 test
test it_adds_two ... ok

test result: ok. 1 passed; 0 failed; 0 ignored; 0 measured; 0 filtered out; finished in 0.00s

   Doc-tests adder

running 0 tests

test result: ok. 0 passed; 0 failed; 0 ignored; 0 measured; 0 filtered out; finished in 0.00s
```

输出的三个部分包括单元测试、集成测试和文档测试。注意，如果某个部分的任何测试失败，后续部分将不会运行。例如，如果单元测试失败，将不会有集成和文档测试的输出，因为只有在所有单元测试都通过时才会运行这些测试。

单元测试的第一部分与我们一直看到的一样：每个单元测试一行（在清单 11-12 中添加的一个名为 `internal` 的测试），然后是单元测试的摘要行。

集成测试部分以行 `Running tests/integration_test.rs` 开始。接下来，该集成测试中的每个测试函数有一行，以及在 `Doc-tests adder` 部分开始之前的集成测试结果摘要行。

每个集成测试文件都有自己的部分，因此如果我们在 _tests_ 目录中添加更多文件，将会有更多的集成测试部分。

我们仍然可以通过将测试函数的名称指定为 `cargo test` 的参数来运行特定的集成测试函数。要运行特定集成测试文件中的所有测试，使用 `cargo test` 的 `--test` 参数后跟文件名：

```console
$ cargo test --test integration_test
   Compiling adder v0.1.0 (file:///projects/adder)
    Finished `test` profile [unoptimized + debuginfo] target(s) in 0.64s
     Running tests/integration_test.rs (target/debug/deps/integration_test-82e7799c1bc62298)

running 1 test
test it_adds_two ... ok

test result: ok. 1 passed; 0 failed; 0 ignored; 0 measured; 0 filtered out; finished in 0.00s
```

这个命令只运行 _tests/integration_test.rs_ 文件中的测试。

#### 集成测试中的子模块

随着你添加更多的集成测试，你可能希望在 _tests_ 目录中创建更多的文件来帮助组织它们；例如，你可以按它们正在测试的功能对测试函数进行分组。如前所述，_tests_ 目录中的每个文件都被编译为它自己的单独 crate，这对于创建单独的作用域以更紧密地模仿最终用户使用你的 crate 的方式很有用。然而，这意味着 _tests_ 目录中的文件不像 _src_ 中的文件那样共享相同的行为，正如你在第 7 章中学到的关于如何将代码分离成模块和文件的内容。

_tests_ 目录文件的不同行为在你有一组辅助函数要在多个集成测试文件中使用，并且你尝试按照第 7 章的[「将模块拆分到不同文件」][separating-modules-into-files]部分中的步骤将它们提取到一个公共模块中时最为明显。例如，如果我们创建 _tests/common.rs_ 并在其中放置一个名为 `setup` 的函数，我们可以向 `setup` 添加一些我们希望在多个测试文件的多个测试函数中调用的代码：

*文件名：tests/common.rs*

```rust
pub fn setup() {
    // 专属于你的库测试的设置代码放在这里
}
```

当我们再次运行测试时，我们会在测试输出中看到 _common.rs_ 文件的新部分，即使这个文件不包含任何测试函数，我们也没有从任何地方调用 `setup` 函数：

```console
$ cargo test
   Compiling adder v0.1.0 (file:///projects/adder)
    Finished `test` profile [unoptimized + debuginfo] target(s) in 0.89s
     Running unittests src/lib.rs (target/debug/deps/adder-92948b65e88960b4)

running 1 test
test tests::internal ... ok

test result: ok. 1 passed; 0 failed; 0 ignored; 0 measured; 0 filtered out; finished in 0.00s

     Running tests/common.rs (target/debug/deps/common-92948b65e88960b4)

running 0 tests

test result: ok. 0 passed; 0 failed; 0 ignored; 0 measured; 0 filtered out; finished in 0.00s

     Running tests/integration_test.rs (target/debug/deps/integration_test-92948b65e88960b4)

running 1 test
test it_adds_two ... ok

test result: ok. 1 passed; 0 failed; 0 ignored; 0 measured; 0 filtered out; finished in 0.00s

   Doc-tests adder

running 0 tests

test result: ok. 0 passed; 0 failed; 0 ignored; 0 measured; 0 filtered out; finished in 0.00s
```

在测试结果中让 `common` 出现并显示 `running 0 tests` 不是我们想要的。我们只是想与其他集成测试文件共享一些代码。为了避免 `common` 出现在测试输出中，我们不创建 _tests/common.rs_，而是创建 _tests/common/mod.rs_。项目目录现在看起来像这样：

```text
├── Cargo.lock
├── Cargo.toml
├── src
│   └── lib.rs
└── tests
    ├── common
    │   └── mod.rs
    └── integration_test.rs
```

这是 Rust 也理解的旧命名约定，我们在第 7 章的[「替代文件路径」][alt-paths]中提到过。以这种方式命名文件告诉 Rust 不要将 `common` 模块视为集成测试文件。当我们将 `setup` 函数代码移入 _tests/common/mod.rs_ 并删除 _tests/common.rs_ 文件时，测试输出中的部分将不再出现。_tests_ 目录子目录中的文件不会被编译为单独的 crate，也不会在测试输出中有部分。

在我们创建了 _tests/common/mod.rs_ 之后，我们可以从任何集成测试文件中将其用作模块。以下是从 _tests/integration_test.rs_ 中的 `it_adds_two` 测试调用 `setup` 函数的示例：

*文件名：tests/integration_test.rs*

```rust
use adder::add_two;

mod common;

#[test]
fn it_adds_two() {
    common::setup();

    let result = add_two(2);
    assert_eq!(result, 4);
}
```

注意 `mod common;` 声明与我们在清单 7-21 中演示的模块声明相同。然后，在测试函数中，我们可以调用 `common::setup()` 函数。

#### 二进制 crate 的集成测试

如果我们的项目是一个只包含 _src/main.rs_ 文件而没有 _src/lib.rs_ 文件的二进制 crate，我们不能在 _tests_ 目录中创建集成测试，也不能使用 `use` 语句将 _src/main.rs_ 文件中定义的函数引入作用域。只有库 crate 暴露其他 crate 可以使用的函数；二进制 crate 意味着要独立运行。

这是提供二进制的 Rust 项目具有简单明了的 _src/main.rs_ 文件的原因之一，该文件调用位于 _src/lib.rs_ 文件中的逻辑。使用这种结构，集成测试 _可以_ 使用 `use` 来测试库 crate，使重要功能可用。如果重要功能正常工作，_src/main.rs_ 文件中的少量代码也将正常工作，而那少量代码不需要测试。

## 总结

Rust 的测试功能提供了一种指定代码应该如何工作以确保它在你进行更改时继续按你预期的方式工作的方法。单元测试练习库的不同部分，可以测试私有实现细节。集成测试检查库的许多部分是否能正确协同工作，它们使用库的公共 API 以与外部代码使用它的相同方式测试代码。即使 Rust 的类型系统和所有权规则有助于防止某些类型的 bug，测试对于减少与代码预期行为有关的逻辑 bug 仍然很重要。

让我们结合你在本章和前几章中学到的知识来处理一个项目！

[paths]: /rust-book/ch07-03-paths-for-referring-to-an-item-in-the-module-tree/
[separating-modules-into-files]: /rust-book/ch07-05-separating-modules-into-different-files/
[alt-paths]: /rust-book/ch07-05-separating-modules-into-different-files/#替代文件路径
