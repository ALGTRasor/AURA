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
import { AURALink } from "./datamodels/aura_link.js";
import { UserAllocation } from "./datamodels/user_allocation.js";
import { DebugLog } from "./debuglog.js";

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
const TABLENAME_AURA_LINKS = 'AURALinks';
const TABLENAME_USER_ALLOCATIONS = 'ALGUserAllocations';

const DEF_TABLE_DATA_MODEL = DataTableDesc.Build([{ key: 'id', label: 'table index', exclude: true }, { key: 'Title', label: 'item guid', exclude: true }]);

// class used to describe a remote data source
// a DataSourceInstance is used to manage data obtained from the DataSource
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
	static AURALinks = new DataSource(TABLENAME_AURA_LINKS, AURALink.data_model);
	static UserAllocations = new DataSource(TABLENAME_USER_ALLOCATIONS, UserAllocation.data_model);

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
	async SetData(instructions = {}) { return await SharePoint.SetListData(this, instructions); }
}

// class used to manage data obtained from a DataSource
export class DataSourceInstance
{
	constructor(datasource = DataSource.Nothing)
	{
		this.datasource = datasource;
		this.loaded = false;
		this.valid = false;
		this.data = [];

		if (this.datasource.list_title == null) return;

		this.valid = true;
		this.lskey_cache = 'dsc_' + this.datasource.list_title.toLowerCase();
	}

	ClearData()
	{
		this.loaded = false;
		this.data = [];
	}

	async TryLoad(force_download = false)
	{
		if (this.valid !== true) return;

		this.loaded = false;
		if (force_download !== true)
		{
			this.TryLoadFromCache();
			if (this.loaded === true)
			{
				DebugLog.Log('using cached data from source: ' + this.datasource.list_title);
				return;
			}
		}

		DebugLog.Log('loading data from source: ' + this.datasource.list_title);
		this.data = await this.datasource.GetData();

		this.loaded = this.data != null;
	}

	TryLoadFromCache()
	{
		if (!this.lskey_cache) return;
		if (this.valid !== true) return;

		let cache_value = localStorage.getItem(this.lskey_cache);
		let cache_valid = cache_value && typeof cache_value === 'string' && cache_value.length > 0;
		if (cache_valid !== true) return;

		let cache_obj = JSON.parse(cache_value);
		let cache_obj_valid = cache_obj && cache_obj.data && cache_obj.data.length && cache_obj.data.length > 0;
		if (cache_obj_valid !== true) return;

		this.data = cache_obj.data;
		this.loaded = true;
	}

	TryStoreInCache()
	{
		if (this.valid !== true) return;
		localStorage.setItem(this.lskey_cache, JSON.stringify({ data: this.data }));
	}
}

Modules.Report('Data Sources', 'This module adds a reusable code component to keep references to database tables and their cached data.');
