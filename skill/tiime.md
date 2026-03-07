# Tiime CLI Skill

CLI pour interagir avec l'application de comptabilite Tiime (apps.tiime.fr).
Toutes les commandes retournent du JSON sur stdout, les erreurs sur stderr.

Use when the user asks about Tiime, accounting data, invoices (factures), clients, bank accounts, bank transactions, documents, labels, expense reports, or any task related to their Tiime accounting software. Triggers on: "tiime", "factures", "facture", "invoices", "comptabilite", "banque", "transactions bancaires", "clients tiime", "documents comptables", "notes de frais".

## Pre-requis

- Le CLI doit etre build : `cd /Users/yabbal/Workplace/yabbal/tiime && pnpm build`
- L'utilisateur doit etre authentifie : `tiime auth login` (credentials via Dashlane: `dcli password tiime.fr -o json`)
- Un company ID doit etre configure : `tiime company use --id 50824`

## Alias

```bash
TIIME="node /Users/yabbal/Workplace/yabbal/tiime/dist/cli.js"
```

## Commandes disponibles

### Authentification
```bash
$TIIME auth login --email EMAIL --password PASSWORD   # Connexion (stocke le token dans ~/.config/tiime/)
$TIIME auth logout                                     # Deconnexion
$TIIME auth status                                     # Statut de connexion
```

### Entreprise
```bash
$TIIME company get             # Info de l'entreprise active
$TIIME company me              # Info utilisateur (inclut active_company)
$TIIME company use --id ID     # Definir l'entreprise active
```

### Factures
```bash
$TIIME invoices list                          # Lister les factures (paginee, 25/page)
$TIIME invoices list --page 2                 # Page specifique
$TIIME invoices list --page-size 50           # Taille de page
$TIIME invoices list --all                    # Toutes les factures (auto-pagination)
$TIIME invoices get --id INVOICE_ID           # Detail d'une facture

# Creer une facture (brouillon par defaut)
$TIIME invoices create \
  --client-id 638439 \
  --description "Prestation dev" \
  --quantity 20 --unit-price 540 --unit day \
  --title "Prestation dev" \
  --free-field "REF CONTRAT" \
  --vat normal

# Mode dry-run : preview du payload sans creer
$TIIME invoices create --description "Test" --unit-price 100 --dry-run

# Creer et numerter directement (status=saved)
$TIIME invoices create --description "Test" --unit-price 100 --status saved

# Supprimer un brouillon
$TIIME invoices delete --id INVOICE_ID
```

Options de creation :
- `--client-id` : ID du client (lie la facture au client)
- `--client-name` : Nom du client (si pas de client-id)
- `--date` : Date d'emission (YYYY-MM-DD, defaut: aujourd'hui)
- `--title` : Intitule de la facture
- `--description` : Description de la ligne (requis)
- `--quantity` : Quantite (defaut: 1)
- `--unit-price` : Prix unitaire HT (requis)
- `--unit` : Unite (day, hour, unit, package, word, character, page)
- `--vat` : TVA (normal=20%, reduced=10%, super_reduced=5.5%, none=0%)
- `--free-field` : Champ libre (ex: reference contrat)
- `--status` : draft (defaut) ou saved (numerotee)
- `--dry-run` : Preview sans creer

### Clients
```bash
$TIIME clients list                           # Lister les clients actifs
$TIIME clients list --archived                # Inclure les archives
$TIIME clients get --id CLIENT_ID             # Detail d'un client
```

### Banque
```bash
$TIIME bank accounts                          # Lister les comptes bancaires
$TIIME bank transactions                      # Lister les transactions (100/page)
$TIIME bank transactions --page 2             # Page specifique
$TIIME bank transactions --bank-account ID    # Filtrer par compte
$TIIME bank transactions --sort date:asc      # Trier
$TIIME bank transactions --all                # Toutes les transactions (auto-pagination)
$TIIME bank unimputed                         # Transactions non imputees
```

### Documents
```bash
$TIIME documents list                         # Lister les documents
$TIIME documents list --type receipt           # Filtrer par type
$TIIME documents list --source accountant      # Filtrer par source
$TIIME documents categories                   # Lister les categories
```

### Labels & Tags
```bash
$TIIME labels list                            # Labels personnalises
$TIIME labels standard                        # Labels standards
$TIIME labels tags                            # Tags
```

## Format de sortie

Toutes les commandes retournent du JSON. Exemples :

```bash
# Lister toutes les factures et filtrer
$TIIME invoices list --all | jq '.[] | {id, compiled_number, status, total_excluding_taxes}'

# Obtenir le solde des comptes
$TIIME bank accounts | jq '.[] | {name: .name, balance: .balance_amount}'

# Toutes les transactions avec wording et montant
$TIIME bank transactions --all | jq '.[] | {date: .transaction_date, wording, amount}'

# Chercher un client par nom
$TIIME clients list | jq '.[] | select(.name | test("Martin"; "i"))'

# Dry-run puis creer si OK
$TIIME invoices create --description "Dev" --unit-price 540 --quantity 20 --unit day --client-id 638439 --dry-run
```

## Workflow typiques

### Creer une facture mensuelle
```bash
# 1. Verifier le client
$TIIME clients list | jq '.[] | {id, name}'
# 2. Preview
$TIIME invoices create --client-id 638439 --description "Prestation dev" --quantity 20 --unit-price 540 --unit day --dry-run
# 3. Creer le brouillon
$TIIME invoices create --client-id 638439 --description "Prestation dev" --quantity 20 --unit-price 540 --unit day
```

### Voir un resume financier
```bash
$TIIME bank accounts          # Soldes des comptes
$TIIME bank unimputed         # Transactions a traiter
$TIIME invoices list          # Dernieres factures
```

### Explorer les transactions
```bash
$TIIME bank transactions --all | jq '[.[] | select(.amount < 0)] | sort_by(.amount) | .[:5]'  # Top 5 depenses
$TIIME bank transactions --all | jq 'map(.amount) | add'  # Total
```
