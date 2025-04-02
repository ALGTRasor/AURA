import { DataTableDesc } from "./datatable_desc.js";

export class Permission
{
	static data_model = DataTableDesc.Build(
		[
			{ key: 'id', label: 'id', exclude: true },
			{ key: 'Title', label: 'permission id' },
			{ key: 'permission_name', label: 'permission name' },
			{ key: 'permission_desc', label: 'description', multiline: true },
			{ key: 'permission_app_icon', label: 'powerapps icon' },
			{ key: 'permission_flags', label: 'flags', multiline: true }
		]
	);
}