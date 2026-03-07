import { defineCommand } from "citty";
import { TiimeClient } from "../../sdk/client";
import { getCompanyId } from "../config";
import { output, outputError } from "../output";

export const documentsCommand = defineCommand({
	meta: { name: "documents", description: "Gestion des documents" },
	subCommands: {
		list: defineCommand({
			meta: { name: "list", description: "Lister les documents" },
			args: {
				type: {
					type: "string",
					description: "Type de document (ex: receipt)",
				},
				source: {
					type: "string",
					description: "Source du document (ex: accountant)",
				},
				page: { type: "string", description: "Numéro de page", default: "1" },
			},
			async run({ args }) {
				try {
					const client = new TiimeClient({ companyId: getCompanyId() });
					const docs = await client.documents.list({
						types: args.type,
						source: args.source,
						page: Number(args.page),
					});
					output(docs);
				} catch (e) {
					outputError(e);
				}
			},
		}),

		categories: defineCommand({
			meta: {
				name: "categories",
				description: "Lister les catégories de documents",
			},
			async run() {
				try {
					const client = new TiimeClient({ companyId: getCompanyId() });
					const categories = await client.documents.categories();
					output(categories);
				} catch (e) {
					outputError(e);
				}
			},
		}),
	},
});
