import { Modules } from "./modules.js";

export class DBConfig
{
	static Nothing = new DBConfig();

	loaded = false;
	loading = false;

	async _OnInitialize() { }

	async Initialize()
	{
		if (this.loading === true || this.loaded === true) return;
		this.loading = true;
		await this._OnInitialize();
		this.loading = false;
		this.loaded = true;
	}

	// await processing all queued requests
	async WaitAllRequests() { }

	// methods for handling remotely stored data in a table / list structure
	async GetRecords(source) { }
	async GetRecordById(source, record_id) { }
	async UpdateRecord(source, record_id, record_data) { }
	async CreateRecord(source, record_data) { }

	// methods for handling remotely stored files in a folder / file structure
	async CreateItem(path, data) { }
	async DownloadItem(path) { }
	async LoadItemInfo(path) { }
	async RenameItem(path, new_name) { }

	async CreateFolder(path) { }
	async GetFolderInfo(path) { }
	async RenameFolder(path, new_name) { }
	async LoadItemsAtPath(path) { }
}

Modules.Report("Database Config", "This module adds a database config class to configure different database backends to work with a DBLayer instance.");