import type { $Fetch } from "ofetch";
import type { BankTransaction, BankTransactionsResponse } from "../types";

export interface BankTransactionsListParams {
	hide_refused?: boolean;
	bank_account?: number;
	amount_type?: "positive" | "negative";
	operation_type?: string;
	sorts?: string;
	page?: number;
	pageSize?: number;
}

export class BankTransactionsResource {
	constructor(
		private fetch: $Fetch,
		private companyId: number,
	) {}

	list(params?: BankTransactionsListParams) {
		const start = ((params?.page ?? 1) - 1) * (params?.pageSize ?? 100);
		const end = start + (params?.pageSize ?? 100);
		const { page: _, pageSize: __, ...query } = params ?? {};

		return this.fetch<BankTransactionsResponse>(
			`/companies/${this.companyId}/bank_transactions`,
			{
				query: { hide_refused: false, ...query },
				headers: {
					Accept:
						"application/vnd.tiime.bank_transactions.v2+json,application/vnd.tiime.bank_transactions.without_documents+json",
					Range: `items=${start}-${end}`,
				},
			},
		);
	}

	async listAll(
		params?: Omit<BankTransactionsListParams, "page">,
	): Promise<BankTransaction[]> {
		const pageSize = params?.pageSize ?? 200;
		const all: BankTransaction[] = [];
		let page = 1;
		let hasMore = true;

		while (hasMore) {
			const response = await this.list({ ...params, page, pageSize });
			all.push(...response.transactions);
			hasMore = response.transactions.length === pageSize;
			page++;
		}

		return all;
	}

	unimputed() {
		return this.fetch<BankTransaction[]>(
			`/companies/${this.companyId}/bank_transactions/unimputed`,
		);
	}
}
