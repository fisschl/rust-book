import { defineConfig } from "astro/config";
import starlight from "@astrojs/starlight";

export default defineConfig({
  base: "/rust-book/",
  integrations: [
    starlight({
      title: "Rust 程序设计语言",
      sidebar: [
        { label: "Rust 程序设计语言", slug: "title-page" },
        { label: "前言", slug: "foreword" },
        { label: "介绍", slug: "ch00-00-introduction" },
        {
          label: "开始入门",
          items: [
            { label: "概述", slug: "ch01-00-getting-started" },
            { label: "安装", slug: "ch01-01-installation" },
            { label: "Hello, world!", slug: "ch01-02-hello-world" },
            { label: "Hello, Cargo!", slug: "ch01-03-hello-cargo" },
          ],
        },
        { label: "编写猜数字游戏", slug: "ch02-00-guessing-game-tutorial" },
        {
          label: "通用编程概念",
          items: [
            { label: "概述", slug: "ch03-00-common-programming-concepts" },
            { label: "变量与可变性", slug: "ch03-01-variables-and-mutability" },
            { label: "数据类型", slug: "ch03-02-data-types" },
            { label: "函数", slug: "ch03-03-how-functions-work" },
            { label: "注释", slug: "ch03-04-comments" },
            { label: "控制流", slug: "ch03-05-control-flow" },
          ],
        },
        {
          label: "理解所有权",
          items: [
            { label: "概述", slug: "ch04-00-understanding-ownership" },
            { label: "什么是所有权？", slug: "ch04-01-what-is-ownership" },
          ],
        },
      ],
    }),
  ],
});
