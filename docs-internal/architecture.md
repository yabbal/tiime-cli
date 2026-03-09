# Architecture — Tiime CLI & SDK

> Mis à jour le 2026-03-09 | Scan level: deep

## Résumé

Tiime est un monorepo Turborepo composé de deux packages npm :
- **`tiime-sdk`** — SDK TypeScript autonome pour l'API Tiime
- **`tiime-cli`** — CLI qui consomme le SDK

Le SDK est utilisable indépendamment du CLI, avec authentification via variables d'environnement ou options explicites.

## Architecture en couches

```
┌─────────────────────────────────────────────┐
│              CLI Layer (tiime-cli)           │
│  citty framework, 13 commands, i18n, output │
│       packages/tiime-cli/src/cli/           │
├─────────────────────────────────────────────┤
│              SDK Layer (tiime-sdk)           │
│  TiimeClient, TokenManager, 10 Resources   │
│       packages/tiime-sdk/src/               │
├─────────────────────────────────────────────┤
│              API Tiime (externe)             │
│  https://chronos-api.tiime-apps.com/v1/     │
│  Auth0 (auth0.tiime.fr)                     │
└─────────────────────────────────────────────┘
```

**Règle fondamentale :** La CLI consomme le SDK (`import { TiimeClient } from "tiime-sdk"`), jamais l'inverse. Le SDK est autonome et publié comme package npm indépendant.

## Stack technologique

| Catégorie | Technologie | Version |
|-----------|------------|---------|
| Langage | TypeScript | 5.9.3 |
| Runtime | Node.js | >=20 |
| Monorepo | Turborepo | — |
| CLI Framework | citty | 0.2.1 |
| HTTP Client | ofetch | 1.5.1 |
| Prompts | @clack/prompts | 1.1.0 |
| Logging | consola | 3.4.2 |
| Tables | cli-table3 | 0.6.5 |
| Build | tsup | 8.5.1 |
| Tests | Vitest | 4.0.18 |
| Linter | Biome | 2.4.6 |

## Couche SDK (`packages/tiime-sdk/src/`)

### TiimeClient (`client.ts`)

Client HTTP principal. Initialise `ofetch` avec :
- **Base URL** : `https://chronos-api.tiime-apps.com/v1/companies/{companyId}/`
- **Headers custom** : `tiime-app: tiime`, `tiime-app-version: 4.30.3`, `tiime-app-platform: web`
- **Intercepteur auth** : injecte `Authorization: Bearer {token}` via TokenManager
- **Retry** : logique de retry intégrée ofetch
- **Agrégation** : expose les 10 ressources comme propriétés (`.invoices`, `.clients`, etc.)

Options du constructeur (toutes optionnelles) :

| Option | Type | Description |
|--------|------|-------------|
| `companyId` | `number` | ID entreprise (résolu via `TIIME_COMPANY_ID` ou config locale) |
| `email` | `string` | Email du compte (résolu via `TIIME_EMAIL`) |
| `password` | `string` | Mot de passe (résolu via `TIIME_PASSWORD`) |
| `tokens` | `AuthTokens` | Tokens d'authentification directe (résolu via `TIIME_ACCESS_TOKEN`) |
| `tokenManager` | `TokenManager` | Instance custom de TokenManager |

### TokenManager (`auth.ts`)

Gestion de l'authentification Auth0 avec cascade de résolution :

| Aspect | Détail |
|--------|--------|
| Grant type | `password` (pas password-realm) |
| Endpoint Auth0 | `https://auth0.tiime.fr/oauth/token` |
| Client ID | `iEbsbe3o66gcTBfGRa012kj1Rb6vjAND` |
| Audience | `https://chronos/` |
| Scope | `openid email` |
| Expiration | Buffer de 60 secondes avant expiration réelle |
| Stockage tokens | `~/.config/tiime/auth.json` (si persist=true) |
| Stockage credentials | macOS Keychain → fallback fichier (si persist=true) |

**Cascade d'authentification :**
```
1. Tokens explicites (options.tokens)
2. Email/password explicites (options.email + options.password) → deferred login
3. TIIME_ACCESS_TOKEN (env var)
4. TIIME_EMAIL + TIIME_PASSWORD (env vars) → deferred login
5. Fichiers disque (~/.config/tiime/) → CLI compat
```

**`resolveCompanyId()` — Cascade :**
```
1. Option explicite (companyId)
2. TIIME_COMPANY_ID (env var)
3. Fichier config (~/.config/tiime/config.json)
```

### Ressources API (`packages/tiime-sdk/src/resources/`)

10 classes de ressource, chacune encapsulant un domaine de l'API Tiime :

| Ressource | Méthodes | Particularités |
|-----------|----------|----------------|
| `invoices` | list, listAll, get, create, update, send, duplicate, downloadPdf, delete | Template par défaut, calcul `line_amount`, la plus complète |
| `quotations` | list, get, create, downloadPdf, send | Similaire aux factures |
| `clients` | list, get, create, search | Filtre `archived` |
| `bank-accounts` | list, get, balance | Agrégation soldes |
| `bank-transactions` | list, listAll, unimputed | Pagination `Range: items=X-Y`, status 206 |
| `documents` | list, categories, preview, upload, download, match | Upload FormData, download ArrayBuffer |
| `expense-reports` | list, get, create | Tri `metadata.date:desc` |
| `labels` | list, standard, tags | Expand `tag_detail` |
| `company` | get, users, appConfig, accountingPeriod, tiles, dashboardBlocks | Config entreprise |
| `users` | me, legalInformations, settings | Utilisateur courant |

### Gestion des erreurs (`errors.ts`)

```typescript
class TiimeError extends Error {
  status: number       // Code HTTP (401, 404, 500...)
  endpoint: string     // Route API qui a échoué
  details?: unknown    // Corps de la réponse d'erreur
  toJSON()             // Sérialisation structurée pour la CLI
}
```

### Types (`types.ts`)

40+ interfaces TypeScript couvrant tous les modèles de données : `AuthTokens`, `Company`, `User`, `Client`, `BankAccount`, `BankTransaction`, `Invoice`, `Quotation`, `Document`, `ExpenseReport`, `Label`, `Tag`, paramètres de création, réponses paginées.

## Couche CLI (`packages/tiime-cli/src/cli/`)

### Bootstrap (`index.ts`)

- Framework `citty` avec `defineCommand()` + `runMain()`
- 13 sous-commandes enregistrées via `subCommands`
- Help personnalisé avec `showTranslatedUsage()` pour i18n
- Imports SDK depuis `"tiime-sdk"` (workspace dependency)

### Commandes (`commands/`)

| Commande | Sous-commandes | Description |
|----------|---------------|-------------|
| `auth` | login, logout, status | Authentification (interactif + scriptable) |
| `company` | list, get, use, me | Gestion entreprise active |
| `invoices` | list, get, create, duplicate, update, send, pdf, delete | Facturation complète (~400 lignes) |
| `quotations` | list, get, create, pdf, send | Devis |
| `clients` | list, get, create, search | Gestion clients |
| `bank` | balance, accounts, transactions, unimputed | Banque |
| `expenses` | list, get, create | Notes de frais |
| `documents` | list, upload, download, categories | Documents comptables |
| `labels` | list, standard, tags | Étiquettes |
| `status` | — | Résumé rapide (6 requêtes parallèles) |
| `open` | — | Ouvre Tiime dans le navigateur |
| `version` | — | Affiche version CLI + Node |
| `completion` | — | Génère scripts complétion (zsh/bash/fish) |

### Configuration (`config.ts`)

- Fichier : `~/.config/tiime/config.json`
- Contenu : `{ companyId: number }`
- `loadConfig()` : lecture silencieuse (pas d'erreur si absent)
- `saveConfig()` : écriture avec création de répertoire récursive
- `getCompanyId()` : erreur explicite si non configuré

### Internationalisation (`i18n.ts`)

- Détection langue : `TIIME_LANG` → `LC_ALL` → `LC_MESSAGES` → `LANG` → français par défaut
- 147 traductions FR↔EN pour descriptions de commandes et arguments
- Traductions framework citty (USAGE → UTILISATION, etc.)
- Fonction `translateHelp()` applique les remplacements sur le texte d'aide

### Formatage sortie (`output.ts`)

- 3 formats : JSON (défaut), table (cli-table3), CSV
- `output()` : dispatch selon format choisi
- `outputSummary()` : messages informatifs via consola
- `outputColoredStatus()` : résumés colorés (status command)
- `outputError()` : erreurs JSON structurées

## API Tiime (externe)

| Aspect | Détail |
|--------|--------|
| Base URL | `https://chronos-api.tiime-apps.com/v1/` |
| Auth | Auth0 password grant |
| Headers | `tiime-app: tiime`, `tiime-app-version: 4.30.3`, `tiime-app-platform: web` |
| Pagination | Header `Range: items=0-25`, réponse `Content-Range`, status 206 |
| Content-Type | Headers Accept custom (`vnd.tiime.*`) |
| Endpoints | 40+ endpoints documentés dans `api-discovery.md` |

## Build et distribution

### tsup

Chaque package a sa propre config tsup :

| Package | Entrée | Sortie | Particularités |
|---------|--------|--------|----------------|
| `tiime-sdk` | `src/index.ts` | `dist/index.js` + `dist/index.d.ts` | Bundle ESM avec déclarations TypeScript |
| `tiime-cli` | `src/cli/index.ts` | `dist/cli.js` | Shebang `#!/usr/bin/env node`, `__VERSION__` injecté |

Turborepo ordonne le build : `tiime-sdk` d'abord (dépendance), puis `tiime-cli`.

### Distribution

| Canal | Détail |
|-------|--------|
| npm | `tiime-sdk` (SDK) + `tiime-cli` (CLI) |
| Homebrew | Tap `yabbal/tap/tiime`, formule dans `homebrew/tiime.rb` |
| Source | Clone + `pnpm install && pnpm build` |

## Tests

- **Framework** : Vitest avec globals
- **Structure** :
  - `packages/tiime-sdk/tests/` — Tests SDK (auth, client, resources)
  - `packages/tiime-cli/tests/` — Tests CLI (output, config, auto-impute, i18n)

## CI/CD

### ci.yml (GitHub Actions)
- **Trigger** : push main, PR vers main
- **Matrice** : Node 22 et 24
- **Steps** : install (pnpm) → lint (biome) → build (tsup) → test (vitest) → test CLI binary
- **Release** : Changesets auto-publish sur push main (trusted publishing OIDC, pas de NPM_TOKEN)

### homebrew.yml
- **Trigger** : release published
- **Steps** : extract version → wait npm publish → get SHA256 tarball → update formula → push tap
