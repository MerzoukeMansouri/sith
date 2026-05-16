# How to Add a Skill

Skills are installed in `docker/nix/nix-scripts/06-skills-setup.sh` during container startup.

## Steps

### 1. Add skill installation to `docker/nix/nix-scripts/06-skills-setup.sh`

```bash
# Example: Add new skill "my-skill"
if [ "${MY_SKILL_ENABLED:-true}" = "true" ]; then
  echo "📦 Installing My Skill..."

  mkdir -p /root/.agents/skills/my-skill

  # Download skill (example)
  curl -fsSL https://example.com/my-skill.zip -o /tmp/my-skill.zip
  unzip -q /tmp/my-skill.zip -d /root/.agents/skills/my-skill
  rm /tmp/my-skill.zip

  echo "  ✅ My Skill installed"
fi
```

### 2. Add environment variable (optional)

In `docker/nix/nix-scripts/02-env-vars.sh`:

```bash
export MY_SKILL_ENABLED="${MY_SKILL_ENABLED:-true}"
```

### 3. Add to docker/Dockerfile ENV (optional)

```dockerfile
ENV MY_SKILL_ENABLED=true
```

### 4. Add config file (optional)

If skill needs config, add to `docker/skills/` and copy in docker/Dockerfile:

```dockerfile
COPY docker/skills/my-skill-config.toml /workspace/skills/
```

Then reference in installation script.

## Current Skills

- **Caveman**: Language compression (75%+ reduction)
  - Location: `/root/.agents/skills/caveman/`
  - Env: `CAVEMAN_AUTO`, `CAVEMAN_MODE`
  - Installed: Runtime (downloaded on first run)

- **RTK**: CLI output optimization (60-90% reduction)
  - Location: `/root/.agents/skills/rtk/`
  - Env: `RTK_ENABLED`
  - Status: Disabled (binary not publicly available)

## Testing

```bash
./run-interactive.sh

# In container:
ls -la /root/.agents/skills/
```
