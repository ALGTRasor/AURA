import { AppEvents } from "./appevents.js";
import { DataSource } from "./datasource.js";
import { DBConfig } from "./dbconfig.js";
import { DBLayer } from "./dblayer.js";
import { DebugLog } from "./debuglog.js";
import { Modules } from "./modules.js";
import { OverlayManager } from "./ui/overlays.js";
import { UserAccountManager } from "./useraccount.js";

export class RequestBatchRequest
{
	static Nothing = new RequestBatchRequest('get', '', _ => { }, _ => { }, {});

	constructor(method = 'get', url = '', with_result = _ => { }, prep = _ => { }, headers = SharePoint.GetDefaultHeaders())
	{
		this.method = method.toUpperCase();
		this.url = url;

		this.id = -1;
		this.headers = headers;
		this.body = {};
		this.with_result = with_result;

		if (prep) prep(this);
	}

	GetBatchData()
	{
		return {
			id: this.id,
			url: this.url,
			method: this.method,
			headers: this.headers,
			body: this.body
		};
	}
}

export class RequestBatch
{
	constructor(requests = []) { this.requests = requests; }
	PushRequest(req = RequestBatchRequest.Nothing) { this.requests.push(req); }
	ClearRequests() { this.requests = []; }
}

export class SharePoint
{
	static url_api = 'https://graph.microsoft.com/v1.0';
	static url_api_sites = SharePoint.url_api + '/sites';
	static url_batch = SharePoint.url_api + '/$batch';

	static web_name = 'arrowlandgroup.sharepoint.com';
	static site_name_primary = 'ALGInternal';
	static path_root = 'Shared Documents/ALGFileLibrary/';
	static path_user_docs_root = 'ALGUserDocs/';
	static path_user_files = SharePoint.path_user_docs_root + 'Users/';
	static path_user_hr = SharePoint.path_user_docs_root + 'HR/';

	static GetWebBaseURL() { return SharePoint.url_api_sites + '/' + SharePoint.web_name; }
	static GetWebBatchBaseURL() { return '/sites/' + SharePoint.web_name; }

	static GetSiteUrl(site_name) { return SharePoint.GetWebBaseURL() + ':/sites/' + site_name; }
	static GetListUrl(site_name, list_name) { return SharePoint.GetWebBaseURL() + ':/sites/' + site_name + ':/lists/' + list_name; }
	static GetItemsUrl(site_name, list_name, item_id) { return SharePoint.GetWebBaseURL() + ':/sites/' + site_name + ':/lists/' + list_name + ':/items/' + item_id; }

	static GetSiteBatchUrl(site_name) { return SharePoint.GetWebBatchBaseURL() + ':/sites/' + site_name; }
	static GetListBatchUrl(site_name, list_name) { return SharePoint.GetWebBatchBaseURL() + ':/sites/' + site_name + ':/lists/' + list_name; }
	static GetItemsBatchUrl(site_name, list_name, item_id) { return SharePoint.GetWebBatchBaseURL() + ':/sites/' + site_name + ':/lists/' + list_name + ':/items/' + item_id; }

	static intervalId_ProcessQueue = -1;
	static processingBatch = false;
	static batchQueue = [];

	static StartProcessingQueue()
	{
		if (SharePoint.intervalId_ProcessQueue !== -1) return;
		SharePoint.intervalId_ProcessQueue = window.setInterval(_ => { SharePoint.CheckProcessQueue(); }, 500);
	}

	static Enqueue(req = RequestBatchRequest.Nothing) { SharePoint.batchQueue.push(req); }

	static CheckProcessQueue()
	{
		if (SharePoint.processingBatch === true) return;
		if (SharePoint.batchQueue.length < 1) return;
		SharePoint.DoProcessQueue();
	}

	static async DoProcessQueue()
	{
		if (SharePoint.processingBatch === true) return;
		SharePoint.processingBatch = true;

		while (SharePoint.batchQueue.length > 0)
		{
			let new_batch_count = SharePoint.batchQueue.length;
			let new_batch = new RequestBatch(SharePoint.batchQueue.splice(0, new_batch_count));
			DebugLog.StartGroup(`SharePoint Batch (${new_batch_count} requests)`);
			await SharePoint.ProcessBatchRequests(new_batch);
			// processing may enqueue additional requests, typically due to pagination
			DebugLog.SubmitGroup('#0ff4');
		}

		SharePoint.processingBatch = false;
	}

	static async WaitAllRequests() { await SharePoint.DoProcessQueue(); }

	static GetDefaultHeaders()
	{
		return {
			'Authorization': 'Bearer ' + UserAccountManager.account_provider.access_token,
			'Accept': 'application/json',
			'Content-Type': 'application/json',
			'Prefer': 'HonorNonIndexedQueriesWarningMayFailRandomly'
		};
	}

	static GetAuthOnlyHeaders()
	{
		return {
			'Authorization': 'Bearer ' + UserAccountManager.account_provider.access_token,
			'Content-Type': 'application/json'
		};
	}

	static AssignBatchRequestIds(requests = [])
	{
		for (let req_index in requests) requests[req_index].id = req_index;
	}

	static async ProcessBatchRequests(batchRequest = {})
	{
		let request_objects = batchRequest.requests;

		while (request_objects.length > 0)
		{
			// limit 20 batch requests at once per microsoft
			let this_batch = request_objects.splice(0, 20);
			// assign ordered indices to batch requests
			// batch responses often return out of order and will need to be matched via index
			SharePoint.AssignBatchRequestIds(this_batch);

			// post the request, wait for the results
			let resp = await fetch(
				SharePoint.url_batch,
				{
					method: 'post',
					headers: SharePoint.GetDefaultHeaders(),
					body: JSON.stringify({ requests: this_batch.map(_ => _.GetBatchData()) })
				}
			);

			// overall batch success, though each response may still return an error
			if (resp.status === 200)
			{
				let responses_obj = await resp.json();
				SharePoint.MatchBatchResponses(this_batch, responses_obj);
				for (let bid in this_batch)
				{
					if (!this_batch[bid].with_result) continue;
					this_batch[bid].with_result(this_batch[bid].response);
				}
			}
			// unauthorized to perform batch
			else if (resp.status >= 401 && resp.status <= 403)
			{
				AppEvents.onAuthorizationFailure.Invoke();
			}
		}
	}

	static MatchBatchResponses(requests = [], responses_obj = {})
	{
		const responses = responses_obj.responses;
		const get_response_from_id = id =>
		{
			for (let resp_index in responses)
			{
				if (responses[resp_index].id == id) return responses[resp_index];
			}
			console.warn('failed to match batch response ID: ' + id);
			return undefined;
		};

		for (let req_index in requests)
		{
			let this_req = requests[req_index];
			let this_req_resp = get_response_from_id(this_req.id);
			if (this_req_resp)
			{
				requests[req_index].response = this_req_resp;
				if (this_req_resp.body)
				{
					requests[req_index].body = this_req_resp.body;
					requests[req_index]['@odata.nextLink'] = this_req_resp.body['@odata.nextLink'];
				}
			}
		}
	}


	static async DownloadRecord(site = '', list = '', filter = '', fields = [])
	{
		let url = SharePoint.GetListUrl(site, list) + '/items?select=id';
		if (fields && fields.length > 0) url += '&expand=fields(select=' + fields.join(',') + ')';
		if (filter && filter.length > 0) url += '&$filter=' + filter;
		let result = await SharePoint.GetData(url);
		let result_items = result.value;
		let valid_items = result_items && Array.isArray(result_items) && result_items.length > 0;
		if (valid_items) return result_items[0].fields;
		return undefined;
	}




	static async GetData(url)
	{
		let req_headers =
		{
			'Authorization': 'Bearer ' + UserAccountManager.account_provider.access_token,
			'Accept': 'application/json'
		};

		let resp = await fetch(url, { method: 'get', headers: req_headers });
		if (resp.status == 200) return await resp.json();
		// unauthorized to perform batch
		if (resp.status >= 401 && resp.status <= 403)
		{
			AppEvents.onAuthorizationFailure.Invoke();
		}
		return resp;
	}



	static async SetData(url, data = {})
	{
		if (!data) return;

		let headers =
		{
			'Authorization': 'Bearer ' + UserAccountManager.account_provider.access_token,
			'Accept': 'application/json'
		};

		let resp = await fetch(url, { method: 'patch', headers: headers, body: JSON.stringify(data) });
		if (resp.status == 200) return await resp.json();
		return null;
	}


	static GetURL_GetList(source = DataSource.Nothing)
	{
		let url = SharePoint.GetListUrl(source.site_name, source.list_title) + '/items?select=id';
		if (source.fields && source.fields.length > 0) url += '&expand=fields(select=' + source.fields.join(',') + ')';
		if (source.view_filter && source.view_filter.length > 0) url += '&$filter=' + source.view_filter;
		if (source.sorting_field && source.sorting_field.length > 0) url += '&$orderby=fields/' + source.sorting_field + ' asc';
		return url;
	}


	static GetBatchURL_GetList(source = DataSource.Nothing)
	{
		let url = SharePoint.GetListBatchUrl(source.site_name, source.list_title) + '/items?select=id';
		if (source.fields && source.fields.length > 0) url += '&expand=fields(select=' + source.fields.join(',') + ')';
		if (source.view_filter && source.view_filter.length > 0) url += '&$filter=' + source.view_filter;
		if (source.sorting_field && source.sorting_field.length > 0) url += '&$orderby=fields/' + source.sorting_field + ' asc';
		return url;
	}

	static async GetListData(source = DataSource.Nothing)
	{
		let url = SharePoint.GetURL_GetList(source);
		let result = await SharePoint.GetData(url);

		let all_items = [];

		if (result)
		{
			const collect_items = (item_list = [], new_items = []) =>
			{
				let valid_items = new_items && Array.isArray(new_items) && new_items.length > 0;
				return valid_items ? item_list.concat(new_items) : item_list;
			}

			all_items = collect_items(all_items, result.value);
			while ('@odata.nextLink' in result)
			{
				let next_url = result['@odata.nextLink'];
				result = await SharePoint.GetData(next_url);
				all_items = collect_items(all_items, result.value);
			}
		}
		else
		{
			DebugLog.Log('...failed to collect sharepoint list items', '#ff03');
		}

		const expand_fields = x => { return 'fields' in x ? x.fields : x; };
		return all_items.map(expand_fields);
	}

	static async PatchListItem(source = DataSource.Nothing, item_id = '', patchData = {})
	{
		let url = SharePoint.GetListUrl(source.site_name, source.list_title) + '/items/' + item_id + '/fields';
		let result = await SharePoint.SetData(url, patchData);
		DebugLog.Log('Patch sharepoint list items result: ' + result);
	}







	static GetListItems(table)
	{
		SharePoint.Enqueue(
			new RequestBatchRequest(
				'get',
				SharePoint.GetBatchURL_GetList(table.instance.datasource),
				_ => { SharePoint.HandleListItemsResult(table, _); }
			)
		);
	}


	static HandleListItemsResult(table, result) 
	{
		const expand_fields = x => { return x.fields ? x.fields : x; };
		let page_items = result.body.value.map(expand_fields);

		// executes the expander on data in all DataFieldDescs that contain an expander
		for (let field_id in table.instance.datasource.data_model.field_descs)
		{
			let desc = table.instance.datasource.data_model.field_descs[field_id];
			if ('expander' in desc && typeof desc.expander === 'function')
			{
				DebugLog.Log('expanded field: ' + desc.label);
				const try_expand = record =>
				{
					try
					{
						record[desc.key] = desc.expander(record[desc.key]);
					}
					catch (e)
					{
						DebugLog.Log('error expanding field ' + desc.key + ': ' + e, "#f55");
					}
					return record;
				};
				page_items = page_items.map(try_expand);
			}
		}

		table.instance.data = table.instance.data.concat(page_items);
		table.instance.loaded = true;

		let next_page_url = result.body['@odata.nextLink'];
		if (next_page_url)
		{
			table.instance.loaded = false;
			next_page_url = next_page_url.replace(SharePoint.url_api, '');
			let next_page_req = new RequestBatchRequest(
				'get', next_page_url,
				next_page_result => { SharePoint.HandleListItemsResult(table, next_page_result); }
			);
			SharePoint.Enqueue(next_page_req);
			DebugLog.Log(`+ ${page_items.length} items : ${table.key} [incomplete]`);
		}
		else DebugLog.Log(`+ ${page_items.length} items : ${table.key}`);
	};
}








export class DB_SharePoint extends DBConfig
{
	async _OnInitialize() { SharePoint.StartProcessingQueue(); }

	// await processing all queued requests
	async WaitAllRequests() { return await SharePoint.WaitAllRequests(); }

	// methods for handling remotely stored data in a table / record structure
	async GetRecords(source) { return await SharePoint.GetListItems(source); }
	async GetRecordById(source, record_id) { }
	async UpdateRecord(source, record_id, record_data) { return await SharePoint.PatchListItem(source, record_id, record_data); }
	async CreateRecord(source, record_data) { }

	// methods for handling remotely stored items in a folder / file structure
	async CreateItem(path, data) { }
	async DownloadItem(path) { }
	async LoadItemInfo(path) { }
	async RenameItem(path, new_name) { }

	async CreateFolder(path) { }
	async GetFolderInfo(path) { }
	async RenameFolder(path, new_name) { }
	async LoadItemsAtPath(path) { }
}




Modules.Report('SharePoint', 'This module adds a SharePoint API DBConfig and functionality.');