import { Modules } from "../modules.js";
import { DebugLog } from "../debuglog.js";
import { AppInfo } from "../app_info.js";
import { AppEvents } from "../appevents.js";
import { Timers } from "../timers.js";
import { EventSource } from "../eventsource.js";
import { DataSourceDescriptor, DataSourceInstance } from "./datasource.js";
import { NotificationLog } from "../notificationlog.js";
import { UserAccountInfo } from "../useraccount.js";
import { FieldValidation } from "../utils/field_validation.js";


export class SharedDataTable
{
	static Nothing = new SharedDataTable('nothing', DataSourceDescriptor.Nothing);

	constructor(key = '', datasource = DataSourceDescriptor.Nothing)
	{
		this.key = key;
		this.instance = new DataSourceInstance(datasource);
	}

	async Download()
	{
		await this.instance.TryLoad(true);
	}

	AddNeeder() { return this.instance.AddNeeder(); }
	RemoveNeeder(needer) { return this.instance.RemoveNeeder(needer); }
}

export class SharedData
{
	static sub_AccountLogin = {};

	static loading = false;
	static loaded = false;

	static onLoaded = new EventSource();
	static onLoadedFromCache = new EventSource();
	static onSavedToCache = new EventSource();
	static onDownloaded = new EventSource();

	static roles = new SharedDataTable('roles', DataSourceDescriptor.Roles);
	static teams = new SharedDataTable('teams', DataSourceDescriptor.Teams);
	static users = new SharedDataTable('users', DataSourceDescriptor.Users);
	static tasks = new SharedDataTable('tasks', DataSourceDescriptor.Tasks);
	static contacts = new SharedDataTable('contacts', DataSourceDescriptor.Contacts);
	static projects = new SharedDataTable('projects', DataSourceDescriptor.Projects);
	static permissions = new SharedDataTable('permissions', DataSourceDescriptor.Permissions);
	static hrRequests = new SharedDataTable('hr requests', DataSourceDescriptor.HrRequests);
	static timekeepEvents = new SharedDataTable('timekeep events', DataSourceDescriptor.TimekeepEvents);
	static timekeepStatuses = new SharedDataTable('timekeep statuses', DataSourceDescriptor.TimekeepStatuses);
	static userAllocations = new SharedDataTable('user allocations', DataSourceDescriptor.UserAllocations);
	static auraLinks = new SharedDataTable('aura links', DataSourceDescriptor.AURALinks);
	static auraProblems = new SharedDataTable('aura problems', DataSourceDescriptor.AURAProblems);

	static all_tables = [
		SharedData.roles,
		SharedData.teams,
		SharedData.users,
		SharedData.tasks,
		SharedData.contacts,
		SharedData.projects,
		SharedData.permissions,
		SharedData.hrRequests,
		SharedData.timekeepEvents,
		SharedData.timekeepStatuses,
		SharedData.auraLinks,
		SharedData.userAllocations,
		SharedData.auraProblems
	];

	static UpdateDataSourceFilters()
	{
		let user_id_filter = (field_name = 'Title') => `fields/${field_name} eq '${UserAccountInfo.account_info.user_id}'`;
		//DataSourceDescriptor.UserAllocations.view_filter = user_id_filter('user_id');
		DataSourceDescriptor.TimekeepEvents.view_filter = user_id_filter('user_id');
		DataSourceDescriptor.TimekeepStatuses.view_filter = user_id_filter('Title');
		if (!UserAccountInfo.HasPermission('hr.access')) DataSourceDescriptor.HrRequests.view_filter = `fields/requestee_id eq '${UserAccountInfo.account_info.user_id}'`;
	}

	static async LoadData(useCache = true)
	{
		const timer_shareddataload = 'shared data load';

		if (SharedData.loading) return;

		SharedData.UpdateDataSourceFilters();
		SharedData.loading = true;
		Timers.Start(timer_shareddataload);
		DebugLog.StartGroup('loading shared data');

		if (useCache === true)
		{
			let all_from_cache = true;
			SharedData.all_tables.forEach(
				x =>
				{
					x.instance.TryLoadFromCache();
					if (x.instance.loaded !== true) all_from_cache = false;
				}
			);

			if (all_from_cache)
			{
				NotificationLog.Log('Using Cached Shared Data', '#888');
				DebugLog.Log('...using cached shared data');
				DebugLog.Log('shared data load delta: ' + Timers.Stop(timer_shareddataload) + 'ms');
				DebugLog.SubmitGroup();

				SharedData.loaded = true;
				SharedData.loading = false;

				await AppEvents.onDataReloaded.InvokeAsync();
				await SharedData.onLoaded.InvokeAsync();
				await SharedData.onLoadedFromCache.InvokeAsync();
				return;
			}
		}

		if (useCache === true) DebugLog.Log('fetching missing shared data...');


		for (let table_id in SharedData.all_tables)
		{
			const table = SharedData.all_tables[table_id];
			if (useCache === true && table.instance.loaded === true) continue;
			if (useCache === true) DebugLog.Log('fetching ' + table.key);
			table.instance.ClearData();

			window.DBLayer.GetRecords(table);
		}

		await window.DBLayer.WaitAllRequests();

		for (let table_id in SharedData.all_tables) { SharedData.all_tables[table_id].instance.TryStoreInCache(); }
		await SharedData.onSavedToCache.InvokeAsync();

		let ms_str = Timers.Stop(timer_shareddataload) + 'ms';
		NotificationLog.Log(`Shared Data Refreshed (${ms_str})`);
		DebugLog.Log('shared data load delta: ' + ms_str);
		DebugLog.SubmitGroup();

		SharedData.loading = false;
		SharedData.loaded = true;

		await AppEvents.onDataReloaded.InvokeAsync();
		await SharedData.onLoaded.InvokeAsync();
		await SharedData.onDownloaded.InvokeAsync();
	}

	static AttemptLoadCache()
	{
		let full = true;
		SharedData.all_tables.forEach(
			x =>
			{
				x.instance.TryLoadFromCache();
				if (x.instance.loaded !== true) 
				{
					DebugLog.Log('not cached: ' + x.instance.datasource.list_title);
					full = false;
				}
				else
				{
					DebugLog.Log('in cache: ' + x.instance.datasource.list_title);
				}
			}
		);
		return full;
	}

	static TryLoadFromCache(key = '')
	{
		if (!key || key.length < 1) return null;
		return SharedData.LoadFromStorage(key);
	}

	static async LoadTable(datasource = DataSourceDescriptor.Nothing, key = '????')
	{
		let result = [];
		result = await datasource.GetData();
		if (result && result.length) { }
		else DebugLog.Log('loaded ' + result + ' ' + key, false, '#f00');
		return result;
	}

	static SaveToStorage(key = '', table = []) { if (key && key.length > 0) localStorage.setItem('cache_shared_data_' + key, JSON.stringify({ table: table })); }
	static LoadFromStorage(key = '')
	{
		if (key && key.length > 0)
		{
			let got = localStorage.getItem('cache_shared_data_' + key);
			if (got)
			{
				DebugLog.Log('from cache: ' + key)
				return JSON.parse(got).table;
			}
			else return null;
		}
		else return null;
	}




	static GetSharedDatum(table = SharedDataTable.Nothing, keys = [], key_field = 'Title')
	{
		if (!Array.isArray(keys)) keys = [keys];
		let results = [];
		for (let key_id in keys) // for each provided key value
		{
			let this_key = keys[key_id];
			// find all records with matching key value
			let matches = table.instance.data.filter(x => x && x[key_field] == this_key);
			for (var match_id in matches) results.push(matches[match_id]);
		}
		return results;
	}

	static GetDatum(table = [], keys = [], key_field = 'Title')
	{
		if (!Array.isArray(keys)) keys = [keys];
		let results = [];
		for (let key_id in keys) // for each provided key value
		{
			let this_key = keys[key_id];
			// find all records with matching key value
			let matches = table.filter(x => x && x[key_field] == this_key);
			for (var match_id in matches) results.push(matches[match_id]);
		}
		return results;
	}

	static GetData(table = [], key = '', key_field = 'Title')
	{
		key = key.trim().toLowerCase();
		return table.find(
			x =>
			{
				if (!x || !x[key_field]) return false;
				return x[key_field].trim().toLowerCase() === key;
			}
		);
	}

	static GetUserDatum(ids = []) { return SharedData.GetSharedDatum(SharedData.users, ids); }
	static GetRoleDatum(ids = []) { return SharedData.GetSharedDatum(SharedData.roles, ids); }
	static GetTeamDatum(ids = []) { return SharedData.GetSharedDatum(SharedData.teams, ids); }
	static GetTaskDatum(ids = []) { return SharedData.GetSharedDatum(SharedData.tasks, ids); }
	static GetPermDatum(ids = []) { return SharedData.GetSharedDatum(SharedData.permissions, ids); }
	static GetContactDatum(ids = []) { return SharedData.GetSharedDatum(SharedData.contacts, ids); }
	static GetProjectDatum(ids = []) { return SharedData.GetSharedDatum(SharedData.projects, ids); }
	static GetHrRequestDatum(ids = []) { return SharedData.GetSharedDatum(SharedData.hrRequests, ids, 'requestee_id'); }
	static GetTimekeepEventDatum(ids = []) { return SharedData.GetSharedDatum(SharedData.timekeepEvents, ids, 'user_id'); }
	static GetTimekeepStatusDatum(ids = []) { return SharedData.GetSharedDatum(SharedData.timekeepStatuses, ids); }
	static GetAURALinksDatum(ids = []) { return SharedData.GetSharedDatum(SharedData.auraLinks, ids); }

	static GetUserData(id = '') { return SharedData.GetSharedDatum(SharedData.users, id); }
	static GetRoleData(id = '') { return SharedData.GetSharedDatum(SharedData.roles, id); }
	static GetTeamData(id = '') { return SharedData.GetSharedDatum(SharedData.teams, id); }
	static GetTaskData(id = '') { return SharedData.GetSharedDatum(SharedData.tasks, id); }
	static GetPermData(id = '') { return SharedData.GetSharedDatum(SharedData.permissions, id); }
	static GetContactData(id = '') { return SharedData.GetSharedDatum(SharedData.contacts, id); }
	static GetProjectData(id = '') { return SharedData.GetSharedDatum(SharedData.projects, id); }
	static GetHrRequestData(id = '') { return SharedData.GetSharedDatum(SharedData.hrRequests, id, 'requestee_id'); }
	static GetTimekeepEventData(id = '') { return SharedData.GetSharedDatum(SharedData.timekeepEvents, id, 'user_id'); }
	static GetTimekeepStatusData(id = '') { return SharedData.GetSharedDatum(SharedData.timekeepStatuses, id); }
	static GetAURALinksData(id = '') { return SharedData.GetSharedDatum(SharedData.auraLinks, id); }






	static Validator_Roles(raw = '')
	{
		const getRoleString = (role_key = '') =>
		{
			let role_info = SharedData.GetRoleData(role_key)[0];
			if (role_info) return role_info.role_name_short;
			return role_key;
		};

		return raw.split(';').map(getRoleString).join(', ');
	}
}

SharedData.sub_AccountLogin = AppEvents.onAccountLogin.RequestSubscription(async () => { await SharedData.LoadData(true) });
FieldValidation.RegisterValidator('role', SharedData.Validator_Roles);

Modules.Report('Shared Data', `This module acts as an entrypoint for any aspect of ${AppInfo.name} which need access to shared online data.`);