import { TaskData } from "../systems/tasks.js";
import { DataTableDesc } from "./datatable_desc.js";

export class Task
{
	static data_model = DataTableDesc.Build(
		[
			{ key: 'id', label: 'table index', exclude: true },
			{ key: 'Title', label: 'task guid' },
			{ key: 'task_title', label: 'task title' },
			{ key: 'task_data', label: 'task data', multiline: true },
		],
		Task.Expander
	);

	static Expander(record = {})
	{
		let data = {
			table_index: record.id,
			guid: record.Title,
			title: record.task_title
		};
		if (record.task_data && typeof record.task_data === 'string' && record.task_data.length > 1)
			data = JSON.parse(record.task_data) ?? {};
		return new TaskData(data);
	}
}