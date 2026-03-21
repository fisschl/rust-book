---
name: rust-book-translate
description: Rust Book Chinese translation skill, including glossary, formatting rules, and lessons learned.
---

# Rust Book Translation

## Lessons Learned (2025-03-21)

### Key Findings
1. **Must add frontmatter** - Astro Starlight requires every `.md` file to have `title:`
2. **Homepage handled separately** - `index.md` uses `template: splash`, not included in sidebar
3. **Link format** - `["Installation"]` is wrong, should be `[Installation]`
4. **Navigation config** - Top-level pages as array items directly, no nested `label/items`
5. **Image syntax** - HTML `<img>` tags have path resolution issues in Astro/Starlight, must use Markdown `![alt](path)` syntax

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

| Element | Handling |
|---------|----------|
| Code blocks | Preserve as-is |
| `<!-- ignore -->` | Keep |
| `[text][ref]` | Keep link syntax |
| `<span id="...">` | Keep HTML |
| `*italic*` | Keep italics |
| `**bold**` | Keep bold |
| **Images** | **Must use `![alt](path)`, not `<img>`** |

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
- [ ] Terminology consistent with glossary
- [ ] Code not translated
- [ ] Ferris images use Markdown syntax
- [ ] `bun run dev` runs without errors
