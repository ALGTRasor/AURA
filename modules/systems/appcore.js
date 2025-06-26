import "../useraccount.js";
import "../utils/datastates.js";

import { UserAccountInfo } from "../useraccount.js";
import { AccountStateManager } from "./accountstatemanager.js";
import { HotkeyDescriptor, Hotkeys } from "../utils/hotkeys.js";
import { ChoiceOverlay } from "../ui/overlays/overlay_choice.js";
import { RunningTimeout } from "../utils/running_timeout.js";
import { NotificationLog } from "../notificationlog.js";
import { GlobalStyling } from "../ui/global_styling.js";
import { OverlayManager } from "../ui/overlay_manager.js";
import { UserSettings } from "../usersettings.js";
import { addElement } from "../utils/domutils.js";
import { PageManager } from "../pagemanager.js";
import { ActionBar } from "../ui/actionbar.js";
import { AppEvents } from "../appevents.js";
import { Welcome } from "./welcomes.js";
import { Autosave } from "../autosave.js";
import { DebugLog } from "../debuglog.js";
import { AppStrap } from "./appstrap.js";
import { DevMode } from "./devmode.js";
import { AnimJob } from "../AnimJob.js";
import { LongOps } from "./longops.js";
import { MegaTips } from "./megatips.js";
import { AppStats } from "./appstats.js";
import { Fax } from "./fax.js";
import { AppInput } from "./appinput.js";
import { Spotlight } from "../ui/spotlight.js";
import { MobileMode } from "./mobile_mode.js";

export class AppCore extends EventTarget
{
	static IsLoadedInFrame() { return window.top !== window.self; }

	static async Initialize()
	{
		AppCore.#InitializeCore();
	}

	static async #InitializeCore()
	{
		AppCore.CheckWindowArgs();
		AppCore.PrepareDocument();
		AppCore.PrepareActionBar();

		NotificationLog.Create();
		UserSettings.LoadFromStorage();

		window.TryGetGlobalStylingAspect = (name = '') => { return GlobalStyling[name]; };
		window.TryGetGlobalStylingValue = (name = '') => { return GlobalStyling[name]?.value; };
		GlobalStyling.Load();

		AppEvents.AddListener('account-login', AppCore.#AfterTenantAccountLogin); // after initial auth / login success
		AppEvents.AddListener('account-login-failed', AppCore.#AfterTenantAccountLoginFailed); // after initial auth / login failure
		AppEvents.AddListener('authorization-failure', AppCore.NotifyReauthorizeRequest); // after an auth failure is received from a data request
		AppEvents.AddListener('data-loaded', UserAccountInfo.UpdateUserSharedData); // after any shared data table is downloaded

		//await AccountStateManager.tenant.VerifyAccess();
		await AccountStateManager.tenant.TryLogIn();
		ActionBar.UpdateAccountButton();

		GlobalStyling.Apply();

		DebugLog.SubmitGroup('#fff4');
	}


	static async #AfterTenantAccountLogin()
	{
		LongOps.CreateActionBarElements();

		await Promise.allSettled(
			[
				AppStrap.ImportPageModules(),
				AppStrap.ImportDataModules()
			]
		);

		window.DBLayer.config = new window.DB_SharePoint();
		await window.DBLayer.Initialize();

		// permissions data is required to interpret and display information about the user's granted permissions
		window.global_needer_perms = window.SharedData['permissions'].AddNeeder();
		window.global_needer_notifications = window.SharedData['app notifications'].AddNeeder();

		await UserAccountInfo.DownloadUserInfo();
		await AppCore.CheckIdentity();

		UserAccountInfo.UpdateUserSharedData();
		AppStats.Load();
		Autosave.HookSaveEvent(AppStats.Save);

		AppCore.PopulateActionBarButtons();
		AppCore.RegisterHotkeys();
		window.addEventListener('keydown', AppInput.HandleKeyDown);
		window.addEventListener('keyup', AppInput.HandleKeyUp);

		let should_restore_layout = UserSettings.GetOptionValue('pagemanager-restore-layout', true);
		if (should_restore_layout !== true || PageManager.RestoreCachedLayout() !== true)
		{
			if (UserAccountInfo.HasAppAccess()) PageManager.OpenPageByTitle('nav menu');
			else PageManager.OpenPageByTitle('user dashboard');
		}

		Fax.RefreshFact();

		AppCore.SetContentObscured(false);
		NotificationLog.Log('Ready', '#097');
		Welcome.ShowWelcomeMessage();

		//Notification.requestPermission();
	}

	static #AfterTenantAccountLoginFailed()
	{
		NotificationLog.Log('Login Required', '#ff0');
		AppCore.SetContentObscured(true, 'Login Required');
		DebugLog.Log('! Login required');
	}







	static BeforeUnload(e)
	{
		if (LongOps.active.length > 0)
		{
			e.preventDefault();
			let emsg = LongOps.active.length > 1 ? 'Operation Pending!' : 'Multiple Operations Pending!';
			e.returnValue = emsg;
			NotificationLog.Log(emsg, '#fa0');
		}
	}

	static NotifyReauthorizeRequest()
	{
		UserAccountInfo.SuspendAppAccess();
		OverlayManager.HideAll();
		DebugLog.Log('<< Authentication Requested >>');
		ChoiceOverlay.ShowNew(
			{
				prompt: 'Account token expired or invalid! Authentication required.',
				choices: [
					{ label: 'REAUTHENTICATE', color: '#0f0', on_click: overlay => { AccountStateManager.tenant.RefreshAccess(); overlay.Dismiss(); } },
					{ label: 'IGNORE', color: '#f70', on_click: overlay => { overlay.Dismiss(); } }
				]
			}
		);
	}

	static OnWindowFocus()
	{
		if (AccountStateManager.tenant.logged_in === true) AccountStateManager.tenant.VerifyAccess();
	}

	static PrepareDocument()
	{
		window.onbeforeunload = e => AppCore.BeforeUnload(e);
		window.addEventListener('focus', _ => AppCore.OnWindowFocus());
		window.timeout_WindowSizeChange = new RunningTimeout(AppCore.OnWindowSizeChanged, 0.5, true, 250);

		window.fontSizePixels = parseInt(getComputedStyle(document.documentElement).fontSize);

		window.loop_detectWindowSizeChange = new AnimJob(200, AppCore.CheckWindowSizeChanged);
		window.loop_detectWindowSizeChange.Start();

		//AppInput.AddBodyEventListeners();

		const clock_refresh_delay_s = 29;
		const clock_refresh_delay_ms = clock_refresh_delay_s * 1000;
		window.loop_updateClock = new AnimJob(clock_refresh_delay_ms, AppCore.UpdateClock);
		window.loop_updateClock.Start();
		AppCore.UpdateClock();

		MegaTips.CreateElements();
		Spotlight.Initialize();

		MobileMode.Check();
		window.e_content_root = document.getElementById('content-body');

		window.SetContentFaded = (enabled = true) =>
		{
			window.content_faded = enabled === true;

			let e_content_root = document.getElementById('content-root');
			if (!e_content_root) return;

			e_content_root.classList.remove('obscured-light');
			if (enabled === true) e_content_root.classList.add('obscured-light');
		}

		document.body.style.opacity = '100%';
	}

	static CheckWindowSizeChanged()
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

	static OnWindowSizeChanged() { PageManager.NotifyLayoutChange(); }

	static SetContentObscured(enabled = true, label = '...')
	{
		window.content_obscured = enabled === true;
		let e_content_obscurer = document.getElementById('content-body-obscurer');
		if (!e_content_obscurer) return;
		e_content_obscurer.style.display = window.content_obscured ? 'block' : 'none';
		if (label) e_content_obscurer.innerText = label;
	}

	static RegisterHotkeys()
	{
		if (AccountStateManager.tenant.logged_in !== true) return;

		const hkaction_save = (m, e) => { if (m.ctrl) Autosave.InvokeNow(); };
		const hkinfo_save = { key_description: 'ctrl﹢s', action_description: 'Save Settings' };
		Hotkeys.Register(new HotkeyDescriptor('s', hkaction_save, hkinfo_save));

		const hkaction_lightmode = (m, e) => { if (m.none) AppCore.ToggleLightMode(); };
		const hkinfo_lightmode = { key_description: '~', action_description: 'Toggle Light Mode' };
		Hotkeys.Register(new HotkeyDescriptor('`', hkaction_lightmode, hkinfo_lightmode));

		const hkaction_debuglog = (m, e) => { if (m.none) AppCore.ToggleDebugLog(); };
		const hkinfo_debuglog = { action_description: 'Toggle Debug Log', dev_only: true };
		Hotkeys.Register(new HotkeyDescriptor('0', hkaction_debuglog, hkinfo_debuglog));

		PageManager.RegisterHotkeys();
	}

	static UpdateClock()
	{
		const e_clock = document.getElementById('info-bar-clock');
		const d = new Date();
		e_clock.innerText = d.to12HourTime();
		e_clock.title = d.toTimeString();
	}

	static PopulateActionBarButtons()
	{
		let e_btn_settings = ActionBar.AddMenuButton(
			'settings', 'settings',
			_ =>
			{
				if (window.mobile_mode_enabled === true)
					PageManager.CloseAll(() => { PageManager.OpenPageByTitle('settings'); });
				else PageManager.OpenPageByTitle('settings');
			}
		);
		MegaTips.RegisterSimple(e_btn_settings, 'Open the settings page. <br> (((You can view and manage your settings <br> and find useful information like hotkeys and permissions.)))');

		if (UserAccountInfo.HasAppAccess() === true)
		{
			let e_btn_home = ActionBar.AddMenuButton(
				'home', 'other_houses',
				_ =>
				{
					if (_.button === 1 || _.shiftKey === true) PageManager.TogglePageByTitle('nav menu');
					else PageManager.CloseAll();
				}
			);
			MegaTips.RegisterSimple(e_btn_home, 'Close all open pages and show the navigation menu. <br> ((([[[SHIFT CLICK]]] or [[[MIDDLE CLICK]]] to keep pages open.)))');
		}
	}

	static PrepareActionBar() { ActionBar.Initialize(); }

	static CheckWindowArgs()
	{
		window.args = {};
		let q = window.location.search.length > 0 ? window.location.search.substring(1).split('&') : [];
		if (typeof q !== 'Array' || q.length < 1) return;

		let ii = 0;
		while (ii < q.length)
		{
			let x = q[ii];
			ii++;

			console.warn('arg: ' + x + '\n' + q[x]);
			let str = q[x];
			let id_eq = str.indexOf('=');
			let k = str.substring(0, id_eq);
			let v = str.substring(id_eq + 1);
			window.args[k] = v;
		}
	}

	static async CheckIdentity()
	{
		DevMode.ValidateDeveloperId(UserAccountInfo.account_info.user_id);
		if (DevMode.active === true) DebugLog.SubmitGroup('#f0f3');
		else DebugLog.SubmitGroup();
	}

	static ToggleDebugLog()
	{
		GlobalStyling.showDebugLog.enabled = GlobalStyling.showDebugLog.enabled !== true;
		GlobalStyling.showDebugLog.Apply(true);
	};

	static ToggleLightMode()
	{
		GlobalStyling.lightMode.enabled = GlobalStyling.lightMode.enabled !== true;
		GlobalStyling.lightMode.Apply(true);
	};
}