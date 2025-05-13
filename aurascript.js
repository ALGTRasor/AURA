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

import { DevMode } from "./modules/devmode.js";
import { DebugLog } from "./modules/debuglog.js";
import { Welcome } from "./modules/ui/welcomes.js";
import { UserSettings } from "./modules/usersettings.js";
import { HotkeyDescriptor, Hotkeys } from "./modules/utils/hotkeys.js";

import { GlobalStyling } from "./modules/ui/global_styling.js";
import { NotificationLog } from "./modules/notificationlog.js";
import { OverlayManager } from "./modules/ui/overlays.js";
import { PageManager } from "./modules/pagemanager.js";
import { ActionBar } from "./modules/actionbar.js";
import { AppEvents } from "./modules/appevents.js";
import { DBLayer } from "./modules/dblayer.js";
import { SharedData } from "./modules/datashared.js";
import { DB_SharePoint } from "./modules/sharepoint.js";
import { Fax } from "./modules/fax.js";



import './modules/pages/descriptors/user_dashboard.js';
import './modules/pages/descriptors/help.js';
import './modules/pages/descriptors/home.js';
import './modules/pages/descriptors/settings.js';
import './modules/pages/descriptors/files.js';
import './modules/pages/descriptors/pdf_view.js';
import './modules/pages/descriptors/directory.js';
import './modules/pages/descriptors/internal_users.js';
import './modules/pages/descriptors/external_contacts.js';
import './modules/pages/descriptors/project_hub.js';
import './modules/pages/descriptors/task_hub.js';
import './modules/pages/descriptors/contact_logs.js';
import './modules/pages/descriptors/scratchpad.js';
import './modules/pages/descriptors/timekeep.js';
import './modules/pages/descriptors/hr.js';
import './modules/pages/descriptors/database_probe.js';
import './modules/pages/descriptors/external_links.js';
import './modules/pages/descriptors/demo_panel.js';
import './modules/pages/descriptors/map.js';




function NotifyReauthorizeRequest()
{
	DebugLog.Log('authentication required! auth error status from batch request');
	UserAccountManager.account_provider.logged_in = false; // trigger reauthentication flow
	OverlayManager.ShowConfirmDialog(
		_ => { UserAccountManager.RequestLogin(); },
		_ => { },
		'Account token expired or invalid! Authentication required.',
		'REAUTHENTICATE',
		'IGNORE'
	);
}
AppEvents.onAuthorizationFailure.RequestSubscription(NotifyReauthorizeRequest);





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



function SetContentObscured(enabled = true, label = '...')
{
	window.content_obscured = enabled === true;
	let e_content_obscurer = document.getElementById('content-body-obscurer');
	if (!e_content_obscurer) return;
	e_content_obscurer.style.display = window.content_obscured ? 'block' : 'none';
	if (label) e_content_obscurer.innerText = label;
}
function ToggleContentObscured() { SetContentObscured(window.content_obscured !== true); }

function SetContentFaded(enabled = true)
{
	window.content_faded = enabled === true;

	let e_content_root = document.getElementById('content-root');
	if (!e_content_root) return;

	e_content_root.classList.remove('obscured-light');
	if (window.content_faded === true) e_content_root.classList.add('obscured-light');
}
function ToggleContentFaded() { SetContentFaded(window.content_faded !== true); }


function RegisterHotkeys()
{
	if (!UserAccountInfo.HasAppAccess()) return;

	const hkaction_lightmode = (m, e) => { if (m.none) ToggleLightMode(); };
	const hkinfo_lightmode = { key_description: '~', action_description: 'Toggle Light Mode' };
	Hotkeys.Register(new HotkeyDescriptor('`', hkaction_lightmode, hkinfo_lightmode));

	const hkaction_save = (m, e) => { if (m.ctrl) Autosave.InvokeNow(); };
	const hkinfo_save = { key_description: 'ctrl﹢s', action_description: 'Save Settings' };
	Hotkeys.Register(new HotkeyDescriptor('s', hkaction_save, hkinfo_save));

	const hkaction_debuglog = (m, e) => { if (m.none) ToggleDebugLog(); };
	const hkinfo_debuglog = { action_description: 'Toggle Debug Log', dev_only: true };
	Hotkeys.Register(new HotkeyDescriptor('0', hkaction_debuglog, hkinfo_debuglog));

	PageManager.RegisterHotkeys();
}




async function OnAuraInit()
{
	window.timeout_WindowSizeChange = new RunningTimeout(OnWindowSizeChanged, 0.5, true, 250);
	window.loop_detectWindowSizeChange = new AnimJob(100, CheckWindowSizeChanged);
	window.loop_detectWindowSizeChange.Start();

	window.use_mobile_layout = window.visualViewport.width < window.visualViewport.height;
	window.e_content_root = document.getElementById('content-body');

	let e_action_bar = document.getElementById('action-bar');
	e_action_bar.addEventListener('mouseenter', _ =>
	{
		if (PageManager.pages_being_dragged > 0) return;
		SetContentFaded(true);
	});
	e_action_bar.addEventListener('mouseleave', _ => { SetContentFaded(false); });

	window.e_account_profile_picture = document.getElementById('action-bar-profile-picture');
	window.e_account_profile_picture.style.display = 'none';

	SetErrorProxy();

	NotificationLog.Create();
	NotificationLog.Log('Initializing');

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

	NotificationLog.Log('Loading Settings');
	UserSettings.LoadFromStorage();
	GlobalStyling.Load();

	NotificationLog.Log('Checking Authorization');
	await UserAccountManager.CheckWindowLocationForCodes();
	await UserAccountManager.AttemptAutoLogin();
	ActionBar.UpdateAccountButton();

	if (UserAccountManager.account_provider.logged_in === true && UserAccountInfo.is_alg_account === true)
	{
		DBLayer.config = new DB_SharePoint();
		await DBLayer.Initialize();

		NotificationLog.Log('Downloading User Info');
		await UserAccountInfo.DownloadUserInfo();

		window.e_account_profile_picture.style.display = 'block';

		await CheckIdentity();

		ActionBar.AddMenuButton(
			'settings', 'settings',
			_ => PageManager.OpenPageByTitle('settings'),
			_ => { _.title = 'Configure your local settings and view useful information like available hotkeys or app permissions.'; }
		);

		await AppEvents.onAccountLogin.InvokeAsync();

		if (UserAccountInfo.HasAppAccess())
		{
			ActionBar.AddMenuButton(
				'refresh', 'refresh',
				_ =>
				{
					OverlayManager.ShowConfirmDialog(
						_ => { RequestSharedDataRefresh(); },
						_ => { },
						'Refresh all shared data?<br><br>'
						+ '<span style="opacity:50%;font-size:0.85rem;">This operation may take a few seconds.</span>',
						'[Y]ES',
						'[N]o'
					)
				},
				_ =>
				{
					_.title = 'Refresh all Shared Data.'
						+ '\nShared Data does include all company, client, and employee related data.'
						+ '\nShared Data does not include local app settings.'
						+ '\nRefreshing Shared Data might take several seconds to complete.';
				}
			);
			ActionBar.AddMenuButton('home', 'menu', _ => { if (_.shiftKey === true) PageManager.TogglePageByTitle('nav menu'); else PageManager.CloseAll(); });
		}

		RegisterHotkeys();

		let should_restore_layout = UserAccountInfo.HasAppAccess() && UserSettings.GetOptionValue('pagemanager-restore-layout', true);
		if (!should_restore_layout || !PageManager.RestoreCachedLayout())
		{
			if (UserAccountInfo.HasAppAccess()) PageManager.OpenPageByTitle('nav menu');
			else PageManager.OpenPageByTitle('user dashboard');
		}
		await Fax.RefreshFact();

		NotificationLog.Log('Ready');
		Welcome.ShowWelcomeMessage();

		SetContentObscured(false);
		window.addEventListener('keyup', HandleKeyUp);
	}
	else
	{
		NotificationLog.Log('Login Required');
		SetContentObscured(true, 'Login Required');
		DebugLog.Log('! Login required');
		await AppEvents.onAccountLoginFailed.InvokeAsync();
	}

	GlobalStyling.Apply();

	DebugLog.SubmitGroup('#fff4');
}


function HandleKeyUp(e)
{
	if (OverlayManager.visible && OverlayManager.overlays.length > 0)
	{
		let o = OverlayManager.overlays[OverlayManager.overlays.length - 1];
		if (o && o.handleHotkeys) o.handleHotkeys(e);
	}
	else
	{
		Hotkeys.EvaluateKeyEvent(e);
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
const info_label = document.getElementById('info-bar-marquee');

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

function ToggleDebugLog()
{
	GlobalStyling.showDebugLog.enabled = GlobalStyling.showDebugLog.enabled !== true;
	GlobalStyling.showDebugLog.Apply(true);
};

function ToggleLightMode()
{
	GlobalStyling.lightMode.enabled = GlobalStyling.lightMode.enabled !== true;
	GlobalStyling.lightMode.Apply(true);
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