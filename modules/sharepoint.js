import { ActionBar } from "./actionbar.js";
import { DataSource } from "./datasource.js";
import { DBConfig } from "./dbconfig.js";
import { DebugLog } from "./debuglog.js";
import { Modules } from "./modules.js";
import { UserAccountManager } from "./useraccount.js";

export class RequestBatchRequest
{
	static Nothing = new RequestBatchRequest('get', '', {}, _ => { }, _ => { });

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
	static async GetSiteUrl(site_name) { return await DBConfig.GetWebURL() + ':/sites/' + site_name; }
	static async GetListUrl(site_name, list_name) { return await DBConfig.GetWebURL() + ':/sites/' + site_name + ':/lists/' + list_name; }
	static async GetItemsUrl(site_name, list_name, item_id) { return await DBConfig.GetWebURL() + ':/sites/' + site_name + ':/lists/' + list_name + ':/items/' + item_id; }

	static async GetSiteBatchUrl(site_name) { return await DBConfig.GetWebBatchURL() + ':/sites/' + site_name; }
	static async GetListBatchUrl(site_name, list_name) { return await DBConfig.GetWebBatchURL() + ':/sites/' + site_name + ':/lists/' + list_name; }
	static async GetItemsBatchUrl(site_name, list_name, item_id) { return await DBConfig.GetWebBatchURL() + ':/sites/' + site_name + ':/lists/' + list_name + ':/items/' + item_id; }

	static GetDefaultHeaders()
	{
		return {
			'Authorization': 'Bearer ' + UserAccountManager.account_provider.access_token,
			'Accept': 'application/json',
			'Content-Type': 'application/json'
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
		const url_ms_graph_batch = 'https://graph.microsoft.com/v1.0/$batch';

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
				url_ms_graph_batch,
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
			else if (resp.status >= 401 && resp.status <= 499)
			{
				DebugLog.Log('authentication required! auth error status from batch request');
				UserAccountManager.account_provider.logged_in = false; // trigger reauthentication flow
				fxn.ForceLogOut();
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




	static async GetData(url)
	{
		let req_headers =
		{
			'Authorization': 'Bearer ' + UserAccountManager.account_provider.access_token,
			'Accept': 'application/json'
		};

		let resp = await fetch(url, { method: 'get', headers: req_headers });
		if (resp.status == 200) return await resp.json();
		return null;
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


	static async GetURL_GetList(source = DataSource.Nothing)
	{
		let url = await SharePoint.GetListUrl(source.site_name, source.list_title) + '/items?select=id';
		if (source.fields && source.fields.length > 0) url += '&expand=fields(select=' + source.fields.join(',') + ')';
		if (source.view_filter && source.view_filter.length > 0) url += '&$filter=' + source.view_filter;
		return url;
	}


	static async GetBatchURL_GetList(source = DataSource.Nothing)
	{
		let url = await SharePoint.GetListBatchUrl(source.site_name, source.list_title) + '/items?select=id';
		if (source.fields && source.fields.length > 0) url += '&expand=fields(select=' + source.fields.join(',') + ')';
		if (source.view_filter && source.view_filter.length > 0) url += '&$filter=' + source.view_filter;
		return url;
	}

	static async GetListData(source = DataSource.Nothing)
	{
		let url = await SharePoint.GetURL_GetList(source);
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

		const expand_fields = x => { return x.fields ? x.fields : x; };
		return all_items.map(expand_fields);
	}


	static async GetURL_PatchListItem(source = DataSource.Nothing, item_id = '')
	{
		return await SharePoint.GetListUrl(source.site_name, source.list_title) + '/items/' + item_id + '/fields';
	}

	static async PatchListItem(source = DataSource.Nothing, item_id = '', patchData = {})
	{
		let url = SharePoint.GetURL_PatchListItem(source, item_id);
		let result = await SharePoint.SetData(url, patchData);
		DebugLog.Log('Patch sharepoint list items result: ' + result);
	}
}

Modules.Report('SharePoint', 'This module adds a shared SharePoint API layer.');