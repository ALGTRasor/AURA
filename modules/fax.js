import { DebugLog } from "./debuglog.js";
import { Modules } from "./modules.js";
import { until } from "./until.js";

export class Fax
{
	static all = [];
	static allRead = false;
	static allReading = false;

	static async Read(force = false)
	{
		if (Fax.allReading) await until(() => !Fax.allReading);
		else if (force || !Fax.allRead)
		{
			DebugLog.Log("loading fax...");
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
		document.getElementById('info-bar-marquee').innerHTML = '<div>' + fact + '</div>';
		DebugLog.Log("...fact refreshed");
	}
}

Modules.Report("Fax");
if (!window.fxn) window.fxn = {};
window.fxn.RefreshFact = Fax.RefreshFact;