import { DataTableDesc } from "./datatable_desc.js";

export class AURAProblem
{
	static data_model = DataTableDesc.Build(
		[
			{ key: 'id', label: 'table index', exclude: true },
			{ key: 'Title', label: 'guid' },
			{ key: 'problem_name', label: 'Name' },
			{ key: 'problem_desc', label: 'Description' },
			{ key: 'date_resolved', label: 'Date/Time Resolved', format: 'datetime' }
		]
	);
}