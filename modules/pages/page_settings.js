import { AppEvents } from "../appevents.js";
import { UserSettings } from "../usersettings.js";
import { PageBase } from "./pagebase.js";

export class PageSettings extends PageBase
{
	GetTitle() { return 'settings'; }
	CreateElements(parent)
	{
		if (!parent) return;
		this.CreateBody();
		this.e_body.style.maxWidth = '500px';

		this.e_toggles_root = document.createElement('div');
		this.e_toggles_root.className = 'settings-toggles-root';

		this.e_toggle_limitwidth = this.AddToggle('limit width', 'width_wide', 'Toggle limit content width', 'limit-content-width', () => { AppEvents.onToggleLimitWidth.Invoke(); });
		this.e_toggle_lightmode = this.AddToggle('light mode', 'light_mode', 'Toggle light mode', 'light-mode', () => { AppEvents.onToggleLightMode.Invoke(); });
		this.e_toggle_spotlight = this.AddToggle('spotlight', 'highlight', 'Toggle spotlight', 'spotlight', () => { AppEvents.onToggleSpotlight.Invoke(); });
		this.e_toggle_hidesensitive = this.AddToggle('hide sensitive', 'visibility_lock', 'Toggle hiding sensitive info', 'hide-sensitive-info', () => { AppEvents.onToggleHideSensitiveInfo.Invoke(); });

		this.e_content.appendChild(this.e_toggles_root);

		this.FinalizeBody(parent);
	}

	AddToggle(label = '', icon = '', tooltip = '', option_id = '', extra = () => { })
	{
		let toggled_og = UserSettings.GetOptionValue(option_id) === true;

		let e = document.createElement('div');
		e.className = toggled_og ? 'settings-toggle settings-toggle-on' : 'settings-toggle';
		if (tooltip) e.title = tooltip;
		e.innerHTML = '<span>' + label + '</span>' + (icon ? ("<i class='material-symbols icon'>" + icon + "</i>") : "");
		e.addEventListener(
			'click',
			() =>
			{
				let new_value = UserSettings.GetOptionValue(option_id) !== true;
				UserSettings.SetOptionValue(option_id, new_value);
				e.className = new_value ? 'settings-toggle settings-toggle-on' : 'settings-toggle';
				if (extra) extra();
			}
		);
		this.e_toggles_root.appendChild(e);
		return e;
	}
}