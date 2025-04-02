import { DataTableDesc } from "./datatable_desc.js";

export class AccountUser
{
	static data_model = DataTableDesc.Build(
		[
			{ key: 'user_id', label: 'user id' },
			{ key: 'display_name', label: 'display name' },
			{ key: 'email', label: 'email' }
		]
	);
}