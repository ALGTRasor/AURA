import { Modules } from "./modules.js";
import { DataSource } from "./datasource.js";
import { DebugLog } from "./debuglog.js";
import { AppEvents } from "./appevents.js";
import { Timers } from "./timers.js";
import { EventSource } from "./eventsource.js";

export class SharedDataTable
{
	static Nothing = new SharedDataTable();

	constructor(title = 'null_shared_data', data = [])
	{
		this.title = title;
		this.items = data;
	}
}

export class SharedData
{
	static sub_AccountLogin = {};

	static loading = false;
	static loaded = false;

	static roles = [];
	static teams = [];
	static permissions = [];
	static users = [];
	static contacts = [];
	static projects = [];
	static tasks = [];

	static onLoaded = new EventSource();
	static onLoadedFromCache = new EventSource();
	static onSavedToCache = new EventSource();
	static onDownloaded = new EventSource();

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
				SharedData.loaded = true;
				SharedData.loading = false;
				DebugLog.SubmitGroup();

				await SharedData.onLoaded.InvokeAsync();
				await SharedData.onLoadedFromCache.InvokeAsync();
				return;
			}
		}

		const updates =
			[
				{ table: SharedData.roles, source: DataSource.Roles, label: 'roles' },
				{ table: SharedData.teams, source: DataSource.Teams, label: 'teams' },
				{ table: SharedData.users, source: DataSource.Users, label: 'users' },
				{ table: SharedData.tasks, source: DataSource.Tasks, label: 'tasks' },
				{ table: SharedData.contacts, source: DataSource.Contacts, label: 'contacts' },
				{ table: SharedData.projects, source: DataSource.Projects, label: 'projects' },
				{ table: SharedData.permissions, source: DataSource.Permissions, label: 'permissions' },
			];

		let update_targets = updates.map(x => x.table);
		update_targets = await Promise.all(updates.map(x => SharedData.LoadTable(x.source, x.label)));

		DebugLog.Log('caching shared data');
		updates.forEach(x => SharedData.SaveToStorage(x.label, x.table));
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
		SharedData.roles = SharedData.TryLoadFromCache('roles');
		SharedData.teams = SharedData.TryLoadFromCache('teams');
		SharedData.permissions = SharedData.TryLoadFromCache('permissions');
		SharedData.users = SharedData.TryLoadFromCache('users');
		return SharedData.roles && SharedData.teams && SharedData.permissions && SharedData.users;
	}

	static TryLoadFromCache(key = '')
	{
		if (!key || key.length < 1) return;
		return SharedData.LoadFromStorage('cache_shared_data_' + key);
	}

	static async LoadTable(source = DataSource.Nothing, label = '????')
	{
		let result = [];
		try
		{
			result = await source.GetData();
			DebugLog.Log('loaded ' + result.length + ' ' + label, false, '#0f0');
		}
		catch (e)
		{
			DebugLog.Log('! ' + e, true, '#f00');
		}
		return result;
	}

	static SaveToStorage(key = '', table = []) { if (key && key.length > 0) localStorage.setItem('cache_shared_data_' + key, JSON.stringify({ table: table })); }
	static LoadFromStorage(key = '')
	{
		if (key && key.length > 0)
		{
			let got = localStorage.getItem(key);
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
		let rec = table.find(x => x && x.fields && (x.fields.Title == user_id));
		return (rec && rec.fields) ? rec.fields : null;
	}
	static GetUserData(id = '') { return SharedData.GetData(SharedData.users, id); }
	static GetRoleData(id = '') { return SharedData.GetData(SharedData.roles, id); }
	static GetTeamData(id = '') { return SharedData.GetData(SharedData.teams, id); }
}

SharedData.sub_AccountLogin = AppEvents.onAccountLogin.RequestSubscription(SharedData.LoadData);

Modules.Report("Shared Data");