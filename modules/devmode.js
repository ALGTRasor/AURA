import { DebugLog } from "./debuglog.js";
import { EventSource } from "./eventsource.js";
import { Modules } from "./modules.js";

const developer_ids = ['brian.bristow', 't.rasor', 't.wink'];

export class DevMode
{
	static onActivate = new EventSource();
	static onDeactivate = new EventSource();

	static active = false;

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

Modules.Report("DevMode");
