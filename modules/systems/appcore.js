import "../useraccount.js";

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
import { ActionBar } from "../actionbar.js";
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

export class AppCore extends EventTarget
{
	static IsLoadedInFrame = () => window.top !== window.self;

	static async Initialize()
	{
		if (AppCore.IsLoadedInFrame() === true) 
		{
			parent.postMessage('AuthFrameInit', '*');
			return;
		}

		AppCore.CheckWindowArgs();
		AppCore.PrepareDocument();
		AppCore.PrepareActionBar();
		AppCore.CheckSpoofing();

		NotificationLog.Create();
		UserSettings.LoadFromStorage();
		GlobalStyling.Load();

		AppEvents.AddListener('account-login', AppCore.#AfterTenantAccountLogin); // after initial auth / login success
		AppEvents.AddListener('account-login-failed', AppCore.#AfterTenantAccountLoginFailed); // after initial auth / login failure
		AppEvents.AddListener('authorization-failure', AppCore.NotifyReauthorizeRequest); // after an auth failure is received from a data request
		AppEvents.AddListener('data-loaded', UserAccountInfo.UpdateUserSharedData); // after any shared data table is downloaded

		await AccountStateManager.tenant.VerifyAccess();
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
		window.addEventListener('keyup', AppCore.HandleKeyUp);

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

		window.loop_detectWindowSizeChange = new AnimJob(200, AppCore.CheckWindowSizeChanged);
		window.loop_detectWindowSizeChange.Start();

		document.body.addEventListener('wheel', e => AppCore.RefreshGlobalTooltip(e), { passive: true });
		document.body.addEventListener('mouseout', e => AppCore.RefreshGlobalTooltip(e));
		document.body.addEventListener('mousemove', e => AppCore.RefreshGlobalTooltip(e));

		window.loop_updateClock = new AnimJob(33333, AppCore.UpdateClock);
		window.loop_updateClock.Start();
		AppCore.UpdateClock();

		AppCore.CreateSpotlightWalls();

		MegaTips.CreateElements();

		window.use_mobile_layout = window.visualViewport.width < window.visualViewport.height;
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
			_ => PageManager.OpenPageByTitle('settings')
		);
		MegaTips.RegisterSimple(e_btn_settings, 'Open the settings page. <br> (((You can view and manage your settings <br> and find useful information like hotkeys and permissions.)))');

		if (UserAccountInfo.HasAppAccess() === true)
		{
			let e_btn_home = ActionBar.AddMenuButton(
				'home', 'other_houses',
				_ =>
				{
					if (_.shiftKey === true) PageManager.TogglePageByTitle('nav menu');
					else PageManager.CloseAll();
				}
			);
			MegaTips.RegisterSimple(e_btn_home, 'Close all open pages and show the navigation menu. <br> (((Hold [[[SHIFT]]] to only toggle the navigation menu.)))');
		}
	}

	static PrepareActionBar() { ActionBar.Initialize(); }

	static CheckWindowArgs()
	{
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
	}

	static CheckSpoofing()
	{
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
	}

	static async CheckIdentity()
	{
		DevMode.ValidateDeveloperId(UserAccountInfo.account_info.user_id);
		if (DevMode.active === true) DebugLog.SubmitGroup('#f0f3');
		else DebugLog.SubmitGroup();
	}

	static HandleKeyUp(e)
	{
		if (OverlayManager.visible && OverlayManager.overlays.length > 0)
		{
			let o = OverlayManager.overlays[OverlayManager.overlays.length - 1];
			if (o && o.HandleHotkeys) o.HandleHotkeys(e);
			return;
		}

		Hotkeys.EvaluateKeyEvent(e);
	}

	static CreateSpotlightWalls()
	{
		let e_spotlight = document.getElementById('spotlight');

		addElement(
			e_spotlight, 'div', 'spotlight-wall', '',
			_ =>
			{
				_.style.top = '50%';
				_.style.right = '100%';
				_.style.width = '100vw';
				_.style.height = '200vh';
				_.style.transform = 'translate(0%, -50%)';
			}
		);
		addElement(
			e_spotlight, 'div', 'spotlight-wall', '',
			_ =>
			{
				_.style.top = '50%';
				_.style.left = '100%';
				_.style.width = '100vw';
				_.style.height = '200vh';
				_.style.transform = 'translate(0%, -50%)';
			}
		);

		addElement(
			e_spotlight, 'div', 'spotlight-wall', '',
			_ =>
			{
				_.style.top = '100%';
				_.style.left = '50%';
				_.style.width = '200vw';
				_.style.height = '100vh';
				_.style.transform = 'translate(-50%, 0%)';
			}
		);

		addElement(
			e_spotlight, 'div', 'spotlight-wall', '',
			_ =>
			{
				_.style.bottom = '100%';
				_.style.left = '50%';
				_.style.width = '200vw';
				_.style.height = '100vh';
				_.style.transform = 'translate(-50%, 0%)';
			}
		);
	}

	static SpotlightElement(e_target)
	{
		if (!e_target) return;

		let e_body_rect = document.body.getBoundingClientRect();
		let e_target_rect = e_target.getBoundingClientRect();

		const e_spotlight = document.getElementById('spotlight');
		e_spotlight.style.left = ((e_target_rect.x - e_body_rect.x) - 12) + 'px';
		e_spotlight.style.top = ((e_target_rect.y - e_body_rect.y) - 12) + 'px';
		e_spotlight.style.width = (e_target_rect.width + 24) + 'px';
		e_spotlight.style.height = (e_target_rect.height + 24) + 'px';
	}

	static RefreshGlobalTooltip(e)
	{
		const e_spotlight = document.getElementById('spotlight');
		let info_label = document.getElementById('info-bar-marquee');
		let mouse_element = document.elementFromPoint(e.pageX, e.pageY);
		if (mouse_element && mouse_element.title && mouse_element.title.length > 0)
		{
			window.active_tooltip = mouse_element.title;
			info_label.innerHTML = '<div>' + window.active_tooltip + '</div>';
			if (GlobalStyling.spotlight.enabled === true) 
			{
				AppCore.SpotlightElement(mouse_element);
				e_spotlight.style.transitionDelay = '0s';
				e_spotlight.style.opacity = '40%';
			}
		}
		else
		{
			window.active_tooltip = '';
			info_label.innerHTML = '<div>' + Fax.current_fact + '</div>';
			if (GlobalStyling.spotlight.enabled === true) 
			{
				e_spotlight.style.transitionDelay = '0.5s';
				e_spotlight.style.opacity = '0%';
			}
		}
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