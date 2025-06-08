import { DebugLog } from "../debuglog.js";
import { Modules } from "../modules.js";
import { until } from "../utils/until.js";

export class Fax
{
	static all = [];
	static allRead = false;
	static allReading = false;

	static current_fact = '';

	static e_marquee = document.getElementById('info-bar-marquee');

	static async Read(force = false)
	{
		if (Fax.allReading) await until(() => !Fax.allReading);
		else if (force || !Fax.allRead)
		{
			Fax.allReading = true;
			let resp = await fetch(
				'resources/fax.txt',
				{
					method: 'get',
					headers: { 'accept': 'text/plain' }
				}
			);
			Fax.all = (await resp.text()).split('\n').map(x => x.trim()).filter(x => x != '');
			Fax.allRead = Fax.all.length > 0;
			Fax.allReading = false;
			DebugLog.Log("loaded fax");
		}
	}

	static async GetOne()
	{
		await Fax.Read();
		return Fax.all[Math.floor(Fax.all.length * Math.random())].trim();
	}

	static async RefreshFact()
	{
		let fact = await Fax.GetOne();
		Fax.current_fact = fact;
		Fax.e_marquee.innerHTML = `<div>${fact}</div>`;
		DebugLog.Log('refreshed fact');
	}
}

Modules.Report('Fax', 'This module adds some fun facts to the info bar.');
if (!window.fxn) window.fxn = {};
window.fxn.RefreshFact = Fax.RefreshFact;