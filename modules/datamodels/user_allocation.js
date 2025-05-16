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
			{ key: 'use_history', label: 'consumption history', format: 'list', expander: UserAllocation.ExpandHistory },
			{ key: 'Created', label: 'created', format: 'datetime' },
			{ key: 'Author', label: 'created by' },
			{ key: 'Modified', label: 'last modified', format: 'datetime' },
			{ key: 'Editor', label: 'last modified by' },
		]
	);

	static ExpandHistory(value)
	{
		if (typeof value === 'string') value = JSON.parse(value);
		if (typeof value === 'object') 
		{
			if ('uses' in value) return value.uses;
			DebugLog.Log(`'uses' not found in '${typeof value}'`);
			for (let propid in value)
			{
				DebugLog.Log(`  > ${propid}: ${value[propid]}`);
			}
			return value;
		}

		DebugLog.Log(`ExpandHistory provided type '${typeof value}'`);
		return value;
	}
}