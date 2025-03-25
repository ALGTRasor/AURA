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

		this.e_options_root = document.createElement('div');
		this.e_options_root.className = 'settings-options-root';

		this.e_toggle_limitwidth = this.AddToggle('limit width', 'width_wide', 'Toggle limit content width', 'limit-content-width', () => { AppEvents.onToggleLimitWidth.Invoke(); });
		this.e_toggle_lightmode = this.AddToggle('invert', 'invert_colors', 'Toggle light mode', 'light-mode', () => { AppEvents.onToggleLightMode.Invoke(); });
		this.e_toggle_spotlight = this.AddToggle('spotlight', 'highlight', 'Toggle spotlight', 'spotlight', () => { AppEvents.onToggleSpotlight.Invoke(); });
		this.e_toggle_hidesensitive = this.AddToggle('hide sensitive info', 'visibility_lock', 'Toggle hiding sensitive info', 'hide-sensitive-info', () => { AppEvents.onToggleHideSensitiveInfo.Invoke(); });
		this.e_toggle_debuglog = this.AddToggle('show debug log', 'problem', 'Toggle the debugging log', 'show-debug-log', () => { AppEvents.onToggleDebugLog.Invoke(); });

		this.e_slider_animspeed = this.AddSlider('animation speed', 'speed', 'UI animation speed', 'anim-speed', () => { AppEvents.onSetAnimSpeed.Invoke(); });
		this.e_slider_themehue = this.AddSlider('theme hue', 'palette', 'UI theme hue', 'theme-hue', () => { AppEvents.onSetThemeColor.Invoke(); });
		this.e_slider_themesat = this.AddSlider('theme saturation', 'opacity', 'UI theme saturation', 'theme-saturation', () => { AppEvents.onSetThemeColor.Invoke(); });

		this.e_content.appendChild(this.e_options_root);

		this.FinalizeBody(parent);
	}

	AddToggle(label = '', icon = '', tooltip = '', option_id = '', extra = () => { })
	{
		let toggled_og = UserSettings.GetOptionValue(option_id) === true;

		let e = document.createElement('div');
		e.className = toggled_og ? 'setting-root setting-root-toggle setting-root-on' : 'setting-root setting-root-toggle ';
		if (tooltip) e.title = tooltip;
		e.innerHTML = '<span>' + label + '</span>' + (icon ? ("<i class='material-symbols icon'>" + icon + "</i>") : "");
		e.addEventListener(
			'click',
			() =>
			{
				let new_value = UserSettings.GetOptionValue(option_id) !== true;
				UserSettings.SetOptionValue(option_id, new_value);
				e.className = new_value ? 'setting-root setting-root-toggle setting-root-on' : 'setting-root setting-root-toggle ';
				if (extra) extra();
			}
		);
		this.e_options_root.appendChild(e);
		return e;
	}

	AddSlider(label = '', icon = '', tooltip = '', option_id = '', extra = () => { })
	{
		let val_og = UserSettings.GetOptionValue(option_id);

		let e_slider = document.createElement('div');
		e_slider.className = 'setting-root setting-root-slider';

		let e_slider_icon = {};
		if (icon)
		{
			e_slider_icon = document.createElement('i');
			e_slider_icon.className = 'material-symbols icon';
			e_slider_icon.innerText = icon;
			e_slider_icon.style.color = 'rgba(255,255,255,' + (val_og * 0.6 + 0.4) + ')';
			e_slider_icon.style.textShadow = '0px 0px 6px rgba(255,255,255,' + val_og + ')';
			e_slider.appendChild(e_slider_icon);
		}

		let e_slider_label = document.createElement('span');
		e_slider_label.innerText = label;
		e_slider.appendChild(e_slider_label);

		let e_slider_fill = document.createElement('div');
		e_slider_fill.className = 'setting-slider-fill';
		e_slider_fill.style.width = (val_og * 100) + '%';
		e_slider.className = 'setting-root setting-root-slider' + ((val_og > 0.0) ? ' setting-root-on' : '');
		e_slider.appendChild(e_slider_fill);

		if (tooltip) e_slider.title = tooltip;

		let isclicking = false;

		const handleMouse = e =>
		{
			if (!isclicking) return;

			let slider_rect = e_slider.getBoundingClientRect();
			let click_phase = (e.pageX - slider_rect.x) / slider_rect.width;
			click_phase = (click_phase - 0.5) * 1.025 + 0.5;
			click_phase = Math.max(0.0, Math.min(1.0, click_phase));
			let new_value = click_phase;

			UserSettings.SetOptionValue(option_id, new_value);
			e_slider.className = 'setting-root setting-root-slider' + ((new_value > 0.0) ? ' setting-root-on' : '');
			e_slider_fill.style.width = (new_value * 100) + '%';
			if (e_slider_icon)
			{
				e_slider_icon.style.color = 'rgba(255, 255, 255, ' + (new_value * 0.6 + 0.4) + ')';
				e_slider_icon.style.textShadow = '0px 0px 6px rgba(255, 255, 255, ' + new_value + ')';
			}
			if (extra) extra();
		};


		e_slider.addEventListener(
			'mousedown',
			e =>
			{
				isclicking = true;
				handleMouse(e);

				const fn_MouseMove = e => { handleMouse(e); };
				const fn_MouseUp = e =>
				{
					isclicking = false;
					window.removeEventListener('mouseup', fn_MouseUp);
					window.removeEventListener('mousemove', fn_MouseMove);
				};
				window.addEventListener('mousemove', fn_MouseMove);
				window.addEventListener('mouseup', fn_MouseUp);
			}
		);

		this.e_options_root.appendChild(e_slider);
		return e_slider;
	}
}