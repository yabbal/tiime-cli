import type { TableColumn } from "./output";

export const transactionColumns: TableColumn[] = [
	{ key: "id" },
	{ key: "transaction_date", header: "date" },
	{ key: "wording" },
	{ key: "amount" },
	{ key: "currency", header: "cur" },
	{ key: "status" },
	{ key: "operation_type", header: "type" },
	{
		key: "label",
		header: "label",
		get: (r) => {
			const imps = r.imputations as { label?: { name?: string } }[] | undefined;
			if (Array.isArray(imps) && imps.length > 0 && imps[0]?.label?.name)
				return imps[0].label.name;
			return "";
		},
	},
	{ key: "bank_name", header: "bank" },
	{ key: "count_documents", header: "docs" },
];

export const bankAccountColumns: TableColumn[] = [
	{ key: "id" },
	{ key: "name" },
	{ key: "iban" },
	{ key: "balance_amount", header: "balance" },
	{ key: "balance_currency", header: "cur" },
	{ key: "enabled" },
	{ key: "closed" },
	{ key: "short_bank_name", header: "bank" },
];

export const clientColumns: TableColumn[] = [
	{ key: "id" },
	{ key: "name" },
	{ key: "email" },
	{ key: "phone" },
	{ key: "city" },
	{
		key: "country",
		header: "country",
		get: (r) => {
			const c = r.country as { code?: string } | string | null;
			if (typeof c === "object" && c?.code) return c.code;
			return c ?? "";
		},
	},
	{ key: "siren_or_siret", header: "siret" },
	{ key: "archived" },
];

export const invoiceColumns: TableColumn[] = [
	{ key: "id" },
	{ key: "compiled_number", header: "number" },
	{ key: "client_name", header: "client" },
	{ key: "emission_date", header: "date" },
	{ key: "status" },
	{ key: "total_excluding_taxes", header: "ht" },
	{ key: "total_including_taxes", header: "ttc" },
	{ key: "type" },
	{ key: "due_date", header: "due" },
];

export const quotationColumns: TableColumn[] = [
	{ key: "id" },
	{ key: "compiled_number", header: "number" },
	{ key: "client_name", header: "client" },
	{ key: "emission_date", header: "date" },
	{ key: "status" },
	{ key: "total_excluding_taxes", header: "ht" },
	{ key: "total_including_taxes", header: "ttc" },
];

export const labelColumns: TableColumn[] = [
	{ key: "id" },
	{ key: "name" },
	{ key: "type" },
	{ key: "registry_type", header: "registry" },
	{ key: "acronym" },
	{ key: "color" },
	{ key: "disabled" },
	{ key: "configuration_source", header: "source" },
];

export const documentColumns: TableColumn[] = [
	{ key: "id" },
	{ key: "name" },
	{ key: "type" },
	{ key: "mime_type", header: "mime" },
	{ key: "created_at", header: "date" },
	{ key: "ocr_status", header: "ocr" },
	{ key: "payment_status", header: "payment" },
];

export const documentCategoryColumns: TableColumn[] = [
	{ key: "id" },
	{ key: "name" },
	{ key: "identifier" },
	{ key: "owner" },
	{ key: "editable" },
];

export const expenseColumns: TableColumn[] = [
	{ key: "id" },
	{ key: "title" },
	{ key: "status" },
	{ key: "total_amount", header: "amount" },
	{ key: "created_at", header: "date" },
];
