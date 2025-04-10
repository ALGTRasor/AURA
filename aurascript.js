import "./modules/windowfxn.js";
import "./modules/remotedata.js";
import { UserAccountInfo, UserAccountManager } from "./modules/useraccount.js";
import "./modules/usersettings.js";
import "./modules/globaltooltip.js";
import "./modules/notificationlog.js";

import { Timers } from "./modules/timers.js";
import { AnimJob } from "./modules/AnimJob.js";
import { Autosave } from "./modules/autosave.js";
import { RunningTimeout } from "./modules/utils/running_timeout.js";
import { Notification, NotificationLog } from "./modules/notificationlog.js";
import { DevMode } from "./modules/devmode.js";
import { DebugLog } from "./modules/debuglog.js";
import { ActionBar } from "./modules/actionbar.js";
import { PageManager } from "./modules/pagemanager.js";
import { OverlayManager } from "./modules/ui/overlays.js";
import { UserSettings } from "./modules/usersettings.js";
import { AppEvents } from "./modules/appevents.js";
import { SharedData } from "./modules/datashared.js";
import { SharePoint } from "./modules/sharepoint.js";
import { Fax } from "./modules/fax.js";



import './modules/pages/onboarding.js';
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
import './modules/pages/external_links.js';
import './modules/pages/demo_panel.js';
import './modules/pages/map.js';
import { Welcome } from "./modules/ui/welcomes.js";




function CheckWindowSizeChanged()
{
	let changedW = window.lastViewportW !== window.visualViewport.width;
	let changedH = window.lastViewportH !== window.visualViewport.height;
	let changed = changedW || changedH;

	if (changed)
	{
		window.lastViewportW = window.visualViewport.width;
		window.lastViewportH = window.visualViewport.height;
		if (window.timeout_WindowSizeChange) window.timeout_WindowSizeChange.ExtendTimer();
	}
}

function OnWindowSizeChanged() { PageManager.onLayoutChange.Invoke(); }

async function OnAuraInit()
{
	window.timeout_WindowSizeChange = new RunningTimeout(OnWindowSizeChanged, 0.5, true, 250);
	window.loop_detectWindowSizeChange = new AnimJob(100, CheckWindowSizeChanged);
	window.loop_detectWindowSizeChange.Start();

	window.use_mobile_layout = window.visualViewport.width < window.visualViewport.height;
	window.e_content_root = document.getElementById('content-body');
	let e_content_obscurer = document.getElementById('content-body-obscurer');

	window.e_account_profile_picture = document.getElementById('action-bar-profile-picture');
	window.e_account_profile_picture.style.display = 'none';

	SetErrorProxy();

	window.args = {};
	let q = window.location.search.substring(1).split('&');
	for (let x in q)
	{
		let str = q[x];
		let id_eq = str.indexOf('=');
		let k = str.substring(0, id_eq);
		let v = str.substring(id_eq + 1);
		window.args[k] = v;
	}

	const sdanger = { user_id: 's.danger', display_name: 'Stranger Danger', mail: 's.danger@evil.corp' };
	window.spoof_data = {};
	if ('spoof-id' in window.args)
	{
		let spoof_id = window.args['spoof-id'];
		if (spoof_id === 's.danger') window.spoof_data = sdanger;
		else window.spoof_data.user_id = spoof_id;
	}
	if ('spoof-name' in window.args) window.spoof_data.display_name = window.args['spoof-name'];
	if ('spoof-mail' in window.args) window.spoof_data.mail = window.args['spoof-mail'];
	//window.spoof_data = sdanger;

	UserSettings.HookOptionEvents();
	UserSettings.LoadFromStorage();

	await UserAccountManager.CheckWindowLocationForCodes();
	await UserAccountManager.AttemptAutoLogin();
	ActionBar.UpdateAccountButton();

	if (UserAccountManager.account_provider.logged_in === true && UserAccountInfo.is_alg_account === true)
	{
		await UserAccountInfo.DownloadUserInfo();

		window.e_account_profile_picture.style.display = 'block';

		SharePoint.StartProcessingQueue();
		await CheckIdentity();

		ActionBar.AddMenuButton('settings', 'settings', _ => PageManager.OpenPageByTitle('settings'));
		if (UserAccountInfo.aura_access === true)
		{
			ActionBar.AddMenuButton('refresh', 'refresh', _ =>
			{
				OverlayManager.ShowConfirmDialog(
					_ => { RequestSharedDataRefresh(); },
					_ => { },
					'Refresh all shared data?<br><br>'
					+ '<span style="opacity:50%;font-size:0.85rem;">This operation may take a few seconds.</span>',
					'[Y]ES',
					'[N]o'
				)
			});
			ActionBar.AddMenuButton('nav menu', 'menu', _ => PageManager.OpenPageByTitle('nav menu'));
		}
		await AppEvents.onAccountLogin.InvokeAsync();

		let should_restore_layout = UserAccountInfo.aura_access && UserSettings.GetOptionValue('pagemanager-restore-layout', true);
		if (!should_restore_layout || !PageManager.RestoreCachedLayout())
		{
			if (UserAccountInfo.aura_access === true) PageManager.OpenPageByTitle('nav menu');
			else PageManager.OpenPageByTitle('onboarding');
		}
		await Fax.RefreshFact();

		NotificationLog.Create();

		e_content_obscurer.style.display = 'none';
		window.addEventListener('keyup', CheckHotkey);
	}
	else
	{
		e_content_obscurer.style.display = 'block';
		e_content_obscurer.innerText = 'nothing to see';
		DebugLog.Log('! Login required');
		await AppEvents.onAccountLoginFailed.InvokeAsync();
	}

	UserSettings.UpdateOptionEffects();
	Welcome.ShowWelcomeMessage();

	DebugLog.SubmitGroup('#fff4');
}

function CheckHotkey(e)
{
	if (OverlayManager.visible && OverlayManager.overlays.length > 0)
	{
		let o = OverlayManager.overlays[OverlayManager.overlays.length - 1];
		if (o && o.handleHotkeys) o.handleHotkeys(e);
		return;
	}

	let anyModifier = e.ctrlKey || e.altKey || e.shiftKey;
	let allModifiers = e.ctrlKey && e.altKey && e.shiftKey;
	let someModifiers = anyModifier && !allModifiers;
	let ctrlShift = someModifiers && e.ctrlKey && e.shiftKey;
	let ctrlAlt = someModifiers && e.ctrlKey && e.altKey;
	let shiftAlt = someModifiers && e.shiftKey && e.altKey;

	if (anyModifier)
	{
		if (e.key === 's')
		{
			NotificationLog.Log(new Notification('save triggered', 'save triggered', true, '#0ff', '#0ff'));
			Autosave.InvokeSoon();
		}
	}
	else
	{
		if (e.key === 's') PageManager.TogglePageByTitle('settings');
		else if (e.key === 'n') PageManager.TogglePageByTitle('nav menu');
		else if (e.key === 'm') PageManager.TogglePageByTitle('my data');
		else if (e.key === 'h') PageManager.TogglePageByTitle('hr');
		else if (e.key === 'i') PageManager.TogglePageByTitle('internal users');
		else if (e.key === 'e') PageManager.TogglePageByTitle('external contacts');
		else if (e.key === 'p') PageManager.TogglePageByTitle('project hub');
		else if (e.key === 'k') PageManager.TogglePageByTitle('timekeep');
		else if (e.key === 't') PageManager.TogglePageByTitle('task hub');
		else if (e.key === '`') ToggleLightMode();
	}
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

function SetErrorProxy() { console.error = get_console_proxy_fxn(console, console.error); }

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

function ToggleLightMode()
{
	const option_id = 'light-mode';
	UserSettings.SetOptionValue(option_id, !UserSettings.GetOptionValue(option_id));
	UserSettings.UpdateLightMode();
};

async function CheckIdentity()
{
	DebugLog.StartGroup('validating identity');
	DevMode.ValidateDeveloperId(UserAccountInfo.account_info.user_id);
	if (DevMode.active === true) DebugLog.SubmitGroup('#f0f3');
	else DebugLog.SubmitGroup();
}

async function RequestSharedDataRefresh()
{
	DebugLog.StartGroup('manual refresh');
	await UserAccountManager.account_provider.DownloadAccountData();
	await CheckIdentity();
	await SharedData.LoadData(false);
	DebugLog.SubmitGroup("#f808");

	const timer_shareddataload = 'shared data load';
	let load_delta_str = Timers.GetElapsed(timer_shareddataload) + 'ms';

	let o = OverlayManager.ShowChoiceDialog('Shared Data Refreshed in ' + load_delta_str, [OverlayManager.OkayChoice()]);
	o.dismissable = true;
}




//(() => { (() => { (() => { (() => { OnAuraInit(); })(); })(); })(); })();
OnAuraInit();