import { SharePoint } from "./sharepoint.js";
import { ExternalContact } from "./datamodels/external_contact.js";
import { Permission } from "./datamodels/user_permission.js";
import { InternalUser } from "./datamodels/internal_user.js";
import { Role } from "./datamodels/role.js";
import { Team } from "./datamodels/team.js";
import { Modules } from "./modules.js";

import { TaskData } from "./datamodels/task_data.js";
import { ProjectCoreData } from "./datamodels/project_data_core.js";
import { HrRequest } from "./datamodels/hr_request.js";
import { TimekeepEvent, TimekeepStatus } from "./datamodels/timekeep.js";
import { DataTableDesc } from "./datamodels/datatable_desc.js";
import { UserAccountInfo } from "./useraccount.js";

const DEF_TABLE_SITE = 'ALGInternal';

const TABLENAME_TEAMS = 'ALGTeams';
const TABLENAME_ROLES = 'ALGRoles';
const TABLENAME_PERMS = 'ALGPerms';
const TABLENAME_USERS = 'ALGUsers';
const TABLENAME_TASKS = 'ALGTasks';
const TABLENAME_CONTACTS = 'ALGContacts';
const TABLENAME_PROJECTS = 'ALGProjects';
const TABLENAME_HR_REQUESTS = 'ALGHRRequests';
const TABLENAME_TK_EVENTS = 'ALGTimekeepEvents';
const TABLENAME_TK_STATUSES = 'ALGTimekeepStatuses';

const DEF_TABLE_DATA_MODEL = DataTableDesc.Build([{ key: 'id', label: 'table index', exclude: true }, { key: 'Title', label: 'item guid', exclude: true }]);

export class DataSource
{
	static Nothing = new DataSource(null, null, null);

	static Teams = new DataSource(TABLENAME_TEAMS, Team.data_model, 'team_name', 'team_name');
	static Roles = new DataSource(TABLENAME_ROLES, Role.data_model, 'role_name', 'role_name');
	static Permissions = new DataSource(TABLENAME_PERMS, Permission.data_model);
	static Users = new DataSource(TABLENAME_USERS, InternalUser.data_model, 'display_name_full', 'display_name_full');
	static Tasks = new DataSource(TABLENAME_TASKS, TaskData.data_model, 'task_title', 'task_title');
	static Contacts = new DataSource(TABLENAME_CONTACTS, ExternalContact.data_model, 'contact_name', 'contact_name');
	static Projects = new DataSource(TABLENAME_PROJECTS, ProjectCoreData.data_model, 'project_name', 'project_name');
	static HrRequests = new DataSource(TABLENAME_HR_REQUESTS, HrRequest.data_model, 'request_name', 'request_name');
	static TimekeepEvents = new DataSource(TABLENAME_TK_EVENTS, TimekeepEvent.data_model);
	static TimekeepStatuses = new DataSource(TABLENAME_TK_STATUSES, TimekeepStatus.data_model);

	constructor(list_title, data_model = DEF_TABLE_DATA_MODEL, label_field = 'Title', sorting_field = 'Title', view_filter = '', site_name = DEF_TABLE_SITE)
	{
		this.list_title = list_title;
		this.label_field = label_field;
		this.sorting_field = sorting_field;
		this.site_name = site_name;
		this.data_model = data_model;
		this.fields = (data_model && data_model.fields) ? data_model.fields : [];
		this.view_filter = view_filter;
	}

	async GetData() { return await SharePoint.GetListData(this); }


	async SetData(instructions = {})
	{
		return await SharePoint.SetListData(this, instructions);
	}
}

Modules.Report('Data Sources', 'This module adds a reusable code component to keep references to database tables.');
