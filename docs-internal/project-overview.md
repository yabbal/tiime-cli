# Vue d'ensemble du projet — Tiime CLI & SDK

> Mis à jour le 2026-03-09 | Scan level: deep

## Description

**Tiime** est un monorepo TypeScript composé de deux packages npm :

- **`tiime-sdk`** — SDK TypeScript autonome pour l'API Tiime (comptabilité, facturation, banque)
- **`tiime-cli`** — CLI qui consomme le SDK pour piloter Tiime depuis le terminal

Le SDK fonctionne de manière autonome (sans le CLI) via variables d'environnement ou options explicites.

## Informations clés

| Aspect | Détail |
|--------|--------|
| **Packages** | `tiime-sdk` + `tiime-cli` |
| **Licence** | MIT |
| **Type de projet** | Monorepo (2 packages npm + docs) |
| **Langage** | TypeScript (ES2022, strict) |
| **Runtime** | Node.js >=20 |
| **Package manager** | pnpm 10.30.2 |
| **Monorepo** | Turborepo |
| **CLI Framework** | citty 0.2.1 |
| **HTTP Client** | ofetch 1.5.1 |
| **Build** | tsup 8.5.1 (ESM) |
| **Tests** | Vitest 4.0.18 |
| **Linter** | Biome 2.4.6 |
| **Distribution** | npm + Homebrew |

## Fonctionnalités

### CLI (13 commandes — `tiime-cli`)

- **auth** — Authentification (login interactif/scriptable, logout, status)
- **company** — Sélection et info entreprise
- **invoices** — Gestion complète des factures (CRUD, envoi email, PDF, duplication)
- **quotations** — Gestion des devis (CRUD, envoi, PDF)
- **clients** — Gestion des clients (CRUD, recherche)
- **bank** — Comptes bancaires, transactions, soldes, transactions non imputées
- **expenses** — Notes de frais
- **documents** — Documents comptables (list, upload, download)
- **labels** — Étiquettes et tags
- **status** — Résumé rapide de l'état comptable
- **open** — Ouvre Tiime dans le navigateur
- **version** — Version CLI et Node
- **completion** — Complétion shell (zsh, bash, fish)

### SDK (4 exports — `tiime-sdk`)

- `TiimeClient` — Client HTTP avec 10 ressources API
- `TokenManager` — Authentification Auth0 (cascade: options > env vars > disque)
- `TiimeError` — Gestion d'erreurs structurée
- Types TypeScript — 40+ interfaces

## Architecture

Architecture en 3 couches, 2 packages npm :
1. **CLI** (`packages/tiime-cli/`) — Interface utilisateur, commandes citty, i18n, formatage
2. **SDK** (`packages/tiime-sdk/`) — Client HTTP, auth, 10 ressources API typées
3. **API Tiime** (externe) — REST API Tiime avec auth Auth0

→ Voir [Architecture](./architecture.md) pour le détail complet.

## Structure du monorepo

```
tiime/
├── packages/tiime-sdk/       # SDK TypeScript (publié sur npm)
│   ├── src/
│   │   ├── index.ts          # Exports SDK
│   │   ├── auth.ts           # TokenManager, resolveCompanyId
│   │   ├── client.ts         # TiimeClient (ofetch)
│   │   ├── errors.ts         # TiimeError
│   │   ├── types.ts          # 40+ interfaces
│   │   └── resources/        # 10 wrappers API
│   └── tests/                # Tests SDK
├── packages/tiime-cli/       # CLI (publié sur npm, dépend de tiime-sdk)
│   ├── src/cli/
│   │   ├── index.ts          # Bootstrap citty
│   │   ├── config.ts, i18n.ts, output.ts
│   │   └── commands/         # 13 commandes
│   └── tests/                # Tests CLI
├── apps/docs/                # Documentation Fumadocs (GitHub Pages)
├── turbo.json                # Turborepo
└── SKILL.md                  # Skill pour agents IA
```

→ Voir [Arbre source](./source-tree-analysis.md) pour l'arbre annoté complet.

## Liens

- [Architecture](./architecture.md)
- [Arbre source](./source-tree-analysis.md)
- [Guide de développement](./development-guide.md)
- [API Discovery](./api-discovery.md) — Documentation des 40+ endpoints API Tiime
- [Homebrew Setup](./homebrew-setup.md)
