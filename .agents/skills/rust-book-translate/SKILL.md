---
name: rust-book-translate
description: Rust Book Chinese translation skill, including glossary, formatting rules, and lessons learned.
---

# Rust Book Translation

## Lessons Learned

### 2025-03-21 - Initial Setup
1. **Must add frontmatter** - Astro Starlight requires every `.md` file to have `title:`
2. **Homepage handled separately** - `index.md` uses `template: splash`, not included in sidebar
3. **Link format** - `["Installation"]` is wrong, should be `[Installation]`
4. **Navigation config** - Top-level pages as array items directly, no nested `label/items`
5. **Image syntax** - HTML `<img>` tags have path resolution issues in Astro/Starlight, must use Markdown `![alt](path)` syntax

### 2025-03-21 - Link Format (Critical)
**NEVER use relative paths like `./filename` for internal links!**

In Astro Starlight with `base: "/rust-book/"`:
- ❌ `./ch01-01-installation` - Breaks when URL has trailing slash
- ✅ `/rust-book/ch01-01-installation` - Works in all cases

**Why:** When a page is accessed with trailing slash (e.g., `/ch01-02-hello-world/`), relative paths resolve incorrectly as `/ch01-02-hello-world/ch01-01-installation` instead of `/rust-book/ch01-01-installation`.

**Anchor Requirements:**
- Use Chinese anchors matching the translated headings
- Example: `#遮蔽shadowing` (not `#shadowing`)
- Check generated HTML to verify anchor IDs

**External Links:**
- Translated chapters: `/rust-book/<slug>`
- Untranslated chapters: `https://doc.rust-lang.org/book/<path>`
- Standard library: `../std/...` (points to official Rust docs)

**Link Reference Format:**
```markdown
<!-- Correct -->
[variables-and-mutability]: /rust-book/ch03-01-variables-and-mutability
[shadowing]: /rust-book/ch03-01-variables-and-mutability#遮蔽shadowing
[enums]: https://doc.rust-lang.org/book/ch06-00-enums.html

<!-- Wrong - will cause 404 with trailing slash -->
[variables-and-mutability]: ./ch03-01-variables-and-mutability
```

### 2025-03-21 - Remove MDbook Markup
MDbook-specific markup must be converted to standard Markdown for Astro Starlight:

**Remove these MDbook-specific elements:**

| MDbook Element | Standard Markdown Equivalent | Notes |
|---------------|------------------------------|-------|
| `<!-- ignore -->` | Remove | Link checker hint, not needed |
| `<Listing number="...">` | `**清单 X-X**：描述` | Use bold text before code block |
| `<a id="..."></a>` + `<!-- 旧标题... -->` | Remove entirely | Anchor compatibility, not needed |
| `<span class="filename">` | `*文件名: path*` | Use italic text |

**Example conversions:**

```markdown
<!-- BEFORE (MDbook) -->
<Listing number="1-1" file-name="main.rs" caption="A program...">
```rust
fn main() {}
```
</Listing>

<!-- AFTER (Standard) -->
**清单 1-1**：一个程序...（文件名：*main.rs*）
```rust
fn main() {}
```
```

### Common Pitfalls
- Forgetting to check `bun run dev` error messages
- Not verifying links are clickable after changes
- Inconsistent terminology (e.g., "trait" sometimes translated as "特性")

## Quick Start

1. Check original: file in `book-main/src/`
2. Create file: `src/content/docs/<original-filename>`
3. Add frontmatter:
   ```yaml
   ---
   title: Page Title
   ---
   ```
4. Translate content, preserve formatting
5. Update `astro.config.ts` sidebar to add new page
6. Run `bun run dev` to verify

## Core Terminology

**Keep in English:** trait, crate, Cargo, Ferris, panic, Rust
**Standard Translations:**
- ownership → 所有权
- borrowing → 借用
- lifetimes → 生命周期
- generics → 泛型
- closures → 闭包

## Formatting Rules

| Element | Handling | Notes |
|---------|----------|-------|
| Code blocks | Preserve as-is | |
| `<!-- ignore -->` | **Remove** | MDbook-specific, not needed in Starlight |
| `[text][ref]` | Keep link syntax | Use `[Text]` not `["Text"]` |
| **Internal links** | **Use `/rust-book/...` (absolute)** | ❌ Never use `./filename` (breaks with trailing slash) |
| `<span id="...">` | **Remove** | MDbook anchor compatibility |
| `*italic*` | Keep italics | |
| `**bold**` | Keep bold | |
| `<Listing ...>` | Convert to `**清单 X-X**` | Standard markdown |
| `<span class="filename">` | Convert to `*文件名: path*` | Use italic |
| **Images** | **Must use `![alt](path)`, not `<img>`** | HTML has path issues |
| Code block languages | **Simplify to single language** | MDbook uses `rust,ignore`, use `rust` |

### Code Block Language Conversion

MDbook uses compound language specifiers that Astro Expressive Code doesn't recognize:

| MDbook Language | Starlight Language | Notes |
|----------------|-------------------|-------|
| `rust,ignore` | `rust` | Code that shouldn't be run |
| `rust,ignore,does_not_compile` | `rust` | Code with intentional errors |
| `rust,editable` | `rust` | Interactive code (keep as `rust`) |

**Conversion:**
```bash
# Replace compound languages with single language
sed -i 's/rust,ignore/rust/g' file.md
sed -i 's/rust,does_not_compile/rust/g' file.md
```

### Image Path Rules

**Correct:**
```markdown
![Ferris with question mark](img/ferris/does_not_compile.svg)
```

**Incorrect:**
```html
<!-- Don't use HTML img tags, path resolution has issues -->
<img src="img/ferris/does_not_compile.svg" alt="...">
<img src="./img/ferris/does_not_compile.svg" alt="...">
```

**Image Directory Structure:**
- Place images in `src/content/docs/img/` (consistent with original structure)
- Path is relative to markdown file, no `./` prefix needed

## Checklist

- [ ] Frontmatter contains title
- [ ] No `["text"]` incorrect link format
- [ ] **Internal links use absolute paths `/rust-book/...` (NOT `./filename`)**
- [ ] **Link anchors match translated Chinese headings**
- [ ] **Untranslated chapter links point to doc.rust-lang.org**
- [ ] Terminology consistent with glossary
- [ ] Code not translated
- [ ] Ferris images use Markdown syntax
- [ ] **No MDbook-specific markup** (`<!-- ignore -->`, `<Listing>`, `<a id="...">`)
- [ ] Subheadings use `##` (not `###` when main title is in frontmatter)
- [ ] `bun run dev` runs without errors
- [ ] No duplicate main titles (frontmatter `title` + markdown `# Title`)
- [ ] **Test links work with BOTH `/page/` and `/page` URLs**
