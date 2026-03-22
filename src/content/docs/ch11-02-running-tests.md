---
title: 11.2. 控制测试的运行方式
---

正如 `cargo run` 编译你的代码然后运行生成的二进制文件一样，`cargo test` 以测试模式编译你的代码并运行生成的测试二进制文件。`cargo test` 生成的二进制文件的默认行为是并行运行所有测试并捕获测试运行期间生成的输出，阻止输出被显示，使与测试结果相关的输出更易于阅读。然而，你可以指定命令行选项来改变这个默认行为。

一些命令行选项传递给 `cargo test`，一些传递给生成的测试二进制文件。为了分隔这两种类型的参数，你列出传递给 `cargo test` 的参数，后跟分隔符 `--`，然后是传递给测试二进制文件的参数。运行 `cargo test --help` 显示你可以与 `cargo test` 一起使用的选项，运行 `cargo test -- --help` 显示你可以在使用分隔符之后使用的选项。这些选项也在[_`rustc` 手册_][tests]的「Tests」部分中记录。

[tests]: https://doc.rust-lang.org/rustc/tests/index.html

### 并行或连续运行测试

当你运行多个测试时，默认情况下它们使用线程并行运行，这意味着它们完成运行得更快，你能更快得到反馈。因为测试是同时运行的，你必须确保你的测试不依赖于彼此或任何共享状态，包括共享环境，例如当前工作目录或环境变量。

例如，假设你的每个测试都运行一些代码，在磁盘上创建一个名为 _test-output.txt_ 的文件并向该文件写入一些数据。然后，每个测试读取该文件中的数据并断言文件包含一个特定的值，每个测试的值都不同。因为测试是同时运行的，一个测试可能在 [_`rustc` 手册_]��一个测试写入和读取文件之间的时间覆盖该文件。然后第二个测试将失败，不是因为代码不正确，而是因为测试在 [_`rustc` 手册_]��行运行时相互干扰。一个解决方案是确保每个测试写入不同的文件；另一个解决方案是一次运行一个测试。

如果你不想并行运行测试，或者你想更细粒度地控制使用的线程数，你可以将 `--test-threads` 标志和你想要使用的线程数发送给测试二进制文件。看看下面的示例：

```console
$ cargo test -- --test-threads=1
```

我们将测试线程数设置为 `1`，告诉程序不要使用任何并行性。使用一个线程运行测试将比并行运行花费更长的时间，但如果测试共享状态，它们不会相互干扰。

### 显示函数输出

默认情况下，如果测试通过，Rust 的测试库会捕获打印到标准输出的任何内容。例如，如果我们在 [_`rustc` 手册_]��试中调用 `println!` 并且测试通过，我们在终端中看不到 `println!` 的输出；我们只看到指示测试通过的那一行。如果测试失败，我们会看到与失败消息的其余部分一起打印到标准输出的任何内容。

作为示例，清单 11-10 有一个愚蠢的函数，它打印其参数的值并返回 10，以及一个通过的测试和一个失败的测试。

**清单 11-10**：调用 `println!` 的函数的测试（*文件名：src/lib.rs*）

```rust
fn prints_and_returns_10(a: i32) -> i32 {
    println!("I got the value {a}");
    10
}

#[cfg(test)]
mod tests {
    use super::*;

    #[test]
    fn this_test_will_pass() {
        let value = prints_and_returns_10(4);
        assert_eq!(value, 10);
    }

    #[test]
    fn this_test_will_fail() {
        let value = prints_and_returns_10(8);
        assert_eq!(value, 5);
    }
}
```

当我们用 `cargo test` 运行这些测试时，我们会看到以下输出：

```console
$ cargo test
   Compiling silly-function v0.1.0 (file:///projects/silly-function)
    Finished `test` profile [unoptimized + debuginfo] target(s) in 0.58s
     Running unittests src/lib.rs (target/debug/deps/silly_function-160869f38cff9166)

running 2 tests
test tests::this_test_will_fail ... FAILED
test tests::this_test_will_pass ... ok

failures:

---- tests::this_test_will_pass stdout ----
I got the value 8

thread 'tests::this_test_will_fail' panicked at src/lib.rs:19:9:
assertion `left == right` failed
  left: 10
 right: 5
note: run with `RUST_BACKTRACE=1` environment variable to display a backtrace


failures:
    tests::this_test_will_fail

test result: FAILED. 1 passed; 1 failed; 0 ignored; 0 measured; 0 filtered out; finished in 0.00s

error: test failed, to rerun pass `--lib`
```

注意在这个输出中我们哪里都看不到 `I got the value 4`，这是通过的测试运行时打印的。该输出已被捕获。失败的测试的输出 `I got the value 8` 出现在 [_`rustc` 手册_]��试摘要输出的部分中，这也显示了测试失败的原因。

如果我们想要看到通过的测试的打印值，我们可以使用 `--show-output` 告诉 Rust 也显示成功测试的输出：

```console
$ cargo test -- --show-output
```

当我们使用 `--show-output` 标志再次运行清单 11-10 中的测试时，我们会看到以下输出：

```console
$ cargo test -- --show-output
   Compiling silly-function v0.1.0 (file:///projects/silly-function)
    Finished `test` profile [unoptimized + debuginfo] target(s) in 0.60s
     Running unittests src/lib.rs (target/debug/deps/silly_function-160869f38cff9166)

running 2 tests
test tests::this_test_will_fail ... FAILED
test tests::this_test_will_pass ... ok

successes:

---- tests::this_test_will_pass stdout ----
I got the value 4


successes:
    tests::this_test_will_pass

failures:

---- tests::this_test_will_fail stdout ----
I got the value 8

thread 'tests::this_test_will_fail' panicked at src/lib.rs:19:9:
assertion `left == right` failed
  left: 10
 right: 5
note: run with `RUST_BACKTRACE=1` environment variable to display a backtrace


failures:
    tests::this_test_will_fail

test result: FAILED. 1 passed; 1 failed; 0 ignored; 0 measured; 0 filtered out; finished in 0.00s

error: test failed, to rerun pass `--lib`
```

### 按名称运行测试的子集

运行完整的测试套件有时可能需要很长时间。如果你正在 [_`rustc` 手册_]��理特定区域的代码，你可能只想运行与该代码相关的测试。你可以通过将你想要运行的测试的名称或名称作为参数传递给 `cargo test` 来选择运行哪些测试。

为了演示如何运行测试的子集，我们将首先为 `add_two` 函数创建三个测试，如清单 11-11 所示，然后选择运行哪些测试。

**清单 11-11**：三个不同名称的测试（*文件名：src/lib.rs*）

```rust
pub fn add_two(a: u64) -> u64 {
    a + 2
}

#[cfg(test)]
mod tests {
    use super::*;

    #[test]
    fn add_two_and_two() {
        let result = add_two(2);
        assert_eq!(result, 4);
    }

    #[test]
    fn add_three_and_two() {
        let result = add_two(3);
        assert_eq!(result, 5);
    }

    #[test]
    fn one_hundred() {
        let result = add_two(100);
        assert_eq!(result, 102);
    }
}
```

如果我们不传递任何参数运行测试，就像我们之前看到的那样，所有测试将并行运行：

```console
$ cargo test
   Compiling adder v0.1.0 (file:///projects/adder)
    Finished `test` profile [unoptimized + debuginfo] target(s) in 0.62s
     Running unittests src/lib.rs (target/debug/deps/adder-92948b65e88960b4)

running 3 tests
test tests::add_three_and_two ... ok
test tests::add_two_and_two ... ok
test tests::one_hundred ... ok

test result: ok. 3 passed; 0 failed; 0 ignored; 0 measured; 0 filtered out; finished in 0.00s

   Doc-tests adder

running 0 tests

test result: ok. 0 passed; 0 failed; 0 ignored; 0 measured; 0 filtered out; finished in 0.00s
```

#### 运行单个测试

我们可以将任何测试函数的名称传递给 `cargo test` 来只运行那个测试：

```console
$ cargo test one_hundred
   Compiling adder v0.1.0 (file:///projects/adder)
    Finished `test` profile [unoptimized + debuginfo] target(s) in 0.69s
     Running unittests src/lib.rs (target/debug/deps/adder-92948b65e88960b4)

running 1 test
test tests::one_hundred ... ok

test result: ok. 1 passed; 0 failed; 0 ignored; 0 measured; 2 filtered out; finished in 0.00s
```

只有名为 `one_hundred` 的测试运行了；其他两个测试没有匹配那个名称。测试输出通过在 [_`rustc` 手册_]��尾显示 `2 filtered out` 让我们知道还有更多测试没有运行。

我们不能用这种方式指定多个测试的名称；只有给 `cargo test` 的第一个值会被使用。但有一种方法可以运行多个测试。

#### 过滤以运行多个测试

我们可以指定测试名称的一部分，任何名称匹配该值的测试都将运行。例如，因为我们的两个测试名称包含 `add`，我们可以通过运行 `cargo test add` 来运行这两个测试：

```console
$ cargo test add
   Compiling adder v0.1.0 (file:///projects/adder)
    Finished `test` profile [unoptimized + debuginfo] target(s) in 0.61s
     Running unittests src/lib.rs (target/debug/deps/adder-92948b65e88960b4)

running 2 tests
test tests::add_three_and_two ... ok
test tests::add_two_and_two ... ok

test result: ok. 2 passed; 0 failed; 0 ignored; 0 measured; 1 filtered out; finished in 0.00s
```

这个命令运行了名称中包含 `add` 的所有测试，并过滤掉了名为 `one_hundred` 的测试。还要注意，测试出现的模块成为测试名称的一部分，因此我们可以通过过滤模块名称来运行模块中的所有测试。

### 除非特别要求否则忽略测试

有时，一些特定的测试可能非常耗时，因此你可能想在 [_`rustc` 手册_]��多数 `cargo test` 运行期间排除它们。与其列出你想要运行的所有测试作为参数，不如使用 `ignore` 属性来注解耗时的测试以排除它们，如下所示：

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

    #[test]
    #[ignore]
    fn expensive_test() {
        // 运行一个小时的代码
    }
}
```

在 [_`rustc` 手册_]`#[test]` 之后，我们将 `#[ignore]` 这一行添加到我们想要排除的测试中。现在 [_`rustc` 手册_]��我们运行测试时，`it_works` 运行了，但 `expensive_test` 没有：

```console
$ cargo test
   Compiling adder v0.1.0 (file:///projects/adder)
    Finished `test` profile [unoptimized + debuginfo] target(s) in 0.60s
     Running unittests src/lib.rs (target/debug/deps/adder-92948b65e88960b4)

running 2 tests
test tests::expensive_test ... ignored
test tests::it_works ... ok

test result: ok. 1 passed; 0 failed; 1 ignored; 0 measured; 0 filtered out; finished in 0.00s

   Doc-tests adder

running 0 tests

test result: ok. 0 passed; 0 failed; 0 ignored; 0 measured; 0 filtered out; finished in 0.00s
```

`expensive_test` 函数被列为 `ignored`。如果我们只想运行被忽略的测试，我们可以使用 `cargo test -- --ignored`：

```console
$ cargo test -- --ignored
   Compiling adder v0.1.0 (file:///projects/adder)
    Finished `test` profile [unoptimized + debuginfo] target(s) in 0.61s
     Running unittests src/lib.rs (target/debug/deps/adder-92948b65e88960b4)

running 1 test
test tests::expensive_test ... ok

test result: ok. 1 passed; 0 failed; 0 ignored; 0 measured; 1 filtered out; finished in 0.00s

   Doc-tests adder

running 0 tests

test result: ok. 0 passed; 0 failed; 0 ignored; 0 measured; 0 filtered out; finished in 0.00s
```

通过控制运行哪些测试，你可以确保你的 `cargo test` 结果能快速返回。当你处于检查 `ignored` 测试结果有意义且有等待结果的时间时，你可以运行 `cargo test -- --ignored`。如果你想运行所有测试，无论它们是否被忽略，你可以运行 `cargo test -- --include-ignored`。
