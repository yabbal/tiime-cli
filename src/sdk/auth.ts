import { existsSync, mkdirSync, readFileSync, writeFileSync } from "node:fs";
import { homedir } from "node:os";
import { join } from "node:path";
import { ofetch } from "ofetch";
import type { AuthTokens } from "./types";

const AUTH0_DOMAIN = "auth0.tiime.fr";
const AUTH0_CLIENT_ID = "iEbsbe3o66gcTBfGRa012kj1Rb6vjAND";
const AUTH0_AUDIENCE = "https://chronos/";
const CONFIG_DIR = join(homedir(), ".config", "tiime");
const AUTH_FILE = join(CONFIG_DIR, "auth.json");
const CREDS_FILE = join(CONFIG_DIR, "credentials.json");

export class TokenManager {
	private tokens: AuthTokens | null = null;

	constructor() {
		this.loadFromDisk();
	}

	async login(email: string, password: string): Promise<AuthTokens> {
		const response = await ofetch<{
			access_token: string;
			expires_in: number;
			token_type: string;
		}>(`https://${AUTH0_DOMAIN}/oauth/token`, {
			method: "POST",
			body: {
				grant_type: "password",
				client_id: AUTH0_CLIENT_ID,
				audience: AUTH0_AUDIENCE,
				scope: "openid email",
				username: email,
				password: password,
			},
		});

		this.tokens = {
			access_token: response.access_token,
			expires_at: Date.now() + response.expires_in * 1000,
		};

		this.saveToDisk();
		this.saveCredentials(email, password);
		return this.tokens;
	}

	async getValidToken(): Promise<string> {
		if (!this.tokens || this.isExpired()) {
			const creds = this.loadCredentials();
			if (creds) {
				const tokens = await this.login(creds.email, creds.password);
				return tokens.access_token;
			}
			throw new Error(
				this.tokens
					? "Token expired. Run `tiime auth login` to re-authenticate."
					: "Not authenticated. Run `tiime auth login` first.",
			);
		}

		return this.tokens.access_token;
	}

	isAuthenticated(): boolean {
		return this.tokens !== null && !this.isExpired();
	}

	logout(): void {
		this.tokens = null;
		if (existsSync(AUTH_FILE)) {
			writeFileSync(AUTH_FILE, "{}");
		}
	}

	getTokenInfo(): { email: string | null; expiresAt: Date | null } {
		if (!this.tokens) {
			return { email: null, expiresAt: null };
		}

		// Decode JWT payload to get email
		try {
			const payload = JSON.parse(
				Buffer.from(
					this.tokens.access_token.split(".")[1],
					"base64",
				).toString(),
			);
			return {
				email: payload["tiime/userEmail"] || null,
				expiresAt: new Date(this.tokens.expires_at),
			};
		} catch {
			return { email: null, expiresAt: new Date(this.tokens.expires_at) };
		}
	}

	private isExpired(): boolean {
		if (!this.tokens) return true;
		// Add 60s buffer
		return Date.now() >= this.tokens.expires_at - 60_000;
	}

	private loadFromDisk(): void {
		try {
			if (existsSync(AUTH_FILE)) {
				const data = JSON.parse(readFileSync(AUTH_FILE, "utf-8"));
				if (data.access_token && data.expires_at) {
					this.tokens = data;
				}
			}
		} catch {
			// Ignore read errors
		}
	}

	private saveToDisk(): void {
		if (!existsSync(CONFIG_DIR)) {
			mkdirSync(CONFIG_DIR, { recursive: true });
		}
		writeFileSync(AUTH_FILE, JSON.stringify(this.tokens, null, 2));
	}

	private saveCredentials(email: string, password: string): void {
		if (!existsSync(CONFIG_DIR)) {
			mkdirSync(CONFIG_DIR, { recursive: true });
		}
		writeFileSync(CREDS_FILE, JSON.stringify({ email, password }, null, 2), {
			mode: 0o600,
		});
	}

	private loadCredentials(): { email: string; password: string } | null {
		try {
			if (existsSync(CREDS_FILE)) {
				const data = JSON.parse(readFileSync(CREDS_FILE, "utf-8"));
				if (data.email && data.password) return data;
			}
		} catch {
			// Ignore
		}
		return null;
	}
}
