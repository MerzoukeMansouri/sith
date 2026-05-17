# Security Policy

## Docker Image Distribution Security

This document outlines security practices and considerations for using Sith Docker images.

## Supported Distribution Methods

### 1. Prebuilt Images (Recommended)

**Location:** `ghcr.io/merzoukemanouri/sith`

**Security Features:**
- ✅ **Image Signing**: All images signed with cosign using keyless OIDC signing
- ✅ **SBOM Attestation**: Software Bill of Materials attached to every image
- ✅ **Provenance**: Verifiable build chain from source to image
- ✅ **Automated Builds**: Built via GitHub Actions on public infrastructure
- ✅ **Semantic Versioning**: Pinnable to specific versions
- ✅ **Non-root User**: Runs as user `sith` (UID 1000)
- ✅ **Multi-stage Build**: Reduced attack surface with minimal runtime dependencies

**Verification:**

```bash
# Install cosign
brew install cosign  # macOS
# or download from https://github.com/sigstore/cosign/releases

# Verify image signature
cosign verify \
  --certificate-identity-regexp="https://github.com/MerzoukeMansouri/sith" \
  --certificate-oidc-issuer="https://token.actions.githubusercontent.com" \
  ghcr.io/merzoukemanouri/sith:latest

# Download and inspect SBOM
cosign download sbom ghcr.io/merzoukemanouri/sith:latest > sbom.spdx.json
cat sbom.spdx.json | jq .
```

**Trust Model:**
- You trust GitHub's infrastructure to build images
- You trust the automated GitHub Actions workflow
- You can verify the signature and SBOM before running
- Compromise of maintainer's GitHub account could affect new images (but signatures remain verifiable)

### 2. Local Builds

**Method:** `npx @m14i/sith --build`

**Security Features:**
- ✅ **Full Control**: You control the build environment
- ✅ **Inspectable**: Can review Dockerfile before building
- ✅ **No External Trust**: No dependency on external registries
- ⚠️ **Manual Updates**: You must rebuild to get security updates
- ⚠️ **No Signature**: Locally built images are not signed

**Trust Model:**
- You trust your own build environment
- You trust the npm package `@m14i/sith` (published with provenance)
- You trust the Nix packages fetched during build (verified via SHA256 hashes)
- You trust the OpenCode CLI installer script

## Security Considerations

### Token Handling

**Environment Variables (Current Method):**
```bash
docker run -e GITHUB_TOKEN=$(gh auth token) ...
```

⚠️ **Risks:**
- Token visible in `docker inspect`
- Token visible in process listings
- Token visible in container logs if printed

**Best Practice - Use Docker Secrets (Production):**
```bash
echo "gho_your_token_here" | docker secret create github_token -
docker service create --secret github_token ...
```

**Best Practice - Use File Mounts (CI/CD):**
```bash
# Create auth file
echo '{"github_token":"gho_your_token_here"}' > /tmp/auth.json
chmod 600 /tmp/auth.json

# Mount as read-only
docker run -v /tmp/auth.json:/home/sith/.config/auth.json:ro \
  ghcr.io/merzoukemanouri/sith:latest \
  "cat /home/sith/.config/auth.json"

# Clean up
rm /tmp/auth.json
```

### Nix Sandbox Disabled

**Why:** The Dockerfile disables Nix sandbox with `sandbox = false` in `/etc/nix/nix.conf`.

**Reason:** Required for Docker-in-Docker compatibility. Nix's sandbox requires kernel features not available in nested containerization.

**Risk:** Nix package builds have less isolation during installation.

**Mitigation:**
- All packages pinned to specific versions in `shell.nix`
- Packages verified with SHA256 hashes
- Multi-stage build limits runtime attack surface

### Known Limitations

1. **RTK Binary Not Available**
   - The RTK (Rust Token Killer) binary mentioned in the Dockerfile is not publicly available
   - `RTK_ENABLED=false` by default
   - Healthcheck properly handles this case
   - No security impact, just missing functionality

2. **OpenCode CLI Install Script**
   - Uses `curl | bash` pattern: `curl -fsSL https://opencode.ai/install | bash`
   - Not pinned to specific version/commit
   - **Recommendation**: Pin to specific commit hash if available

3. **Root During Build**
   - Build stage runs as root (necessary for Nix installation)
   - Runtime stage switches to non-root user `sith` (UID 1000)
   - No security impact for runtime operations

## Reporting a Vulnerability

If you discover a security vulnerability in Sith or its Docker images, please:

1. **Do NOT** open a public issue
2. Email the maintainer directly with details
3. Allow reasonable time for a fix before public disclosure

## Security Updates

- Docker images are rebuilt automatically on every release
- Security fixes are tagged with `fix:` in conventional commits
- Subscribe to GitHub releases for notifications
- Use `latest` tag for automatic updates (or pin to specific version)

## Best Practices

### For Development

```bash
# Use prebuilt images
docker pull ghcr.io/merzoukemanouri/sith:latest

# Verify signature
cosign verify \
  --certificate-identity-regexp="https://github.com/MerzoukeMansouri/sith" \
  --certificate-oidc-issuer="https://token.actions.githubusercontent.com" \
  ghcr.io/merzoukemanouri/sith:latest

# Run with minimal permissions
docker run --rm \
  -v $(pwd):/workspace:ro \
  -e GITHUB_TOKEN=$(gh auth token) \
  ghcr.io/merzoukemanouri/sith:latest \
  "opencode --help"
```

### For CI/CD

```yaml
# Example: GitHub Actions
jobs:
  analyze:
    runs-on: ubuntu-latest
    container:
      image: ghcr.io/merzoukemanouri/sith:v1.5.4  # Pin to specific version
      credentials:
        username: ${{ github.actor }}
        password: ${{ secrets.GITHUB_TOKEN }}
    steps:
      - uses: actions/checkout@v4
      - name: Run OpenCode analysis
        run: opencode analyze
        env:
          GITHUB_TOKEN: ${{ secrets.GITHUB_TOKEN }}
```

### For Production

1. **Pin to specific versions** instead of `latest`
2. **Verify signatures** before deployment
3. **Use Docker secrets** for token management
4. **Run vulnerability scans** on images before use
5. **Monitor for updates** and rebuild regularly

## Additional Resources

- [Sigstore Cosign Documentation](https://docs.sigstore.dev/cosign/overview/)
- [Docker Security Best Practices](https://docs.docker.com/engine/security/)
- [Nix Security Model](https://nixos.org/manual/nix/stable/installation/env-variables.html)
- [GitHub Container Registry Security](https://docs.github.com/en/packages/learn-github-packages/about-permissions-for-github-packages)

## Changelog

- **2.3.0** (2024-01): Added cosign signing, SBOM attestation, multi-stage build, non-root user
- **2.2.0** (2024-01): Added RTK and Caveman token optimization
- **2.1.0** (2024-01): Initial automated Docker publishing to GHCR
