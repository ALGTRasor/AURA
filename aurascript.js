import "./modules/remotedata.js";
import { SharePoint } from "./modules/sharepoint.js";
import { UserAccountManager } from "./modules/useraccount.js";
import "./modules/usersettings.js";

import { PageHome } from "./modules/pages/page_home.js";
import { PageManager } from "./modules/pagemanager.js";
import { Fax } from "./modules/fax.js";

async function OnAuraInit()
{
	await UserAccountManager.CheckWindowLocationForCodes();

	window.e_content_root = document.getElementById('content-body');

	UserAccountManager.AttemptAutoLogin();

	if (UserAccountManager.access_token_found) 
	{
		document.getElementById('content-body-obscurer').style.display = 'none';
		PageManager.SetPageByTitle("home");
	}
	else
	{
		document.getElementById('content-body-obscurer').style.display = 'block';
		document.getElementById('content-body-obscurer').innerText = 'PLEASE LOG IN';
	}

	await RefreshFact();
}

async function RefreshFact()
{
	let fact = await Fax.GetOne();
	document.getElementById('info-bar-marquee').innerHTML = '<div>' + fact + '</div>';
}

// functions available to events on html elements
window.fxn = {};

window.fxn.AttemptLogin = UserAccountManager.RequestLogin;
window.fxn.ForceLogOut = UserAccountManager.ForceLogOut;

window.fxn.RefreshFact = RefreshFact;

window.fxn.DoTestSPList = async () =>
{
	var list_data = await SharePoint.GetListData('ALGInternal', 'ALGUsers');
	console.info("ALGUsers: " + list_data.value.length);
};
window.fxn.FetchCurrentUserData = UserAccountManager.GetCurrentUserInfo;


console.info("Aura Initializing...");
OnAuraInit();