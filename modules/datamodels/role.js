import { Modules } from "../modules.js";

export class Role
{
	static table_fields = ['id', 'title', 'role_name_short', 'role_name', 'role_desc', 'role_flags', 'role_level'];
}

Modules.Report("Roles");