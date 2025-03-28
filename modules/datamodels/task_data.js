import { DataFieldDesc } from "./datafield_desc.js";
import { DataTableDesc } from "./datatable_desc.js";

export class TaskData
{
	static data_model = new DataTableDesc(
		{
			'id': new DataFieldDesc('id', 'id', false, true),
			'Title': new DataFieldDesc('Title', 'task guid', false, true),
			'task_title': new DataFieldDesc('task_title', 'title'),
			'task_desc': new DataFieldDesc('task_desc', 'description'),
			'task_comments': new DataFieldDesc('task_comments', 'comments', false, false, 'list'),
			'subtask_ids': new DataFieldDesc('subtask_ids', 'subtasks', false, false, 'list'),
			'task_date_due': new DataFieldDesc('task_date_due', 'due date', false, false, 'date'),
			'task_date_completed': new DataFieldDesc('task_date_completed', 'completed date', false, false, 'date'),
			'owner_user_id': new DataFieldDesc('owner_user_id', 'owner', false, false, 'user'),
			'assigned_user_ids': new DataFieldDesc('assigned_user_ids', 'assigned users', false, false, 'list'),
			'task_project_id': new DataFieldDesc('task_project_id', 'project')
		}
	);
}
TaskData.data_model.field_descs['task_comments'].list_separator = '}:|:{';