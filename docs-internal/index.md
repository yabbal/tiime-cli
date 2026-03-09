# Documentation du projet — Tiime CLI & SDK

> Mis à jour le 2026-03-09 | Scan level: deep

## Aperçu du projet

- **Type :** Monorepo Turborepo (2 packages npm + docs)
- **Langage :** TypeScript (ES2022, strict)
- **Runtime :** Node.js >=20
- **Architecture :** 3 couches (CLI → SDK → API Tiime)
- **Packages :** `tiime-sdk` (SDK autonome) + `tiime-cli` (CLI)

## Référence rapide

- **CLI Framework :** citty 0.2.1
- **HTTP Client :** ofetch 1.5.1
- **Auth :** Auth0 password grant (cascade: options > env vars > disque)
- **Build :** tsup (SDK: 1 bundle ESM + dts, CLI: 1 bundle ESM + shebang)
- **Tests :** Vitest 4.0.18
- **Linter :** Biome 2.4.6
- **Distribution :** npm + Homebrew
- **Point d'entrée SDK :** `packages/tiime-sdk/src/index.ts`
- **Point d'entrée CLI :** `packages/tiime-cli/src/cli/index.ts`

## Documentation générée

- [Vue d'ensemble du projet](./project-overview.md)
- [Architecture](./architecture.md)
- [Arbre source annoté](./source-tree-analysis.md)
- [Guide de développement](./development-guide.md)

## Documentation existante

- [API Discovery](./api-discovery.md) — Documentation complète des 40+ endpoints API Tiime (auth, headers, pagination, endpoints)
- [Homebrew Setup](./homebrew-setup.md) — Guide de configuration du tap Homebrew

## Autres ressources

- [README.md](../README.md) — Documentation principale du projet (installation, usage, SDK)
- [CHANGELOG.md](../CHANGELOG.md) — Historique des versions
- [Skill Claude Code](../SKILL.md) — Définition du skill d'intégration Claude Code

## Pour démarrer

```bash
# Installation depuis les sources
git clone <repo-url>
cd tiime
pnpm install
pnpm build

# Configuration
node packages/tiime-cli/dist/cli.js auth login
node packages/tiime-cli/dist/cli.js company use <company-id>

# Utilisation (après install global)
tiime invoices list
tiime bank balance
tiime status
```

## Utilisation pour l'IA

Ce dossier `docs-internal/` est conçu comme point d'entrée pour les outils d'IA (Claude Code, Copilot, etc.) :
- **Pour comprendre le projet** → Commencer par `index.md` (ce fichier)
- **Pour l'architecture** → `architecture.md`
- **Pour contribuer** → `development-guide.md`
- **Pour l'API Tiime** → `api-discovery.md`
- **Pour le code source** → `source-tree-analysis.md`
