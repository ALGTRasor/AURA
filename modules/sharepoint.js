import { DataSource } from "./datasource.js";
import { DBConfig } from "./dbconfig.js";
import { DebugLog } from "./debuglog.js";
import { Modules } from "./modules.js";
import { UserAccountManager } from "./useraccount.js";

export class SharePoint
{
	static async GetSiteUrl(site_name) { return await DBConfig.GetWebURL() + ':/sites/' + site_name; }
	static async GetListUrl(site_name, list_name) { return await DBConfig.GetWebURL() + ':/sites/' + site_name + ':/lists/' + list_name; }
	static async GetItemsUrl(site_name, list_name, item_id) { return await DBConfig.GetWebURL() + ':/sites/' + site_name + ':/lists/' + list_name + ':/items/' + item_id; }

	static async GetData(url)
	{
		const def_headers =
		{
			'Authorization': 'Bearer ' + UserAccountManager.account_provider.access_token,
			'Accept': 'application/json'
		};

		let resp = await fetch(url, { method: 'get', headers: def_headers });
		if (resp.status == 200) return await resp.json();
		return null;
	}

	static async GetListData(source = DataSource.Nothing)
	{
		let field_str = source.fields.join(',');
		let url = await SharePoint.GetListUrl(source.site_name, source.list_title) + '/items?select=id&expand=fields(select=' + field_str + ')';
		let result = await SharePoint.GetData(url);

		if (result && result.value)
		{
			if (Array.isArray(result.value)) 
			{
				let table = result.value.map(x => { return x.fields ? x.fields : x; });
				DebugLog.Log('...collected ' + table.length + ' items from ' + source.list_title, '#0f03');
				return table;
			}
			DebugLog.Log('...collected sharepoint list data', '#0ff3');
			return result.value;
		}

		DebugLog.Log('...failed to collect sharepoint list items', '#ff03');
		return result;
	}
}

Modules.Report("SharePoint");