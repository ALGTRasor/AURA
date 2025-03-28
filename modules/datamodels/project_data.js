import { DataFieldDesc } from "./datafield_desc.js";
import { DataTableDesc } from "./datatable_desc.js";

if (!window.data_models) window.data_models = {};
window.data_models.project_data = new DataTableDesc(
	{
		'id': new DataFieldDesc('id', 'id', false, true),
		'Title': new DataFieldDesc('Title', 'project guid', false, true),
		'name': new DataFieldDesc('name', 'name'),
		'status': new DataFieldDesc('status', 'status'),
		'scope': new DataFieldDesc('scope', 'scope', false, false, false, true),
		'description': new DataFieldDesc('description', 'description', false, false, false, true),

		'client_id': new DataFieldDesc('client_id', 'client', false, false, 'contact'),
		'pm_id': new DataFieldDesc('pm_id', 'project manager', false, false, 'contact'),
		'ops_id': new DataFieldDesc('ops_id', 'ops', false, false, 'contact'),
		'comms_id': new DataFieldDesc('comms_id', 'comms', false, false, 'contact'),
		'row_id': new DataFieldDesc('row_id', 'row', false, false, 'contact'),

		'location': new DataFieldDesc('location', 'location'),
		'date_start': new DataFieldDesc('date_start', 'start date', false, false, 'date'),
		'date_construction': new DataFieldDesc('date_construction', 'construction date', false, false, 'date'),
		'date_in_service': new DataFieldDesc('date_in_service', 'in-service date', false, false, 'date'),

		'surveyor_id': new DataFieldDesc('surveyor_id', 'surveyor', false, false, 'contact'),
		'survey_notes': new DataFieldDesc('survey_notes', 'survey notes', false, false, false, true),

		'user_ids': new DataFieldDesc('users_ids', 'assigned users', false, false, 'list'),
		'file_ids': new DataFieldDesc('file_ids', 'files', false, false, 'list'),

		'billing_code': new DataFieldDesc('billing_code', 'billing code'),

		'notes': new DataFieldDesc('notes', 'notes', false, false, false, true),
	}
);