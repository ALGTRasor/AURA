const default_stat_name = 'null-stat';
const lskey_appstats = 'lsc-app-statistics';

class AppStat
{
	constructor(name = default_stat_name, initial_value = undefined)
	{
		this.name = name;
		this.value = initial_value;
	}
}

export class AppStats
{
	static statistics = [];

	static IndexOf(name = default_stat_name) { return AppStats.statistics.findIndex(_ => _.name == name); };

	static Average(name = default_stat_name, value = 0.0)
	{
		let existing_index = AppStats.IndexOf(name);
		if (existing_index > -1)
		{
			let pvalue = AppStats.statistics[existing_index].value;
			AppStats.statistics[existing_index].value = (pvalue + value) * 0.5;
		}
		else AppStats.statistics.push(new AppStat(name, value));
	}

	static Count(name = default_stat_name, count = 1)
	{
		let existing_index = AppStats.IndexOf(name);
		if (existing_index > -1) 
		{
			let pvalue = AppStats.statistics[existing_index].value;
			AppStats.statistics[existing_index].value = Math.max(0.0, pvalue + count);
		}
		else AppStats.statistics.push(new AppStat(name, count));
	}

	static Clear()
	{
		AppStats.statistics = [];
	}

	static Load()
	{
		let ls_json = localStorage.getItem(lskey_appstats);
		if (ls_json)
		{
			AppStats.Clear();
			let ls_obj = JSON.parse(ls_json);
			if ('statistics' in ls_obj) AppStats.statistics = ls_obj.statistics;
		}
	}

	static Save()
	{
		localStorage.setItem(lskey_appstats, JSON.stringify({ statistics: AppStats.statistics }));
	}
}