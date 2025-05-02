import { DebugLog } from "./debuglog.js";
import { CreatePagePanel } from "./domutils.js";
import { EventSource } from "./eventsource.js";
import { Modules } from "./modules.js";

const developer_ids = ['t.rasor'];

export class DevMode
{
	static onActivate = new EventSource();
	static onDeactivate = new EventSource();

	static toggle_created = false;
	static active = false;

	//8293

	static TryCreateToggle()
	{
		if (DevMode.toggle_created === true) return;
		DevMode.toggle_created = true;

		let e_toggle_root = CreatePagePanel(document.getElementById('action-bar'), true, false);
		e_toggle_root.style.position = 'absolute';
		e_toggle_root.style.top = '0.25rem';
		e_toggle_root.style.bottom = '0.25rem';
		e_toggle_root.style.right = '5rem';
		e_toggle_root.style.width = '11rem';

		let e_toggle = CreatePagePanel(e_toggle_root, false, false);
		e_toggle.innerText = 'Disable Dev Mode';
		e_toggle.style.fontSize = '0.7rem';
		e_toggle.style.position = 'absolute';
		e_toggle.style.inset = 'var(--gap-025)';
		e_toggle.style.alignSelf = 'center';
		e_toggle.style.alignContent = 'center';

	}

	static ValidateDeveloperId(user_id)
	{
		if (developer_ids.indexOf(user_id) > -1) DevMode.Activate();
		else DevMode.Deactivate();
	}

	static Activate()
	{
		if (DevMode.active) return;
		DevMode.onActivate.Invoke();
		DevMode.active = true;
		DebugLog.Log(' ~ dev mode active');

		DevMode.TryCreateToggle();
	}
	static Deactivate()
	{
		if (!DevMode.active) return;
		DevMode.onDeactivate.Invoke();
		DevMode.active = false;
		DebugLog.Log(' ~ dev mode inactive');
	}

	static AddActivateAction(save_action = () => { }) { return DevMode.onActivate.RequestSubscription(save_action); }
	static RemoveActivateAction(save_action_sub) { DevMode.onActivate.RemoveSubscription(save_action_sub); }

	static AddDeactivateAction(action = () => { }) { return DevMode.onDeactivate.RequestSubscription(action); }
	static RemoveDeactivateAction(action_sub) { DevMode.onDeactivate.RemoveSubscription(action_sub); }
}

Modules.Report('Developer Mode', 'This module adds debug functionality, if you have the expected permissions.');
