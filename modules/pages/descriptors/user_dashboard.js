import { addElement, CreatePagePanel, FadeElement } from "../../utils/domutils.js";
import { DebugLog } from "../../debuglog.js";
import { PageManager } from "../../pagemanager.js";
import { PageDescriptor } from "../pagebase.js";

import { SlideSelector } from "../../ui/slide_selector.js";
import { PanelContent } from "../../ui/panel_content.js";
import { RecordViewer } from "../../ui/recordviewer.js";
import { RecordFormUtils } from "../../ui/recordform.js";

import { FileExplorer } from "../../ui/file_explorer.js";

import { AccountUser } from "../../datamodels/account_user.js";
import { InternalUser } from "../../datamodels/internal_user.js";
import { UserAccountInfo } from "../../useraccount.js";
import { HrRequest } from "../../datamodels/hr_request.js";
import { Help } from "./help.js";





export class UserDashboardInfo extends PanelContent
{
	OnCreateElements()
	{
		this.e_root = CreatePagePanel(this.e_parent, true, false);
		//this.e_info_title = CreatePagePanel(this.e_root, false, false, 'text-align:center;opacity:60%;', _ => _.innerText = 'Account Info');


	}

	OnRefreshElements()
	{
		if (this.e_info_record_list) this.e_info_record_list.remove();
		this.e_info_record_list = RecordFormUtils.CreateRecordInfoList(this.e_root, UserAccountInfo.user_info, InternalUser.data_model.field_descs);
		//RecordFormUtils.CreateRecordInfoList(this.e_root, UserAccountInfo.account_info, AccountUser.data_model.field_descs);
	}

	OnRemoveElements()
	{
		this.e_root.remove();
	}
}

export class UserDashboardHr extends PanelContent
{
	OnCreateElements()
	{
		this.e_root = CreatePagePanel(this.e_parent, true, false);
		//this.e_info_title = CreatePagePanel(this.e_root, false, false, 'text-align:center;opacity:60%;', _ => _.innerText = 'HR Info');
		this.viewer_hr_requests = new RecordViewer();
	}
	OnRefreshElements()
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
		this.viewer_hr_requests.SetViewBuilder(records => this.BuildRecordView_HrReqs(this.page_instance, records));
		this.viewer_hr_requests.SetData(UserAccountInfo.hr_info.requests);
		this.viewer_hr_requests.CreateElements(this.e_root);
	}
	OnRemoveElements()
	{
		this.e_root.remove();
	}

	BuildRecordView_HrReqs(instance, records = [])
	{
		if (!records || records.length < 1) return;

		for (let id in records)
		{
			let record = records[id];
			let e_info_root = CreatePagePanel(this.viewer_hr_requests.e_view_root, false, false, 'min-width:20vw;', e => { });
			addElement(e_info_root, 'div', '', 'text-align:center;', x => { x.innerText = record.request_name; });
			let e_info_body = CreatePagePanel(e_info_root, true, false, '', x => { });
			RecordFormUtils.CreateRecordInfoList(e_info_body, record, HrRequest.data_model.field_descs, 'info', records.length < 2);
		}
	}
}

export class UserDashboardDocs extends PanelContent
{
	OnCreateElements()
	{
		this.e_root = CreatePagePanel(this.e_parent, true, false);
		//this.e_info_title = CreatePagePanel(this.e_root, false, false, 'text-align:center;opacity:60%;', _ => _.innerText = 'Documents');

		this.explorer = new FileExplorer(this.e_root, 'ALGInternal', 'ALGFileLibrary');
		this.explorer.base_relative_path = 'ALGUserDocs/HR/' + UserAccountInfo.account_info.user_id;
		this.explorer.show_folder_actions = false;
		this.explorer.show_navigation_bar = false;
		this.explorer.CreateElements();
	}
	OnRefreshElements()
	{
	}
	OnRemoveElements()
	{
		this.e_root.remove();
	}
}












export class PageMyData extends PageDescriptor
{
	title = 'my data';
	icon = 'person';
	order_index = 5;

	OnCreateElements(instance)
	{
		if (!instance) return;

		instance.sub_SharedDataRefresh = {};
		instance.sub_modeChange = {};

		instance.e_frame.style.minWidth = '32rem';

		let mode_slider = new SlideSelector();
		instance.mode_slider = mode_slider;

		const modes = [
			{ label: 'INFO', on_click: _ => { } },
			{ label: 'DOCUMENTS', on_click: _ => { } },
			{ label: 'HR', on_click: _ => { } }
		];
		mode_slider.CreateElements(instance.e_content, modes);
		mode_slider.e_root.style.flexBasis = 'fit-content';
		mode_slider.e_root.style.flexShrink = '0.0';
		mode_slider.e_root.style.flexGrow = '0.0';

		const instance_content_root = instance.e_content;
		instance.content_info = new UserDashboardInfo(instance_content_root);
		instance.content_docs = new UserDashboardDocs(instance_content_root);
		instance.content_hr = new UserDashboardHr(instance_content_root);
		instance.content_hr.page_instance = instance;

		const _afterModeChange = () => { this.AfterModeChange(instance); };
		instance.sub_modeChange = mode_slider.afterSelectionChanged.RequestSubscription(_afterModeChange);

		mode_slider.SelectIndexAfterDelay(0, 333, true);
	}

	AfterModeChange(instance)
	{
		instance.mode_slider.SetDisabled(true);

		let selected_index = -1;
		selected_index = instance.mode_slider.selected_index;
		if (typeof selected_index !== 'number') selected_index = Number.parseInt(selected_index);

		if (selected_index < 0)
		{
			instance.mode_slider.SetDisabled(false);
			return;
		}

		instance.content_previous = instance.content_current;
		switch (selected_index)
		{
			case 0: instance.content_current = instance.content_info; break;
			case 1: instance.content_current = instance.content_docs; break;
			case 2: instance.content_current = instance.content_hr; break;
		}



		instance.mode_slider.SetDisabled(false);

		const prev = instance.content_previous;
		const curr = instance.content_current;

		const fade_prev = async () =>
		{
			if (prev) await FadeElement(prev.e_root, 100, 0);
		};

		const fade_next = async () =>
		{
			if (curr) await FadeElement(curr.e_root, 0, 100);
		};

		fade_prev().then(
			_ =>
			{
				if (prev) prev.RemoveElements();
				if (curr)
				{
					curr.CreateElements();
					curr.RefreshElements();
				}
			}
		).then(fade_next);
	}

	RemoveAccountInfoBlock(instance)
	{
		if (instance.e_account_info) instance.e_account_info.remove();
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

		instance.content_hr.viewer_hr_requests.CreateElements(instance.e_hr);
		this.UpdateHrBlock(instance);

		instance.e_content.appendChild(instance.e_hr);

	}

	UpdateHrBlock(instance)
	{
		instance.content_hr.viewer_hr_requests.RemoveElements();
		const sort = (x, y) =>
		{
			if (x.request_name < y.request_name) return -1;
			if (x.request_name > y.request_name) return 1;
			return 0;
		};
		instance.content_hr.viewer_hr_requests.SetListItemSorter(sort);
		instance.content_hr.viewer_hr_requests.SetListItemBuilder((table, x, e) => { addElement(e, 'span', '', '', c => { c.innerText = table[x].request_name }); });
		instance.content_hr.viewer_hr_requests.SetViewBuilder(records => this.BuildRecordView_HrReqs(instance, records));
		instance.content_hr.viewer_hr_requests.SetData(UserAccountInfo.hr_info.requests);
		instance.content_hr.viewer_hr_requests.CreateElements(instance.e_hr);
	}

	UpdateBlocks(instance)
	{
		instance.content_info.RefreshElements();
		instance.content_docs.RefreshElements();
		instance.content_hr.RefreshElements();
		return;

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
			let e_info_root = CreatePagePanel(instance.content_hr.viewer_hr_requests.e_view_root, false, false, 'min-width:20vw;', e => { });
			addElement(e_info_root, 'div', '', 'text-align:center;', x => { x.innerText = record.request_name; });
			let e_info_body = CreatePagePanel(e_info_root, true, false, '', x => { });
			RecordFormUtils.CreateRecordInfoList(e_info_body, record, HrRequest.data_model.field_descs, 'info', records.length < 2);
		}
	}

	OnOpen(instance)
	{
		instance.sub_SharedDataRefresh = window.SharedData.onLoaded.RequestSubscription(() => { window.setTimeout(() => { this.UpdateBlocks(instance); }, 50) });
	}

	OnClose(instance)
	{
		window.SharedData.onLoaded.RemoveSubscription(instance.sub_SharedDataRefresh);
	}

	UpdateSize(instance)
	{
		instance.UpdateBodyTransform();
		this.OnLayoutChange(instance);
	}

	OnLayoutChange(instance)
	{
		if (instance.state_data.docked === true && instance.state_data.expanding === false) instance.e_frame.style.maxWidth = '36rem';
		else instance.e_frame.style.maxWidth = 'unset';

		window.setTimeout(
			() =>
			{
				instance.mode_slider.ApplySelection();
				if (instance.content_current) instance.content_current.RefreshElements();
				if (instance.content_hr.viewer_hr_requests) instance.content_hr.viewer_hr_requests.RefreshElementVisibility();
			},
			250
		);
	}
}

PageManager.RegisterPage(new PageMyData('my data', UserAccountInfo.app_access_permission, 'person', 'View and manage your own contact and work related information.'), 'm', 'My Data');
Help.Register(
	'pages.my data', 'My Data',
	'The My Data page allows Users to view and manage their own employee information.'
	+ '\nUsers can find a list of pending requests from HR and their document upload history in My Data.'
);