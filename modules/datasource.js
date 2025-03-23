import { Modules } from "./modules.js";
import { SharePoint } from "./sharepoint.js";

export class DataSource
{
	static Nothing = new DataSource(null, null, null);

	static Teams = new DataSource('ALGTeams', 'ALGInternal', ['id', 'title', 'team_name', 'team_desc']);
	static Roles = new DataSource('ALGRoles', 'ALGInternal', ['id', 'title', 'role_name_short', 'role_name', 'role_desc', 'role_flags', 'role_level']);
	static Permissions = new DataSource('ALGPerms', 'ALGInternal', ['id', 'title', 'permission_name', 'permission_desc', 'permission_app_icon', 'permission_flags']);

	static Users = new DataSource('ALGUsers', 'ALGInternal', ['id', 'title', 'display_name_full']);
	static Contacts = new DataSource('ALGContacts', 'ALGInternal', ['id', 'title', 'contact_name']);

	static Tasks = new DataSource('ALGTasks', 'ALGInternal', ['id', 'title', 'task_id', 'task_title', 'task_desc', 'task_comments', 'subtask_ids', 'task_due_date', 'task_date_completed', 'owner_user_id']);

	constructor(list_title, site_name = 'ALGInternal', fields = ['id', 'title'])
	{
		this.list_title = list_title;
		this.site_name = site_name;
		this.fields = fields;
	}

	async GetData() { return await SharePoint.GetListData(this); }
}

Modules.Report("SharePoint");