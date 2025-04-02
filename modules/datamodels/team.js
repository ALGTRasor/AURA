import { DataTableDesc } from "./datatable_desc.js";

export class Team
{
	static data_model = DataTableDesc.Build(
		[
			{ key: 'id', label: 'table index', exclude: true },
			{ key: 'Title', label: 'team id' },
			{ key: 'team_name', label: 'team name' },
			{ key: 'team_desc', label: 'description', multiline: true },
		]
	);
}