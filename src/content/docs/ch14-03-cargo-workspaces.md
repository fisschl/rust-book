---
title: Cargo 工作空间
---

在第12章中，我们构建了一个包含二进制 crate 和库 crate 的包。随着你的项目发展，你可能会发现库 crate 变得越来越大，你想进一步将你的包拆分为多个库 crate。Cargo 提供了一个名为 _工作空间_ 的功能，可以帮助管理多个协同开发的相关包。

## 创建工作空间

 _工作空间_ 是一组共享相同 _Cargo.lock_ 和输出目录的包。让我们使用工作空间创建一个项目——我们将使用简单的代码，以便我们可以专注于工作空间的结构。有多种方式可以组织工作空间，所以我们只展示一种常见的方式。我们将有一个包含一个二进制文件和两个库的工作空间。二进制文件将提供主要功能，并将依赖于两个库。一个库将提供 `add_one` 函数，另一个库提供 `add_two` 函数。这三个 crate 将是同一工作空间的一部分。我们首先为工作空间创建一个新目录：

```console
$ mkdir add
$ cd add
```

接下来，在 _add_ 目录中，我们创建将配置整个工作空间的 _Cargo.toml_ 文件。这个文件不会有 `[package]` 部分。相反，它将以 `[workspace]` 部分开始，允许我们向工作空间添加成员。我们还通过在 workspace 中设置 `resolver` 值为 `"3"` 来使用最新最好的 Cargo 解析器算法：

**文件名：Cargo.toml**

```toml
[workspace]
resolver = "3"
```

接下来，我们将在 _add_ 目录中运行 `cargo new` 来创建 `adder` 二进制 crate：

```console
$ cargo new adder
     Created binary (application) `adder` package
      Adding `adder` as member of workspace at `file:///projects/add`
```

在工作空间内运行 `cargo new` 也会自动将新创建的包添加到工作空间 _Cargo.toml_ 中 `[workspace]` 定义的 `members` 键中，如下所示：

```toml
[workspace]
resolver = "3"
members = ["adder"]
```

此时，我们可以通过运行 `cargo build` 来构建工作空间。你 _add_ 目录中的文件应该如下所示：

```text
├── Cargo.lock
├── Cargo.toml
├── adder
│   ├── Cargo.toml
│   └── src
│       └── main.rs
└── target
```

工作空间在顶层有一个 _target_ 目录，编译后的构件将被放入其中；`adder` 包没有自己的 _target_ 目录。即使我们从 _adder_ 目录内运行 `cargo build`，编译后的工件仍然会进入 _add/target_ 而不是 _add/adder/target_。Cargo 像这样构造工作空间中的 _target_ 目录，因为工作空间中的 crate 意味着相互依赖。如果每个 crate 都有自己的 _target_ 目录，每个 crate 都必须重新编译工作空间中的其他 crate，以将工件放入自己的 _target_ 目录中。通过共享一个 _target_ 目录，crate 可以避免不必要的重建。

## 在工作空间中创建第二个包

接下来，让我们在工作空间中创建另一个成员包，并将其命名为 `add_one`。生成一个名为 `add_one` 的新库 crate：

```console
$ cargo new add_one --lib
     Created library `add_one` package
      Adding `add_one` as member of workspace at `file:///projects/add`
```

顶层 _Cargo.toml_ 现在将在 `members` 列表中包含 _add_one_ 路径：

**文件名：Cargo.toml**

```toml
[workspace]
resolver = "3"
members = ["adder", "add_one"]
```

你的 _add_ 目录现在应该有这些目录和文件：

```text
├── Cargo.lock
├── Cargo.toml
├── add_one
│   ├── Cargo.toml
│   └── src
│       └── lib.rs
├── adder
│   ├── Cargo.toml
│   └── src
│       └── main.rs
└── target
```

在 _add_one/src/lib.rs_ 文件中，让我们添加一个 `add_one` 函数：

**文件名：add_one/src/lib.rs**

```rust
pub fn add_one(x: i32) -> i32 {
    x + 1
}
```

现在我们可以让我们的二进制包 `adder` 依赖于拥有我们的库的 `add_one` 包。首先，我们需要在 _adder/Cargo.toml_ 中添加一个对 `add_one` 的路径依赖。

**文件名：adder/Cargo.toml**

```toml
[package]
name = "adder"
version = "0.1.0"
edition = "2024"

[dependencies]
add_one = { path = "../add_one" }
```

Cargo 不假设工作空间中的 crate 会相互依赖，所以我们需要明确依赖关系。

接下来，让我们在 `adder` crate 中使用 `add_one` 函数（来自 `add_one` crate）。打开 _adder/src/main.rs_ 文件并更改 `main` 函数以调用 `add_one` 函数，如代码示例14-7所示。

**代码示例 14-7：在 `adder` crate 中使用 `add_one` 库 crate**

```rust
fn main() {
    let num = 10;
    println!("Hello, world! {num} plus one is {}!", add_one::add_one(num));
}
```

让我们在顶层 _add_ 目录中运行 `cargo build` 来构建工作空间！

```console
$ cargo build
   Compiling add_one v0.1.0 (file:///projects/add/add_one)
   Compiling adder v0.1.0 (file:///projects/add/adder)
    Finished `dev` profile [unoptimized + debuginfo] target(s) in 0.22s
```

要从 _add_ 目录运行二进制 crate，我们可以使用 `-p` 参数指定要运行工作空间中的哪个包，并使用 `cargo run`：

```console
$ cargo run -p adder
    Finished `dev` profile [unoptimized + debuginfo] target(s) in 0.00s
     Running `target/debug/adder`
Hello, world! 10 plus one is 11!
```

这运行了 _adder/src/main.rs_ 中的代码，它依赖于 `add_one` crate。

## 依赖于外部包

注意，工作空间只在顶层有一个 _Cargo.lock_ 文件，而不是在每个 crate 的目录中都有一个 _Cargo.lock_。这确保所有 crate 都使用相同版本的所有依赖项。如果我们将 `rand` 包添加到 _adder/Cargo.toml_ 和 _add_one/Cargo.toml_ 文件中，Cargo 将把这两个都解析为一个版本的 `rand`，并在一个 _Cargo.lock_ 中记录下来。使工作空间中的所有 crate 使用相同的依赖项意味着这些 crate 将始终相互兼容。让我们在 _add_one/Cargo.toml_ 文件的 `[dependencies]` 部分添加 `rand` crate，以便我们可以在 `add_one` crate 中使用 `rand` crate：

**文件名：add_one/Cargo.toml**

```toml
[package]
name = "add_one"
version = "0.1.0"
edition = "2024"

[dependencies]
rand = "0.8.5"
```

我们现在可以在 _add_one/src/lib.rs_ 文件中添加 `use rand;`，在 _add_ 目录中运行 `cargo build` 构建整个工作空间将引入并编译 `rand` crate。我们会得到一个警告，因为我们没有引用我们引入作用域的 `rand`：

```console
$ cargo build
    Updating crates.io index
  Downloaded rand v0.8.5
   --snip--
   Compiling rand v0.8.5
   Compiling add_one v0.1.0 (file:///projects/add/add_one)
warning: unused import: `rand`
 --> add_one/src/lib.rs:1:5
  |
1 | use rand;
  |     ^^^^
  |
  = note: `#[warn(unused_imports)]` on by default

warning: `add_one` (lib) generated 1 warning (run `cargo fix --lib -p add_one` to apply 1 suggestion)
   Compiling adder v0.1.0 (file:///projects/add/adder)
    Finished `dev` profile [unoptimized + debuginfo] target(s) in 0.95s
```

顶层 _Cargo.lock_ 现在包含关于 `add_one` 对 `rand` 的依赖的信息。然而，即使 `rand` 在工作空间的某个地方被使用，除非我们也把 `rand` 添加到它们的 _Cargo.toml_ 文件中，否则我们不能在工作空间的其他 crate 中使用它。例如，如果我们在 `adder` 包的 _adder/src/main.rs_ 文件中添加 `use rand;`，我们会得到一个错误：

```console
$ cargo build
  --snip--
   Compiling adder v0.1.0 (file:///projects/add/adder)
error[E0432]: unresolved import `rand`
 --> adder/src/main.rs:2:5
  |
2 | use rand;
  |     ^^^^ no external crate `rand`
```

为了解决这个问题，编辑 `adder` 包的 _Cargo.toml_ 文件，并指明 `rand` 也是它的依赖项。构建 `adder` 包将把 `rand` 添加到 _Cargo.lock_ 中 `adder` 的依赖列表中，但不会下载额外的 `rand` 副本。Cargo 将确保只要它们指定兼容版本的 `rand`，工作空间中每个包的每个使用 `rand` 包的 crate 都将使用相同的版本，从而节省空间并确保工作空间中的 crate 彼此兼容。

如果工作空间中的 crate 指定了相同依赖项的不兼容版本，Cargo 将分别解析它们，但仍会尝试尽可能少地解析版本。

## 向工作空间添加测试

为了另一个增强，让我们在 `add_one` crate 中添加 `add_one::add_one` 函数的测试：

**文件名：add_one/src/lib.rs**

```rust
pub fn add_one(x: i32) -> i32 {
    x + 1
}

#[cfg(test)]
mod tests {
    use super::*;

    #[test]
    fn it_works() {
        assert_eq!(3, add_one(2));
    }
}
```

现在在顶层 _add_ 目录中运行 `cargo test`。在这样的工作空间中运行 `cargo test` 将运行工作空间中所有 crate 的测试：

```console
$ cargo test
   Compiling add_one v0.1.0 (file:///projects/add/add_one)
   Compiling adder v0.1.0 (file:///projects/add/adder)
    Finished `test` profile [unoptimized + debuginfo] target(s) in 0.20s
     Running unittests src/lib.rs (target/debug/deps/add_one-93c49ee75dc46543)

running 1 test
test tests::it_works ... ok

test result: ok. 1 passed; 0 failed; 0 ignored; 0 measured; 0 filtered out; finished in 0.00s

     Running unittests src/main.rs (target/debug/deps/adder-3a47283c568d2b6a)

running 0 tests

test result: ok. 0 passed; 0 failed; 0 ignored; 0 measured; 0 filtered out; finished in 0.00s

   Doc-tests add_one

running 0 tests

test result: ok. 0 passed; 0 failed; 0 ignored; 0 measured; 0 filtered out; finished in 0.00s
```

输出的第一部分显示 `add_one` crate 中的 `it_works` 测试通过了。下一部分显示在 `adder` crate 中找不到测试，然后最后一部分显示在 `add_one` crate 中找不到文档测试。

我们还可以从顶层目录中使用 `-p` 标志指定我们想要测试的 crate 名称，来运行工作空间中某个特定 crate 的测试：

```console
$ cargo test -p add_one
    Finished `test` profile [unoptimized + debuginfo] target(s) in 0.00s
     Running unittests src/lib.rs (target/debug/deps/add_one-93c49ee75dc46543)

running 1 test
test tests::it_works ... ok

test result: ok. 1 passed; 0 failed; 0 ignored; 0 measured; 0 filtered out; finished in 0.00s

   Doc-tests add_one

running 0 tests

test result: ok. 0 passed; 0 failed; 0 ignored; 0 measured; 0 filtered out; finished in 0.00s
```

此输出显示 `cargo test` 只运行了 `add_one` crate 的测试，没有运行 `adder` crate 的测试。

如果你将工作空间中的 crate 发布到 [crates.io](https://crates.io/)，工作空间中的每个 crate 都需要单独发布。像 `cargo test` 一样，我们可以使用 `-p` 标志并指定我们想要发布的 crate 名称来发布工作空间中的特定 crate。

为了额外练习，以与 `add_one` crate 类似的方式向此工作空间添加一个 `add_two` crate！

随着项目的发展，考虑使用工作空间：它使你能够使用比一大块代码更小、更易理解的组件。此外，如果 crate 经常同时更改，将 crate 保留在工作空间中可以使 crate 之间的协调更容易。
