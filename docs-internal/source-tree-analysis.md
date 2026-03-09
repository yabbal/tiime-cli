# Analyse de l'arbre source — Tiime CLI & SDK

> Mis à jour le 2026-03-09 | Scan level: deep

## Structure du monorepo

```
tiime/
├── packages/tiime-sdk/               # SDK TypeScript (publié sur npm comme tiime-sdk)
│   ├── src/
│   │   ├── index.ts                  # Exports publics SDK (TiimeClient, TokenManager, TiimeError, types)
│   │   ├── auth.ts                   # TokenManager (Auth0, cascade auth), resolveCompanyId()
│   │   ├── client.ts                 # TiimeClient (ofetch, intercepteurs, agrégation ressources)
│   │   ├── errors.ts                 # TiimeError (status, endpoint, details)
│   │   ├── types.ts                  # 40+ interfaces TypeScript (Company, Invoice, Client, etc.)
│   │   └── resources/                # 10 ressources API typées
│   │       ├── bank-accounts.ts      # list, get, balance
│   │       ├── bank-transactions.ts  # list, listAll, unimputed (pagination Range)
│   │       ├── clients.ts            # list, get, create, search
│   │       ├── company.ts            # get, users, appConfig, accountingPeriod, tiles
│   │       ├── documents.ts          # list, categories, preview, upload, download, match
│   │       ├── expense-reports.ts    # list, get, create
│   │       ├── invoices.ts           # list, listAll, get, create, update, send, duplicate, pdf, delete
│   │       ├── labels.ts             # list, standard, tags
│   │       ├── quotations.ts         # list, get, create, pdf, send
│   │       └── users.ts             # me, legalInformations, settings
│   ├── tests/                        # Tests SDK (Vitest)
│   │   └── client.test.ts            # Tests TiimeClient, resources
│   ├── package.json                  # npm: tiime-sdk
│   ├── tsconfig.json                 # TypeScript config
│   └── tsup.config.ts                # Build: 1 bundle ESM + dts
│
├── packages/tiime-cli/               # CLI (publié sur npm comme tiime-cli, dépend de tiime-sdk)
│   ├── src/cli/
│   │   ├── index.ts                  # Bootstrap citty, 13 sous-commandes
│   │   ├── config.ts                 # Gestion config (~/.config/tiime/config.json)
│   │   ├── i18n.ts                   # Traductions FR/EN (147 entrées, détection locale)
│   │   ├── output.ts                 # Formatage sortie (JSON, table, CSV)
│   │   ├── audit.ts                  # Audit comptable multi-entreprise
│   │   ├── auto-impute.ts            # Auto-imputation transactions
│   │   └── commands/                 # 13 commandes CLI
│   │       ├── auth.ts               # login (interactif/scriptable), logout, status
│   │       ├── bank.ts               # balance, accounts, transactions, unimputed
│   │       ├── clients.ts            # list, get, create, search
│   │       ├── company.ts            # list, get, use, me
│   │       ├── completion.ts         # Complétion shell (zsh, bash, fish)
│   │       ├── documents.ts          # list, upload, download, categories
│   │       ├── expenses.ts           # list, get, create
│   │       ├── invoices.ts           # list, get, create, duplicate, update, send, pdf, delete
│   │       ├── labels.ts             # list, standard, tags
│   │       ├── open.ts               # Ouvre Tiime dans le navigateur
│   │       ├── quotations.ts         # list, get, create, pdf, send
│   │       ├── status.ts             # Résumé rapide (6 requêtes parallèles)
│   │       └── version.ts            # Affiche version CLI + Node
│   ├── tests/                        # Tests CLI (Vitest)
│   │   └── cli/
│   │       └── output.test.ts        # Tests formatage JSON/table/CSV
│   ├── package.json                  # npm: tiime-cli (dépend de tiime-sdk workspace:*)
│   ├── tsconfig.json                 # TypeScript config
│   └── tsup.config.ts                # Build: 1 bundle CLI ESM + shebang
│
├── apps/docs/                        # Documentation Fumadocs (Next.js static export → GitHub Pages)
│   ├── content/docs/                 # Pages MDX
│   │   ├── sdk/                      # Documentation SDK (auth, client, index)
│   │   └── ...                       # CLI, agents, installation
│   └── ...
│
├── docs-internal/                    # Documentation interne (pour IA / développeurs)
│   ├── index.md                      # Point d'entrée documentation
│   ├── project-overview.md           # Vue d'ensemble
│   ├── architecture.md               # Architecture détaillée
│   ├── source-tree-analysis.md       # Ce fichier
│   ├── development-guide.md          # Guide de développement
│   ├── api-discovery.md              # Documentation 40+ endpoints API Tiime
│   └── homebrew-setup.md             # Guide setup Homebrew tap
│
├── .github/workflows/
│   ├── ci.yml                        # CI: lint, build, test (Node 22/24) + changesets release
│   ├── docs.yml                      # Deploy docs GitHub Pages
│   └── homebrew.yml                  # Release: mise à jour formule Homebrew
│
├── .changeset/
│   └── config.json                   # Configuration changesets
│
├── package.json                      # Root monorepo (scripts: build, test, lint, release)
├── pnpm-workspace.yaml               # Workspaces: packages/*, apps/*
├── turbo.json                        # Turborepo (build order SDK → CLI)
├── biome.json                        # Linter/Formatter (Biome v2.4.6, partagé)
├── vitest.config.ts                  # Config tests (workspaces)
├── README.md                         # Documentation principale
├── SKILL.md                          # Skill pour agents IA (skills.sh)
├── CHANGELOG.md                      # Historique des versions
└── LICENSE                           # MIT
```

## Répertoires critiques

| Répertoire | Rôle | Fichiers clés |
|------------|------|---------------|
| `packages/tiime-sdk/src/` | Cœur métier — client HTTP, auth, ressources typées | `client.ts`, `auth.ts`, `types.ts` |
| `packages/tiime-sdk/src/resources/` | 10 wrappers d'API REST Tiime | `invoices.ts` (le plus complet) |
| `packages/tiime-cli/src/cli/` | Interface utilisateur CLI | `index.ts` (bootstrap), `output.ts` |
| `packages/tiime-cli/src/cli/commands/` | 13 commandes utilisateur | `invoices.ts` (~400 lignes) |
| `packages/tiime-sdk/tests/` | Tests SDK | `client.test.ts` |
| `packages/tiime-cli/tests/` | Tests CLI | `output.test.ts` |
| `.github/workflows/` | Automatisation CI/CD | `ci.yml`, `docs.yml`, `homebrew.yml` |

## Points d'entrée

| Type | Fichier | Rôle |
|------|---------|------|
| SDK source | `packages/tiime-sdk/src/index.ts` | Exports: TiimeClient, TokenManager, TiimeError, types |
| CLI source | `packages/tiime-cli/src/cli/index.ts` | Bootstrap citty, enregistrement 13 commandes |
| Build SDK | `packages/tiime-sdk/dist/index.js` | Bundle ESM avec déclarations TypeScript |
| Build CLI | `packages/tiime-cli/dist/cli.js` | Exécutable avec shebang `#!/usr/bin/env node` |
| Bin | `tiime` (tiime-cli package.json) | Pointe vers `dist/cli.js` |
