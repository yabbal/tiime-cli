export interface FetchOptions {
	method?: string;
	headers?: Record<string, string>;
	body?: unknown;
	query?: Record<string, unknown> | object;
}

export interface CreateFetchOptions {
	baseURL: string;
	headers?: Record<string, string>;
	retry?: number;
	retryDelay?: number;
	retryStatusCodes?: number[];
	onRequest?: (ctx: { options: { headers: Headers } }) => void | Promise<void>;
	onResponseError?: (ctx: {
		request: string;
		response: Response & { _data?: unknown };
	}) => void;
}

export type FetchFn = <T = unknown>(
	url: string,
	options?: FetchOptions,
) => Promise<T>;

const buildUrl = (
	baseURL: string,
	path: string,
	query?: Record<string, unknown> | object,
): string => {
	const url = new URL(path, baseURL.endsWith("/") ? baseURL : `${baseURL}/`);
	if (query) {
		for (const [key, value] of Object.entries(
			query as Record<string, unknown>,
		)) {
			if (value !== undefined && value !== null) {
				url.searchParams.set(key, String(value));
			}
		}
	}
	return url.href;
};

const sleep = (ms: number) => new Promise((r) => setTimeout(r, ms));

const isJsonContent = (contentType: string | null): boolean =>
	!!contentType?.includes("application/json") ||
	!!contentType?.includes("+json");

export const createFetch = (config: CreateFetchOptions): FetchFn => {
	const maxRetries = config.retry ?? 0;
	const retryDelay = config.retryDelay ?? 500;
	const retryStatusCodes = new Set(config.retryStatusCodes ?? []);

	return async <T = unknown>(
		path: string,
		options?: FetchOptions,
	): Promise<T> => {
		const url = buildUrl(config.baseURL, path, options?.query);

		const headers = new Headers(config.headers);
		if (options?.headers) {
			for (const [key, value] of Object.entries(options.headers)) {
				headers.set(key, value);
			}
		}

		let reqBody: BodyInit | undefined;
		if (options?.body !== undefined) {
			if (options.body instanceof FormData) {
				reqBody = options.body;
			} else {
				headers.set("Content-Type", "application/json");
				reqBody = JSON.stringify(options.body);
			}
		}

		if (config.onRequest) {
			await config.onRequest({ options: { headers } });
		}

		let lastError: unknown;
		for (let attempt = 0; attempt <= maxRetries; attempt++) {
			if (attempt > 0) await sleep(retryDelay);

			let response: Response;
			try {
				response = await fetch(url, {
					method: options?.method ?? "GET",
					headers,
					body: reqBody,
				});
			} catch (err) {
				lastError = err;
				if (attempt < maxRetries) continue;
				throw err;
			}

			if (!response.ok && retryStatusCodes.has(response.status)) {
				lastError = response;
				if (attempt < maxRetries) continue;
			}

			if (!response.ok && config.onResponseError) {
				let data: unknown;
				try {
					data = await response.clone().json();
				} catch {
					/* ignore */
				}
				const enriched = Object.assign(response, { _data: data });
				config.onResponseError({ request: url, response: enriched });
			}

			const contentType = response.headers.get("content-type");
			if (response.status === 204 || !contentType) {
				return undefined as T;
			}

			if (isJsonContent(contentType)) {
				return response.json() as Promise<T>;
			}

			return response.arrayBuffer() as unknown as Promise<T>;
		}

		throw lastError;
	};
};

export const fetchJson = async <T>(
	url: string,
	options?: RequestInit,
): Promise<T> => {
	const response = await fetch(url, options);
	if (!response.ok) {
		throw new Error(`HTTP ${response.status}: ${response.statusText}`);
	}
	return response.json() as Promise<T>;
};
