import { TaskData } from "../systems/tasks.js";
import { DataTableDesc } from "./datatable_desc.js";

export class Task
{
	static data_model = DataTableDesc.Build(
		[
			{ key: 'id', label: 'table index' },
			{ key: 'Title', label: 'task guid' },
			{ key: 'task_title', label: 'task title' },
			{ key: 'task_data', label: 'task data', multiline: true },
		],
		Task.Expander
	);

	static Expander(record = {})
	{
		let data = {};
		if (record.task_data && typeof record.task_data === 'string' && record.task_data.length > 1)
			data = JSON.parse(record.task_data) ?? {};

		data.table_index = record.id;
		data.guid = record.Title;
		data.title = record.task_title;
		return new TaskData(data);
	}
}