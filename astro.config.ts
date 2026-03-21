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
      ],
    }),
  ],
});
