---
name: rust-book-translate
description: Rust Book Chinese translation skill, including glossary, formatting rules, and lessons learned.
---

# Rust Book Translation

Guide for translating Rust Book to Chinese using Astro Starlight.

## Quick Start

1. Check original: file in `book-main/src/`
2. Create file: `src/content/docs/<original-filename>`
3. Add frontmatter:
   ```yaml
   ---
   title: 中文标题
   ---
   ```
4. Translate content, preserve code and formatting
5. Update `astro.config.ts` sidebar to add new page
6. Run `bun run dev` to verify

## Critical Rules (Will Break Site If Wrong)

### Internal Links (Absolute Paths Required)

**❌ Never use relative paths like `./filename`**

In Astro Starlight with `base: "/rust-book/"`:
- ❌ `./ch01-01-installation` - Breaks when URL has trailing slash
- ✅ `/rust-book/ch01-01-installation` - Works in all cases

**Why:** When page is accessed with trailing slash (e.g., `/ch01-02-hello-world/`), relative paths resolve as `/ch01-02-hello-world/ch01-01-installation` instead of `/rust-book/ch01-01-installation`.

**Link Targets:**
- Translated chapters: `/rust-book/<slug>`
- Untranslated chapters: `https://doc.rust-lang.org/book/<path>`
- Standard library: `../std/...` (points to official Rust docs)

**Anchor Links:**
- Use Chinese anchors matching translated headings
- Example: `#遮蔽shadowing` (not `#shadowing`)

**Link Reference Format:**
```markdown
<!-- Correct -->
[variables-and-mutability]: /rust-book/ch03-01-variables-and-mutability
[shadowing]: /rust-book/ch03-01-variables-and-mutability#遮蔽shadowing
[enums]: https://doc.rust-lang.org/book/ch06-00-enums.html

<!-- Wrong - will cause 404 with trailing slash -->
[variables-and-mutability]: ./ch03-01-variables-and-mutability
```

### Chinese Text Formatting (Spaces Required)

**Problem:** When Chinese characters are directly adjacent to formatting markers, parsers may fail to render them correctly.

**Wrong (may not render):**
```markdown
是_泛型_：具体类型的抽象替身
在**附录 F**中
```

**Correct (always renders):**
```markdown
是 _泛型_ ：具体类型的抽象替身
在 **附录 F** 中
```

**Rules:**
- Chinese char + `_` → Add space: `是 _` (not `是_`)
- `_` + Chinese punctuation → Add space: `_ ：` (not `_:`)
- Chinese char + `**` → Add space: `在 **` (not `在**`)
- `**` + Chinese char → Add space: `** 中` (not `**中`)

### Remove MDbook Markup

MDbook-specific elements must be converted to standard Markdown:

| MDbook Element | Convert To | Notes |
|---------------|-----------|-------|
| `<!-- ignore -->` | Remove | Link checker hint, not needed |
| `<Listing number="X-Y">` | `**代码示例 X-Y**：描述` | Before code block |
| `<a id="...">` | Remove | Anchor compatibility not needed |
| `<span class="filename">` | `*文件名: path*` | Italic text |

**Example:**
```markdown
<!-- BEFORE (MDbook) -->
<Listing number="1-1" file-name="main.rs" caption="A program...">
```rust
fn main() {}
```
</Listing>

<!-- AFTER (Standard) -->
**代码示例 1-1**：一个程序...（文件名：*main.rs*）
```rust
fn main() {}
```
```

## Formatting Rules

| Element | Handling | Notes |
|---------|----------|-------|
| **Frontmatter** | Required | Every `.md` file needs `title:` |
| **Homepage** | Use `template: splash` | `index.md` not in sidebar |
| **Links** | `[Text]` not `["Text"]` | No quotes in link text |
| **Internal links** | `/rust-book/...` (absolute) | ❌ Never `./filename` |
| **Images** | `![alt](path)` | ❌ Never `<img>` tags |
| **Code blocks** | Preserve as-is | |
| **Code language** | Single language only | `rust` not `rust,ignore` |
| **Italics** | `*text*` | Add space around Chinese chars |
| **Bold** | `**text**` | Add space around Chinese chars |
| **Navigation** | Top-level items directly | No nested `label/items` |
| **Subheadings** | Use `##` | Not `###` when title in frontmatter |

### Code Block Language Conversion

MDbook compound languages → Starlight single language:

| MDbook | Starlight |
|--------|-----------|
| `rust,ignore` | `rust` |
| `rust,ignore,does_not_compile` | `rust` |
| `rust,editable` | `rust` |

### Image Rules

**Correct:**
```markdown
![Ferris](img/ferris/does_not_compile.svg)
```

**Incorrect:**
```html
<img src="img/ferris/does_not_compile.svg">
<img src="./img/ferris/does_not_compile.svg">
```

**Location:** Place images in `src/content/docs/img/`

## Core Terminology

**Keep in English (Never Translate):**
- trait, crate, Cargo, Ferris, panic, Rust
- unsafe (as a concept/keyword)
- macro (keep lowercase when referring to the general concept)
- newtype (keep lowercase as it's a term)

**Standard Translations:**
- ownership → 所有权
- borrowing → 借用
- lifetimes → 生命周期
- generics → 泛型
- closures → 闭包
- unsafe Rust → Unsafe Rust (keep English identifier)
- unsafe superpowers → unsafe 超能力
- raw pointers → 原始指针
- function pointers → 函数指针
- associated types → 关联类型
- default type parameters → 默认类型参数
- fully qualified syntax → 完全限定语法
- supertrait → 超 Trait
- operator overloading → 运算符重载
- diverging functions → 发散函数
- never type → never 类型 / 永不返回的类型
- dynamically sized types (DST) → 动态大小类型
- type aliases → 类型别名 / 类型同义词
- declarative macros → 声明式宏
- procedural macros → 过程宏
- derive macros → derive 宏
- attribute-like macros → 类属性宏
- function-like macros → 类函数宏
- opaque type → 不透明类型
- metaprogramming → 元编程
- FFI (Foreign Function Interface) → 外部函数接口（FFI）

## Translation Workflow

### Before Starting a Chapter

1. **Check original file** in `book-main/src/` for structure
2. **Identify code examples** - read all listing files from `book-main/listings/`
3. **Note special formatting** - MDbook-specific tags that need conversion
4. **Plan link references** - identify internal links that need updating

### Translation Process

1. **Translate one file at a time** (don't batch multiple files)
2. **Copy code examples** from original listings (don't translate code)
3. **Keep English comments** unless they're explanatory (not API docs)
4. **Use consistent terminology** from glossary
5. **Test build frequently** (`bun run build`)

### Code Block Handling

When code block contains multiple language annotations:

| Original | Convert To | Notes |
|----------|-----------|-------|
| `rust,ignore` | `rust` | Standard Rust code |
| `rust,noplayground` | `rust` | Remove noplayground |
| `rust,ignore,does_not_compile` | `rust` | Remove all modifiers |
| `rust,editable` | `rust` | Remove editable tag |
| `text` | Keep as `text` | For output/console text |

### Link Reference Best Practices

**Format at end of file:**
```markdown
[link-id]: /rust-book/chXX-slug#中文锚点
[other-link]: https://doc.rust-lang.org/book/...
```

**Rules:**
- Keep all link references together at file end
- Use Chinese anchors that match translated headings
- External links to Rust Reference stay as https://doc.rust-lang.org/reference/

## Pre-Commit Checklist

Before committing a translated file:

### Content Quality
- [ ] Translation matches original meaning (not literal translation)
- [ ] Technical terms use glossary consistently
- [ ] Code examples identical to original (not translated)
- [ ] Comments in code: English preserved unless explanatory
- [ ] No stray English phrases left untranslated

### Format Verification
- [ ] Frontmatter has `title:` in Chinese
- [ ] No duplicate H1 (frontmatter title + markdown `# Title`)
- [ ] Code blocks use `rust` only (no `rust,ignore`, `rust,noplayground`)
- [ ] Chinese text has spaces around `**bold**` and `_italic_`
- [ ] All MDbook tags removed: `<!-- ignore -->`, `<Listing>`, `<a id="...">`
- [ ] Link references at file end use `/rust-book/` prefix
- [ ] Internal links use Chinese anchors (e.g., `#关联类型`)

### Build & Navigation
- [ ] `astro.config.ts` updated with new page slug
- [ ] `bun run build` completes without errors
- [ ] Page count increased correctly (e.g., 100 → 101)
- [ ] No 404 errors for internal links

## Post-Translation Review

After completing a chapter:

1. **Read through entire file** for flow and clarity
2. **Check for common errors:**
   - Missing translations (Ctrl+F for English words)
   - Wrong link anchors
   - Formatting inconsistencies
   - Code block language issues
3. **Verify with original** that meaning is preserved
4. **Run full build** and check all pages generate
5. **Commit with descriptive message:**
   ```
   feat: translate Chapter XX (Title) to Chinese
   
   - chXX-00-xxx.md: Overview
   - chXX-01-xxx.md: Section 1
   - chXX-02-xxx.md: Section 2
   - Update astro.config.ts navigation
   
   All files verified with build (XXX pages)
   ```

## Common Pitfalls & Solutions

### Critical Errors (Break Site)
| Problem | Solution |
|---------|----------|
| Relative links `./filename` | Use `/rust-book/filename` instead |
| Wrong link anchors | Must match translated heading text exactly |
| Compound code languages `rust,ignore` | Convert to single `rust` |
| Duplicate content in file | Check file size; compare to original |

### Content Issues
- **Inconsistent terminology** → Maintain and use glossary
- **Untranslated phrases** → Search for English words before commit
- **Wrong code examples** → Copy from `book-main/listings/` directly
- **Missing file name labels** → Add `*文件名：src/main.rs*` format

### Formatting Issues
- **Missing spaces** around `**bold**` with Chinese → `是 **这样**` not `是**这样**`
- **MDbook tags left in** → Remove `<!-- ignore -->`, `<Listing>`, `<a id="...">`
- **Wrong heading levels** → Use `##` for sections, not `###`
- **Missing frontmatter** → Every file needs `title:`

### Build Issues
- **Forgetting `astro.config.ts`** → Add to checklist
- **Not running full build** → `bun run build` not just dev
- **Page count wrong** → Should increase by number of new files

## Lessons Learned

**Chapter 20 specific:**
- Technical chapters require careful reading of code examples before translating
- Terms like "newtype", "opaque type", "diverging functions" need glossary entries
- Link references easier to manage when grouped at file end
- Always check for duplicate content (copy-paste errors) in long files
- File size check: if translated file is 2x original, likely has duplicates
