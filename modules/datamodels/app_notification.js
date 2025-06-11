import { DataTableDesc } from "./datatable_desc.js";

export class AppNotification
{
	static data_model = DataTableDesc.Build(
		[
			{ key: 'id', label: 'table index', exclude: true },
			{ key: 'Title', label: 'user id' },
			{ key: 'notification_title', label: 'title' },
			{ key: 'notification_body', label: 'body' },
			{ key: 'select_action_code', label: 'action code' },
			{ key: 'datetime_arrival', label: 'timestamp', format: 'datetime' }
		]
	);
}