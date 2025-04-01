import { DataFieldDesc } from "./datafield_desc.js";

export class InternalUser
{
	static table_fields = [
		'id', 'Title', 'display_name_full', 'user_role', 'user_team', 'user_manager_id', 'date_start', 'date_end',
		'email_work', 'email_home', 'phone_work', 'phone_home', 'phone_ext', 'address_home', 'address_work',
		'user_birthdate', 'user_permissions', 'user_notes', 'first_login_ts'
	];

	static field_descs =
		{
			'id': new DataFieldDesc('id', 'id', false, true, null),
			'Title': new DataFieldDesc('Title', 'user id', false, false, null),

			'display_name_full': new DataFieldDesc('display_name_full', 'legal name', false, false, null),
			'user_role': new DataFieldDesc('user_role', 'role(s)', false, false, 'role'),
			'user_team': new DataFieldDesc('user_team', 'department', false, false, 'team'),
			'user_manager_id': new DataFieldDesc('user_manager_id', 'manager id', false, false, 'user'),
			'date_start': new DataFieldDesc('date_start', 'tenure start', false, false, 'date'),
			'date_end': new DataFieldDesc('date_end', 'tenure end', false, false, 'date'),
			'email_work': new DataFieldDesc('email_work', 'work email', false, false, 'email'),
			'email_home': new DataFieldDesc('email_home', 'personal email', true, false, 'email'),
			'phone_ext': new DataFieldDesc('phone_ext', 'office ext', false, false, null),
			'phone_work': new DataFieldDesc('phone_work', 'work phone', false, true, 'phone'),
			'phone_home': new DataFieldDesc('phone_home', 'mobile phone', true, false, 'phone'),
			'address_work': new DataFieldDesc('address_work', 'work address', false, false, 'address'),
			'address_home': new DataFieldDesc('address_home', 'home address', true, false, 'address'),
			'user_birthdate': new DataFieldDesc('user_birthdate', 'date of birth', false, false, 'date'),
			'user_permissions': new DataFieldDesc('user_permissions', 'permissions', false, true, 'list'),
			'user_notes': new DataFieldDesc('user_notes', 'notes', true, false, null, true),

			'first_login_ts': new DataFieldDesc('first_login_ts', 'first login', false, true, 'datetime'),
		};
}