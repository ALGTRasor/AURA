import { DataFieldDesc } from "./datafield_desc.js";
import { DataTableDesc } from "./datatable_desc.js";

export class HrRequest
{
	static data_model = new DataTableDesc(
		{
			'id': new DataFieldDesc('id', 'id', false, true),
			'Title': new DataFieldDesc('Title', 'request guid', false, true),

			'request_name': new DataFieldDesc('request_name', 'name'),
			'request_group': new DataFieldDesc('request_group', 'group'),
			'request_desc': new DataFieldDesc('request_desc', 'description', false, false, false, true),

			'requestee_id': new DataFieldDesc('requestee_id', 'requestee', false, false, 'user'),
			'requester_id': new DataFieldDesc('requester_id', 'requester', false, false, 'user'),

			'file_type_requested': new DataFieldDesc('file_type_requested', 'file type requested'),
			'file_upload_path': new DataFieldDesc('file_upload_path', 'file upload path'),
			'file_expires': new DataFieldDesc('file_expires', 'file expires'),

			'date_uploaded': new DataFieldDesc('date_uploaded', 'upload date', false, false, 'date'),
			'date_discarded': new DataFieldDesc('date_discarded', 'discard date', false, false, 'date'),
			'date_completed': new DataFieldDesc('date_completed', 'completed date', false, false, 'date'),
			'date_approved': new DataFieldDesc('date_approved', 'approved date', false, false, 'date')
		}
	);
}