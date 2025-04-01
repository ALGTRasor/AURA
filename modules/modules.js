export class Modules
{
	static reported = [];
	static Report(module_name)
	{
		Modules.reported.push(module_name);
		Modules.reported = Modules.reported.sort();
	}
}
Modules.Report("Modules");