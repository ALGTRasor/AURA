import { AnimJob } from "./AnimJob.js";
import { AppEvents } from "./appevents.js";
import { Modules } from "./modules.js";
import { NotificationLog } from "./notificationlog.js";
import { MegaTips } from "./systems/megatips.js";
import { UserAccountInfo, UserAccountManager } from "./useraccount.js";

export class Autosave
{
	static invokesoon_delay = 1000;

	static e_lastsaved = document.getElementById('info-bar-lastsaved');
	static e_megatip = undefined;
	static delay_seconds = 45.0;

	static last_invoke_ts;
	static invokesoon_tid;

	static InvokeNow()
	{
		if (Autosave.invokesoon_tid > -1)
		{
			window.clearTimeout(Autosave.invokesoon_tid);
			Autosave.invokesoon_tid = -1;
		}

		if (UserAccountManager.account_provider.logged_in !== true) return;
		if (UserAccountInfo.is_alg_account !== true) return;

		AppEvents.Dispatch('localsave');

		Autosave.last_invoke_ts = new Date();

		//NotificationLog.Log('Saved', '#0f0');

		Autosave.StartPulseAnimation();

		Autosave.e_lastsaved.style.aspectRatio = '1.0';
		Autosave.e_lastsaved.style.height = '100%';
		Autosave.e_lastsaved.style.width = 'auto';
		Autosave.e_lastsaved.style.setProperty('--theme-color', '#0f0');

		if (!Autosave.e_megatip) Autosave.e_megatip = MegaTips.Register(Autosave.e_lastsaved, _ => { });
		Autosave.e_megatip.prep = _ => { _.innerHTML = MegaTips.FormatHTML('[[[Saved local data at]]] ' + Autosave.last_invoke_ts.toLocaleTimeString()); };
		//Autosave.e_lastsaved.title = 'Saved user settings at ' + Autosave.last_invoke_ts.toLocaleTimeString();
		Autosave.e_lastsaved.innerHTML = '';
		let e_title_icon = document.createElement('i');
		e_title_icon.className = 'material-symbols icon';
		e_title_icon.style = 'inset:unset;position:relative;top:0;left:0;width:100%;height:100%;'
			+ 'user-select:none;pointer-events:none;';
		e_title_icon.innerText = 'save';
		Autosave.e_lastsaved.appendChild(e_title_icon);
	}

	static StartPulseAnimation()
	{
		Autosave.e_lastsaved.style.animation = '0.5s infinite save-icon-pulse-fast';
		window.setTimeout(Autosave.EndPulseAnimation, 2500);
	}

	static EndPulseAnimation()
	{
		Autosave.e_lastsaved.style.animation = '4s infinite save-icon-pulse-soft';
	}

	static InvokeSoon()
	{
		if (Autosave.invokesoon_tid > -1) window.clearTimeout(Autosave.invokesoon_tid);
		Autosave.invokesoon_tid = window.setTimeout(Autosave.InvokeNow, Autosave.invokesoon_delay);
	}

	static HookSaveEvent(save_action = () => { }) { AppEvents.AddListener('localsave', save_action); }
	static ReleaseSaveEvent(save_action = () => { }) { AppEvents.RemoveListener('localsave', save_action); }

	static loop = new AnimJob(4000, Autosave.StepLoop); // checks for autosave every 5 seconds, might be interrupted by manual Invokes
	static StepLoop(dt)
	{
		let ts_now = new Date();
		let invoke_delta = ts_now - Autosave.last_invoke_ts;
		let min_invoke_delta = 1000 * Autosave.delay_seconds;
		if (invoke_delta >= min_invoke_delta) Autosave.InvokeNow();
	}
}

Modules.Report('Autosave', 'This module adds autosave functionality. Autosave applies to your local app settings, but not to database/remote data.');
//Autosave.loop.Start();
