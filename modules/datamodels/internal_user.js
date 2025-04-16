import { DataTableDesc } from "./datatable_desc.js";

export class InternalUser
{
	static data_model = DataTableDesc.Build(
		[
			{ key: 'id', label: 'id', exclude: true },
			{ key: 'Title', label: 'user id', read_only: true },
			{ key: 'display_name_full', label: 'legal name' },
			{ key: 'user_role', label: 'role(s)', format: 'role' },
			{ key: 'user_team', label: 'department', format: 'team' },
			{ key: 'user_manager_id', label: 'manager id', format: 'user' },
			{ key: 'date_start', label: 'tenure start', format: 'date' },
			{ key: 'date_end', label: 'tenure end', format: 'date' },
			{ key: 'email_work', label: 'work email', format: 'email' },
			{ key: 'email_home', label: 'personal email', sensitive: true, format: 'email' },
			{ key: 'phone_ext', label: 'office ext' },
			{ key: 'phone_work', label: 'work phone', exclude: true, format: 'phone' },
			{ key: 'phone_home', label: 'mobile phone', sensitive: true, format: 'phone' },
			{ key: 'address_work', label: 'work address', exclude: true, format: 'address' },
			{ key: 'address_home', label: 'home address', sensitive: true, format: 'address' },
			{ key: 'user_birthdate', label: 'date of birth', format: 'date' },
			{ key: 'user_permissions', label: 'permissions', exclude: true, format: 'list' },
			{ key: 'user_notes', label: 'notes', sensitive: true, multiline: true },
			{ key: 'first_login_ts', label: 'first login', exclude: true, format: 'datetime' },
		]);
}