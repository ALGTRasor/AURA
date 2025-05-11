import { Modules } from "./modules.js";

export class DBConfig
{
	static Nothing = new DBConfig();

	loaded = false;
	loading = false;

	async DoLoad()
	{
		// await dbconfig info load
		this.web_name = '';
		this.site_name = '';
		this.path_root = '';
		this.path_user_docs_root = '';
		this.path_user_files = '';
		this.path_user_hr = '';
	}

	async Load()
	{
		if (this.loading === true) return;
		this.loading = true;
		await this.DoLoad();
		this.loading = false;
		this.loaded = true;
	}

	async GetWebURL()
	{
		await this.Load();
		return this.web_name;
	}

	async GetWebBatchURL()
	{
		await this.Load();
		return this.web_name;
	}
}

Modules.Report("Database Config", "This module adds a database config class to configure different database backends to work with a DBLayer instance.");