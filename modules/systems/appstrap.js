export class AppStrap
{
	static async ImportDataModules()
	{
		console.info('importing remote data modules');

		const { DBLayer } = await import('../remotedata/dblayer.js');
		window.DBLayer = DBLayer;

		const { SharedData } = await import('../remotedata/datashared.js');
		window.SharedData = SharedData;

		const { RequestBatch, RequestBatchRequest, SharePoint, DB_SharePoint } = await import('../remotedata/sharepoint.js');
		window.RequestBatch = RequestBatch;
		window.RequestBatchRequest = RequestBatchRequest;
		window.SharePoint = SharePoint;
		window.DB_SharePoint = DB_SharePoint;
	}

	static async ImportPageModules()
	{
		console.info('importing page modules');
		await import('../pages/descriptors/home.js');
		await import('../pages/descriptors/settings.js');
		await import('../pages/descriptors/user_dashboard.js');
		await import('../pages/descriptors/help.js');
		await import('../pages/descriptors/problems.js');
		await import('../pages/descriptors/files.js');
		await import('../pages/descriptors/pdf_view.js');
		await import('../pages/descriptors/directory.js');
		await import('../pages/descriptors/internal_users.js');
		await import('../pages/descriptors/external_contacts.js');
		await import('../pages/descriptors/project_hub.js');
		await import('../pages/descriptors/task_hub.js');
		await import('../pages/descriptors/contact_logs.js');
		await import('../pages/descriptors/scratchpad.js');
		await import('../pages/descriptors/timekeep.js');
		await import('../pages/descriptors/database_probe.js');
		await import('../pages/descriptors/external_links.js');
		await import('../pages/descriptors/demo_panel.js');
		await import('../pages/descriptors/map.js');
		await import('../pages/descriptors/hr.js');
		await import('../pages/descriptors/user_allocations.js');
	}
}