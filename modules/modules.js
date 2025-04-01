export class ModuleInfo
{
	constructor(name = '', desc = '')
	{
		this.name = name;
		this.desc = desc;
	}
}

const modules_sort_by_name = (x, y) =>
{
	if (x.name < y.name) return -1;
	if (x.name > y.name) return 1;
	return 0;
};

export class Modules
{
	static reported = [];

	static Report(module_name = '', module_desc = '')
	{
		Modules.reported.push(new ModuleInfo(module_name, module_desc));
		Modules.reported = Modules.reported.sort(modules_sort_by_name);
	}
}
Modules.Report('Modules', 'This module keeps track of all the modules.');