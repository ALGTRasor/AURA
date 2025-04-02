import { DataTableDesc } from "./datatable_desc.js";

export class HrRequest
{
	static data_model = DataTableDesc.Build(
		[
			{ key: 'id', label: 'Table Index', exclude: true },
			{ key: 'Title', label: 'Record GUID', exclude: true },
			{ key: 'request_name', label: 'name' },
			{ key: 'request_group', label: 'group' },
			{ key: 'request_desc', label: 'description', multiline: true },

			{ key: 'requestee_id', label: 'requestee', format: 'user' },
			{ key: 'requester_id', label: 'requester', format: 'user' },

			{ key: 'file_type_requested', label: 'file type requested' },
			{ key: 'file_upload_path', label: 'file upload path' },
			{ key: 'file_expires', label: 'file expires' },

			{ key: 'date_uploaded', label: 'upload date', format: 'date' },
			{ key: 'date_discarded', label: 'discard date', format: 'date' },
			{ key: 'date_completed', label: 'completed date', format: 'date' },
			{ key: 'date_approved', label: 'approved date', format: 'date' },

		]
	);
}