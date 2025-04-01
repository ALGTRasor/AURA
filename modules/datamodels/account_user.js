import { DataFieldDesc } from "./datafield_desc.js";

export class AccountUser
{
	static table_fields = ['user_id', 'user_name', 'email'];
	static field_descs =
		{
			'user_id': new DataFieldDesc('user_id', 'user_id', false, false, null),
			'display_name': new DataFieldDesc('display_name', 'display_name', false, false, null),
			'email': new DataFieldDesc('email', 'email', false, false, null),
		};
}