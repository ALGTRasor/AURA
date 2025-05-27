import "../useraccount.js";

import { UserAccountInfo, UserAccountManager } from "../useraccount.js";
import { HotkeyDescriptor, Hotkeys } from "../utils/hotkeys.js";
import { RunningTimeout } from "../utils/running_timeout.js";
import { NotificationLog } from "../notificationlog.js";
import { GlobalStyling } from "../ui/global_styling.js";
import { OverlayManager } from "../ui/overlays.js";
import { UserSettings } from "../usersettings.js";
import { addElement } from "../utils/domutils.js";
import { PageManager } from "../pagemanager.js";
import { ActionBar } from "../actionbar.js";
import { AppEvents } from "../appevents.js";
import { Welcome } from "../ui/welcomes.js";
import { Autosave } from "../autosave.js";
import { DebugLog } from "../debuglog.js";
import { AppStrap } from "./appstrap.js";
import { DevMode } from "../devmode.js";
import { AnimJob } from "../AnimJob.js";
import { LongOps } from "./longops.js";
import { Fax } from "./fax.js";

export class AppCore
{
	static async Initialize()
	{
		AppCore.CheckWindowArgs();
		AppCore.PrepareDocument();
		AppCore.PrepareActionBar();
		AppCore.CheckSpoofing();

		NotificationLog.Create();
		UserSettings.LoadFromStorage();
		GlobalStyling.Load();

		AppEvents.AddListener('authorization-failure', AppCore.NotifyReauthorizeRequest);
		AppEvents.AddListener('account-login', UserAccountInfo.UpdateUserSharedData);
		AppEvents.AddListener('data-loaded', UserAccountInfo.UpdateUserSharedData);

		await UserAccountManager.CheckWindowLocationForCodes();
		await UserAccountManager.AttemptAutoLogin();
		ActionBar.UpdateAccountButton();

		if (UserAccountManager.account_provider.logged_in === true && UserAccountInfo.is_alg_account === true)
		{
			LongOps.CreateActionBarElements();

			await AppStrap.ImportPageModules();
			await AppStrap.ImportDataModules();

			window.DBLayer.config = new window.DB_SharePoint();
			await window.DBLayer.Initialize();

			// permissions data is required to interpret and display information about the user's granted permissions
			window.global_needer_perms = window.SharedData.permissions.AddNeeder();

			await UserAccountInfo.DownloadUserInfo();
			await AppCore.CheckIdentity();

			AppEvents.Dispatch('account-login');

			AppCore.PopulateActionBarButtons();
			window.addEventListener('keyup', AppCore.HandleKeyUp);
			AppCore.RegisterHotkeys();

			let should_restore_layout = UserSettings.GetOptionValue('pagemanager-restore-layout', true);
			if (should_restore_layout !== true || PageManager.RestoreCachedLayout() !== true)
			{
				if (UserAccountInfo.HasAppAccess()) PageManager.OpenPageByTitle('nav menu');
				else PageManager.OpenPageByTitle('user dashboard');
			}

			Fax.RefreshFact();

			NotificationLog.Log('Ready', '#097');
			Welcome.ShowWelcomeMessage();

			AppCore.SetContentObscured(false);
		}
		else
		{
			NotificationLog.Log('Login Required', '#ff0');
			AppCore.SetContentObscured(true, 'Login Required');
			DebugLog.Log('! Login required');
			AppEvents.Dispatch('account-login-failed');
			//await AppEvents.onAccountLoginFailed.InvokeAsync();
		}

		GlobalStyling.Apply();

		DebugLog.SubmitGroup('#fff4');
	}



	static BeforeUnload(e)
	{
		if (LongOps.active.length > 0)
		{
			e.preventDefault();
			NotificationLog.Log('Operation Ongoing!');
		}
	}

	static NotifyReauthorizeRequest()
	{
		DebugLog.Log('authentication required! auth error status from batch request');
		UserAccountManager.account_provider.logged_in = false; // trigger reauthentication flow
		OverlayManager.ShowConfirmDialog(
			_ => { UserAccountManager.RequestLogin(); },
			_ => { },
			'Account token expired or invalid! Authentication required.',
			'REAUTHENTICATE', 'IGNORE'
		);
	}


	static PrepareDocument()
	{
		window.onbeforeunload = e => AppCore.BeforeUnload(e);
		window.timeout_WindowSizeChange = new RunningTimeout(AppCore.OnWindowSizeChanged, 0.5, true, 250);

		window.loop_detectWindowSizeChange = new AnimJob(200, AppCore.CheckWindowSizeChanged);
		window.loop_detectWindowSizeChange.Start();

		document.body.addEventListener('scroll', e => AppCore.RefreshGlobalTooltip(e));
		document.body.addEventListener('mouseout', e => AppCore.RefreshGlobalTooltip(e));
		document.body.addEventListener('mousemove', e => AppCore.RefreshGlobalTooltip(e));

		window.loop_updateClock = new AnimJob(33333, AppCore.UpdateClock);
		window.loop_updateClock.Start();
		AppCore.UpdateClock();

		AppCore.CreateSpotlightWalls();

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

	static OnWindowSizeChanged() { PageManager.onLayoutChange.Invoke(); }



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
		if (!UserAccountInfo.HasAppAccess()) return;

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
		let d = new Date();
		let hr = d.getHours();
		let min = d.getMinutes();
		e_clock.innerText = (hr % 12).toString().padStart(2, '0') + ':' + min.toString().padStart(2, '0') + (hr >= 12.0 ? 'PM' : 'AM');
		e_clock.title = d.toTimeString();
	}


	static PopulateActionBarButtons()
	{
		ActionBar.AddMenuButton(
			'settings', 'settings',
			_ => PageManager.OpenPageByTitle('settings'),
			_ => { _.title = 'Configure your local settings and view useful information like available hotkeys or app permissions.'; }
		);

		if (UserAccountInfo.HasAppAccess() === true)
		{
			if (false)
			{
				ActionBar.AddMenuButton(
					'refresh', 'refresh',
					_ =>
					{
						OverlayManager.ShowConfirmDialog(
							_ => { AppCore.RequestSharedDataRefresh(); },
							_ => { },
							'Refresh all shared data?<br><br>'
							+ '<span style="opacity:50%;font-size:0.85rem;">This operation may take a few seconds.</span>',
							'[Y]ES', '[N]o'
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
			}

			ActionBar.AddMenuButton('home', 'menu', _ => { if (_.shiftKey === true) PageManager.TogglePageByTitle('nav menu'); else PageManager.CloseAll(); });
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

	static async RequestSharedDataRefresh()
	{
		DebugLog.StartGroup('manual refresh');
		//await UserAccountManager.account_provider.DownloadAccountData();
		//await AppCore.CheckIdentity();
		await window.SharedData.LoadData(false);
		DebugLog.SubmitGroup("#f808");
	}



	static HandleKeyUp(e)
	{
		if (OverlayManager.visible && OverlayManager.overlays.length > 0)
		{
			let o = OverlayManager.overlays[OverlayManager.overlays.length - 1];
			if (o && o.handleHotkeys) o.handleHotkeys(e);
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