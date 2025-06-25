import { Modules } from "../modules.js";
import { AppStats } from "../systems/appstats.js";
import { Timers } from "../timers.js";
import { DBConfig } from "./dbconfig.js";

export class DBLayer
{
	static config = DBConfig.Nothing;

	static async Initialize() { return await DBLayer.config.Initialize(); }

	static async WaitAllRequests() { return await DBLayer.config.WaitAllRequests(); }

	static async GetRecords(source)
	{
		let timer_name = 'db-layer-get-records ' + Math.round(Math.random() * 9999999);
		Timers.Start(timer_name);
		let result = await DBLayer.config.GetRecords(source);
		let ms_delta = Timers.Stop(timer_name);
		AppStats.Average('datasource-load-time', ms_delta);
		return result;
	}
	static async GetRecordById(source, record_id) { return await DBLayer.config.GetRecordById(source, record_id); }
	static async UpdateRecord(source, record_id, record_data) { return await DBLayer.config.UpdateRecord(source, record_id, record_data); }
	static async CreateRecord(source, record_data) { return await DBLayer.config.CreateRecord(source, record_data); }
	static async DeleteRecord(source, record_id) { return await DBLayer.config.DeleteRecord(source, record_id); }

	static async CreateItem(path, data) { return await DBLayer.config.CreateItem(path, data); }
	static async DownloadItem(path) { return await DBLayer.config.DownloadItem(path); }
	static async LoadItemInfo(path) { return await DBLayer.config.LoadItemInfo(path); }
	static async RenameItem(path, new_name) { return await DBLayer.config.RenameItem(path, new_name); }

	static async CreateFolder(path) { return await DBLayer.config.CreateFolder(path); }
	static async GetFolderInfo(path) { return await DBLayer.config.GetFolderInfo(path); }
	static async RenameFolder(path, new_name) { return await DBLayer.config.RenameFolder(path, new_name); }
	static async LoadItemsAtPath(path) { return await DBLayer.config.LoadItemsAtPath(path); }
}

Modules.Report("Database Layer", "This module works as an abstraction layer for an interchangeable database backend.");