import { Modules } from "../modules.js";

export class Permission
{
	static table_fields = ['id', 'title', 'permission_name', 'permission_desc', 'permission_app_icon', 'permission_flags'];
}

Modules.Report("Permissions");