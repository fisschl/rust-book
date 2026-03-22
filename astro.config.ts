import { defineConfig } from "astro/config";
import starlight from "@astrojs/starlight";

export default defineConfig({
  base: "/rust-book/",
  integrations: [
    starlight({
      title: "Rust 程序设计语言",
      sidebar: [
        { slug: "title-page" },
        { slug: "foreword" },
        { slug: "ch00-00-introduction" },
        {
          label: "1. 开始入门",
          items: [
            { slug: "ch01-00-getting-started" },
            { slug: "ch01-01-installation" },
            { slug: "ch01-02-hello-world" },
            { slug: "ch01-03-hello-cargo" },
          ],
        },
        { slug: "ch02-00-guessing-game-tutorial" },
        {
          label: "3. 通用编程概念",
          items: [
            { slug: "ch03-00-common-programming-concepts" },
            { slug: "ch03-01-variables-and-mutability" },
            { slug: "ch03-02-data-types" },
            { slug: "ch03-03-how-functions-work" },
            { slug: "ch03-04-comments" },
            { slug: "ch03-05-control-flow" },
          ],
        },
        {
          label: "4. 理解所有权",
          items: [
            { slug: "ch04-00-understanding-ownership" },
            { slug: "ch04-01-what-is-ownership" },
            { slug: "ch04-02-references-and-borrowing" },
            { slug: "ch04-03-slices" },
          ],
        },
        {
          label: "5. 使用结构体组织相关联的数据",
          items: [
            { slug: "ch05-00-structs" },
            { slug: "ch05-01-defining-structs" },
            { slug: "ch05-02-example-structs" },
            { slug: "ch05-03-method-syntax" },
          ],
        },
        {
          label: "6. 枚举和模式匹配",
          items: [
            { slug: "ch06-00-enums" },
            { slug: "ch06-01-defining-an-enum" },
            { slug: "ch06-02-match" },
            { slug: "ch06-03-if-let" },
          ],
        },
        {
          label: "7. 使用包、crate 和模块管理项目",
          items: [
            { slug: "ch07-00-managing-growing-projects-with-packages-crates-and-modules" },
            { slug: "ch07-01-packages-and-crates" },
            { slug: "ch07-02-defining-modules-to-control-scope-and-privacy" },
            { slug: "ch07-03-paths-for-referring-to-an-item-in-the-module-tree" },
            { slug: "ch07-04-bringing-paths-into-scope-with-the-use-keyword" },
            { slug: "ch07-05-separating-modules-into-different-files" },
          ],
        },
        {
          label: "8. 常见集合",
          items: [
            { slug: "ch08-00-common-collections" },
            { slug: "ch08-01-vectors" },
            { slug: "ch08-02-strings" },
            { slug: "ch08-03-hash-maps" },
          ],
        },
        {
          label: "9. 错误处理",
          items: [
            { slug: "ch09-00-error-handling" },
            { slug: "ch09-01-unrecoverable-errors-with-panic" },
            { slug: "ch09-02-recoverable-errors-with-result" },
            { slug: "ch09-03-to-panic-or-not-to-panic" },
          ],
        },
        {
          label: "10. 泛型类型、Trait 和生命周期",
          items: [
            { slug: "ch10-00-generics" },
            { slug: "ch10-01-syntax" },
            { slug: "ch10-02-traits" },
            { slug: "ch10-03-lifetime-syntax" },
          ],
        },
        {
          label: "11. 编写自动化测试",
          items: [
            { slug: "ch11-00-testing" },
            { slug: "ch11-01-writing-tests" },
            { slug: "ch11-02-running-tests" },
            { slug: "ch11-03-test-organization" },
          ],
        },
        {
          label: "12. I/O 项目：构建命令行程序",
          items: [
            { slug: "ch12-00-an-io-project" },
            { slug: "ch12-01-accepting-command-line-arguments" },
            { slug: "ch12-02-reading-a-file" },
            { slug: "ch12-03-improving-error-handling-and-modularity" },
            { slug: "ch12-04-testing-the-librarys-functionality" },
            { slug: "ch12-05-working-with-environment-variables" },
            { slug: "ch12-06-writing-to-stderr-instead-of-stdout" },
          ],
        },
        {
          label: "13. Rust 中的函数式语言功能",
          items: [
            { slug: "ch13-00-functional-features" },
            { slug: "ch13-01-closures" },
            { slug: "ch13-02-iterators" },
            { slug: "ch13-03-improving-our-io-project" },
            { slug: "ch13-04-performance" },
          ],
        },
        {
          label: "14. Cargo 的更多内容",
          items: [
            { slug: "ch14-00-more-about-cargo" },
            { slug: "ch14-01-release-profiles" },
            { slug: "ch14-02-publishing-to-crates-io" },
            { slug: "ch14-03-cargo-workspaces" },
            { slug: "ch14-04-installing-binaries" },
            { slug: "ch14-05-extending-cargo" },
          ],
        },
        {
          label: "15. 智能指针",
          items: [
            { slug: "ch15-00-smart-pointers" },
            { slug: "ch15-01-box" },
            { slug: "ch15-02-deref" },
            { slug: "ch15-03-drop" },
            { slug: "ch15-04-rc" },
            { slug: "ch15-05-interior-mutability" },
            { slug: "ch15-06-reference-cycles" },
          ],
        },
        {
          label: "16. 无畏并发",
          items: [
            { slug: "ch16-00-concurrency" },
            { slug: "ch16-01-threads" },
            { slug: "ch16-02-message-passing" },
            { slug: "ch16-03-shared-state" },
            { slug: "ch16-04-extensible-concurrency-sync-and-send" },
          ],
        },
        {
          label: "17. 异步编程",
          items: [
            { slug: "ch17-00-async-await" },
            { slug: "ch17-01-futures-and-syntax" },
            { slug: "ch17-02-concurrency-with-async" },
            { slug: "ch17-03-more-futures" },
            { slug: "ch17-04-streams" },
            { slug: "ch17-05-traits-for-async" },
            { slug: "ch17-06-futures-tasks-threads" },
          ],
        },
        {
          label: "18. 面向对象编程特性",
          items: [
            { slug: "ch18-00-oop" },
            { slug: "ch18-01-what-is-oo" },
            { slug: "ch18-02-trait-objects" },
            { slug: "ch18-03-oo-design-patterns" },
          ],
        },
        {
          label: "19. 模式与匹配",
          items: [
            { slug: "ch19-00-patterns" },
            { slug: "ch19-01-all-the-places-for-patterns" },
            { slug: "ch19-02-refutability" },
            { slug: "ch19-03-pattern-syntax" },
          ],
        },
        {
          label: "20. 高级特性",
          items: [
            { slug: "ch20-00-advanced-features" },
            { slug: "ch20-01-unsafe-rust" },
            { slug: "ch20-02-advanced-traits" },
            { slug: "ch20-03-advanced-types" },
            { slug: "ch20-04-advanced-functions-and-closures" },
            { slug: "ch20-05-macros" },
          ],
        },
        {
          label: "21. 最终项目",
          items: [
            { slug: "ch21-00-final-project-a-web-server" },
            { slug: "ch21-01-single-threaded" },
            { slug: "ch21-02-multithreaded" },
            { slug: "ch21-03-graceful-shutdown-and-cleanup" },
          ],
        },
        {
          label: "22. 附录",
          items: [
            { slug: "appendix-00" },
            { slug: "appendix-01-keywords" },
            { slug: "appendix-02-operators" },
            { slug: "appendix-03-derivable-traits" },
            { slug: "appendix-04-useful-development-tools" },
            { slug: "appendix-05-editions" },
            { slug: "appendix-06-translation" },
            { slug: "appendix-07-nightly-rust" },
          ],
        },
      ],
    }),
  ],
});
