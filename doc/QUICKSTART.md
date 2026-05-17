# Guide de démarrage rapide - OpenCode Docker avec GitHub Copilot

## 🎯 Token Optimization Skills Activés par Défaut

Cette image intègre automatiquement :
- ✅ **RTK** - Réduit les sorties de commandes de 60-90%
- ✅ **Caveman ultra** - Compresse les réponses de 75%+
- 💰 **Économie** : ~$7.50 par session de 30 min (GPT-4)

**Aucune configuration requise** - Tout fonctionne automatiquement ! 🚀

Pour désactiver : `docker run -e RTK_ENABLED=false -e CAVEMAN_AUTO=false ...`

---

## Installation en 5 minutes

### 1. Prérequis
```bash
# Vérifier Docker
docker --version  # Devrait afficher 20.10 ou plus

# Vérifier que vous avez accès à GitHub Copilot
# Allez sur https://github.com/settings/copilot et vérifiez votre abonnement
```

### 2. Installation
```bash
git clone <votre-repo>
cd opencode-docker
docker build -f docker/Dockerfile -t sith:latest .
```

### 3. Authentification

**Si vous utilisez déjà OpenCode localement** (Recommandé) :
```bash
# Vérifiez que votre auth.json existe
ls -la ~/.local/share/opencode/auth.json

# ✅ Si le fichier existe, vous êtes prêt ! Aucune config requise.
```

**Sinon** (ou pour CI/CD), créez un token GitHub :
```bash
# 1. Allez sur https://github.com/settings/tokens
# 2. Cliquez sur "Generate new token (classic)"
# 3. Sélectionnez les scopes:
#    - repo (Full control of private repositories)
#    - read:org (Read org and team membership)
#    - copilot (GitHub Copilot)
# 4. Générez le token et copiez-le

cp .env.example .env
nano .env  # Ajoutez: GITHUB_TOKEN=ghp_votre_token_ici
```

### 4. Premier test

**Méthode 1 - Docker Compose** :
```bash
docker-compose run sith analyze
```

**Méthode 2 - Docker run manuel** :
```bash
# Avec auth.json local
docker run --rm \
  -v $(pwd):/workspace \
  -v ~/.local/share/opencode/auth.json:/config/auth.json:ro \
  sith:latest analyze

# Ou avec GITHUB_TOKEN
docker run --rm \
  -v $(pwd):/workspace \
  -e GITHUB_TOKEN=$GITHUB_TOKEN \
  sith:latest analyze
```

Le rapport sera dans `./opencode-output/analysis-report.md`

## Utilisation avec Docker Compose

### Analyse de code
```bash
# Depuis le répertoire de votre projet
cd /path/to/your/project

# Copier le docker-compose.yml
cp /path/to/opencode-docker/docker/docker-compose.yml .
cp /path/to/opencode-docker/.env.example .env

# Lancer l'analyse
docker-compose --profile analyze up

# Voir le rapport
cat opencode-output/analysis-report.md
```

### Génération de documentation
```bash
docker-compose --profile document up

# La documentation sera dans le dossier docs/
ls -la docs/
```

### Revue de PR
```bash
# Définir le numéro de PR
export PR_NUMBER=123
PR_NUMBER=123 docker-compose --profile review up

# Ou directement
PR_NUMBER=42 docker-compose --profile review up
```

## Intégration GitHub Actions

### Setup ultra-rapide

1. **Publier l'image Docker** (une fois):
```bash
# Option A: GitHub Container Registry (gratuit)
docker tag sith:latest ghcr.io/votre-user/opencode-ci:latest
docker push ghcr.io/votre-user/sith:latest

# Option B: Docker Hub
docker tag sith:latest votre-user/opencode-ci:latest
docker push votre-user/sith:latest
```

2. **Copier les workflows**:
```bash
mkdir -p .github/workflows
cp examples/github-actions/*.yml .github/workflows/
```

3. **Modifier les workflows** pour utiliser votre image:
```bash
# Remplacer dans les fichiers .yml:
# uses: docker://sith:latest
# par
# uses: docker://ghcr.io/votre-user/sith:latest
```

4. **Commit et push**:
```bash
git add .github/workflows/
git commit -m "feat: add OpenCode automation"
git push
```

5. **Créer une PR pour tester** - OpenCode analysera automatiquement!

## Intégration GitLab CI

### Setup ultra-rapide

1. **Ajouter le token GitHub**:
   - Allez dans Settings > CI/CD > Variables
   - Ajoutez `GITHUB_COPILOT_TOKEN` avec votre token GitHub
   - Cochez "Protected" et "Masked"

2. **Copier le fichier CI**:
```bash
cp examples/gitlab-ci/.gitlab-ci.yml .gitlab-ci.yml
```

3. **Publier l'image** dans le registry GitLab:
```bash
docker login registry.gitlab.com
docker tag sith:latest registry.gitlab.com/votre-groupe/votre-projet/sith:latest
docker push registry.gitlab.com/votre-groupe/votre-projet/sith:latest
```

4. **Mettre à jour `.gitlab-ci.yml`**:
```yaml
variables:
  DOCKER_IMAGE: registry.gitlab.com/votre-groupe/votre-projet/sith:latest
```

5. **Commit et push**:
```bash
git add .gitlab-ci.yml
git commit -m "feat: add OpenCode automation"
git push
```

## Exemples d'utilisation rapide

### Analyser rapidement un projet
```bash
docker run --rm -v $(pwd):/workspace -e GITHUB_TOKEN=$GITHUB_TOKEN sith analyze
```

### Générer la documentation
```bash
docker run --rm -v $(pwd):/workspace -e GITHUB_TOKEN=$GITHUB_TOKEN sith document
```

### Reviewer une PR locale
```bash
# Depuis votre branche
docker run --rm -v $(pwd):/workspace -e GITHUB_TOKEN=$GITHUB_TOKEN \
  sith review-pr --base=main --head=$(git branch --show-current)
```

### Utiliser un modèle différent
```bash
# Avec GPT au lieu de Claude
docker run --rm -v $(pwd):/workspace \
  -e GITHUB_TOKEN=$GITHUB_TOKEN \
  -e OPENCODE_MODEL=github-copilot/gpt-5.5 \
  sith analyze
```

### Corriger automatiquement le linting
```bash
docker run --rm -v $(pwd):/workspace -e GITHUB_TOKEN=$GITHUB_TOKEN sith fix-lint
```

## Dépannage rapide

### Erreur: "GITHUB_TOKEN not found"
```bash
# Vérifiez que la variable est définie
echo $GITHUB_TOKEN

# Si vide, exportez-la
export GITHUB_TOKEN=ghp_your_token_here

# Puis relancez
docker run --rm -v $(pwd):/workspace -e GITHUB_TOKEN=$GITHUB_TOKEN sith analyze
```

### Erreur: "GitHub Copilot oauth"
```bash
# Vérifiez que votre token a les bons scopes
# Le token doit avoir: repo, read:org, copilot

# Testez l'authentification
docker run --rm -e GITHUB_TOKEN=$GITHUB_TOKEN sith \
  sh -c "opencode providers list"
```

### Erreur: "Permission denied"
```bash
# Reconstruisez l'image
docker build --no-cache -f docker/Dockerfile -t sith:latest .
```

### L'image ne se construit pas
```bash
# Vérifiez Docker
docker info

# Nettoyez et reconstruisez
docker system prune -f
docker build --no-cache -f docker/Dockerfile -t sith:latest .
```

### OpenCode ne trouve pas les fichiers
```bash
# Vérifiez que vous montez le bon répertoire
# Le chemin doit être absolu ou relatif depuis votre position actuelle

# Bon
docker run --rm -v $(pwd):/workspace ...

# Mauvais
docker run --rm -v :/workspace ...
docker run --rm -v /incorrect/path:/workspace ...
```

## Commandes utiles

```bash
# Voir les logs détaillés
docker run --rm -v $(pwd):/workspace \
  -e GITHUB_TOKEN=$GITHUB_TOKEN \
  -e OPENCODE_LOG_LEVEL=DEBUG \
  sith analyze

# Lister les modèles disponibles
docker run --rm -e GITHUB_TOKEN=$GITHUB_TOKEN sith \
  sh -c "opencode models github-copilot"

# Entrer dans le container pour debug
docker run --rm -it -v $(pwd):/workspace \
  -e GITHUB_TOKEN=$GITHUB_TOKEN \
  --entrypoint /bin/bash \
  sith

# Nettoyer les anciens résultats
rm -rf opencode-output/
```

## Alias pratiques

Ajoutez à votre `~/.bashrc` ou `~/.zshrc` :

```bash
# Alias OpenCode
alias oc-analyze='docker run --rm -v $(pwd):/workspace -e GITHUB_TOKEN=$GITHUB_TOKEN sith analyze'
alias oc-document='docker run --rm -v $(pwd):/workspace -e GITHUB_TOKEN=$GITHUB_TOKEN sith document'
alias oc-review='docker run --rm -v $(pwd):/workspace -e GITHUB_TOKEN=$GITHUB_TOKEN sith review-pr'
alias oc-lint='docker run --rm -v $(pwd):/workspace -e GITHUB_TOKEN=$GITHUB_TOKEN sith fix-lint'
alias oc-test='docker run --rm -v $(pwd):/workspace -e GITHUB_TOKEN=$GITHUB_TOKEN sith test'

# Utilisation:
# oc-analyze
# oc-document
# oc-review --pr-number=42
```

## Prochaines étapes

1. ✅ Installation terminée
2. ✅ Premier test effectué
3. 📖 Lisez le [README complet](README.md) pour plus de détails
4. 🔧 Configurez votre CI/CD
5. 🚀 Automatisez vos workflows!

## Support

- **Documentation complète**: voir [README.md](README.md)
- **Issues**: ouvrir une issue sur le repo
- **Documentation OpenCode**: https://opencode.ai/docs
- **GitHub Copilot**: https://github.com/features/copilot
