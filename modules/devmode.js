import { Autosave } from "./autosave.js";
import { DebugLog } from "./debuglog.js";
import { CreatePagePanel, FlashElement } from "./utils/domutils.js";
import { Modules } from "./modules.js";
import { NotificationLog } from "./notificationlog.js";
import { AppEvents } from "./appevents.js";
import { ActionBar } from "./actionbar.js";

const developer_ids = ['t.rasor'];

export class DevMode
{
	static toggle_created = false;
	static available = false;
	static active = false;

	static TryCreateToggle()
	{
		if (DevMode.toggle_created === true) return;
		DevMode.toggle_created = true;

		let toggle_info = ActionBar.AddIcon(
			'developer_mode_tv', 'Toggle Debug Mode',
			e => 
			{
				if (DevMode.active === true) DevMode.Deactivate();
				else DevMode.Activate();
				DevMode.update_toggle();
				Autosave.InvokeSoon();
			}
		);

		DevMode.update_toggle = () =>
		{
			if (DevMode.active !== true)
			{
				toggle_info.e_icon.style.opacity = '50%';
				toggle_info.e_btn.style.removeProperty('--theme-color');
				FlashElement(toggle_info.e_btn, 1.0, 1.0, 'black');
			}
			else
			{
				toggle_info.e_icon.style.opacity = '100%';
				toggle_info.e_btn.style.setProperty('--theme-color', '#0fa');

				FlashElement(toggle_info.e_btn, 0.5, 2.0, 'lime');
			}
		};
		DevMode.update_toggle();
	}

	static ValidateDeveloperId(user_id)
	{
		DevMode.available = false;
		if (developer_ids.indexOf(user_id) > -1) 
		{
			DevMode.available = true;
			DevMode.TryCreateToggle();
			DevMode.TryLoadState();
			DevMode.update_toggle();
		}
	}

	static Activate()
	{
		if (DevMode.active) return;
		Autosave.HookSaveEvent(DevMode.SaveState);
		DevMode.active = true;
		DebugLog.Log(' ~ debug mode active');
		NotificationLog.Log('Activated Debug Mode');
		AppEvents.onDebugModeActivated.Invoke();

	}
	static Deactivate()
	{
		if (!DevMode.active) return;
		Autosave.ReleaseSaveEvent(DevMode.SaveState);
		DevMode.active = false;
		DebugLog.Log(' ~ debug mode inactive');
		NotificationLog.Log('Deactivated Debug Mode');
		AppEvents.onDebugModeDeactivated.Invoke();
	}

	static TryLoadState()
	{
		const lskey_devmode_state = 'devmodestate';
		let json = localStorage.getItem(lskey_devmode_state);
		if (typeof json === 'string' && json.startsWith('{'))
		{
			let state = JSON.parse(json);
			if (state.active === true) DevMode.Activate();
			else if (state.active === false) DevMode.Deactivate();
		}
	}

	static SaveState()
	{
		const lskey_devmode_state = 'devmodestate';
		localStorage.setItem(lskey_devmode_state, JSON.stringify({ active: DevMode.active }));
	}

	static AddActivateAction(action = () => { }) { return AppEvents.onDebugModeActivated.RequestSubscription(action); }
	static RemoveActivateAction(action_sub) { AppEvents.onDebugModeActivated.RemoveSubscription(action_sub); }

	static AddDeactivateAction(action = () => { }) { return AppEvents.onDebugModeDeactivated.RequestSubscription(action); }
	static RemoveDeactivateAction(action_sub) { AppEvents.onDebugModeDeactivated.RemoveSubscription(action_sub); }
}

Modules.Report('Developer Mode', 'This module adds debug functionality, if you have the expected permissions.');
