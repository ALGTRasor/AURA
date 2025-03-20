import { Modules } from "./modules.js";
import { UserAccountManager } from "./useraccount.js";

const url_sp = 'https://arrowlandgroup.sharepoint.com/';
const url_sp_sites = url_sp + 'sites/';
const url_sp_site_algi = url_sp_sites + 'ALGInternal/';
const url_sp_site_algi_api = url_sp_site_algi + '_api/web/';

const url_ms_graph = 'https://graph.microsoft.com/v1.0/';
const url_ms_graph_sites = url_ms_graph + 'sites/';
const url_ms_graph_site_alg = url_ms_graph_sites + 'arrowlandgroup.sharepoint.com';


export class SharePoint
{
	static GetSiteUrl(site_name) { return url_ms_graph_site_alg + ':/sites/' + site_name; }
	static GetListUrl(site_name, list_name) { return url_ms_graph_site_alg + ':/sites/' + site_name + ':/lists/' + list_name; }

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

	static async GetListData(site_name, list_title)
	{
		console.info('Requesting SP List data...');
		try
		{
			let resp = await fetch(
				SharePoint.GetListUrl(site_name, list_title) + '/items?select=id&expand=fields(select=id,title)',
				{
					method: 'get',
					headers:
					{
						'Authorization': 'Bearer ' + UserAccountManager.access_token,
						'Accept': 'application/json'
					}
				}
			);

			var resp_obj = await resp.json();
			return resp_obj;
		}
		catch (e)
		{
			console.warn('...Error requesting list data');
			console.error(e);
			return null;
		}
	}
}

Modules.Report("SharePoint");