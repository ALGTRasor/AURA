import { DataTableDesc } from "./datatable_desc.js";

export class Role
{
	static data_model = DataTableDesc.Build(
		[
			{ key: 'id', label: 'table index', exclude: true },
			{ key: 'Title', label: 'role id' },
			{ key: 'role_name_short', label: 'name short' },
			{ key: 'role_name', label: 'name' },
			{ key: 'role_desc', label: 'description', multiline: true },
			{ key: 'role_flags', label: 'flags', format: 'list' }
		]
	);
}