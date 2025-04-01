import { Modules } from "./modules.js";

const url_ms_graph = 'https://graph.microsoft.com/v1.0/';
const url_ms_graph_sites = url_ms_graph + 'sites/';

export class DBConfig
{
	static web_name = 'arrowlandgroup.sharepoint.com';

	static loaded = false;
	static loading = false;

	static async Load()
	{
		if (!DBConfig.loading) 
		{
			DBConfig.loading = true;

			//DBConfig.web_name = blob.web_name;

			DBConfig.loading = false;
			DBConfig.loaded = true;
		}
	}

	static async GetWebURL()
	{
		if (!DBConfig.loaded) await DBConfig.Load();
		return url_ms_graph_sites + DBConfig.web_name;
	}
}

Modules.Report("Database Config", "This module works as an abstraction layer for an interchangeable database backend.");