import { AccountUser } from "../datamodels/account_user.js";
import { DataFieldDesc } from "../datamodels/datafield_desc.js";
import { InternalUser } from "../datamodels/internal_user.js";
import { SharedData } from "../datashared.js";
import { DebugLog } from "../debuglog.js";
import { PageManager } from "../pagemanager.js";
import { RecordFormUtils } from "../ui/recordform.js";
import { UserAccountInfo } from "../useraccount.js";
import { PageBase } from "./pagebase.js";


export class PageMyData extends PageBase
{
	GetTitle() { return 'my data'; }
	CreateElements(parent)
	{
		if (!parent) return;

		this.sub_SharedDataRefresh = {};

		this.icon = 'person';

		this.CreateBody();
		this.e_body.style.minWidth = '600px';

		this.e_content.style.flexWrap = 'wrap';
		this.e_content.style.flexDirection = 'row';

		this.CreateAccountInfoBlock();
		this.CreateUserInfoBlock();

		this.FinalizeBody(parent);

		this.UpdateBlocks();
	}

	CreateAccountInfoBlock()
	{
		this.e_account_info = document.createElement('div');
		this.e_account_info.className = 'page-content-root-block';
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
		this.e_user_info.style.minWidth = '24rem';

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

	UpdateBlocks()
	{
		this.UpdateAccountInfoBlock();
		DebugLog.Log('...updated account info block');
		this.UpdateUserInfoBlock();
		DebugLog.Log('...updated user info block');
	}

	OnOpen()
	{
		this.sub_SharedDataRefresh = SharedData.onLoaded.RequestSubscription(() => { window.setTimeout(() => { this.UpdateBlocks(); }, 50) });
	}

	OnClose()
	{
		SharedData.onLoaded.RemoveSubscription(this.sub_SharedDataRefresh);
	}
}

PageManager.RegisterPage(new PageMyData('my data'));