import { defineCommand } from "citty";
import { TiimeClient } from "../../sdk/client";
import { getCompanyId } from "../config";
import { output, outputError } from "../output";

export const clientsCommand = defineCommand({
	meta: { name: "clients", description: "Gestion des clients" },
	subCommands: {
		list: defineCommand({
			meta: { name: "list", description: "Lister les clients" },
			args: {
				archived: {
					type: "boolean",
					description: "Inclure les clients archivés",
					default: false,
				},
			},
			async run({ args }) {
				try {
					const client = new TiimeClient({ companyId: getCompanyId() });
					const clients = await client.clients.list({
						archived: args.archived,
					});
					output(clients);
				} catch (e) {
					outputError(e);
				}
			},
		}),

		get: defineCommand({
			meta: { name: "get", description: "Détails d'un client" },
			args: {
				id: { type: "string", description: "ID du client", required: true },
			},
			async run({ args }) {
				try {
					const client = new TiimeClient({ companyId: getCompanyId() });
					const result = await client.clients.get(Number(args.id));
					output(result);
				} catch (e) {
					outputError(e);
				}
			},
		}),
	},
});
