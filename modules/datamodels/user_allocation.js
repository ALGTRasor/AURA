import { DebugLog } from "../debuglog.js";
import { DataTableDesc } from "./datatable_desc.js";

export class UserAllocation
{
	static data_model = DataTableDesc.Build(
		[
			{ key: 'id', label: 'table index', exclude: true },
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
		record.allocation_max = Math.max(record.allocation_max ?? 1, 0.1);
		record.use_history = UserAllocation.ExpandHistory(record.use_history);
		record.use_total = record.use_history.reduce((sum, _) => sum + _.hours, 0);
		record.use_percent = record.use_total / record.allocation_max;
		return record;
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