import type { $Fetch } from "ofetch";
import type { User } from "../types";

export class UsersResource {
	constructor(private fetch: $Fetch) {}

	me() {
		return this.fetch<User>("/users/me");
	}

	legalInformations(): Promise<unknown> {
		return this.fetch("/users/me/legal_informations");
	}

	settings(companyId: number): Promise<unknown> {
		return this.fetch(`/users/me/companies/${companyId}/settings`);
	}
}
