import { Modules } from "./modules.js";
import { DataSource } from "./datasource.js";
import { DebugLog } from "./debuglog.js";
import { AppEvents } from "./appevents.js";
import { Timers } from "./timers.js";
import { EventSource } from "./eventsource.js";

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

	static all_tables = [
		SharedData.roles,
		SharedData.teams,
		SharedData.users,
		SharedData.tasks,
		SharedData.contacts,
		SharedData.projects,
		SharedData.permissions
	];

	static async LoadData(useCache = true)
	{
		if (SharedData.loading) return;

		SharedData.loading = true;
		Timers.Start('shared data load');
		DebugLog.StartGroup('loading shared data');

		if (useCache)
		{
			let cacheAvailable = SharedData.AttemptLoadCache();
			if (cacheAvailable)
			{
				DebugLog.Log('using cached shared data');
				DebugLog.Log('load delta: ' + Timers.Stop('shared data load') + 'ms');
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

		DebugLog.Log('load delta: ' + Timers.Stop('shared data load') + 'ms');
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
		if (result && result.length) DebugLog.Log('loaded ' + result.length + ' ' + key, false, '#0f0');
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




	static GetData(table = [], user_id = '')
	{
		user_id = user_id.trim().toLowerCase();
		return table.find(
			x =>
			{
				if (!x) return false;
				if (!x.Title) return false;
				let this_user_id = x.Title.trim().toLowerCase();
				return this_user_id === user_id;
			}
		);
	}
	static GetUserData(id = '') { return SharedData.GetData(SharedData.users.data, id); }
	static GetRoleData(id = '') { return SharedData.GetData(SharedData.roles.data, id); }
	static GetTeamData(id = '') { return SharedData.GetData(SharedData.teams.data, id); }
}

SharedData.sub_AccountLogin = AppEvents.onAccountLogin.RequestSubscription(SharedData.LoadData);

Modules.Report("Shared Data");