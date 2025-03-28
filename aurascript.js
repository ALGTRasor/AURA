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

import { Notification, NotificationLog } from "./modules/notificationlog.js";


import './modules/pages/home.js';
import './modules/pages/settings.js';
import './modules/pages/internal_users.js';
import './modules/pages/external_contacts.js';
import './modules/pages/project_hub.js';
import './modules/pages/task_hub.js';
import './modules/pages/timekeep.js';
import './modules/pages/my_data.js';
import './modules/pages/hr.js';
import './modules/pages/database_probe.js';



async function CheckIdentity()
{
	DebugLog.StartGroup('validating identity');
	DevMode.ValidateDeveloperId(UserAccountInfo.account_info.user_id);
	if (DevMode.active) DebugLog.SubmitGroup('#f0f3');
	else DebugLog.SubmitGroup();
}

async function OnAuraInit()
{
	SetErrorProxy();
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

		let should_restore_layout = UserSettings.GetOptionValue('pagemanager-restore-layout', true);
		if (!should_restore_layout || !PageManager.RestoreCachedLayout()) PageManager.OpenPageByTitle('nav menu');
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

	NotificationLog.Log(new Notification('notification', 'this is a notification', true));

	DebugLog.SubmitGroup('#fff4');

	window.addEventListener('keyup', CheckHotkey);
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
	else if (e.key === 'k') PageManager.TogglePageByTitle('timekeep');
	else if (e.key === 't') PageManager.TogglePageByTitle('task hub');
}




function get_console_proxy_fxn(context, method)
{
	return function ()
	{
		let new_arguments = [].concat(Array.prototype.slice.apply(arguments));
		DebugLog.Log(new_arguments.join(' '));
		method.apply(context, new_arguments);
	}
}

function SetErrorProxy()
{
	console.error = get_console_proxy_fxn(console, console.error);
}

String.prototype.insert = function (index, string)
{
	if (index < 1) return string + this;
	if (index >= this.length) return this + string;
	return this.substring(0, index) + string + this.substring(index, this.length);
};

String.prototype.insertFromEnd = function (index, string)
{
	index = this.length - index;
	if (index < 1) return string + this;
	if (index >= this.length) return this + string;
	return this.substring(0, index) + string + this.substring(index, this.length);
};







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

window.fxn.OpenHomePage = () => { PageManager.OpenPageByTitle('nav menu'); };
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