import { DataTableDesc } from "./datatable_desc.js";

export class ProjectCoreData
{
	static data_model = DataTableDesc.Build(
		[
			{ key: 'id', label: 'table index', exclude: true },
			{ key: 'Title', label: 'project guid' },
			{ key: 'project_name', label: 'project name' },
			{ key: 'project_scope', label: 'scope', multiline: true },
			{ key: 'project_json', label: 'project json', multiline: true }
		]
	);
}