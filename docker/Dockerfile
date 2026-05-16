# OpenCode Docker - Nix-based Image with Token Optimization Skills
# Version 2.2.0 - Ajout RTK + Caveman ultra pour réduction massive de tokens
# 
# Build: docker build -t opencode-ci:latest .
# Run:   docker run -v $(pwd):/workspace -e GITHUB_TOKEN=$GITHUB_TOKEN opencode-ci:latest analyze

# Utilise l'image officielle Nix avec version pinnée pour reproductibilité
FROM nixos/nix:2.19.2

# Metadata
LABEL maintainer="OpenCode Automation"
LABEL description="OpenCode CI/CD avec Nix, GitHub Copilot et skills d'optimisation de tokens (RTK + Caveman ultra)"
LABEL version="2.2.0"
LABEL org.opencontainers.image.source="https://github.com/your-repo/opencode-docker"

# Configuration Nix pour permettre les builds
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

# Configuration de l'environnement
ENV OPENCODE_MODEL=github-copilot/claude-sonnet-4.5
ENV OPENCODE_LOG_LEVEL=INFO
ENV NODE_ENV=production
ENV PATH="/root/.local/bin:/root/.npm-global/bin:${PATH}"
ENV NPM_CONFIG_PREFIX=/root/.npm-global

# === Token Optimization Skills Configuration ===
# RTK (Rust Token Killer) - Désactivé par défaut (binaire non disponible publiquement)
# Activez avec: docker run -e RTK_ENABLED=true ... si vous avez le binaire
ENV RTK_ENABLED=false

# Caveman - Compression de langage en mode ultra (75%+ de réduction)
ENV CAVEMAN_MODE=ultra
ENV CAVEMAN_AUTO=true

# Réduction totale estimée: 85-95% de tokens par session CI/CD

# Healthcheck pour vérifier que l'environnement et skills sont prêts
HEALTHCHECK --interval=30s --timeout=10s --start-period=5s --retries=3 \
    CMD nix-shell /opt/sith/nix/shell.nix --run "opencode --version && command -v rtk" || exit 1

# Répertoire de travail pour les projets
WORKDIR /workspace

# Point d'entrée via nix-shell
ENTRYPOINT ["nix-shell", "/opt/sith/nix/shell.nix", "--run"]

# Commande par défaut
CMD ["opencode --help"]
