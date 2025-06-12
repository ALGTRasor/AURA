import { NotificationLog } from "./notificationlog.js";
import { RunningTimeout } from "./utils/running_timeout.js";

export class AppEvents extends EventTarget
{
	static instance = new AppEvents();
	static log_dispatches = false;
	static requested = [];

	static AddListener(event = 'change', action = _ => { }) { AppEvents.instance.addEventListener(event, action); }
	static RemoveListener(event = 'change', action = _ => { }) { AppEvents.instance.removeEventListener(event, action); }
	static Dispatch(event_name = 'change', data = {})
	{
		if (AppEvents.log_dispatches === true) NotificationLog.Log(event_name.toUpperCase(), '#f0f');
		AppEvents.instance.dispatchEvent(new CustomEvent(event_name, data));
	}

	static Request(event_name = 'change', minimum_delay_sec = 0.25)
	{
		let get_existing_id = (event_name) => { return AppEvents.requested.findIndex(_ => _.name == event_name); };
		let existing_id = get_existing_id(event_name);
		if (existing_id < 0)
		{
			let dispatch_action = () =>
			{
				AppEvents.requested.splice(get_existing_id(event_name), 1);
				AppEvents.Dispatch(event_name, {});
			};

			let timeout = new RunningTimeout(dispatch_action, minimum_delay_sec, true, 150);
			AppEvents.requested.push({ name: event_name, timeout: timeout });
		}
		else
		{
			AppEvents.requested[existing_id].timeout.ExtendTimer();
		}
	}
}
