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

**Keep in English:** trait, crate, Cargo, Ferris, panic, Rust

**Standard Translations:**
- ownership → 所有权
- borrowing → 借用
- lifetimes → 生命周期
- generics → 泛型
- closures → 闭包

## Common Pitfalls

- Forgetting to check `bun run dev` error messages
- Not verifying links are clickable after changes
- Inconsistent terminology (e.g., "trait" sometimes translated as "特性")
- Missing spaces around formatting markers with Chinese text

## Checklist

Before marking a chapter complete:

- [ ] Frontmatter contains title
- [ ] Internal links use `/rust-book/...` (NOT `./filename`)
- [ ] Link anchors use Chinese text (e.g., `#遮蔽shadowing`)
- [ ] Untranslated chapter links point to doc.rust-lang.org
- [ ] No MDbook markup (`<!-- ignore -->`, `<Listing>`, `<a id="...">`)
- [ ] Chinese text has spaces around `_italic_` and `**bold**` markers
- [ ] Images use `![alt](path)` syntax (not `<img>`)
- [ ] Code blocks use single language (not `rust,ignore`)
- [ ] Terminology consistent with glossary
- [ ] Code examples not translated
- [ ] `bun run dev` runs without errors
- [ ] No duplicate titles (frontmatter `title` + markdown `# Title`)
- [ ] Links work with BOTH `/page/` and `/page` URLs
