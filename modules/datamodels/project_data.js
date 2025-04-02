import { DataTableDesc } from "./datatable_desc.js";

export class ProjectData
{

	static data_model = DataTableDesc.Build(
		[
			{ key: 'id', label: 'table index', exclude: true },
			{ key: 'Title', label: 'project guid' },

			{ key: 'name', label: 'name' },
			{ key: 'status', label: 'status' },
			{ key: 'scope', label: 'scope', multiline: true },
			{ key: 'description', label: 'description', multiline: true },
			{ key: 'client_id', label: 'client', format: 'contact' },
			{ key: 'pm_id', label: 'project manager', format: 'contact' },
			{ key: 'ops_id', label: 'ops', format: 'contact' },
			{ key: 'comms_id', label: 'comms', format: 'contact' },
			{ key: 'row_id', label: 'row', format: 'contact' },
			{ key: 'location', label: 'location' },
			{ key: 'date_start', label: 'start date', format: 'date' },
			{ key: 'date_construction', label: 'construction date', format: 'date' },
			{ key: 'date_in_service', label: 'in-service date', format: 'date' },
			{ key: 'surveyor_id', label: 'surveyor', format: 'contact' },
			{ key: 'survey_notes', label: 'survey notes', multiline: true },
			{ key: 'users_ids', label: 'assigned users', format: 'list' },
			{ key: 'file_ids', label: 'files', format: 'list' },
			{ key: 'billing_code', label: 'billing code' },
			{ key: 'notes', label: 'notes', multiline: true },
		]
	);
}