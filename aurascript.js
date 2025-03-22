import "./modules/windowfxn.js";
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
import { SharePointDataSource } from "./modules/sharepointdatasource.js";


async function CheckIdentity()
{
	DebugLog.StartGroup('validating identity');
	DevMode.ValidateDeveloperId(UserAccountInfo.user_info.user_id);
	if (DevMode.active) DebugLog.SubmitGroup('#f0f3');
	else DebugLog.SubmitGroup();
}

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

		CheckIdentity();

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
	var list_data = await SharePointDataSource.ALGUsers.GetData();
	DebugLog.Log("ALGUsers: " + list_data.value.length);
};
window.fxn.GetCurrentUserInfo = async () =>
{
	await UserAccountInfo.GetCurrentUserInfo();
	CheckIdentity();
}

OnAuraInit();