# Tiime CLI

CLI et SDK TypeScript pour la comptabilite [Tiime](https://www.tiime.fr) — pilotez votre compta depuis le terminal.

Sortie JSON par defaut, ideal pour les agents IA et l'automatisation.

## Fonctionnalites

- **Factures** — lister, creer, dupliquer, supprimer des factures de vente
- **Clients** — consulter et gerer votre base clients
- **Banque** — soldes, comptes, transactions, operations non imputees
- **Devis** — lister et consulter les devis
- **Notes de frais** — lister les notes de frais
- **Documents** — parcourir les documents et categories
- **Labels & Tags** — labels personnalises, labels standards, tags
- **Multi-format** — sortie JSON (defaut), table ou CSV
- **SDK programmatique** — utilisable comme librairie TypeScript

## Installation

```bash
git clone https://github.com/yabbal/tiime.git
cd tiime
pnpm install
pnpm build
pnpm link --global
```

Verifiez que l'installation fonctionne :

```bash
tiime --help
```

## Configuration

### 1. Authentification

Mode interactif :

```bash
tiime auth login
```

Mode script / CI :

```bash
tiime auth login --email vous@example.com --password votre-mot-de-passe
```

Verifier le statut :

```bash
tiime auth status
```

### 2. Selection de l'entreprise

Listez vos entreprises puis selectionnez-en une :

```bash
tiime company list
tiime company use --id 12345
```

Verifiez l'entreprise active :

```bash
tiime company get
```

## Utilisation

### Authentification

```bash
tiime auth login          # Connexion interactive
tiime auth logout         # Deconnexion
tiime auth status         # Statut du token
```

### Entreprise

```bash
tiime company list        # Lister les entreprises
tiime company get         # Details de l'entreprise active
tiime company use --id ID # Definir l'entreprise active
tiime company me          # Info utilisateur courant
```

### Factures

```bash
# Lister les factures
tiime invoices list
tiime invoices list --status paid
tiime invoices list --sort invoice_number:asc
tiime invoices list --all                        # Toutes les pages

# Details d'une facture
tiime invoices get --id 42

# Creer une facture simple
tiime invoices create \
  --client-id 100 \
  --description "Prestation de conseil" \
  --unit-price 800 \
  --quantity 5 \
  --unit day \
  --vat normal

# Creer une facture multi-lignes
tiime invoices create \
  --client-id 100 \
  --lines '[{"description":"Dev","quantity":20,"unit_price":540,"unit":"day"},{"description":"Design","quantity":5,"unit_price":450,"unit":"day"}]'

# Previsualiser sans creer
tiime invoices create --client-id 100 --description "Test" --unit-price 500 --dry-run

# Dupliquer une facture
tiime invoices duplicate --id 42
tiime invoices duplicate --id 42 --date 2026-03-01 --quantity 18

# Supprimer un brouillon
tiime invoices delete --id 42
```

### Clients

```bash
tiime clients list                # Lister les clients actifs
tiime clients list --archived     # Inclure les archives
tiime clients get --id 100        # Details d'un client
```

### Banque

```bash
tiime bank accounts               # Lister les comptes bancaires
tiime bank balance                 # Soldes de tous les comptes
tiime bank transactions            # Dernieres transactions
tiime bank transactions --from 2026-01-01 --to 2026-01-31
tiime bank transactions --search "loyer" --all
tiime bank unimputed               # Transactions non imputees
```

### Devis

```bash
tiime quotations list              # Lister les devis
tiime quotations get --id 10       # Details d'un devis
```

### Notes de frais

```bash
tiime expenses list                # Lister les notes de frais
tiime expenses list --sort metadata.date:asc
```

### Documents

```bash
tiime documents list               # Lister les documents
tiime documents list --type receipt # Filtrer par type
tiime documents categories         # Categories disponibles
```

### Labels & Tags

```bash
tiime labels list                  # Labels personnalises
tiime labels standard              # Labels standards (plan comptable)
tiime labels tags                  # Tags
```

### Pipe avec jq

La sortie JSON se combine naturellement avec `jq` :

```bash
# Noms des clients
tiime clients list | jq '.[].name'

# Total des factures payees
tiime invoices list --status paid --all | jq '[.[].total_including_taxes] | add'

# Transactions > 1000 EUR
tiime bank transactions --all | jq '[.[] | select(.amount > 1000)]'

# Solde du premier compte
tiime bank balance | jq '.[0].balance_amount'
```

## Workflows

### Creer et dupliquer une facture mensuelle

```bash
# Premier mois : creer la facture de reference
tiime invoices create \
  --client-id 100 \
  --description "Prestation mensuelle - Janvier 2026" \
  --unit-price 540 \
  --quantity 20 \
  --unit day

# Mois suivants : dupliquer en ajustant la date et la quantite
tiime invoices duplicate --id 42 --date 2026-02-01 --quantity 18
```

### Voir un resume financier

```bash
# Soldes bancaires
tiime bank balance | jq '.[] | {name, balance_amount}'

# Factures en attente de paiement
tiime invoices list --status sent --all | jq 'length'

# Transactions non imputees a traiter
tiime bank unimputed | jq 'length'
```

### Explorer les transactions du mois

```bash
# Transactions de janvier
tiime bank transactions --from 2026-01-01 --to 2026-01-31 --all \
  | jq 'group_by(.amount > 0) | {depenses: .[0] | length, revenus: .[1] | length}'

# Chercher une transaction specifique
tiime bank transactions --search "adobe" --all
```

### Exporter des donnees en CSV

```bash
# Note : la sortie par defaut est JSON, convertissez avec jq
tiime invoices list --all \
  | jq -r '["numero","client","montant_ht","statut"], (.[] | [.invoice_number, .client.name, .total_excluding_taxes, .status]) | @csv' \
  > factures.csv

tiime clients list \
  | jq -r '["id","nom","ville"], (.[] | [.id, .name, .city]) | @csv' \
  > clients.csv
```

## SDK

Tiime CLI exporte un SDK TypeScript utilisable comme librairie :

```typescript
import { TiimeClient } from "tiime-cli";

const client = new TiimeClient({ companyId: 12345 });

// Factures
const invoices = await client.invoices.list({ status: "paid" });
const invoice = await client.invoices.get(42);
const created = await client.invoices.create({
  emission_date: "2026-03-01",
  client: { id: 100 },
  lines: [
    {
      description: "Prestation de conseil",
      quantity: 5,
      unit_amount: 800,
      vat_type: { code: "normal" },
      invoicing_unit: { id: 3, code: "day" },
    },
  ],
  status: "draft",
});

// Banque
const balances = await client.bankAccounts.balance();
const transactions = await client.bankTransactions.listAll();

// Clients
const clients = await client.clients.list({ archived: false });

// Utilisateur
const me = await client.users.me();
```

## Claude Code Skill

Ce CLI est concu pour etre utilise comme skill Claude Code. L'agent peut piloter votre comptabilite Tiime directement depuis une conversation :

- Sortie JSON structuree, facilement parseable par l'IA
- Toutes les commandes sont non-interactives (sauf `auth login` sans arguments)
- Combinable avec `jq` pour des analyses complexes

Pour l'activer, ajoutez le skill dans votre configuration Claude Code (`.claude/skills/`).

## Stack technique

| Outil | Role |
|-------|------|
| [TypeScript](https://www.typescriptlang.org/) | Langage |
| [citty](https://github.com/unjs/citty) | Framework CLI |
| [ofetch](https://github.com/unjs/ofetch) | Client HTTP |
| [@clack/prompts](https://github.com/bombshell-dev/clack) | Prompts interactifs |
| [cli-table3](https://github.com/cli-table/cli-table3) | Rendu tableau |
| [tsup](https://github.com/egoist/tsup) | Build |
| [Biome](https://biomejs.dev/) | Linter & formatter |
| [Vitest](https://vitest.dev/) | Tests |

## Licence

MIT — Youness Abbal
