import { Modules } from "./modules.js";

export class Timers
{
	static timers = [];

	static IndexOf(timer_name = 'main')
	{
		for (let id in Timers.timers)
		{
			let t = Timers.timers[id];
			if (t.name === timer_name) return id;
		}
		return -1;
	}

	static Start(timer_name = 'main')
	{
		let id = Timers.IndexOf(timer_name);
		if (id < 0)
		{
			Timers.timers.push(
				{
					name: timer_name,
					time_start: Date.now(),
					time_end: null
				}
			);
		}
		else 
		{
			let timer = Timers.timers[id];
			timer.time_start = Date.now();
			timer.time_end = null;
		}
	}

	static Stop(timer_name = 'main')
	{
		let id = Timers.IndexOf(timer_name);
		if (id > -1)
		{
			let timer = Timers.timers[id];
			timer.time_end = Date.now();
			return timer.time_end - timer.time_start;
		}
		return 0;
	}

	static GetElapsed(timer_name = 'main')
	{
		let id = Timers.IndexOf(timer_name);
		if (id > -1)
		{
			let timer = Timers.timers[id];
			return timer.time_end - timer.time_start;
		}
		return 0;
	}
}

Modules.Report('Timers', 'This module adds a shared timer system for tracking the network or computation time for specific aspects of AURA. Used to debug.');