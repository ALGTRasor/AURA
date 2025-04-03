import { AppEvents } from "../appevents.js";
import { Autosave } from "../autosave.js";
import { addElement, CreatePagePanel } from "../domutils.js";
import { Modules } from "../modules.js";
import { PageManager } from "../pagemanager.js";
import { UserAccountInfo } from "../useraccount.js";
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

		this.e_body.style.minWidth = '18rem';
		this.e_body.style.maxWidth = '32rem';
		this.e_body.style.flexBasis = '12rem';
		this.e_body.style.flexGrow = '1.0';

		this.e_options_root = CreatePagePanel(
			this.e_content, true, true, 'min-height:1.5rem;align-content:flex-start;flex-grow:2.0;',
			x =>
			{
				addElement(x, 'div', '', 'text-align:center;font-size:0.8rem;font-weight:bold;min-width:100%;letter-spacing:2px;height:1.75rem;align-content:center;', _ => { _.innerText = 'MY SETTINGS'; });
			}
		);

		this.e_toggle_layoutrestore = this.AddToggle('remember layout', 'restore_page', 'Remember page layout', 'pagemanager-restore-layout', () => { });
		this.e_toggle_lightmode = this.AddToggle('light mode', 'invert_colors', 'Toggle light mode', 'light-mode', () => { AppEvents.onToggleLightMode.Invoke(); });
		this.e_toggle_limitwidth = this.AddToggle('limit width', 'width_wide', 'Toggle limit content width', 'limit-content-width', () => { AppEvents.onToggleLimitWidth.Invoke(); });
		this.e_toggle_hidesensitive = this.AddToggle('obscure sensitive info', 'visibility_lock', 'Toggle hiding sensitive info', 'hide-sensitive-info', () => { AppEvents.onToggleHideSensitiveInfo.Invoke(); });
		this.e_toggle_spotlight = this.AddToggle('spotlight', 'highlight', 'Toggle spotlight', 'spotlight', () => { AppEvents.onToggleSpotlight.Invoke(); });
		this.e_toggle_debuglog = this.AddToggle('show debug log', 'problem', 'Toggle the debugging log', 'show-debug-log', () => { AppEvents.onToggleDebugLog.Invoke(); });


		this.e_theme_color_warning = addElement(null, 'div', 'setting-root-warning', null, e => { e.innerText = 'THIS COLOR CHOICE SUCKS' });

		const updateColorWarning = () =>
		{
			let hue = UserSettings.GetOptionValue('theme-hue');
			let sat = UserSettings.GetOptionValue('theme-saturation');
			if ((hue < 0.43 || hue > 0.95) && sat > 0.25) this.e_theme_color_warning.innerText = 'THEME COLOR MIGHT CONFLICT WITH COLOR CODING';
			else if (((hue > 0.55 && hue < 0.75) || (hue < 0.1 || hue > 0.9)) && sat > 0.75)
				this.e_theme_color_warning.innerText = 'THEME COLOR MIGHT MAKE SOME TEXT OR ICONS DIFFICULT TO READ';
			else this.e_theme_color_warning.innerText = '';
		};

		const updateHueSlider = (data = {}, triggerSetEvent = false) =>
		{
			data.e_slider_icon.style.color = 'hsl(from var(--theme-color) h 100% 50%)';
			data.e_slider_icon.style.textShadow = '0px 0px 0.5rem hsl(from var(--theme-color) h 100% 50%)';
			if (triggerSetEvent) AppEvents.onSetThemeColor.Invoke();
			updateColorWarning();
		};

		const updateSatSlider = (data = {}, triggerSetEvent = false) =>
		{
			data.e_slider_icon.style.color = 'hsl(from var(--theme-color) h s 50%)';
			data.e_slider_icon.style.textShadow = '0px 0px 0.5rem hsl(from var(--theme-color) h s 50%)';
			if (triggerSetEvent) AppEvents.onSetThemeColor.Invoke();
			updateColorWarning();
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
		this.e_options_root.appendChild(this.e_theme_color_warning);

		this.e_slider_animspeed = this.AddSlider('animation speed', 'speed', 'UI animation speed', 'anim-speed', 0.125, data => { }, () => { AppEvents.onSetAnimSpeed.Invoke(); });



		CreatePagePanel(
			this.e_content, true, true, 'flex-grow:0.0;flex-basis:100%;max-height:1.5rem;min-height:1.5rem;align-content:start;overflow:hidden;',
			x =>
			{
				x.className += ' expanding-panel';
				addElement(x, 'div', '', 'text-align:center;font-size:0.8rem;font-weight:bold;min-width:100%;letter-spacing:2px;height:1.75rem;align-content:center;', _ => { _.innerText = 'MY PERMISSIONS'; });
				for (let pid in UserAccountInfo.user_permissions)
				{
					let info = UserAccountInfo.user_permissions[pid];
					CreatePagePanel(
						x, false, false, 'text-align:center;margin:2px;font-size:0.7rem;align-content:center;',
						_ =>
						{
							_.innerText = info.permission_name;
							_.title = info.permission_desc;
						}
					);
				}
			}
		);

		CreatePagePanel(
			this.e_content, true, true, 'flex-grow:0.0;flex-basis:100%;max-height:1.5rem;min-height:1.5rem;align-content:start;overflow:hidden;',
			x =>
			{
				x.className += ' expanding-panel';
				addElement(x, 'div', '', 'text-align:center;font-size:0.8rem;font-weight:bold;min-width:100%;letter-spacing:2px;height:1.75rem;align-content:center;', _ => { _.innerText = 'LOADED MODULES'; });
				for (let report_id in Modules.reported)
				{
					let module_info = Modules.reported[report_id];
					CreatePagePanel(
						x, false, false, 'text-align:center;margin:2px;font-size:0.7rem;align-content:center;',
						_ =>
						{
							_.innerText = module_info.name;
							_.title = module_info.desc;
						}
					);
				}
			}
		);


		CreatePagePanel(
			this.e_content, true, true, 'flex-grow:0.0;flex-basis:100%;max-height:1.5rem;min-height:1.5rem;align-content:start;overflow:hidden;',
			x =>
			{
				x.className += ' expanding-panel';
				const title_style = 'text-align:center;font-size:0.8rem;font-weight:bold;min-width:100%;letter-spacing:2px;height:1.75rem;align-content:center;';
				addElement(x, 'div', '', title_style, _ => { _.innerText = 'HOTKEYS'; });

				const about_style = 'text-align:center;margin:2px;font-size:0.7rem;align-content:center;flex-basis:100%;flex-grow:1.0;';
				const addKey = (key = '', effect = '', tooltip = '') => CreatePagePanel(
					x, false, false, about_style,
					_ =>
					{
						_.innerHTML = '<span style="position:absolute;display:block;inset:0;right:80%;align-content:center;background:#0003;">' + key.toUpperCase() + '</span>'
							+ '<span style="position:absolute;display:block;inset:0;left:20%;align-content:center;text-align:left;padding-left:0.5rem;">' + effect + '</span>';
						_.title = tooltip;
					}
				);
				addKey('` or ~', 'Toggle Light Mode', 'Tilde or grave or backquote');
				addKey('e', 'Toggle External Contacts');
				addKey('h', 'Toggle HR');
				addKey('i', 'Toggle Internal Users');
				addKey('k', 'Toggle Timekeep');
				addKey('m', 'Toggle My Data');
				addKey('n', 'Toggle Nav Menu');
				addKey('p', 'Toggle Project Hub');
				addKey('s', 'Toggle Settings');
				addKey('t', 'Toggle Task Hub');
			}
		);


		CreatePagePanel(
			this.e_content, true, true, 'flex-grow:0.0;flex-basis:100%;max-height:1.5rem;min-height:1.5rem;align-content:start;overflow:hidden;',
			x =>
			{
				x.className += ' expanding-panel';
				const title_style = 'text-align:center;font-size:0.8rem;font-weight:bold;min-width:100%;letter-spacing:2px;height:1.75rem;align-content:center;';
				addElement(x, 'div', '', title_style, _ => { _.innerText = 'ABOUT AURA'; });

				const about_style = 'text-align:center;margin:2px;font-size:0.7rem;align-content:center;flex-basis:100%;flex-grow:1.0;';
				const addAbout = (text = '') => CreatePagePanel(x, false, false, about_style, _ => { _.innerHTML = text; });
				addAbout('AURA stands for Arrow User & Resource Assistant.');
				addAbout('AURA is a home-grown tool used to manage company operations at Arrow Land Group on several distinct levels.');
				addAbout('AURA utilizes a Microsoft account for login, but is prepared to accomodate database backends outside of the Microsoft ecosystem.');
				addAbout('AURA itself has no external dependencies, thus it can run in any standard web browser and could be made portable to run locally on any device with a standard browser. This also means AURA avoids any vulnerabilities that might be introduced by commonly used web dependencies like <a href="https://www.upguard.com/blog/critical-middleware-bypass-vulnerability-in-next-js-cve-2025-29927" target="_blank">Next.js</a>.');
				addAbout('AURA is a static site, meaning it runs entirely on your device aside from external service calls like SharePoint.');
				addAbout('© 2025 Arrow Land Group LLC');
			}
		);


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

		let last_value_update_ts = new Date();
		const handleMouse = (e, force = false) =>
		{
			if (!isclicking) return;

			let now = new Date();
			let value_update_delta = now - last_value_update_ts;
			if (!force && value_update_delta < 70) return;

			last_value_update_ts = now;

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
					handleMouse(e, true);
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