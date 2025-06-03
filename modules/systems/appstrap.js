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
		await Promise.allSettled(
			[
				import('../pages/descriptors/home.js'),
				import('../pages/descriptors/settings.js'),
				import('../pages/descriptors/user_dashboard.js'),
				import('../pages/descriptors/help.js'),
				import('../pages/descriptors/problems.js'),
				import('../pages/descriptors/files.js'),
				import('../pages/descriptors/pdf_view.js'),
				import('../pages/descriptors/directory.js'),
				import('../pages/descriptors/internal_users.js'),
				import('../pages/descriptors/external_contacts.js'),
				import('../pages/descriptors/project_hub.js'),
				import('../pages/descriptors/task_hub.js'),
				import('../pages/descriptors/contact_logs.js'),
				import('../pages/descriptors/scratchpad.js'),
				import('../pages/descriptors/timekeep.js'),
				import('../pages/descriptors/database_probe.js'),
				import('../pages/descriptors/external_links.js'),
				import('../pages/descriptors/demo_panel.js'),
				import('../pages/descriptors/map.js'),
				import('../pages/descriptors/hr.js'),
				import('../pages/descriptors/user_allocations.js')
			]
		);
		console.info(' >>> IMPORT Page Modules');
	}
}