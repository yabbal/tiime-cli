import { defineCommand } from "citty";
import { TiimeClient } from "../../sdk/client";
import { getCompanyId } from "../config";
import { output, outputError } from "../output";

export const bankCommand = defineCommand({
	meta: { name: "bank", description: "Comptes bancaires et transactions" },
	subCommands: {
		accounts: defineCommand({
			meta: { name: "accounts", description: "Lister les comptes bancaires" },
			args: {
				enabled: {
					type: "boolean",
					description: "Uniquement les comptes actifs",
					default: true,
				},
			},
			async run({ args }) {
				try {
					const client = new TiimeClient({ companyId: getCompanyId() });
					const accounts = await client.bankAccounts.list(args.enabled);
					output(accounts);
				} catch (e) {
					outputError(e);
				}
			},
		}),

		transactions: defineCommand({
			meta: {
				name: "transactions",
				description: "Lister les transactions bancaires",
			},
			args: {
				"bank-account": {
					type: "string",
					description: "Filtrer par ID de compte bancaire",
				},
				"hide-refused": {
					type: "boolean",
					description: "Masquer les transactions refusées",
					default: false,
				},
				sort: {
					type: "string",
					description: "Tri champ:direction (ex: date:desc)",
				},
				page: { type: "string", description: "Numéro de page", default: "1" },
				"page-size": {
					type: "string",
					description: "Éléments par page",
					default: "100",
				},
				all: {
					type: "boolean",
					description: "Récupérer toutes les pages",
					default: false,
				},
			},
			async run({ args }) {
				try {
					const client = new TiimeClient({ companyId: getCompanyId() });
					const params = {
						bank_account: args["bank-account"]
							? Number(args["bank-account"])
							: undefined,
						hide_refused: args["hide-refused"],
						sorts: args.sort,
					};

					if (args.all) {
						const transactions = await client.bankTransactions.listAll(params);
						output(transactions);
					} else {
						const transactions = await client.bankTransactions.list({
							...params,
							page: Number(args.page),
							pageSize: Number(args["page-size"]),
						});
						output(transactions);
					}
				} catch (e) {
					outputError(e);
				}
			},
		}),

		unimputed: defineCommand({
			meta: {
				name: "unimputed",
				description: "Transactions non imputées",
			},
			async run() {
				try {
					const client = new TiimeClient({ companyId: getCompanyId() });
					const transactions = await client.bankTransactions.unimputed();
					output(transactions);
				} catch (e) {
					outputError(e);
				}
			},
		}),
	},
});
