import { SharePoint } from "./sharepoint.js";
import { ExternalContact } from "./datamodels/external_contact.js";
import { Permission } from "./datamodels/user_permission.js";
import { InternalUser } from "./datamodels/internal_user.js";
import { Role } from "./datamodels/role.js";
import { Task } from "./datamodels/task.js";
import { Team } from "./datamodels/team.js";
import { Modules } from "./modules.js";
import "./datamodels/project_data.js";

const DEF_TABLE_SITE = 'ALGInternal';

const TABLENAME_TEAMS = 'ALGTeams';
const TABLENAME_ROLES = 'ALGRoles';
const TABLENAME_PERMS = 'ALGPerms';
const TABLENAME_USERS = 'ALGUsers';
const TABLENAME_TASKS = 'ALGTasks';
const TABLENAME_CONTACTS = 'ALGContacts';
const TABLENAME_PROJECTS = 'ALGProjects';

const DEF_TABLE_FIELDS = ['id', 'title'];

export class DataSource
{
	static Nothing = new DataSource(null, null, null);

	static Teams = new DataSource(TABLENAME_TEAMS, Team.table_fields);
	static Roles = new DataSource(TABLENAME_ROLES, Role.table_fields);
	static Permissions = new DataSource(TABLENAME_PERMS, Permission.table_fields);
	static Users = new DataSource(TABLENAME_USERS, InternalUser.table_fields);
	static Tasks = new DataSource(TABLENAME_TASKS, Task.table_fields);
	static Contacts = new DataSource(TABLENAME_CONTACTS, ExternalContact.table_fields);
	static Projects = new DataSource(TABLENAME_PROJECTS, window.data_models.project_data.table_fields);

	constructor(list_title, fields = DEF_TABLE_FIELDS, site_name = DEF_TABLE_SITE)
	{
		this.list_title = list_title;
		this.site_name = site_name;
		this.fields = fields;
	}

	async GetData() { return await SharePoint.GetListData(this); }
}

Modules.Report("Data Sources");