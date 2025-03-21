import { AnimJob } from "./AnimJob.js";
import { DebugLog } from "./debuglog.js";
import { EventSource } from "./eventsource.js";
import { Modules } from "./modules.js";

export class Autosave
{
	static source = new EventSource();
	static delay_seconds = 30.0;

	static Invoke()
	{
		Autosave.source.Invoke();
	}

	static HookSaveEvent(save_action = () => { })
	{
		return Autosave.source.RequestSubscription(save_action);
	}

	static ReleaseSaveEvent(save_action_sub)
	{
		Autosave.source.RemoveSubscription(save_action_sub);
	}

	static loop = new AnimJob(1000 * Autosave.delay_seconds, Autosave.StepLoop);

	static StepLoop(dt)
	{
		DebugLog.Log('~ Autosave', false);
		Autosave.Invoke();
	}
}

Autosave.loop.Start();
Modules.Report("Autosave");
