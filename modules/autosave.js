import { AnimJob } from "./AnimJob.js";
import { DebugLog } from "./debuglog.js";
import { EventSource } from "./eventsource.js";
import { Modules } from "./modules.js";

export class Autosave
{
	static invokesoon_delay = 600;

	static e_lastsaved = document.getElementById('info-bar-lastsaved');
	static source = new EventSource();
	static delay_seconds = 15.0;

	static last_invoke_ts;
	static invokesoon_tid;

	static InvokeNow()
	{
		if (Autosave.invokesoon_tid > -1)
		{
			window.clearTimeout(Autosave.invokesoon_tid);
			Autosave.invokesoon_tid = -1;
		}
		Autosave.source.Invoke();

		Autosave.last_invoke_ts = new Date();
		DebugLog.Log('~ Autosave', false);
		Autosave.e_lastsaved.style.color = '#3f3a';
		Autosave.e_lastsaved.innerText = 'Last saved @' + Autosave.last_invoke_ts.toLocaleTimeString();
	}

	static InvokeSoon()
	{
		if (Autosave.invokesoon_tid > -1) window.clearTimeout(Autosave.invokesoon_tid);
		Autosave.invokesoon_tid = window.setTimeout(Autosave.InvokeNow, Autosave.invokesoon_delay);
	}

	static HookSaveEvent(save_action = () => { }) { return Autosave.source.RequestSubscription(save_action); }
	static ReleaseSaveEvent(save_action_sub) { Autosave.source.RemoveSubscription(save_action_sub); }

	static loop = new AnimJob(4000, Autosave.StepLoop); // checks for autosave every 5 seconds, might be interrupted by manual Invokes
	static StepLoop(dt)
	{
		let ts_now = new Date();
		let invoke_delta = ts_now - Autosave.last_invoke_ts;
		let min_invoke_delta = 1000 * Autosave.delay_seconds;
		if (invoke_delta >= min_invoke_delta) Autosave.InvokeNow();
	}
}

Autosave.loop.Start();
Modules.Report('Autosave', 'This module adds autosave functionality. Autosave applies to local AURA user settings, not database sourced data.');
