import { AccountUser } from "../../datamodels/account_user.js";
import { DataFieldDesc } from "../../datamodels/datafield_desc.js";
import { HrRequest } from "../../datamodels/hr_request.js";
import { InternalUser } from "../../datamodels/internal_user.js";
import { SharedData } from "../../datashared.js";
import { DebugLog } from "../../debuglog.js";
import { PageManager } from "../../pagemanager.js";
import { RecordFormUtils } from "../../ui/recordform.js";
import { UserAccountInfo } from "../../useraccount.js";
import { PageDescriptor } from "../pagebase.js";

import { RecordViewer } from "../../ui/recordviewer.js";
import { addElement, CreatePagePanel } from "../../domutils.js";


export class PageMyData extends PageDescriptor
{
	GetTitle() { return 'user dashboard'; }
	GetIcon() { return 'person'; }
	OnCreateElements(instance)
	{
		if (!instance) return;

		instance.sub_SharedDataRefresh = {};

		instance.e_frame.style.minWidth = '32rem';

		instance.e_content.style.flexWrap = 'wrap';
		instance.e_content.style.flexDirection = 'row';

		instance.viewer_hr_requests = new RecordViewer();

		this.CreateAccountInfoBlock(instance);
		this.CreateUserInfoBlock(instance);
		this.CreateHrBlock(instance);
		this.UpdateBlocks(instance);
	}

	CreateAccountInfoBlock(instance)
	{
		instance.e_account_info = CreatePagePanel(instance.e_content, true, false, '', e => { });
		instance.e_account_info.style.minWidth = '20rem';
		this.UpdateAccountInfoBlock(instance);
	}
	UpdateAccountInfoBlock(instance)
	{
		instance.e_account_info.innerHTML = `<div style='text-align:center;opacity:60%;'>Account Info</div>`;
		RecordFormUtils.CreateRecordInfoList(instance.e_account_info, UserAccountInfo.account_info, AccountUser.data_model.field_descs);
	}

	CreateUserInfoBlock(instance)
	{
		instance.e_user_info = CreatePagePanel(instance.e_content, true, false, '', e => { });
		instance.e_user_info.style.minWidth = '20rem';

		this.UpdateUserInfoBlock(instance);
		instance.e_content.appendChild(instance.e_user_info);
	}

	UpdateUserInfoBlock(instance)
	{
		if (UserAccountInfo.user_info)
		{
			instance.e_user_info.innerHTML = `<div style='text-align:center;opacity:60%;'>User Info</div>`;
			RecordFormUtils.CreateRecordInfoList(instance.e_user_info, UserAccountInfo.user_info, InternalUser.data_model.field_descs);
		}
		else
		{
			let div_title = `<div style='text-align:center;opacity:60%;'>User Info</div>`;
			instance.e_user_info.innerHTML = div_title + `<div style='color:red;font-size:125%;font-weight:bold;'>USER INFO MISSING</div>`;
		}
	}

	CreateHrBlock(instance)
	{
		instance.e_hr = CreatePagePanel(instance.e_content, true, true, '', e => { });
		instance.e_hr.style.minWidth = '80%';
		instance.e_hr.style.minHeight = '36rem';

		instance.viewer_hr_requests.CreateElements(instance.e_hr);
		this.UpdateHrBlock(instance);

		instance.e_content.appendChild(instance.e_hr);

	}

	UpdateHrBlock(instance)
	{
		instance.viewer_hr_requests.RemoveElements();
		const sort = (x, y) =>
		{
			if (x.request_name < y.request_name) return -1;
			if (x.request_name > y.request_name) return 1;
			return 0;
		};
		instance.viewer_hr_requests.SetListItemSorter(sort);
		instance.viewer_hr_requests.SetListItemBuilder((table, x, e) => { addElement(e, 'span', '', '', c => { c.innerText = table[x].request_name }); });
		instance.viewer_hr_requests.SetViewBuilder(records => this.BuildRecordView_HrReqs(instance, records));
		instance.viewer_hr_requests.SetData(UserAccountInfo.hr_info.requests);
		instance.viewer_hr_requests.CreateElements(instance.e_hr);
	}

	UpdateBlocks(instance)
	{
		this.UpdateAccountInfoBlock(instance);
		DebugLog.Log('...updated account info block');
		this.UpdateUserInfoBlock(instance);
		DebugLog.Log('...updated user info block');
		this.UpdateHrBlock(instance);
		DebugLog.Log('...updated hr info block');
	}

	BuildRecordView_HrReqs(instance, records = [])
	{
		if (!records || records.length < 1) return;

		for (let id in records)
		{
			let record = records[id];
			let e_info_root = CreatePagePanel(instance.viewer_hr_requests.e_view_root, false, false, 'min-width:20vw;', e => { });
			addElement(e_info_root, 'div', '', 'text-align:center;', x => { x.innerText = record.request_name; });
			let e_info_body = CreatePagePanel(e_info_root, true, false, '', x => { });
			RecordFormUtils.CreateRecordInfoList(e_info_body, record, HrRequest.data_model.field_descs, 'info', records.length < 2);
		}
	}

	OnOpen(instance)
	{
		instance.sub_SharedDataRefresh = SharedData.onLoaded.RequestSubscription(() => { window.setTimeout(() => { this.UpdateBlocks(instance); }, 50) });
	}

	OnClose(instance)
	{
		SharedData.onLoaded.RemoveSubscription(instance.sub_SharedDataRefresh);
	}

	OnLayoutChange(instance)
	{
		instance.viewer_hr_requests.RefreshElementVisibility();
	}
}

PageManager.RegisterPage(new PageMyData('user dashboard', 'aura.access'));