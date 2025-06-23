import { get_guid } from "../utils/mathutils.js";
import { DataTableDesc } from "./datatable_desc.js";

export class ProjectCoreData
{
	static data_model = DataTableDesc.Build(
		[
			{ key: 'id', label: 'table index', exclude: true },
			{ key: 'Title', label: 'project guid' },
			{ key: 'project_name', label: 'project name' },
			{ key: 'project_json', label: 'project json', multiline: true },
			{ key: 'date_start', label: 'start date' },
			{ key: 'date_end', label: 'end date' },
			{ key: 'status', label: 'status' },
		],
		ProjectCoreData.Expander
	);

	static Expander(record = {}) 
	{
		record.guid_random = get_guid();
		record.name = record.project_name;
		record.scope = record.project_scope;
		let data = JSON.parse(record.project_json ?? '{}');
		for (let property_id in data) record[property_id] = data[property_id];
		return record;
	};
}