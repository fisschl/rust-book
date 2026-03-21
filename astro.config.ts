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
      ],
    }),
  ],
});
