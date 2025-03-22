import { Modules } from "./modules.js";
import { SharePoint } from "./sharepoint.js";

export class SharePointDataSource
{
	static Nothing = new SharePointDataSource(null, null, null);
	static ALGUsers = new SharePointDataSource('ALGUsers', 'ALGInternal', ['id', 'title', 'display_name_full']);

	constructor(list_title, site_name = 'ALGInternal', fields = ['id', 'title'])
	{
		this.list_title = list_title;
		this.site_name = site_name;
		this.fields = fields;
	}

	async GetData() { return await SharePoint.GetListData(this); }
}

Modules.Report("SharePoint");