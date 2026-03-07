import type { $Fetch } from "ofetch";
import type { Document, DocumentCategory } from "../types";

export interface DocumentsListParams {
	types?: string;
	source?: string;
	sorts?: string;
	accountable?: boolean;
	page?: number;
	pageSize?: number;
}

export class DocumentsResource {
	constructor(
		private fetch: $Fetch,
		private companyId: number,
	) {}

	list(params?: DocumentsListParams) {
		const start = ((params?.page ?? 1) - 1) * (params?.pageSize ?? 25);
		const end = start + (params?.pageSize ?? 25);
		const { page: _, pageSize: __, ...query } = params ?? {};

		return this.fetch<Document[]>(`/companies/${this.companyId}/documents`, {
			query: {
				sorts: "created_at:desc",
				expand: "file_family,preview_available",
				...query,
			},
			headers: {
				Accept:
					"application/vnd.tiime.documents.v2+json,application/vnd.tiime.docs.query+json,application/vnd.tiime.docs.imputation+json",
				Range: `items=${start}-${end}`,
			},
		});
	}

	categories() {
		return this.fetch<DocumentCategory[]>(
			`/companies/${this.companyId}/document_categories`,
			{
				headers: {
					Accept: "application/vnd.tiime.documents.v3+json",
				},
			},
		);
	}

	preview(documentId: number) {
		return this.fetch(
			`/companies/${this.companyId}/documents/${documentId}/preview`,
		);
	}
}
