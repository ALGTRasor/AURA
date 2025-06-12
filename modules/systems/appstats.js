import { NotificationLog } from "../notificationlog.js";

const default_stat_name = 'null-stat';
const lskey_appstats = 'lsc-app-statistics';

class AppStatBase
{
	constructor(name = default_stat_name, initial_value = undefined)
	{
		this.name = name;
		this.value = initial_value;
		this.initial_value_type = typeof initial_value;
	}
}

class AppStatCounter extends AppStatBase
{
	constructor(name = default_stat_name, initial_value = 0) { super(name, initial_value); }
	AddCount(count) { this.value = Math.max(0, this.value + count); }
}

export class AppStats
{
	static counters = [];

	static IndexOfCounter(name = default_stat_name) { return AppStats.counters.findIndex(_ => _.name === name); };

	static Count(name = default_stat_name, count = 1)
	{
		let existing_index = AppStats.IndexOfCounter(name);
		if (existing_index > 0) AppStats.counters[existing_index].AddCount(count);
		else AppStats.counters.push(new AppStatCounter(name, count));
	}

	static Uncount(name = default_stat_name, count = 1)
	{
		let existing_index = AppStats.IndexOfCounter(name);
		if (existing_index > 0) AppStats.counters[existing_index].AddCount(-count);
	}

	static Clear()
	{
		AppStats.counters = [];
	}

	static Load()
	{
		let ls_json = localStorage.getItem(lskey_appstats);
		if (ls_json)
		{
			AppStats.Clear();
			let ls_obj = JSON.parse(ls_json);
			if ('counters' in ls_obj) AppStats.counters = ls_obj.counters;
		}
	}

	static Save()
	{
		localStorage.setItem(
			lskey_appstats,
			JSON.stringify(
				{
					counters: AppStats.counters
				}
			)
		);
	}
}