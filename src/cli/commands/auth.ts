import { defineCommand } from "citty";
import { TokenManager } from "../../sdk/auth";
import { output, outputError } from "../output";

export const authCommand = defineCommand({
	meta: { name: "auth", description: "Gestion de l'authentification" },
	subCommands: {
		login: defineCommand({
			meta: { name: "login", description: "Se connecter à Tiime" },
			args: {
				email: {
					type: "string",
					description: "Adresse email",
					required: true,
				},
				password: {
					type: "string",
					description: "Mot de passe",
					required: true,
				},
			},
			async run({ args }) {
				try {
					const tm = new TokenManager();
					await tm.login(args.email, args.password);
					const info = tm.getTokenInfo();
					output({
						status: "authenticated",
						email: info.email,
						expires_at: info.expiresAt?.toISOString(),
					});
				} catch (e) {
					outputError(e);
				}
			},
		}),

		logout: defineCommand({
			meta: { name: "logout", description: "Se déconnecter de Tiime" },
			run() {
				const tm = new TokenManager();
				tm.logout();
				output({ status: "logged_out" });
			},
		}),

		status: defineCommand({
			meta: {
				name: "status",
				description: "Afficher le statut d'authentification",
			},
			run() {
				const tm = new TokenManager();
				const info = tm.getTokenInfo();
				output({
					authenticated: tm.isAuthenticated(),
					email: info.email,
					expires_at: info.expiresAt?.toISOString() ?? null,
				});
			},
		}),
	},
});
