import { AppEvents } from "../appevents.js";
import { Autosave } from "../autosave.js";
import { PageManager } from "../pagemanager.js";
import { UserSettings } from "../usersettings.js";
import { PageBase } from "./pagebase.js";

export class PageSettings extends PageBase
{
	GetTitle() { return 'settings'; }
	CreateElements(parent)
	{
		if (!parent) return;

		this.icon = 'settings';

		this.CreateBody();

		this.e_body.style.minWidth = '500px';
		this.e_body.style.maxWidth = '600px';

		this.e_options_root = document.createElement('div');
		this.e_options_root.className = 'settings-options-root';

		this.e_toggle_limitwidth = this.AddToggle('limit width', 'width_wide', 'Toggle limit content width', 'limit-content-width', () => { AppEvents.onToggleLimitWidth.Invoke(); });
		this.e_toggle_lightmode = this.AddToggle('light mode', 'invert_colors', 'Toggle light mode', 'light-mode', () => { AppEvents.onToggleLightMode.Invoke(); });
		this.e_toggle_spotlight = this.AddToggle('spotlight', 'highlight', 'Toggle spotlight', 'spotlight', () => { AppEvents.onToggleSpotlight.Invoke(); });
		this.e_toggle_hidesensitive = this.AddToggle('hide sensitive info', 'visibility_lock', 'Toggle hiding sensitive info', 'hide-sensitive-info', () => { AppEvents.onToggleHideSensitiveInfo.Invoke(); });
		this.e_toggle_debuglog = this.AddToggle('show debug log', 'problem', 'Toggle the debugging log', 'show-debug-log', () => { AppEvents.onToggleDebugLog.Invoke(); });

		this.e_slider_animspeed = this.AddSlider('animation speed', 'speed', 'UI animation speed', 'anim-speed', 0.125, data => { }, () => { AppEvents.onSetAnimSpeed.Invoke(); });

		const updateHueSlider = (data = {}, triggerSetEvent = false) =>
		{
			data.e_slider_icon.style.color = 'hsl(from var(--theme-color) h 100% 50%)';
			data.e_slider_icon.style.textShadow = '0px 0px 0.5rem hsl(from var(--theme-color) h 100% 50%)';
			if (triggerSetEvent) AppEvents.onSetThemeColor.Invoke();
		};

		const updateSatSlider = (data = {}, triggerSetEvent = false) =>
		{
			data.e_slider_icon.style.color = 'hsl(from var(--theme-color) h s 50%)';
			data.e_slider_icon.style.textShadow = '0px 0px 0.5rem hsl(from var(--theme-color) h s 50%)';
			if (triggerSetEvent) AppEvents.onSetThemeColor.Invoke();
		};

		this.e_slider_themehue = this.AddSlider(
			'theme hue', 'palette', 'UI theme hue', 'theme-hue', 0.01,
			data => updateHueSlider(data, false),
			data => updateHueSlider(data, true)
		);
		this.e_slider_themesat = this.AddSlider(
			'theme saturation', 'opacity', 'UI theme saturation', 'theme-saturation', 0.01,
			data => updateSatSlider(data, false),
			data => updateSatSlider(data, true)
		);

		this.e_content.appendChild(this.e_options_root);

		this.FinalizeBody(parent);
	}

	AddToggle(label = '', icon = '', tooltip = '', option_id = '', extra = data => { })
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

				Autosave.InvokeSoon();
			}
		);
		this.e_options_root.appendChild(e);
		return e;
	}

	AddSlider(label = '', icon = '', tooltip = '', option_id = '', step = 0.0, extra = data => { }, extraOnDrag = data => { })
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

		if (extra)
		{
			extra(
				{
					e_slider: e_slider,
					e_slider_label: e_slider_label,
					e_slider_icon: e_slider_icon,
					e_slider_fill: e_slider_fill,
					og_value: val_og,
					new_value: val_og
				}
			);
		}

		const handleMouse = e =>
		{
			if (!isclicking) return;

			let slider_rect = e_slider.getBoundingClientRect();
			let click_phase = (e.pageX - slider_rect.x) / slider_rect.width;
			click_phase = (click_phase - 0.5) * 1.025 + 0.5;
			click_phase = Math.max(0.0, Math.min(1.0, click_phase));
			if (step > 0.0) click_phase = Math.round(click_phase / step) * step;
			let new_value = click_phase;

			UserSettings.SetOptionValue(option_id, new_value);
			e_slider.className = 'setting-root setting-root-slider' + ((new_value > 0.0) ? ' setting-root-on' : '');
			e_slider_fill.style.width = (new_value * 100) + '%';
			if (e_slider_icon)
			{
				e_slider_icon.style.color = 'rgba(255, 255, 255, ' + (new_value * 0.6 + 0.4) + ')';
				e_slider_icon.style.textShadow = '0px 0px 6px rgba(255, 255, 255, ' + new_value + ')';
			}
			if (extraOnDrag)
			{
				extraOnDrag(
					{
						e_slider: e_slider,
						e_slider_label: e_slider_label,
						e_slider_icon: e_slider_icon,
						e_slider_fill: e_slider_fill,
						og_value: val_og,
						new_value: new_value
					}
				);
			}
			Autosave.InvokeSoon();
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


PageManager.RegisterPage(new PageSettings('settings'));