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
			'ops_history',
			'user_dashboard',
			'mail',
			'help',
			'problems',
			'files',
			'pdf_view',
			'directory',
			'project_hub',
			'project_builder',
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

		const get_page = page => import(`../pages/descriptors/${page}.js`);

		let import_results = await Promise.allSettled(page_names.map(get_page));
		import_results = import_results.map((_, i) => { return { name: page_names[i], result: _ }; });
		console.info(' >>> IMPORT Page Modules');

		const err_msg = _ => { return ` ! PAGE '${_.name}'\n ! ${_.result.reason}`; };
		let errors = import_results.filter(_ => _.result.status !== 'fulfilled').map(err_msg);
		if (errors.length > 0) console.warn([' ! IMPORT ERRORS:'].concat(errors).join('\n'));
	}
}