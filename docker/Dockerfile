# OpenCode Docker - Nix-based Image with Token Optimization Skills
# Version 2.3.0 - Multi-stage build with non-root user and improved security
#
# Build: docker build -t sith:latest .
# Run:   docker run -v $(pwd):/workspace -e GITHUB_TOKEN=$GITHUB_TOKEN -e CLAUDE_CODE_OAUTH_TOKEN=$CLAUDE_CODE_OAUTH_TOKEN sith:latest analyze

# ============================================================================
# Stage 1: Builder - Setup environment and install dependencies
# ============================================================================
FROM nixos/nix:2.19.2 AS builder

# Configuration Nix pour permettre les builds et activer flakes
# Note: sandbox=false required for Docker-in-Docker compatibility
RUN echo "sandbox = false" >> /etc/nix/nix.conf && \
    echo "filter-syscalls = false" >> /etc/nix/nix.conf && \
    echo "experimental-features = nix-command flakes" >> /etc/nix/nix.conf

# Copier les assets (logo, etc.)
COPY assets/ /opt/sith/assets/

# Copier les fichiers Nix (scripts, config, shell.nix)
COPY docker/nix/ /opt/sith/nix/

# Configurer npm, pré-charger Nix, installer OpenCode CLI et Claude Code CLI
RUN printf 'registry=https://registry.npmjs.org/\nprefix=/root/.npm-global\n' > /root/.npmrc && \
    mkdir -p /root/.npm-global && \
    nix-shell /opt/sith/nix/shell.nix --run "echo '✅ Environment cached'" && \
    nix-shell /opt/sith/nix/shell.nix --run " \
    curl -fsSL https://opencode.ai/install | bash && \
    patchelf --set-interpreter \$(patchelf --print-interpreter \$(which bash)) /root/.opencode/bin/opencode && \
    /root/.opencode/bin/opencode --version \
    " && \
    nix-shell /opt/sith/nix/shell.nix --run " \
    npm install -g --prefix /root/.npm-global @anthropic-ai/claude-code \
    " && \
    nix-shell /opt/sith/nix/shell.nix --run " \
    CLAUDE_BIN=\$(readlink -f /root/.npm-global/bin/claude) && \
    file \$CLAUDE_BIN && \
    patchelf --set-interpreter \$(patchelf --print-interpreter \$(which bash)) \$CLAUDE_BIN && \
    /root/.npm-global/bin/claude --version \
    "

# ============================================================================
# Stage 2: Runtime - Minimal runtime image with non-root user
# ============================================================================
FROM nixos/nix:2.19.2

# Metadata
LABEL maintainer="OpenCode Automation"
LABEL description="OpenCode CI/CD avec Nix, GitHub Copilot et skills d'optimisation de tokens (RTK + Caveman ultra)"
LABEL version="2.3.0"
LABEL org.opencontainers.image.source="https://github.com/MerzoukeMansouri/sith"

# Configuration Nix pour permettre les builds et activer flakes
# Note: sandbox=false required for Docker-in-Docker compatibility
RUN echo "sandbox = false" >> /etc/nix/nix.conf && \
    echo "filter-syscalls = false" >> /etc/nix/nix.conf && \
    echo "experimental-features = nix-command flakes" >> /etc/nix/nix.conf

# Copier les fichiers de configuration des skills depuis builder
COPY --from=builder /opt/sith/ /opt/sith/

# Copier les binaires et configuration Nix depuis builder
COPY --from=builder /nix/store /nix/store
COPY --from=builder /nix/var /nix/var
COPY --from=builder /root/.opencode /root/.opencode
COPY --from=builder /root/.npm-global /root/.npm-global
COPY --from=builder /root/.npmrc /root/.npmrc

# Bake default Claude Code config (theme, permissions, caveman mode)
COPY docker/claude-defaults/ /root/.claude/

# Entrypoint script: generates .credentials.json from CLAUDE_CODE_OAUTH_TOKEN before nix-shell
COPY docker/entrypoint.sh /opt/sith/entrypoint.sh
RUN chmod +x /opt/sith/entrypoint.sh

# Créer un utilisateur non-root pour l'exécution
RUN mkdir -p /home/sith && \
    echo "sith:x:1000:1000:Sith User:/home/sith:/bin/sh" >> /etc/passwd && \
    echo "sith:x:1000:" >> /etc/group && \
    mkdir -p /home/sith/.opencode /home/sith/.npm-global /workspace && \
    cp -r /root/.opencode/* /home/sith/.opencode/ 2>/dev/null || true && \
    mkdir -p /nix/var/nix/profiles/per-user/sith && \
    chown -R 1000:1000 /home/sith /workspace /opt/sith /nix/var/nix/profiles/per-user/sith && \
    chmod 755 /nix/var/nix/profiles/per-user

# Copier la configuration npm pour l'utilisateur sith
RUN echo "registry=https://registry.npmjs.org/" > /home/sith/.npmrc && \
    chown sith:sith /home/sith/.npmrc

# Configuration de l'environnement
ENV OPENCODE_MODEL=github-copilot/claude-sonnet-4.5
ENV OPENCODE_LOG_LEVEL=INFO
ENV NODE_ENV=production
ENV CLAUDE_CODE_OAUTH_TOKEN=""
ENV IS_DEMO=1
ENV CLAUDE_CONFIG_DIR=/root/.claude
ENV PATH="/root/.opencode/bin:/root/.local/bin:/root/.npm-global/bin:${PATH}"
ENV NPM_CONFIG_PREFIX=/root/.npm-global
ENV HOME=/root

# === Skills Configuration ===
# Skills loaded at runtime via volume mount:
#   docker run -v ~/.sith/skills:/root/.opencode/skills ...

# Note: Keep running as root due to Nix permission requirements
# Nix-shell needs to modify /nix/var/nix/profiles/per-user at runtime
# USER sith

# Healthcheck pour vérifier que l'environnement est prêt
# Note: RTK check is conditional on RTK_ENABLED to avoid false failures
HEALTHCHECK --interval=30s --timeout=10s --start-period=5s --retries=3 \
    CMD cd /opt/sith/nix && nix develop --command sh -c "opencode --version && ([ \"\$RTK_ENABLED\" = \"false\" ] || command -v rtk)" || exit 1

# Répertoire de travail pour les projets
WORKDIR /workspace

# Point d'entrée: génère .credentials.json puis lance nix-shell
ENTRYPOINT ["/opt/sith/entrypoint.sh"]

# Commande par défaut
CMD ["opencode --help"]
