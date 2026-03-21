---
name: skills-manage
description: Manage agent skills - view installed skills, update public skills via CLI, update project skills by editing files.
---

# Skills Management

Use the following commands to update each skill individually.

```bash
npx skills add https://github.com/vercel-labs/skills --skill find-skills --agent universal -y
npx skills add https://github.com/upstash/context7 --skill find-docs --agent universal -y
npx skills add https://github.com/vercel-labs/skills --skill find-skills --agent universal -y
npx skills add https://github.com/microsoft/playwright-cli --skill playwright-cli --agent universal -y
```

Skills not listed above are project-level skills and can only be updated by editing the files directly.
