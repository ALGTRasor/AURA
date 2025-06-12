import { Modules } from "../modules.js";
import { DebugLog } from "../debuglog.js";
import { AppInfo } from "../app_info.js";
import { AppEvents } from "../appevents.js";
import { Timers } from "../timers.js";
import { DataSourceDescriptor, DataSourceInstance } from "./datasource.js";
import { NotificationLog } from "../notificationlog.js";
import { UserAccountInfo } from "../useraccount.js";
import { FieldValidation } from "../utils/field_validation.js";
import { LongOps } from "../systems/longops.js";


export class SharedDataTable
{
	static Nothing = new SharedDataTable('nothing', DataSourceDescriptor.Nothing);

	constructor(key = '', datasource_descriptor = DataSourceDescriptor.Nothing)
	{
		this.key = key;
		this.instance = new DataSourceInstance(datasource_descriptor, this);
		if (typeof this.key === 'string' && this.key.length > 0)
			this.instance.addEventListener('datachange', () => SharedData.InvokeChangeEvent(this.key));
	}

	async Download() { await this.instance.TryLoad(true); }

	AddNeeder() { return this.instance.AddNeeder(); }
	RemoveNeeder(needer) { return this.instance.RemoveNeeder(needer); }
}

export class SharedData
{
	static sub_AccountLogin = {};

	static loading = false;
	static loaded = false;

	static all_tables = [];

	static RegisterTable(key = 'shared-data-table', source_descriptor = DataSourceDescriptor.Nothing)
	{
		let table = new SharedDataTable(key, source_descriptor);
		SharedData[key] = table;
		SharedData.all_tables.push(table);
	}

	static #GetChangeEventName(table_name) { return 'shared-data-change-' + table_name; }

	static InvokeChangeEvent(table_name = '')
	{
		let data = table_name in SharedData ? SharedData[table_name] : {};
		AppEvents.Dispatch(SharedData.#GetChangeEventName(table_name), data);
		AppEvents.Dispatch('shared-data-changed');
		DebugLog.Log('Shared Data Change: ' + table_name);
	}

	static Subscribe(table_name = '', action = () => { })
	{
		AppEvents.AddListener(SharedData.#GetChangeEventName(table_name), action);
	}

	static Unsubscribe(table_name = '', action = () => { })
	{
		AppEvents.RemoveListener(SharedData.#GetChangeEventName(table_name), action);
	}

	static UpdateDataSourceFilters()
	{
		let user_id_filter = (field_name = 'Title') => `fields/${field_name} eq '${UserAccountInfo.account_info.user_id}'`;
		//DataSourceDescriptor.UserAllocations.view_filter = user_id_filter('user_id');
		DataSourceDescriptor.TimekeepEvents.view_filter = user_id_filter('user_id');
		DataSourceDescriptor.TimekeepStatuses.view_filter = user_id_filter('Title');
		if (!UserAccountInfo.HasPermission('hr.access')) DataSourceDescriptor.HrRequests.view_filter = `fields/requestee_id eq '${UserAccountInfo.account_info.user_id}'`;
	}

	// LOAD ALL SHARED DATA TABLES
	static async LoadData(useCache = true)
	{
		const timer_shareddataload = 'shared data load';

		if (SharedData.loading === true)
		{
			NotificationLog.Log('Already Loading Shared Data!', '#fa0');
			return;
		}

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

				AppEvents.Request('data-loaded');
				return;
			}

			DebugLog.Log('fetching missing shared data...');
		}

		let longop = LongOps.Start('shared-data-download-' + Math.random() * 89999 + 10000, { label: 'Reload Shared Data', silent: true });

		for (let table_id in SharedData.all_tables)
		{
			const table = SharedData.all_tables[table_id];
			if (useCache === true && table.instance.loaded === true) continue;
			table.instance.ClearData();
			window.DBLayer.GetRecords(table);
		}

		await window.DBLayer.WaitAllRequests();
		LongOps.Stop(longop);

		for (let table_id in SharedData.all_tables) { SharedData.all_tables[table_id].instance.TryStoreInCache(); }
		AppEvents.Dispatch('data-cached');

		let ms_str = Timers.Stop(timer_shareddataload) + 'ms';
		NotificationLog.Log(`Shared Data Refreshed (${ms_str})`, '#0af');
		DebugLog.Log('shared data load delta: ' + ms_str);
		DebugLog.SubmitGroup();

		SharedData.loading = false;
		SharedData.loaded = true;

		AppEvents.Request('data-loaded');
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
					DebugLog.Log('not cached: ' + x.instance.descriptor.list_title);
					full = false;
				}
				else
				{
					DebugLog.Log('in cache: ' + x.instance.descriptor.list_title);
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

	static async LoadTable(descriptor = DataSourceDescriptor.Nothing, key = '????')
	{
		let result = [];
		result = await descriptor.GetData();
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
		if (typeof table === 'string') table = SharedData[table];

		if (!Array.isArray(table.instance.data)) 
		{
			DebugLog.Log('Invalid shared data table');
			return [];
		}

		if (table.instance.data.length < 1) return [];
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






	static Validator_Roles(raw = '')
	{
		const getRoleString = (role_key = '') =>
		{
			let role_info = SharedData.GetSharedDatum('roles', [role_key])[0];
			if (role_info) return role_info.role_name_short;
			return role_key;
		};

		return raw.split(';').map(getRoleString).join(', ');
	}
}

SharedData.RegisterTable('roles', DataSourceDescriptor.Roles);
SharedData.RegisterTable('teams', DataSourceDescriptor.Teams);
SharedData.RegisterTable('users', DataSourceDescriptor.Users);
SharedData.RegisterTable('tasks', DataSourceDescriptor.Tasks);
SharedData.RegisterTable('contacts', DataSourceDescriptor.Contacts);
SharedData.RegisterTable('projects', DataSourceDescriptor.Projects);
SharedData.RegisterTable('permissions', DataSourceDescriptor.Permissions);
SharedData.RegisterTable('hr requests', DataSourceDescriptor.HrRequests);
SharedData.RegisterTable('timekeep events', DataSourceDescriptor.TimekeepEvents);
SharedData.RegisterTable('timekeep statuses', DataSourceDescriptor.TimekeepStatuses);
SharedData.RegisterTable('user allocations', DataSourceDescriptor.UserAllocations);
SharedData.RegisterTable('external links', DataSourceDescriptor.AURALinks);
SharedData.RegisterTable('aura problems', DataSourceDescriptor.AURAProblems);
SharedData.RegisterTable('app notifications', DataSourceDescriptor.AppNotifications);

//SharedData.sub_AccountLogin = AppEvents.onAccountLogin.RequestSubscription(async () => { await SharedData.LoadData(true) });
FieldValidation.RegisterValidator('role', SharedData.Validator_Roles);

Modules.Report('Shared Data', `This module acts as an entrypoint for any aspect of ${AppInfo.name} which need access to shared online data.`);