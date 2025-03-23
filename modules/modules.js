export class Modules
{
	static Report(module_name)
	{
		if (window.fxn && window.fxn.DebugLog) window.fxn.DebugLog("[ + " + module_name + " ]", false);
		else console.info("[ + " + module_name + " ]");
	}
}
Modules.Report("Modules");