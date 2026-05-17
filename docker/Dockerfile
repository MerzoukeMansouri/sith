# OpenCode Docker - Nix-based Image with Token Optimization Skills
# Version 2.3.0 - Multi-stage build with non-root user and improved security
#
# Build: docker build -t opencode-ci:latest .
# Run:   docker run -v $(pwd):/workspace -e GITHUB_TOKEN=$GITHUB_TOKEN opencode-ci:latest analyze

# ============================================================================
# Stage 1: Builder - Setup environment and install dependencies
# ============================================================================
FROM nixos/nix:2.19.2 AS builder

# Configuration Nix pour permettre les builds
# Note: sandbox=false required for Docker-in-Docker compatibility
RUN echo "sandbox = false" >> /etc/nix/nix.conf && \
    echo "filter-syscalls = false" >> /etc/nix/nix.conf

# Copier les fichiers de configuration des skills
COPY docker/skills/rtk-config.toml /opt/sith/skills/rtk-config.toml
COPY docker/skills/opencode-skills-config.json /opt/sith/skills/opencode-skills-config.json

# Copier les fichiers Nix (scripts, config, shell.nix)
COPY docker/nix/ /opt/sith/nix/

# Configurer npm pour utiliser le registry public
RUN echo "registry=https://registry.npmjs.org/" > /root/.npmrc

# Pré-charger l'environnement Nix (installe tous les packages)
# Cela cache les dépendances dans le layer Docker
RUN nix-shell /opt/sith/nix/shell.nix --run "echo '✅ Environment cached'"

# Installer OpenCode CLI via script officiel
RUN nix-shell /opt/sith/nix/shell.nix --run " \
    curl -fsSL https://opencode.ai/install | bash && \
    patchelf --set-interpreter \$(patchelf --print-interpreter \$(which bash)) /root/.opencode/bin/opencode && \
    /root/.opencode/bin/opencode --version \
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

# Configuration Nix pour permettre les builds
# Note: sandbox=false required for Docker-in-Docker compatibility
RUN echo "sandbox = false" >> /etc/nix/nix.conf && \
    echo "filter-syscalls = false" >> /etc/nix/nix.conf

# Copier les fichiers de configuration des skills depuis builder
COPY --from=builder /opt/sith/ /opt/sith/

# Copier les binaires et configuration Nix depuis builder
COPY --from=builder /nix/store /nix/store
COPY --from=builder /root/.opencode /root/.opencode
COPY --from=builder /root/.npmrc /root/.npmrc

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
ENV PATH="/home/sith/.opencode/bin:/home/sith/.local/bin:/home/sith/.npm-global/bin:${PATH}"
ENV NPM_CONFIG_PREFIX=/home/sith/.npm-global
ENV HOME=/home/sith

# === Token Optimization Skills Configuration ===
# RTK (Rust Token Killer) - Désactivé par défaut (binaire non disponible publiquement)
# Activez avec: docker run -e RTK_ENABLED=true ... si vous avez le binaire
ENV RTK_ENABLED=false

# Caveman - Compression de langage en mode ultra (75%+ de réduction)
ENV CAVEMAN_MODE=ultra
ENV CAVEMAN_AUTO=true

# Réduction totale estimée: 85-95% de tokens par session CI/CD

# Basculer vers l'utilisateur non-root
USER sith

# Healthcheck pour vérifier que l'environnement est prêt
# Note: RTK check is conditional on RTK_ENABLED to avoid false failures
HEALTHCHECK --interval=30s --timeout=10s --start-period=5s --retries=3 \
    CMD nix-shell /opt/sith/nix/shell.nix --run "opencode --version && ([ \"\$RTK_ENABLED\" = \"false\" ] || command -v rtk)" || exit 1

# Répertoire de travail pour les projets
WORKDIR /workspace

# Point d'entrée via nix-shell
ENTRYPOINT ["nix-shell", "/opt/sith/nix/shell.nix", "--run"]

# Commande par défaut
CMD ["opencode --help"]
