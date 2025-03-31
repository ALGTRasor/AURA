import { AccountUser } from "../datamodels/account_user.js";
import { DataFieldDesc } from "../datamodels/datafield_desc.js";
import { HrRequest } from "../datamodels/hr_request.js";
import { InternalUser } from "../datamodels/internal_user.js";
import { SharedData } from "../datashared.js";
import { DebugLog } from "../debuglog.js";
import { PageManager } from "../pagemanager.js";
import { RecordFormUtils } from "../ui/recordform.js";
import { UserAccountInfo } from "../useraccount.js";
import { PageBase } from "./pagebase.js";

import { RecordViewer } from "../ui/recordviewer.js";
import { addElement } from "../domutils.js";


export class PageMyData extends PageBase
{
	GetTitle() { return 'my data'; }
	CreateElements(parent)
	{
		if (!parent) return;

		this.sub_SharedDataRefresh = {};

		this.icon = 'person';

		this.CreateBody();
		this.e_body.style.minWidth = '32rem';

		this.e_content.style.flexWrap = 'wrap';
		this.e_content.style.flexDirection = 'row';

		this.viewer_hr_requests = new RecordViewer();

		this.CreateAccountInfoBlock();
		this.CreateUserInfoBlock();
		this.CreateHrBlock();

		this.FinalizeBody(parent);

		this.UpdateBlocks();
	}

	CreateAccountInfoBlock()
	{
		this.e_account_info = document.createElement('div');
		this.e_account_info.className = 'page-content-root-block';
		this.e_account_info.style.minWidth = '42rem';
		this.UpdateAccountInfoBlock();
		this.e_content.appendChild(this.e_account_info);
	}
	UpdateAccountInfoBlock()
	{
		this.e_account_info.innerHTML = `<div style='text-align:center;opacity:60%;'>Account Info</div>`;
		RecordFormUtils.CreateRecordInfoList(this.e_account_info, UserAccountInfo.account_info, AccountUser.field_descs);
	}

	CreateUserInfoBlock()
	{
		this.e_user_info = document.createElement('div');
		this.e_user_info.className = 'page-content-root-block';
		this.e_user_info.style.minWidth = '42rem';

		this.UpdateUserInfoBlock();
		this.e_content.appendChild(this.e_user_info);
	}

	UpdateUserInfoBlock()
	{
		if (UserAccountInfo.user_info)
		{
			this.e_user_info.innerHTML = `<div style='text-align:center;opacity:60%;'>User Info</div>`;
			RecordFormUtils.CreateRecordInfoList(this.e_user_info, UserAccountInfo.user_info, InternalUser.field_descs);
		}
		else
		{
			let div_title = `<div style='text-align:center;opacity:60%;'>User Info</div>`;
			this.e_user_info.innerHTML = div_title + `<div style='color:red;font-size:125%;font-weight:bold;'>USER INFO MISSING</div>`;
		}
	}

	CreateHrBlock()
	{
		this.e_hr = document.createElement('div');
		this.e_hr.className = 'page-content-root-block';
		this.e_hr.style.minWidth = '42rem';

		this.viewer_hr_requests.CreateElements(this.e_hr);
		this.UpdateHrBlock();

		this.e_content.appendChild(this.e_hr);

	}

	UpdateHrBlock()
	{
		this.viewer_hr_requests.RemoveElements();
		const sort = (x, y) =>
		{
			if (x.request_name < y.request_name) return -1;
			if (x.request_name > y.request_name) return 1;
			return 0;
		};
		this.viewer_hr_requests.SetListItemSorter(sort);
		this.viewer_hr_requests.SetListItemBuilder((table, x, e) => { addElement(e, 'span', '', '', c => { c.innerText = table[x].request_name }); });
		this.viewer_hr_requests.SetViewBuilder(records => this.BuildRecordView_HrReqs(records));
		this.viewer_hr_requests.SetData(UserAccountInfo.hr_info.requests);
		this.viewer_hr_requests.CreateElements(this.e_hr);
	}

	UpdateBlocks()
	{
		this.UpdateAccountInfoBlock();
		DebugLog.Log('...updated account info block');
		this.UpdateUserInfoBlock();
		DebugLog.Log('...updated user info block');
		this.UpdateHrBlock();
		DebugLog.Log('...updated hr info block');
	}

	BuildRecordView_HrReqs(records = [])
	{
		if (!records || records.length < 1) return;

		for (let id in records)
		{
			let record = records[id];
			let e_info_root = addElement(this.viewer_hr_requests.e_view_root, 'div', 'record-viewer-view-block', '', e => { addElement(e, 'span', '', '', x => { x.innerText = record.request_name; }) });
			RecordFormUtils.CreateRecordInfoList(e_info_root, record, HrRequest.data_model.field_descs, null, records.length < 2);
		}
	}

	OnOpen()
	{
		this.sub_SharedDataRefresh = SharedData.onLoaded.RequestSubscription(() => { window.setTimeout(() => { this.UpdateBlocks(); }, 50) });
	}

	OnClose()
	{
		SharedData.onLoaded.RemoveSubscription(this.sub_SharedDataRefresh);
	}

	OnLayoutChange()
	{
		this.viewer_hr_requests.RefreshElementVisibility();
	}
}

PageManager.RegisterPage(new PageMyData('my data'));