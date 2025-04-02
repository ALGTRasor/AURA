import { DataTableDesc } from "./datatable_desc.js";

export class TimekeepEvent
{
	static data_model = DataTableDesc.Build(
		[
			{ key: 'id', label: 'table index', exclude: true },
			{ key: 'Title', label: 'event guid', exclude: true },

			{ key: 'user_id', label: 'user id', format: 'user' },
			{ key: 'event_type_code', label: 'event type' },

			{ key: 'event_start', label: 'start timestamp', format: 'datetime' },
			{ key: 'event_end', label: 'end timestamp', format: 'datetime' },
		]
	);
}

export class TimekeepStatus
{
	static data_model = DataTableDesc.Build(
		[
			{ key: 'id', label: 'table index', exclude: true },
			{ key: 'Title', label: 'user id', format: 'user' },
			{ key: 'user_status_code', label: 'status code' },
			{ key: 'status_start', label: 'start timestamp', format: 'datetime' },
		]
	);
}