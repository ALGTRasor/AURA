import { PageManager } from '../pagemanager.js';

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
			'nav_menu',
			'settings',
			'user_dashboard',
			'help',
			'problems',
			'files',
			'pdf_view',
			'directory',
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

		let import_results = await Promise.allSettled(page_names.map(_ => import(`../pages/descriptors/${_}.js`)));
		import_results = import_results.map((_, i) => { return { name: page_names[i], result: _ }; });
		console.info(' >>> IMPORT Page Modules');
		let errors = import_results.filter(_ => _.result.status !== 'fulfilled').map(_ => `Failed to import '${_.name}': ${_.result.reason}`);
		if (errors.length > 0) console.error('Pages:\n' + errors.join('\n'));
	}
}