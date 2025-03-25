import { Modules } from "../modules.js";

export class Task
{
	static table_fields = ['id', 'title', 'task_id', 'task_title', 'task_desc', 'task_comments', 'subtask_ids', 'task_due_date', 'task_date_completed', 'owner_user_id'];
}

Modules.Report("Tasks");