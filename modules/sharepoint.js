import { DBConfig } from "./dbconfig.js";
import { DebugLog } from "./debuglog.js";
import { Modules } from "./modules.js";
import { UserAccountManager } from "./useraccount.js";

export class SharePoint
{
	static async GetSiteUrl(site_name) { return await DBConfig.GetWebURL() + ':/sites/' + site_name; }
	static async GetListUrl(site_name, list_name) { return await DBConfig.GetWebURL() + ':/sites/' + site_name + ':/lists/' + list_name; }

	static async GetSiteData(site_name)
	{
		console.info('Requesting SP Site data...');
		try
		{
			let resp = await fetch(
				SharePoint.GetSiteUrl(site_name),
				{
					method: 'get',
					headers:
					{
						'Authorization': 'Bearer ' + UserAccountManager.access_token,
						'Accept': 'application/json'
					}
				}
			);

			console.info('...got SP Site data: ' + resp);
			return resp;
		}
		catch (e)
		{
			console.warn('...Error requesting SP Site data: ' + resp);
			console.error(e);
			return null;
		}
	}

	static async GetListData(source = SharePointDataSource.Nothing)
	{
		DebugLog.StartGroup('collecting sharepoint list items');
		let field_str = source.fields.join(',');
		try
		{
			let resp = await fetch(
				await SharePoint.GetListUrl(source.site_name, source.list_title) + '/items?select=id,title&expand=fields(select=' + field_str + ')',
				{
					method: 'get',
					headers:
					{
						'Authorization': 'Bearer ' + UserAccountManager.access_token,
						'Accept': 'application/json'
					}
				}
			);

			DebugLog.SubmitGroup();
			return await resp.json('#0f03');
		}
		catch (e)
		{
			console.warn('...Error requesting list data');
			console.error(e);
			DebugLog.SubmitGroup('#f003');
			return null;
		}
	}
}

Modules.Report("SharePoint");