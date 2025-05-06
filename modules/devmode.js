import { Autosave } from "./autosave.js";
import { DebugLog } from "./debuglog.js";
import { CreatePagePanel } from "./utils/domutils.js";
import { EventSource } from "./eventsource.js";
import { Modules } from "./modules.js";

const developer_ids = ['t.rasor'];

export class DevMode
{
	static onActivate = new EventSource();
	static onDeactivate = new EventSource();

	static toggle_created = false;
	static active = false;

	static TryCreateToggle()
	{
		if (DevMode.toggle_created === true) return;
		DevMode.toggle_created = true;

		let e_toggle_root = CreatePagePanel(document.getElementById('action-bar'), true, false);
		e_toggle_root.style.position = 'absolute';
		e_toggle_root.style.border = '0.125rem';
		e_toggle_root.style.top = '0.125rem';
		e_toggle_root.style.bottom = '0.125rem';
		e_toggle_root.style.right = '4.2rem';
		e_toggle_root.style.padding = '0';
		e_toggle_root.style.width = '6rem';
		e_toggle_root.style.cursor = 'pointer';

		let e_toggle = CreatePagePanel(e_toggle_root, false, false);
		e_toggle.classList.add('hover-lift');
		e_toggle.innerText = 'Debug Mode';
		e_toggle.style.position = 'absolute';
		e_toggle.style.top = '5px';
		e_toggle.style.left = '5px';
		e_toggle.style.width = 'calc(100% - 10px)';
		e_toggle.style.height = 'calc(100% - 10px)';
		e_toggle.style.border = 'none';
		e_toggle.style.padding = '0';
		e_toggle.style.alignSelf = 'center';
		e_toggle.style.alignContent = 'center';
		e_toggle.style.cursor = 'pointer';
		e_toggle.style.fontSize = '0.7rem';
		e_toggle.style.fontWeight = 'normal';

		DevMode.update_toggle = () =>
		{
			if (DevMode.active !== true)
			{
				e_toggle.style.opacity = '30%';
				e_toggle.style.setProperty('--theme-color', '#aaa');
			}
			else
			{
				e_toggle.style.opacity = '100%';
				e_toggle.style.setProperty('--theme-color', '#0fa');
			}
		};
		DevMode.update_toggle();

		e_toggle.addEventListener(
			'click',
			() =>
			{
				if (DevMode.active === true) DevMode.Deactivate();
				else DevMode.Activate();
				DevMode.update_toggle();
				Autosave.InvokeSoon();
			}
		);

	}

	static ValidateDeveloperId(user_id)
	{
		if (developer_ids.indexOf(user_id) > -1) 
		{
			DevMode.TryCreateToggle();
			DevMode.TryLoadState();
			DevMode.update_toggle();
		}
	}

	static Activate()
	{
		if (DevMode.active) return;
		Autosave.HookSaveEvent(DevMode.SaveState);
		DevMode.onActivate.Invoke();
		DevMode.active = true;
		DebugLog.Log(' ~ debug mode active');

	}
	static Deactivate()
	{
		if (!DevMode.active) return;
		Autosave.ReleaseSaveEvent(DevMode.SaveState);
		DevMode.onDeactivate.Invoke();
		DevMode.active = false;
		DebugLog.Log(' ~ debug mode inactive');
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

	static AddActivateAction(action = () => { }) { return DevMode.onActivate.RequestSubscription(action); }
	static RemoveActivateAction(action_sub) { DevMode.onActivate.RemoveSubscription(action_sub); }

	static AddDeactivateAction(action = () => { }) { return DevMode.onDeactivate.RequestSubscription(action); }
	static RemoveDeactivateAction(action_sub) { DevMode.onDeactivate.RemoveSubscription(action_sub); }
}

Modules.Report('Developer Mode', 'This module adds debug functionality, if you have the expected permissions.');
