export class AppStrap
{
	static async ImportDataModules()
	{
		const { DBLayer } = await import('../remotedata/dblayer.js');
		window.DBLayer = DBLayer;

		const { SharedData } = await import('../remotedata/datashared.js');
		window.SharedData = SharedData;

		const { RequestBatch, RequestBatchRequest, SharePoint, DB_SharePoint } = await import('../remotedata/sharepoint.js');
		window.RequestBatch = RequestBatch;
		window.RequestBatchRequest = RequestBatchRequest;
		window.SharePoint = SharePoint;
		window.DB_SharePoint = DB_SharePoint;

		console.info(' >>> IMPORT Remote Data Modules');
	}

	static async ImportPageModules()
	{
		const page_names = [
			'home',
			'settings',
			'user_dashboard',
			'help',
			'problems',
			'files',
			'pdf_view',
			'directory',
			'internal_users',
			'external_contacts',
			'project_hub',
			'task_hub',
			'contact_logs',
			'scratchpad',
			'timekeep',
			'database_probe',
			'external_links',
			'demo_panel',
			'map',
			'hr',
			'user_allocations'
		];

		await Promise.allSettled(page_names.map(_ => import(`../pages/descriptors/${_}.js`)));
		console.info(' >>> IMPORT Page Modules');
	}
}