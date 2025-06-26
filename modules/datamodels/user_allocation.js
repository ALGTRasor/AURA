import { DebugLog } from "../debuglog.js";
import { UserAllocationData } from "../systems/operation/allocations.js";
import { DataTableDesc } from "./datatable_desc.js";

export class UserAllocation
{
	static data_model = DataTableDesc.Build(
		[
			{ key: 'id', label: 'table index' },
			{ key: 'Title', label: 'allocation id' },
			{ key: 'user_id', label: 'user id', format: 'user' },
			{ key: 'allocation_max', label: 'allocated hours' },
			{ key: 'use_history', label: 'consumption history', format: 'list' },
			{ key: 'Created', label: 'created', format: 'datetime' },
			{ key: 'Author', label: 'created by' },
			{ key: 'Modified', label: 'last modified', format: 'datetime' },
			{ key: 'Editor', label: 'last modified by' },
		],
		UserAllocation.Expander
	);

	static Expander(record = {}) 
	{
		let data = {};

		data.table_index = record.id;
		data.user_id = record.user_id;
		data.guid = record.Title;

		data.allocation_max = Math.max(record.allocation_max ?? 1, 0.1);
		data.use_history = UserAllocation.ExpandHistory(record.use_history);
		data.use_total = data.use_history.reduce((sum, _) => sum + _.hours, 0);
		data.use_percent = data.use_total / data.allocation_max;

		return new UserAllocationData(data);
	};

	static ExpandHistory(value)
	{
		if (typeof value === 'string') value = JSON.parse(value);
		if (typeof value === 'Array') return value;
		if (typeof value === 'object') 
		{
			if ('uses' in value) return value.uses;

			DebugLog.Log(`'uses' not found in '${typeof value}' during ExpandHistory`);
			for (let propid in value) DebugLog.Log(`  > ${propid}: ${value[propid]}`);
			return value;
		}
		return value;
	}
}