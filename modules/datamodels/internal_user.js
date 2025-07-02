import { DataTableDesc } from "./datatable_desc.js";

export class InternalUser
{
	static data_model = DataTableDesc.Build(
		[
			{ key: 'id', label: 'id', exclude: true },
			{ key: 'Title', label: 'user id', read_only: true },
			{ key: 'display_name_full', label: 'legal name' },
			{ key: 'user_role', label: 'role(s)', format: 'blank' },
			{ key: 'user_team', label: 'department', format: 'blank' },
			{ key: 'user_manager_id', label: 'manager id', format: 'blank' },
			{ key: 'email_work', label: 'work email', format: 'email' },
			{ key: 'phone_home', label: 'home phone', sensitive: true, format: 'phone' },
			{ key: 'phone_home', label: 'mobile phone', format: 'phone' },
			{ key: 'phone_ext', label: 'business phone', format: 'phone-ext' },
			{ key: 'email_home', label: 'personal email', sensitive: true, format: 'email' },
			{ key: 'address_work', label: 'work address', exclude: true, format: 'address' },
			{ key: 'address_home', label: 'home address', sensitive: true, format: 'address' },
			{ key: 'user_birthdate', label: 'date of birth', sensitive: true, format: 'date' },
			{ key: 'user_permissions', label: 'permissions', exclude: true, format: 'list' },
			{ key: 'user_notes', label: 'notes', sensitive: true, multiline: true, exclude: true },
			{ key: 'first_login_ts', label: 'first login', exclude: true, format: 'datetime' },
			{ key: 'date_start', label: 'tenure start', format: 'date', sensitive: true },
			{ key: 'date_end', label: 'tenure end', format: 'date', sensitive: true },
		]
	);
}