import { Autosave } from "../autosave.js";
import { FlashElement } from "../utils/domutils.js";
import { Modules } from "../modules.js";
import { AppEvents } from "../appevents.js";
import { ActionBar } from "../ui/actionbar.js";

const developer_ids = ['t.rasor'];
const lskey_devmode_state = 'devmodestate';

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
		if (DevMode.active === true) return;
		DevMode.active = true;
		window.debug_mode_enabled = true;
		document.documentElement.setAttribute('devmode', '');
		AppEvents.Dispatch('debugmode-enabled');

	}
	static Deactivate()
	{
		if (DevMode.active !== true) return;
		document.documentElement.removeAttribute('devmode');
		window.debug_mode_enabled = false;
		DevMode.active = false;
		AppEvents.Dispatch('debugmode-disabled');
	}

	static TryLoadState()
	{
		let json = localStorage.getItem(lskey_devmode_state);
		if (typeof json === 'string' && json.startsWith('{'))
		{
			let state = JSON.parse(json);
			if (state.active === true) DevMode.Activate();
			else DevMode.Deactivate();
		}
	}

	static SaveState()
	{
		localStorage.setItem(lskey_devmode_state, JSON.stringify({ active: DevMode.active }));
	}

	static AddActivateAction(action = () => { }) { AppEvents.AddListener('debugmode-enabled', action); }
	static RemoveActivateAction(action = () => { }) { AppEvents.RemoveListener('debugmode-enabled', action); }

	static AddDeactivateAction(action = () => { }) { AppEvents.AddListener('debugmode-disabled', action); }
	static RemoveDeactivateAction(action = () => { }) { AppEvents.RemoveListener('debugmode-disabled', action); }
}

Modules.Report('Developer Mode', 'This module adds debug functionality, if you have the expected permissions.');
Autosave.HookSaveEvent(DevMode.SaveState);