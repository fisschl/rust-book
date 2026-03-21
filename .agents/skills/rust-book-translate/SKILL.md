---
name: rust-book-translate
description: Rust Book 中文翻译技能，包含术语表和教训记录。
---

# Rust Book 翻译

## 经验教训（2025-03-21）

### 关键发现
1. **必须添加 frontmatter** - Astro Starlight 要求每个 `.md` 文件包含 `title:`
2. **首页单独处理** - `index.md` 使用 `template: splash`，不加入侧边栏
3. **链接格式** - `["安装"]` 是错误的，应为 `[安装]`
4. **导航配置** - 顶级页面直接作为数组项，不需要嵌套 `label/items`

### 常见陷阱
- 忘记检查 `bun run dev` 错误提示
- 修改后未验证链接是否可点击
- 术语不一致（如 "trait" 有时译成 "特性"）

## 快速开始

1. 检查原文：`book-main/src/` 下对应文件
2. 创建文件：`src/content/docs/<原文件名>`
3. 添加 frontmatter：
   ```yaml
   ---
   title: 页面标题
   ---
   ```
4. 翻译内容，保留格式
5. 更新 `astro.config.ts` sidebar 添加新页面
6. 运行 `bun run dev` 验证

## 核心术语

**保留英文：** trait, crate, Cargo, Ferris, panic, Rust
**标准译法：**
- ownership → 所有权
- borrowing → 借用
- lifetimes → 生命周期
- generics → 泛型
- closures → 闭包

## 格式规则

| 元素 | 处理 |
|------|------|
| 代码块 | 原样保留 |
| `<!-- ignore -->` | 保留 |
| `[text][ref]` | 保留链接语法 |
| `<span id="...">` | 保留 HTML |
| `*italic*` | 保留斜体 |
| `**bold**` | 保留粗体 |

## 检查清单

- [ ] frontmatter 包含 title
- [ ] 无 `"["文本"]` 错误链接
- [ ] 术语与术语表一致
- [ ] 代码未翻译
- [ ] Ferris 图片路径正确
- [ ] `bun run dev` 无报错
