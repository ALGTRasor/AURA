// object which holds functions available to callbacks from html elements
if (!window.fxn) window.fxn = {};


import "./modules/remotedata.js";
import { SharePoint } from "./modules/sharepoint.js";
import { UserAccountInfo, UserAccountManager } from "./modules/useraccount.js";
import "./modules/usersettings.js";

import { PageHome } from "./modules/pages/page_home.js";
import { PageManager } from "./modules/pagemanager.js";
import { Fax } from "./modules/fax.js";
import { DebugLog } from "./modules/debuglog.js";
import { UserSettings } from "./modules/usersettings.js";
import { DevMode } from "./modules/devmode.js";


async function OnAuraInit()
{
	await UserAccountManager.CheckWindowLocationForCodes();

	UserSettings.LoadFromStorage();

	window.e_content_root = document.getElementById('content-body');
	DebugLog.Create();
	DebugLog.Hide();

	DebugLog.Log("Aura Initializing...");

	await UserAccountManager.AttemptAutoLogin();

	if (UserAccountManager.access_token_found) 
	{
		document.getElementById('content-body-obscurer').style.display = 'none';

		DebugLog.StartGroup('checking identity');
		DevMode.ValidateDeveloperId(UserAccountInfo.user_info.user_id);
		DebugLog.SubmitGroup();

		PageManager.SetPageByTitle("home");
	}
	else
	{
		document.getElementById('content-body-obscurer').style.display = 'block';
		document.getElementById('content-body-obscurer').innerText = 'PLEASE LOG IN';
		DebugLog.Log('! Login required');
	}

	await Fax.RefreshFact();
}


window.fxn.DoTestSPList = async () =>
{
	var list_data = await SharePoint.GetListData('ALGInternal', 'ALGUsers');
	DebugLog.Log("ALGUsers: " + list_data.value.length);
};
window.fxn.FetchCurrentUserData = UserAccountManager.GetCurrentUserInfo;

OnAuraInit();