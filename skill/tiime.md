# Tiime CLI Skill

CLI pour interagir avec l'application de comptabilite Tiime (apps.tiime.fr).
Toutes les commandes retournent du JSON sur stdout (defaut), avec support table et CSV.

Use when the user asks about Tiime, accounting data, invoices (factures), clients, bank accounts, bank transactions, documents, labels, expense reports, quotations, or any task related to their Tiime accounting software. Triggers on: "tiime", "factures", "facture", "invoices", "comptabilite", "banque", "transactions bancaires", "clients tiime", "documents comptables", "notes de frais", "devis", "solde", "balance".

## Pre-requis

- Le CLI doit etre build : `cd /Users/yabbal/Workplace/yabbal/tiime && pnpm build`
- L'utilisateur doit etre authentifie : `tiime auth login` (credentials via Dashlane: `dcli password tiime.fr -o json`)
- Un company ID doit etre configure : `tiime company use --id 50824`

## Commandes disponibles

La commande `tiime` est disponible globalement dans le PATH.

### Authentification
```bash
tiime auth login                                   # Connexion interactive (prompt email/password)
tiime auth login --email EMAIL --password PASSWORD  # Connexion non-interactive (CI/script)
tiime auth logout                                   # Deconnexion
tiime auth status                                   # Statut de connexion
```

Les credentials sont stockes dans le Keychain macOS (fallback fichier chiffre sur Linux).

### Entreprise
```bash
tiime company list            # Lister toutes les entreprises
tiime company get             # Info de l'entreprise active
tiime company me              # Info utilisateur (inclut active_company)
tiime company use --id ID     # Definir l'entreprise active
```

Societes connues : abbal consulting (50824), ALLIAL GROUP (117954), ALLIAL Immobiliers (97641)

### Statut rapide
```bash
tiime status                  # Resume : soldes, factures brouillon/impayees, transactions non imputees
```

### Factures
```bash
tiime invoices list                          # Lister les factures (paginee, 25/page)
tiime invoices list --page 2                 # Page specifique
tiime invoices list --page-size 50           # Taille de page
tiime invoices list --all                    # Toutes les factures (auto-pagination)
tiime invoices list --status draft           # Filtrer par statut (draft, saved, sent, paid)
tiime invoices get --id INVOICE_ID           # Detail d'une facture

# Creer une facture (brouillon par defaut) — ligne simple
tiime invoices create \
  --client-id 638439 \
  --description "Prestation dev" \
  --quantity 20 --unit-price 540 --unit day \
  --title "Prestation dev" \
  --free-field "REF CONTRAT" \
  --vat normal

# Creer une facture multi-lignes
tiime invoices create --client-id 638439 --lines '[
  {"description":"Dev","quantity":20,"unit_price":540,"unit":"day"},
  {"description":"Support","quantity":5,"unit_price":540,"unit":"hour"}
]'

# Mode dry-run : preview du payload sans creer
tiime invoices create --description "Test" --unit-price 100 --dry-run

# Mettre a jour une facture
tiime invoices update --id ID --title "Nouveau titre" --status saved

# Dupliquer une facture existante (cree un brouillon)
tiime invoices duplicate --id INVOICE_ID
tiime invoices duplicate --id INVOICE_ID --date 2026-03-01 --quantity 22

# Envoyer une facture par email
tiime invoices send --id INVOICE_ID --email client@example.com --subject "Facture mars"

# Telecharger le PDF
tiime invoices pdf --id INVOICE_ID --output facture-mars.pdf

# Supprimer un brouillon
tiime invoices delete --id INVOICE_ID
```

### Clients
```bash
tiime clients list                           # Lister les clients actifs
tiime clients list --archived                # Inclure les archives
tiime clients get --id CLIENT_ID             # Detail d'un client
tiime clients search --query "Martin"        # Rechercher un client
tiime clients create --name "ACME" --siret "12345678900000" --city "Paris"  # Creer un client
```

### Banque
```bash
tiime bank accounts                          # Lister les comptes bancaires
tiime bank balance                           # Soldes des comptes (simplifie)
tiime bank transactions                      # Lister les transactions (100/page)
tiime bank transactions --page 2             # Page specifique
tiime bank transactions --bank-account ID    # Filtrer par compte
tiime bank transactions --sort date:asc      # Trier
tiime bank transactions --from 2026-01-01 --to 2026-03-31  # Filtrer par date
tiime bank transactions --search "APPLE"     # Rechercher par libelle
tiime bank transactions --all                # Toutes les transactions (auto-pagination)
tiime bank unimputed                         # Transactions non imputees
```

### Devis (Quotations)
```bash
tiime quotations list                        # Lister les devis
tiime quotations get --id QUOTATION_ID       # Detail d'un devis
```

### Notes de frais (Expenses)
```bash
tiime expenses list                          # Lister les notes de frais
tiime expenses list --sort metadata.date:asc # Trier par date
```

### Documents
```bash
tiime documents list                         # Lister les documents
tiime documents list --type receipt           # Filtrer par type
tiime documents list --source accountant      # Filtrer par source
tiime documents categories                   # Lister les categories
tiime documents upload --file /path/to/receipt.pdf   # Uploader un justificatif
tiime documents download --id DOC_ID --output doc.pdf  # Telecharger un document
```

### Labels & Tags
```bash
tiime labels list                            # Labels personnalises
tiime labels standard                        # Labels standards
tiime labels tags                            # Tags
```

### Autocompletion
```bash
eval "$(tiime completion --shell zsh)"       # Activer l'autocompletion zsh
tiime completion --shell bash >> ~/.bashrc   # Bash
tiime completion --shell fish               # Fish
```

## Formats de sortie

Par defaut JSON. Supporte aussi table et CSV :
```bash
tiime invoices list --format table           # Tableau lisible
tiime clients list --format csv              # Export CSV
tiime bank balance --format json             # JSON (defaut)
```

Exemples avec jq :
```bash
tiime invoices list --all | jq '.[] | {id, compiled_number, status, total_excluding_taxes}'
tiime bank accounts | jq '.[] | {name: .name, balance: .balance_amount}'
tiime bank transactions --all | jq '.[] | {date: .transaction_date, wording, amount}'
tiime clients search --query "Martin" | jq '.[].name'
```

## Workflow typiques

### Creer une facture mensuelle
```bash
tiime clients search --query "EXTRA"    # Trouver le client
tiime invoices create --client-id 638439 --description "Prestation dev" --quantity 20 --unit-price 540 --unit day --dry-run  # Preview
tiime invoices create --client-id 638439 --description "Prestation dev" --quantity 20 --unit-price 540 --unit day  # Creer
tiime invoices send --id ID --email client@example.com  # Envoyer
tiime invoices pdf --id ID  # Telecharger le PDF
```

### Resume financier rapide
```bash
tiime status                 # Vue d'ensemble
tiime bank balance           # Soldes
tiime invoices list --status sent  # Factures en attente de paiement
```

### Explorer les transactions
```bash
tiime bank transactions --from 2026-03-01 --to 2026-03-31 --format table  # Transactions du mois
tiime bank transactions --search "UBER" --all | jq 'map(.amount) | add'   # Total Uber
tiime bank transactions --all | jq '[.[] | select(.amount < 0)] | sort_by(.amount) | .[:5]'  # Top 5 depenses
```

### Dupliquer une facture recurrente
```bash
tiime invoices duplicate --id 12345 --date 2026-04-01 --quantity 22
```
