import { Modules } from "./modules.js";
import { DataSource, DataSourceInstance } from "./datasource.js";
import { DebugLog } from "./debuglog.js";
import { AppEvents } from "./appevents.js";
import { Timers } from "./timers.js";
import { EventSource } from "./eventsource.js";
import { UserAccountInfo } from "./useraccount.js";
import { RequestBatchRequest, SharePoint } from "./sharepoint.js";
import { AppInfo } from "./app_info.js";
import { NotificationLog } from "./notificationlog.js";


export class SharedDataTable
{
	static Nothing = new SharedDataTable('nothing', DataSource.Nothing);

	constructor(key = '', datasource = DataSource.Nothing)
	{
		this.key = key;
		this.instance = new DataSourceInstance(datasource);
	}

	async Download()
	{
		await this.instance.TryLoad(true);
		if (this.instance.data && this.instance.data.length) DebugLog.Log('loaded ' + this.instance.data.length + ' ' + this.key, true, '#0f0');
		else DebugLog.Log('download data invalid: ' + this.key, true, '#f00');
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
	static auraLinks = new SharedDataTable('aura links', DataSource.AURALinks);
	static userAllocations = new SharedDataTable('user allocations', DataSource.UserAllocations);

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
		SharedData.userAllocations
	];

	static async LoadData(useCache = true)
	{
		if (SharedData.loading) return;

		const timer_shareddataload = 'shared data load';

		let user_id_filter = (field_name = 'Title') => `fields/${field_name} eq '${UserAccountInfo.account_info.user_id}'`;
		DataSource.UserAllocations.view_filter = user_id_filter('user_id');
		DataSource.TimekeepEvents.view_filter = user_id_filter('user_id');
		DataSource.TimekeepStatuses.view_filter = user_id_filter('Title');
		if (!UserAccountInfo.HasPermission('hr.access')) DataSource.HrRequests.view_filter = `fields/requestee_id eq '${UserAccountInfo.account_info.user_id}'`;

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
				NotificationLog.Log('Using Cached Shared Data');
				DebugLog.Log('...using cached shared data');
				DebugLog.Log('shared data load delta: ' + Timers.Stop(timer_shareddataload) + 'ms');
				DebugLog.SubmitGroup();

				SharedData.loaded = true;
				SharedData.loading = false;

				await SharedData.onLoaded.InvokeAsync();
				await SharedData.onLoadedFromCache.InvokeAsync();
				return;
			}
		}

		if (useCache === true) DebugLog.Log('fetching missing shared data...');
		const after_download = (table, result) =>
		{
			const expand_fields = x => { return x.fields ? x.fields : x; };
			let page_items = result.body.value.map(expand_fields);

			// executes the expander on data in all DataFieldDescs that contain an expander
			for (let field_id in table.instance.datasource.data_model.field_descs)
			{
				let desc = table.instance.datasource.data_model.field_descs[field_id];
				if ('expander' in desc && typeof desc.expander === 'function')
				{
					DebugLog.Log('expanded field: ' + desc.label);
					const try_expand = record =>
					{
						try
						{
							record[desc.key] = desc.expander(record[desc.key]);
						}
						catch (e)
						{
							DebugLog.Log('error expanding field ' + desc.key + ': ' + e, "#f55");
						}
						return record;
					};
					page_items = page_items.map(try_expand);
				}
			}

			table.instance.data = table.instance.data.concat(page_items);
			table.instance.loaded = true;

			let next_page_url = result.body['@odata.nextLink'];
			if (next_page_url)
			{
				table.instance.loaded = false;
				next_page_url = next_page_url.replace(SharePoint.url_api, '');
				let next_page_req = new RequestBatchRequest('get', next_page_url, _ => { after_download(table, _); });
				SharePoint.Enqueue(next_page_req);
				DebugLog.Log(`+ ${page_items.length} items : ${table.key} [incomplete]`);
			}
			else DebugLog.Log(`+ ${page_items.length} items : ${table.key}`);
		};

		for (let table_id in SharedData.all_tables)
		{
			const table = SharedData.all_tables[table_id];
			if (useCache === true && table.instance.loaded === true) continue;
			if (useCache === true) DebugLog.Log('fetching ' + table.key);
			table.instance.ClearData();
			let url = await SharePoint.GetBatchURL_GetList(table.instance.datasource);
			let req = new RequestBatchRequest('get', url, _ => { after_download(table, _); });
			SharePoint.Enqueue(req);
		}

		await SharePoint.WaitUntilQueueEmpty();

		for (let table_id in SharedData.all_tables) { SharedData.all_tables[table_id].instance.TryStoreInCache(); }
		await SharedData.onSavedToCache.InvokeAsync();

		let ms_str = Timers.Stop(timer_shareddataload) + 'ms';
		NotificationLog.Log(`Shared Data Refreshed (${ms_str})`);
		DebugLog.Log('shared data load delta: ' + ms_str);
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

	static async LoadTable(datasource = DataSource.Nothing, key = '????')
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
}

SharedData.sub_AccountLogin = AppEvents.onAccountLogin.RequestSubscription(() => { SharedData.LoadData(true) });

Modules.Report('Shared Data', `This module acts as an entrypoint for any aspect of ${AppInfo.name} which need access to shared online data.`);