import type { $Fetch } from "ofetch";
import type { Quotation } from "../types";

export class QuotationsResource {
	constructor(
		private fetch: $Fetch,
		private companyId: number,
	) {}

	list(expand = "invoices") {
		return this.fetch<Quotation[]>(`/companies/${this.companyId}/quotations`, {
			query: { expand },
			headers: { Range: "items=0-25" },
		});
	}

	get(quotationId: number) {
		return this.fetch<Quotation>(
			`/companies/${this.companyId}/quotations/${quotationId}`,
		);
	}
}
