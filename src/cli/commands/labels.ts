import { defineCommand } from "citty";
import { TiimeClient } from "../../sdk/client";
import { getCompanyId } from "../config";
import { output, outputError } from "../output";

export const labelsCommand = defineCommand({
	meta: { name: "labels", description: "Gestion des labels et tags" },
	subCommands: {
		list: defineCommand({
			meta: { name: "list", description: "Lister les labels personnalisés" },
			async run() {
				try {
					const client = new TiimeClient({ companyId: getCompanyId() });
					const labels = await client.labels.list();
					output(labels);
				} catch (e) {
					outputError(e);
				}
			},
		}),

		standard: defineCommand({
			meta: { name: "standard", description: "Lister les labels standards" },
			async run() {
				try {
					const client = new TiimeClient({ companyId: getCompanyId() });
					const labels = await client.labels.standard();
					output(labels);
				} catch (e) {
					outputError(e);
				}
			},
		}),

		tags: defineCommand({
			meta: { name: "tags", description: "Lister les tags" },
			async run() {
				try {
					const client = new TiimeClient({ companyId: getCompanyId() });
					const tags = await client.labels.tags();
					output(tags);
				} catch (e) {
					outputError(e);
				}
			},
		}),
	},
});
