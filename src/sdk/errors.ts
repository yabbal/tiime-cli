export class TiimeError extends Error {
	constructor(
		message: string,
		public status: number,
		public endpoint: string,
		public details?: unknown,
	) {
		super(message);
		this.name = "TiimeError";
	}
}
