import { Modules } from "../modules.js";

export class InternalUser
{
	static table_fields = [
		'id', 'title', 'display_name_full', 'user_role', 'user_team', 'user_manager_id', 'date_start', 'date_end',
		'email_work', 'email_home', 'phone_work', 'phone_home', 'phone_ext', 'address_home', 'address_work',
		'user_birthdate', 'user_permissions', 'user_notes', 'first_login_ts'
	];
}

Modules.Report("Internal Users");