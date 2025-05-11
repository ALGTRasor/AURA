import { DBConfig } from "./dbconfig.js";
import { Modules } from "./modules.js";

export class DBLayer
{
	static config = DBConfig.Nothing;
	static async Load() { if (DBLayer.config && DBLayer.config.Load) await DBLayer.config.Load(); }
	static async GetWebURL() { if (DBLayer.config && DBLayer.config.GetWebURL) return await DBLayer.config.GetWebURL(); }
	static async GetWebBatchURL() { if (DBLayer.config && DBLayer.config.GetWebBatchURL) return await DBLayer.config.GetWebBatchURL(); }
}

Modules.Report("Database Layer", "This module works as an abstraction layer for an interchangeable database backend.");