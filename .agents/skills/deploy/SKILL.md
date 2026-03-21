---
name: deploy
description: Build and deploy the project. Two steps: build and deploy.
---

# Deploy Skill

This skill builds and deploys the project.

## Workflow

### 1. Build

Run the build command:

```bash
bun run build
```

### 2. Deploy

Sync the built files to the remote server:

```bash
rclone sync ./dist tos:muelsyse/www/rust-book --progress
```

## Notes

- Ensure build completes successfully before deploying
- The deployment uses rclone to sync files to the remote storage
