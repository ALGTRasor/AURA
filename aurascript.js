import "./modules/windowfxn.js";
import "./modules/remotedata.js";
import { SharePoint } from "./modules/sharepoint.js";
import { UserAccountInfo, UserAccountManager } from "./modules/useraccount.js";
import "./modules/usersettings.js";
import "./modules/globaltooltip.js";

import { PageManager } from "./modules/pagemanager.js";
import { Fax } from "./modules/fax.js";
import { DebugLog } from "./modules/debuglog.js";
import { UserSettings } from "./modules/usersettings.js";
import { DevMode } from "./modules/devmode.js";
import { DataSource } from "./modules/datasource.js";
import { SharedData } from "./modules/datashared.js";
import { AppEvents } from "./modules/appevents.js";

import { PageMyData } from "./modules/pages/page_my_data.js";
import { PageHome } from "./modules/pages/page_home.js";


async function CheckIdentity()
{
	DebugLog.StartGroup('validating identity');
	DevMode.ValidateDeveloperId(UserAccountInfo.user_info.user_id);
	if (DevMode.active) DebugLog.SubmitGroup('#f0f3');
	else DebugLog.SubmitGroup();
}

async function OnAuraInit()
{
	UserSettings.LoadFromStorage();
	await UserAccountManager.CheckWindowLocationForCodes();

	window.e_content_root = document.getElementById('content-body');

	await UserAccountManager.AttemptAutoLogin();

	if (UserAccountManager.access_token_found) 
	{
		document.getElementById('content-body-obscurer').style.display = 'none';

		await CheckIdentity();

		await AppEvents.onAccountLogin.InvokeAsync();

		PageManager.OpenPageDirectly(new PageHome());
		PageManager.OpenPageDirectly(new PageMyData());
		PageManager.OpenPageDirectly(new PageMyData());
		PageManager.OpenPageDirectly(new PageMyData());
		await Fax.RefreshFact();
	}
	else
	{
		document.getElementById('content-body-obscurer').style.display = 'block';
		document.getElementById('content-body-obscurer').innerText = 'PLEASE LOG IN';
		DebugLog.Log('! Login required');
		await AppEvents.onAccountLoginFailed.InvokeAsync();
	}

	DebugLog.SubmitGroup('#ff04');
}

const get_grad = (deg, ca, pa, cb, pb) =>
{
	pa = Math.round(pa * 1000.0) * 0.1 - 0.2;
	pb = Math.round(pb * 1000.0) * 0.1;
	return 'linear-gradient(' + deg + 'deg, #' + ca + ' ' + pa + '%, #' + cb + ' ' + pb + '%)';
}
const e_spotlight = document.getElementById('spotlight');
function SpotlightElement(e_target)
{
	if (!e_target) return;

	let e_body_rect = document.body.getBoundingClientRect();
	let body_aspect = e_body_rect.width / e_body_rect.height;
	let e_target_rect = e_target.getBoundingClientRect();

	let tx = e_target_rect.x - e_body_rect.x;
	let ty = e_target_rect.y - e_body_rect.y;

	tx -= document.documentElement.scrollLeft;
	ty -= document.documentElement.scrollTop;

	let xA = tx / e_body_rect.width;
	let xB = ((e_body_rect.width - (tx + e_target_rect.width))) / e_body_rect.width;

	let yA = (e_body_rect.height - ty) / e_body_rect.height;
	let yB = (ty + e_target_rect.height) / e_body_rect.height;

	xA -= 0.01;
	xB -= 0.01;
	yA += 0.01 * body_aspect;
	yB += 0.01 * body_aspect;


	let newbackimage = [
		get_grad(0, 'fff0', yA, '000', yA),
		get_grad(90, '000', xA, 'fff0', xA),
		get_grad(180, 'fff0', yB, '000', yB),
		get_grad(270, '000', xB, 'fff0', xB)
	].join(', ');
	e_spotlight.style.backgroundImage = newbackimage;
}

const info_label = document.getElementById('info-bar-marquee');

// any time the mouse moves while over the page
document.body.addEventListener(
	'mousemove',
	e =>
	{
		let mouse_element = document.elementFromPoint(e.pageX, e.pageY);
		if (mouse_element && mouse_element.title && mouse_element.title.length > 0)
		{
			SpotlightElement(mouse_element);

			window.active_tooltip = mouse_element.title;
			info_label.innerHTML = '<div>' + window.active_tooltip + '</div>';
			e_spotlight.style.transitionDelay = '1s';
			e_spotlight.style.opacity = '50%';
		}
		else
		{
			window.active_tooltip = '';
			info_label.innerHTML = '<div>' + Fax.current_fact + '</div>';
			e_spotlight.style.transitionDelay = '0.2s';
			e_spotlight.style.opacity = '0%';
		}
	}
);

const e_tgl_lightmode = document.getElementById('action-bar-btn-lightmode');

window.fxn.ToggleLightMode = () =>
{
	let prevVal = document.documentElement.style.getPropertyValue('--theme-invert');
	let is_light_mode = prevVal ? (prevVal < 1.0) : true;
	document.documentElement.style.setProperty('--theme-invert', is_light_mode ? 1.0 : 0.0);

	if (is_light_mode)
		e_tgl_lightmode.innerHTML = "Light Mode<i class='material-symbols icon'>light_mode</i>";
	else
		e_tgl_lightmode.innerHTML = "Dark Mode<i class='material-symbols icon'>dark_mode</i>";
}

window.fxn.OpenHomePage = () =>
{
	PageManager.OpenPageDirectly(new PageHome());
};


window.fxn.DoTestSPList = async () =>
{
	var list_data = await DataSource.ALGUsers.GetData();
	DebugLog.Log("ALGUsers: " + list_data.value.length);
};
window.fxn.RefreshManual = async () =>
{
	DebugLog.StartGroup('manual refresh');
	await UserAccountInfo.GetCurrentUserInfo();
	await CheckIdentity();
	await SharedData.LoadData(false);
	DebugLog.SubmitGroup("#f808");
}

OnAuraInit();