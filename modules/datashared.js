import { Modules } from "./modules.js";
import { DataSource } from "./datasource.js";
import { DebugLog } from "./debuglog.js";
import { AppEvents } from "./appevents.js";
import { Timers } from "./timers.js";
import { EventSource } from "./eventsource.js";

const SanitizeString = (str = '') =>
{
	return str.trim().toLowerCase();
}


export class SharedDataTable
{
	static Nothing = new SharedDataTable('nothing', DataSource.Nothing);

	constructor(key = '', source = DataSource.Nothing, data = [])
	{
		this.key = key;
		this.data = data;
		this.source = source;
	}

	async Download()
	{
		let result = await this.source.GetData();
		if (result && result.length)
		{
			this.data = result;
			DebugLog.Log('loaded ' + result.length + ' ' + this.key, false, '#0f0');
		}
		else DebugLog.Log('loaded ' + result + ' ' + this.key, false, '#f00');
	}
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

	static roles = new SharedDataTable('roles', DataSource.Roles);
	static teams = new SharedDataTable('teams', DataSource.Teams);
	static users = new SharedDataTable('users', DataSource.Users);
	static tasks = new SharedDataTable('tasks', DataSource.Tasks);
	static contacts = new SharedDataTable('contacts', DataSource.Contacts);
	static projects = new SharedDataTable('projects', DataSource.Projects);
	static permissions = new SharedDataTable('permissions', DataSource.Permissions);
	static hrRequests = new SharedDataTable('hr requests', DataSource.HrRequests);
	static timekeepEvents = new SharedDataTable('timekeep events', DataSource.TimekeepEvents);
	static timekeepStatuses = new SharedDataTable('timekeep statuses', DataSource.TimekeepStatuses);

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
		SharedData.timekeepStatuses
	];

	static async LoadData(useCache = true)
	{
		if (SharedData.loading) return;

		const timer_shareddataload = 'shared data load';

		SharedData.loading = true;
		Timers.Start(timer_shareddataload);
		DebugLog.StartGroup('loading shared data');

		if (useCache)
		{
			let cacheAvailable = SharedData.AttemptLoadCache();
			if (cacheAvailable)
			{
				DebugLog.Log('using cached shared data');
				DebugLog.Log('load delta: ' + Timers.Stop(timer_shareddataload) + 'ms');
				DebugLog.SubmitGroup();

				SharedData.loaded = true;
				SharedData.loading = false;

				await SharedData.onLoaded.InvokeAsync();
				await SharedData.onLoadedFromCache.InvokeAsync();
				return;
			}
		}

		let promises = SharedData.all_tables.map(async x => await x.Download());
		await Promise.allSettled(promises);

		DebugLog.Log('caching shared data');
		SharedData.all_tables.forEach(x => SharedData.SaveToStorage(x.key, x.data));
		await SharedData.onSavedToCache.InvokeAsync();

		DebugLog.Log('load delta: ' + Timers.Stop(timer_shareddataload) + 'ms');
		DebugLog.SubmitGroup();

		SharedData.loading = false;
		SharedData.loaded = true;

		await SharedData.onLoaded.InvokeAsync();
		await SharedData.onDownloaded.InvokeAsync();
	}

	static AttemptLoadCache()
	{
		let full = true;
		SharedData.all_tables.forEach(
			x =>
			{
				let got = SharedData.TryLoadFromCache(x.key);
				if (got) x.data = got;
				else full = false;
			}
		);
		return full;
	}

	static TryLoadFromCache(key = '')
	{
		if (!key || key.length < 1) return null;
		return SharedData.LoadFromStorage(key);
	}

	static async LoadTable(source = DataSource.Nothing, key = '????')
	{
		let result = [];
		result = await source.GetData();
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




	static GetDatum(table = [], keys = [], key_field = 'Title')
	{
		if (!Array.isArray(keys)) keys = [keys];
		//keys = keys.map(SanitizeString);

		let results = [];
		for (let key_id in keys) // for each provided key value
		{
			let this_key = keys[key_id];//SanitizeString(keys[key_id]);
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

	static GetUserDatum(ids = []) { return SharedData.GetDatum(SharedData.users.data, ids); }
	static GetRoleDatum(ids = []) { return SharedData.GetDatum(SharedData.roles.data, ids); }
	static GetTeamDatum(ids = []) { return SharedData.GetDatum(SharedData.teams.data, ids); }
	static GetTaskDatum(ids = []) { return SharedData.GetDatum(SharedData.tasks.data, ids); }
	static GetPermDatum(ids = []) { return SharedData.GetDatum(SharedData.permissions.data, ids); }
	static GetContactDatum(ids = []) { return SharedData.GetDatum(SharedData.contacts.data, ids); }
	static GetProjectDatum(ids = []) { return SharedData.GetDatum(SharedData.projects.data, ids); }
	static GetHrRequestDatum(ids = []) { return SharedData.GetDatum(SharedData.hrRequests.data, ids, 'requestee_id'); }
	static GetTimekeepEventDatum(ids = []) { return SharedData.GetDatum(SharedData.timekeepEvents.data, ids, 'user_id'); }
	static GetTimekeepStatusDatum(ids = []) { return SharedData.GetDatum(SharedData.timekeepStatuses.data, ids); }

	static GetUserData(id = '') { return SharedData.GetData(SharedData.users.data, id); }
	static GetRoleData(id = '') { return SharedData.GetData(SharedData.roles.data, id); }
	static GetTeamData(id = '') { return SharedData.GetData(SharedData.teams.data, id); }
	static GetTaskData(id = '') { return SharedData.GetData(SharedData.tasks.data, id); }
	static GetPermData(id = '') { return SharedData.GetData(SharedData.permissions.data, id); }
	static GetContactData(id = '') { return SharedData.GetData(SharedData.contacts.data, id); }
	static GetProjectData(id = '') { return SharedData.GetData(SharedData.projects.data, id); }
	static GetHrRequestData(id = '') { return SharedData.GetData(SharedData.hrRequests.data, id, 'requestee_id'); }
	static GetTimekeepEventData(id = '') { return SharedData.GetData(SharedData.timekeepEvents.data, id, 'user_id'); }
	static GetTimekeepStatusData(id = '') { return SharedData.GetData(SharedData.timekeepStatuses.data, id); }
}

SharedData.sub_AccountLogin = AppEvents.onAccountLogin.RequestSubscription(SharedData.LoadData);

Modules.Report('Shared Data', 'This module acts as an entrypoint for many aspects of AURA which need access to the same online data.');