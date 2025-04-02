import { DataFieldDesc } from "./datafield_desc.js";
import { DataTableDesc } from "./datatable_desc.js";

export class TaskData
{
	static data_model = DataTableDesc.Build(
		[
			{ key: 'id', label: 'id', exclude: true },
			{ key: 'Title', label: 'permission id' },
			{ key: 'task_title', label: 'title name' },
			{ key: 'task_desc', label: 'description', multiline: true },
			{ key: 'task_comments', label: 'comments', format: 'list' },
			{ key: 'subtask_ids', label: 'subtasks', format: 'list' },

			{ key: 'task_date_due', label: 'due date', format: 'date' },
			{ key: 'task_date_completed', label: 'completed date', format: 'date' },

			{ key: 'owner_user_id', label: 'owner', format: 'user' },
			{ key: 'assigned_user_ids', label: 'assigned users', format: 'list' },
			{ key: 'task_project_id', label: 'project', format: 'project' },
		]
	);
}
TaskData.data_model.field_descs['task_comments'].list_separator = '}:|:{';