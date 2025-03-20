import "./modules/remotedata.js";
import { SharePoint } from "./modules/sharepoint.js";
import { UserAccountManager } from "./modules/useraccount.js";
import "./modules/usersettings.js";

async function OnAuraInit()
{
	await UserAccountManager.CheckWindowLocationForCodes();

	window.e_content_root = document.getElementById('content-body');

	UserAccountManager.AttemptAutoLogin();
}

// functions available to events on html elements
window.fxn = {};

window.fxn.AttemptLogin = UserAccountManager.RequestLogin;

window.fxn.DoTestSPList = async () =>
{
	var list_data = await SharePoint.GetListData('ALGInternal', 'ALGUsers');
	console.info("ALGUsers: " + list_data.value.length);
};
window.fxn.FetchCurrentUserData = UserAccountManager.GetCurrentUserInfo;


console.warn("Aura Initializing...");
OnAuraInit();