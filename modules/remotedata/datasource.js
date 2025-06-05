import { Modules } from "../modules.js";
import { DebugLog } from "../debuglog.js";
import { Needed } from "../utils/needed.js";

import { ExternalContact } from "../datamodels/external_contact.js";
import { Permission } from "../datamodels/user_permission.js";
import { InternalUser } from "../datamodels/internal_user.js";
import { Role } from "../datamodels/role.js";
import { Team } from "../datamodels/team.js";
import { TaskData } from "../datamodels/task_data.js";
import { ProjectCoreData } from "../datamodels/project_data_core.js";
import { HrRequest } from "../datamodels/hr_request.js";
import { TimekeepEvent, TimekeepStatus } from "../datamodels/timekeep.js";
import { DataTableDesc } from "../datamodels/datatable_desc.js";
import { AURALink } from "../datamodels/aura_link.js";
import { UserAllocation } from "../datamodels/user_allocation.js";
import { AURAProblem } from "../datamodels/aura_problem.js";
import { DBLayer } from "./dblayer.js";
import { AppEvents } from "../appevents.js";
import { LongOps } from "../systems/longops.js";
import { minutesDelta } from "../utils/timeutils.js";

const DEF_TABLE_SITE = 'ALGInternal';
const DEF_TABLE_DATA_MODEL = DataTableDesc.Build([{ key: 'id', label: 'table index', exclude: true }, { key: 'Title', label: 'item guid', exclude: true }]);

// class used to describe a remote data source
// a DataSourceInstance is used to manage data obtained from the DataSourceDescriptor
export class DataSourceDescriptor
{
	static Nothing = new DataSourceDescriptor(null, null, null);

	static Teams = new DataSourceDescriptor('ALGTeams', Team.data_model, 'team_name', 'team_name');
	static Roles = new DataSourceDescriptor('ALGRoles', Role.data_model, 'role_name', 'role_name');
	static Permissions = new DataSourceDescriptor('ALGPerms', Permission.data_model);
	static Users = new DataSourceDescriptor('ALGUsers', InternalUser.data_model, 'display_name_full', 'display_name_full');
	static Tasks = new DataSourceDescriptor('ALGTasks', TaskData.data_model, 'task_title', 'task_title');
	static Contacts = new DataSourceDescriptor('ALGContacts', ExternalContact.data_model, 'contact_name', 'contact_name');
	static Projects = new DataSourceDescriptor('ALGProjects', ProjectCoreData.data_model, 'project_name', 'project_name');
	static HrRequests = new DataSourceDescriptor('ALGHRRequests', HrRequest.data_model, 'request_name', 'request_name');
	static TimekeepEvents = new DataSourceDescriptor('ALGTimekeepEvents', TimekeepEvent.data_model);
	static TimekeepStatuses = new DataSourceDescriptor('ALGTimekeepStatuses', TimekeepStatus.data_model);
	static UserAllocations = new DataSourceDescriptor('ALGUserAllocations', UserAllocation.data_model);
	static AURALinks = new DataSourceDescriptor('AURALinks', AURALink.data_model);
	static AURAProblems = new DataSourceDescriptor('AURAProblems', AURAProblem.data_model);

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

	async GetData() { return await window.DBLayer.GetRecords(this); }
}

// class used to manage data obtained from a DataSourceDescriptor
export class DataSourceInstance extends EventTarget
{
	constructor(datasource = DataSourceDescriptor.Nothing, table)
	{
		super();

		this.datasource = datasource;
		this.table = table;
		this.loading = false;
		this.loaded = false;
		this.valid = false;
		this.data = [];

		this.needed = new Needed();
		this.needed.name = 'DATA::' + datasource.list_title;
		this.needed.after_became_needed = () => { this.OnNeeded(); };
		this.needed.after_became_not_needed = () => { this.OnNotNeeded(); };
		//this.needed.log_changes = true;

		if (this.datasource.list_title == null) return;

		this.valid = true;
		let smolname = this.datasource.list_title.toLowerCase().trim();
		this.lskey_cache = 'dsc_' + smolname;
		this.lskey_cache_ts = 'dsc_ts_' + smolname;
	}

	AddNeeder() { return this.needed.AddNeeder(); }
	RemoveNeeder(needer) { return this.needed.RemoveNeeder(needer); }
	OnNeeded() { if (this.loaded !== true) this.TryLoad(false); }
	OnNotNeeded() { }

	ClearData()
	{
		this.loading = false;
		this.loaded = false;
		this.data = [];
	}

	async TryLoad(force_download = false)
	{
		if (this.valid !== true) return;
		if (this.loading === true) return;

		let was_loaded = this.loaded;

		this.loading = true;
		this.loaded = false;
		if (force_download !== true)
		{
			this.TryLoadFromCache();
			if (this.loaded === true)
			{
				this.loading = false;
				if (was_loaded !== true)
				{
					DebugLog.Log('first load from cache: ' + this.datasource.list_title + `(${this.data.length})`);
					AppEvents.Request('data-loaded');
					this.dispatchEvent(new CustomEvent('datachange', { detail: this }));
				}
				return;
			}
		}

		DebugLog.Log('downloading: ' + this.datasource.list_title);

		let longop = LongOps.Start('download-' + this.datasource.list_title, { label: 'Download ' + this.datasource.list_title });
		await DBLayer.GetRecords(this.table);
		LongOps.Stop(longop);

		this.loaded = this.data;
		this.loading = false;

		if ('data' in this && 'length' in this.data) 
		{
			if (this.data.length > 0)
			{
				this.TryStoreInCache();
				if (was_loaded !== true) DebugLog.Log('first download: ' + this.datasource.list_title + ` (${this.data ? this.data.length : -1} items)`);
				else DebugLog.Log('reloaded ' + this.data.length + ' ' + this.datasource.list_title, true, '#0f0');
				AppEvents.Request('data-loaded');
			}
			else
			{
				DebugLog.Log(' ! data empty: ' + this.datasource.list_title, true, '#ff0');
			}
		}
		else DebugLog.Log(' ! data invalid: ' + this.datasource.list_title, true, '#fa0');

		this.dispatchEvent(new CustomEvent('datachange', { detail: this }));
	}

	GetCacheTimestamp()
	{
		let ls_text = localStorage.getItem(this.lskey_cache_ts);
		if (!ls_text) return undefined;
		let ls_data = JSON.parse(ls_text).data;
		if (!ls_data) return undefined;
		return new Date(ls_data);
	}

	TryLoadFromCache()
	{
		if (!this.lskey_cache) { DebugLog.Log('No Cache Key'); return; }
		if (this.valid !== true) { DebugLog.Log('Invalid DataSource'); return; }

		let cache_ts = this.GetCacheTimestamp();
		let cache_tsdelta = minutesDelta(cache_ts);
		if (!cache_ts || cache_tsdelta > 1.0) { DebugLog.Log(this.datasource.list_title + ' : Cache Expired : ' + (Math.round(cache_tsdelta * 10.0) * 0.1) + 'min'); return; }

		let cache_value = localStorage.getItem(this.lskey_cache);
		let cache_valid = typeof cache_value === 'string' && cache_value.length > 0;
		if (cache_valid !== true) { DebugLog.Log('Invalid Cache Value'); return; }

		let cache_obj = JSON.parse(cache_value);
		let cache_obj_valid = 'data' in cache_obj && 'length' in cache_obj.data && cache_obj.data.length > 0;
		if (cache_obj_valid !== true) { DebugLog.Log('Invalid Cache Object'); return; }

		this.data = cache_obj.data;
		this.loaded = true;
	}

	TryStoreInCache()
	{
		if (this.valid !== true) return;
		localStorage.setItem(this.lskey_cache_ts, JSON.stringify({ data: new Date().valueOf() }));
		localStorage.setItem(this.lskey_cache, JSON.stringify({ data: this.data }));
	}
}

Modules.Report('Data Sources', 'This module adds a reusable code component to keep references to database tables and their cached data.');
