import { DataFieldDesc } from "./datafield_desc.js";
import { DataTableDesc } from "./datatable_desc.js";

export class ProjectCoreData
{
	static data_model = new DataTableDesc(
		{
			'id': new DataFieldDesc('id', 'id', false, true),
			'Title': new DataFieldDesc('Title', 'project guid', false, true),
			'project_name': new DataFieldDesc('project_name', 'project name'),
			'project_scope': new DataFieldDesc('project_scope', 'scope'),
			'project_json': new DataFieldDesc('project_json', 'project json', false, false, false, true)
		}
	);
}