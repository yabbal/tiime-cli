import type { $Fetch } from "ofetch";
import type { Client } from "../types";

export interface ClientsListParams {
	archived?: boolean;
}

export class ClientsResource {
	constructor(
		private fetch: $Fetch,
		private companyId: number,
	) {}

	list(params?: ClientsListParams) {
		return this.fetch<Client[]>(`/companies/${this.companyId}/clients`, {
			query: params,
			headers: {
				Accept: "application/vnd.tiime.timeline.v2+json",
				Range: "items=0-*",
			},
		});
	}

	get(clientId: number) {
		return this.fetch<Client>(
			`/companies/${this.companyId}/clients/${clientId}`,
		);
	}
}
