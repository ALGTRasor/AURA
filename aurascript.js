import "./modules/windowfxn.js";
import "./modules/remotedata.js";
import { UserAccountInfo, UserAccountManager } from "./modules/useraccount.js";
import "./modules/usersettings.js";
import "./modules/globaltooltip.js";
import "./modules/notificationlog.js";

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
import { PageHR } from "./modules/pages/page_hr.js";
import { PageSettings } from "./modules/pages/page_settings.js";
import { Notification, NotificationLog } from "./modules/notificationlog.js";


async function CheckIdentity()
{
	DebugLog.StartGroup('validating identity');
	DevMode.ValidateDeveloperId(UserAccountInfo.account_info.user_id);
	if (DevMode.active) DebugLog.SubmitGroup('#f0f3');
	else DebugLog.SubmitGroup();
}

async function OnAuraInit()
{
	UserSettings.HookOptionEvents();

	UserSettings.LoadFromStorage();
	await UserAccountManager.CheckWindowLocationForCodes();

	window.e_content_root = document.getElementById('content-body');

	await UserAccountManager.AttemptAutoLogin();

	if (UserAccountManager.account_provider.logged_in) 
	{
		document.getElementById('content-body-obscurer').style.display = 'none';

		await CheckIdentity();

		await AppEvents.onAccountLogin.InvokeAsync();

		PageManager.OpenPageByTitle('nav menu');
		await Fax.RefreshFact();
	}
	else
	{
		document.getElementById('content-body-obscurer').style.display = 'block';
		document.getElementById('content-body-obscurer').innerText = 'PLEASE LOG IN';
		DebugLog.Log('! Login required');
		await AppEvents.onAccountLoginFailed.InvokeAsync();
	}

	UserSettings.UpdateOptionEffects();

	let stacked = new Notification('hello A', 'there X', true);
	let diffA = new Notification('hello B', 'there Y', true);
	let diffB = new Notification('hello C', 'there Z', true);
	NotificationLog.Log(stacked);
	NotificationLog.Log(stacked);
	NotificationLog.Log(stacked);
	NotificationLog.Log(diffA);
	NotificationLog.Log(diffB);
	NotificationLog.Log(diffB);
	NotificationLog.Log(diffA);
	NotificationLog.Log(diffB);

	DebugLog.SubmitGroup('#fff4');
}

function CheckHotkey(e)
{
	if (e.key === 's') PageManager.TogglePageByTitle('settings');
	else if (e.key === 'n') PageManager.TogglePageByTitle('nav menu');
	else if (e.key === 'm') PageManager.TogglePageByTitle('my data');
	else if (e.key === 'h') PageManager.TogglePageByTitle('hr');
	else if (e.key === 'i') PageManager.TogglePageByTitle('internal users');
	else if (e.key === 'o') PageManager.TogglePageByTitle('external contacts');
	else if (e.key === 'p') PageManager.TogglePageByTitle('project hub');
	else if (e.key === 't') PageManager.TogglePageByTitle('task hub');
}
window.addEventListener('keydown', CheckHotkey);

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

function RefreshGlobalTooltip(e)
{
	let mouse_element = document.elementFromPoint(e.pageX, e.pageY);
	if (mouse_element && mouse_element.title && mouse_element.title.length > 0)
	{
		SpotlightElement(mouse_element);

		window.active_tooltip = mouse_element.title;
		info_label.innerHTML = '<div>' + window.active_tooltip + '</div>';
		e_spotlight.style.transitionDelay = '1s';
		e_spotlight.style.transitionDuration = '0.15s';
		e_spotlight.style.opacity = '50%';
	}
	else
	{
		window.active_tooltip = '';
		info_label.innerHTML = '<div>' + Fax.current_fact + '</div>';
		e_spotlight.style.transitionDelay = '0.3s';
		e_spotlight.style.transitionDuration = '0.1s';
		e_spotlight.style.opacity = '0%';
	}
}

// any time the mouse moves while over the page
document.body.addEventListener('mousemove', RefreshGlobalTooltip);
document.body.addEventListener('mouseout', RefreshGlobalTooltip);
document.body.addEventListener('mouseup', e => { window.setTimeout(() => { RefreshGlobalTooltip(e); }, 50); });
document.body.addEventListener('scroll', RefreshGlobalTooltip);

window.fxn.ToggleLightMode = () =>
{
	const option_id = 'light-mode';
	UserSettings.SetOptionValue(option_id, !UserSettings.GetOptionValue(option_id));
	UserSettings.UpdateLightMode();
};

window.fxn.OpenHomePage = () =>
{
	PageManager.OpenPageDirectly(new PageHome());
};

window.fxn.OpenPageById = (page_id) => { return PageManager.OpenPageByTitle(page_id); };


window.fxn.RefreshManual = async () =>
{
	DebugLog.StartGroup('manual refresh');
	await UserAccountManager.account_provider.DownloadAccountData();
	await CheckIdentity();
	await SharedData.LoadData(false);
	DebugLog.SubmitGroup("#f808");
}

OnAuraInit();