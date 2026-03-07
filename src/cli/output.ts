export const output = (data: unknown): void => {
	process.stdout.write(`${JSON.stringify(data, null, 2)}\n`);
};

export const outputError = (error: unknown): void => {
	const message = error instanceof Error ? error.message : String(error);
	process.stderr.write(`${JSON.stringify({ error: message })}\n`);
	process.exit(1);
};
