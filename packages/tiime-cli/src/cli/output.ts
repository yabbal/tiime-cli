import Table from "cli-table3";
import { consola } from "consola";
import { TiimeError } from "tiime-sdk";

export type OutputFormat = "json" | "table" | "csv";

export const formatArg = {
	format: {
		type: "string" as const,
		description: "Format de sortie (json, table, csv)",
		default: "json",
	},
};

export interface TableColumn {
	key: string;
	header?: string;
	get?: (row: Record<string, unknown>) => unknown;
}

interface OutputOptions {
	format?: OutputFormat;
	columns?: TableColumn[];
}

const stringifyValue = (value: unknown): string => {
	if (value === null || value === undefined) return "";
	if (typeof value === "object") return JSON.stringify(value);
	return String(value);
};

const displayValue = (value: unknown): string => {
	if (value === null || value === undefined) return "";
	if (Array.isArray(value)) {
		if (value.length === 0) return "";
		return `(${value.length})`;
	}
	if (typeof value === "object" && value !== null) {
		const obj = value as Record<string, unknown>;
		if (obj.name !== undefined) return String(obj.name);
		if (obj.label !== undefined) return String(obj.label);
		if (obj.code !== undefined) return String(obj.code);
		if (obj.id !== undefined) return `#${obj.id}`;
		return JSON.stringify(obj);
	}
	return String(value);
};

const outputJson = (data: unknown): void => {
	process.stdout.write(`${JSON.stringify(data, null, 2)}\n`);
};

const unwrapEnvelope = (data: unknown): unknown => {
	if (typeof data !== "object" || data === null || Array.isArray(data))
		return data;

	const entries = Object.entries(data as Record<string, unknown>);
	const arrayEntries = entries.filter(([, v]) => Array.isArray(v));
	if (arrayEntries.length === 0) return data;
	// Pick the largest array (e.g. transactions over metadata: [])
	let best = arrayEntries[0];
	for (const entry of arrayEntries) {
		if ((entry[1] as unknown[]).length > (best[1] as unknown[]).length) {
			best = entry;
		}
	}
	return best[1];
};

const outputTable = (data: unknown, columns?: TableColumn[]): void => {
	const resolved = unwrapEnvelope(data);

	if (
		Array.isArray(resolved) &&
		resolved.length > 0 &&
		typeof resolved[0] === "object" &&
		resolved[0] !== null
	) {
		const cols: TableColumn[] =
			columns ??
			Object.keys(resolved[0] as Record<string, unknown>).map((k) => ({
				key: k,
			}));
		const headers = cols.map((c) => c.header ?? c.key);
		const table = new Table({ head: headers });
		for (const row of resolved) {
			const record = row as Record<string, unknown>;
			table.push(
				cols.map((col) => {
					const val = col.get ? col.get(record) : record[col.key];
					return displayValue(val);
				}),
			);
		}
		process.stdout.write(`${table.toString()}\n`);
	} else if (
		typeof resolved === "object" &&
		resolved !== null &&
		!Array.isArray(resolved)
	) {
		const table = new Table();
		for (const [key, value] of Object.entries(
			resolved as Record<string, unknown>,
		)) {
			table.push({ [key]: displayValue(value) });
		}
		process.stdout.write(`${table.toString()}\n`);
	} else {
		outputJson(data);
	}
};

const escapeCsvField = (value: string): string => {
	if (value.includes(",") || value.includes('"') || value.includes("\n")) {
		return `"${value.replace(/"/g, '""')}"`;
	}
	return value;
};

const outputCsv = (data: unknown): void => {
	if (
		Array.isArray(data) &&
		data.length > 0 &&
		typeof data[0] === "object" &&
		data[0] !== null
	) {
		const keys = Object.keys(data[0] as Record<string, unknown>);
		const header = keys.map(escapeCsvField).join(",");
		const lines = data.map((row) => {
			const record = row as Record<string, unknown>;
			return keys
				.map((key) => escapeCsvField(stringifyValue(record[key])))
				.join(",");
		});
		process.stdout.write(`${header}\n${lines.join("\n")}\n`);
	} else if (
		typeof data === "object" &&
		data !== null &&
		!Array.isArray(data)
	) {
		const entries = Object.entries(data as Record<string, unknown>);
		const header = "key,value";
		const lines = entries.map(
			([key, value]) =>
				`${escapeCsvField(key)},${escapeCsvField(stringifyValue(value))}`,
		);
		process.stdout.write(`${header}\n${lines.join("\n")}\n`);
	} else {
		outputJson(data);
	}
};

export const output = (data: unknown, options?: OutputOptions): void => {
	const format = options?.format ?? "json";

	if (!["json", "table", "csv"].includes(format)) {
		process.stderr.write(
			`${JSON.stringify({ error: `Format invalide : "${format}". Utilisez json, table ou csv.` })}\n`,
		);
		process.exit(1);
	}

	switch (format) {
		case "table":
			outputTable(data, options?.columns);
			break;
		case "csv":
			outputCsv(data);
			break;
		default:
			outputJson(data);
			break;
	}
};

export const outputSummary = (text: string): void => {
	consola.info(text);
};

export const outputColoredStatus = (data: {
	company_id: number;
	bank_accounts: { name: string; balance: number; currency: string }[];
	invoices: { drafts: number; unpaid: number };
	pending_quotations: number;
	total_clients: number;
	unimputed_transactions: number;
}): void => {
	const {
		company_id,
		bank_accounts,
		invoices,
		pending_quotations,
		total_clients,
		unimputed_transactions,
	} = data;

	console.error("");
	console.error(`  📊 Résumé — Entreprise #${company_id}`);

	for (const a of bank_accounts) {
		console.error(
			`  💰 Soldes : ${a.name} ${a.balance.toFixed(2)}${a.currency === "EUR" ? "€" : a.currency}`,
		);
	}

	console.error(
		`  📄 Factures : ${invoices.drafts} brouillon(s), ${invoices.unpaid} impayée(s)`,
	);
	console.error(`  📋 Devis en cours : ${pending_quotations}`);
	console.error(`  👥 Clients : ${total_clients}`);

	if (unimputed_transactions > 0) {
		console.error(`  ⚠️  Transactions non imputées : ${unimputed_transactions}`);
	} else {
		console.error(`  ✅ Toutes les transactions sont imputées`);
	}
	console.error("");
};

export const outputError = (error: unknown): void => {
	if (error instanceof TiimeError) {
		process.stderr.write(`${JSON.stringify(error.toJSON())}\n`);
	} else {
		const message = error instanceof Error ? error.message : String(error);
		process.stderr.write(`${JSON.stringify({ error: message })}\n`);
	}
	process.exit(1);
};
