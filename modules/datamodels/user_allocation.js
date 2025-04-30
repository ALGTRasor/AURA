import { DataTableDesc } from "./datatable_desc.js";

export class UserAllocation
{
	static data_model = DataTableDesc.Build(
		[
			{ key: 'id', label: 'table index', exclude: true },
			{ key: 'Title', label: 'allocation id' },
			{ key: 'user_id', label: 'user id', format: 'user' },
			{ key: 'allocation_max', label: 'allocated hours' },
			{ key: 'use_history', label: 'consumption history', format: 'object', expander: _ => typeof _ === 'string' ? JSON.parse(_) : _ },
		]
	);
}