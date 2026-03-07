import { defineCommand } from "citty";

const commands: Record<string, string[]> = {
	auth: ["login", "logout", "status"],
	company: ["list", "get", "use", "me"],
	invoices: ["list", "get", "create", "duplicate", "delete"],
	clients: ["list", "get"],
	bank: ["accounts", "balance", "transactions", "unimputed"],
	quotations: ["list", "get"],
	expenses: ["list"],
	documents: ["list", "categories"],
	labels: ["list", "standard", "tags"],
	completion: [],
};

const topLevelCommands = Object.keys(commands);

const generateZsh = (): string => {
	const subcases = topLevelCommands
		.filter((cmd) => commands[cmd].length > 0)
		.map((cmd) => {
			const subs = commands[cmd].map((s) => `'${s}'`).join(" ");
			return `\t\t\t${cmd})\n\t\t\t\tcompadd -- ${subs}\n\t\t\t\t;;`;
		})
		.join("\n");

	return `#compdef tiime

_tiime() {
\tlocal -a top_commands
\ttop_commands=(${topLevelCommands.map((c) => `'${c}'`).join(" ")})

\tif (( CURRENT == 2 )); then
\t\tcompadd -- "\${top_commands[@]}"
\telse
\t\tlocal cmd="\${words[2]}"
\t\tcase "$cmd" in
${subcases}
\t\tesac
\tfi
}

compdef _tiime tiime
`;
};

const generateBash = (): string => {
	const subcases = topLevelCommands
		.filter((cmd) => commands[cmd].length > 0)
		.map((cmd) => {
			const subs = commands[cmd].join(" ");
			return `\t\t\t${cmd})\n\t\t\t\tCOMPREPLY=( $(compgen -W "${subs}" -- "$cur") )\n\t\t\t\t;;`;
		})
		.join("\n");

	return `_tiime() {
\tlocal cur prev
\tcur="\${COMP_WORDS[COMP_CWORD]}"
\tprev="\${COMP_WORDS[COMP_CWORD-1]}"

\tif [[ \${COMP_CWORD} -eq 1 ]]; then
\t\tCOMPREPLY=( $(compgen -W "${topLevelCommands.join(" ")}" -- "$cur") )
\t\treturn
\tfi

\tcase "$prev" in
${subcases}
\tesac
}

complete -F _tiime tiime
`;
};

const generateFish = (): string => {
	const lines = [
		"# Disable file completions by default",
		"complete -c tiime -f",
		"",
		"# Top-level commands",
		...topLevelCommands.map(
			(cmd) =>
				`complete -c tiime -n '__fish_use_subcommand' -a '${cmd}' -d '${cmd}'`,
		),
		"",
		"# Subcommands",
	];

	for (const cmd of topLevelCommands) {
		const subs = commands[cmd];
		if (subs.length > 0) {
			for (const sub of subs) {
				lines.push(
					`complete -c tiime -n '__fish_seen_subcommand_from ${cmd}' -a '${sub}' -d '${sub}'`,
				);
			}
			lines.push("");
		}
	}

	return `${lines.join("\n")}`;
};

export const completionCommand = defineCommand({
	meta: {
		name: "completion",
		description: "Generer le script d'autocompletion shell",
	},
	args: {
		shell: {
			type: "string",
			description: "Shell cible (zsh, bash, fish)",
			default: "zsh",
		},
	},
	run({ args }) {
		const shell = args.shell;

		switch (shell) {
			case "zsh":
				process.stdout.write(generateZsh());
				break;
			case "bash":
				process.stdout.write(generateBash());
				break;
			case "fish":
				process.stdout.write(generateFish());
				break;
			default:
				process.stderr.write(
					`Shell non supporte : ${shell}. Utilisez zsh, bash ou fish.\n`,
				);
				process.exit(1);
		}
	},
});
