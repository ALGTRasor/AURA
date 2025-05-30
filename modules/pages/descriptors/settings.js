import { About } from "../../about.js";
import { Autosave } from "../../autosave.js";
import { DevMode } from "../../devmode.js";
import { addElement, CreatePagePanel } from "../../utils/domutils.js";
import { clamp } from "../../utils/mathutils.js";
import { Modules } from "../../modules.js";
import { PageManager } from "../../pagemanager.js";
import { GlobalStyling } from "../../ui/global_styling.js";
import { UserAccountInfo } from "../../useraccount.js";
import { UserSettings } from "../../usersettings.js";
import { Hotkeys } from "../../utils/hotkeys.js";
import { PageDescriptor } from "../pagebase.js";
import { Help } from "./help.js";
import { AppInfo } from "../../app_info.js";
import { Ripples } from "../../ui/ripple.js";


class SettingControl
{
	constructor(parent = {}, label = '', icon = '')
	{
		this.parent = parent;
		this.label = label;
		this.icon = icon;
	}

	CreateElements() { }
}

class SettingSlider extends SettingControl
{
	constructor(parent = {}, label = '', icon = '', initial_value = 0.5, value_step = 0.0, tooltip = () => '', onValueChange = _ => { })
	{
		super(parent, label, icon);
		this.value = initial_value;
		this.tooltip = tooltip;
		this.value_step = value_step;
		this.onValueChange = onValueChange;
		this.dragging = false;

		this.CreateElements();
	}

	CreateElements()
	{
		this.e_slider = document.createElement('div');
		this.e_slider.className = 'setting-root setting-root-slider';
		this.e_slider.tabIndex = '0';

		if (this.icon)
		{
			this.e_icon = document.createElement('i');
			this.e_icon.className = 'material-symbols icon';
			this.e_icon.innerText = this.icon;
			this.e_icon.style.color = 'rgba(255,255,255,' + (this.value * 0.6 + 0.4) + ')';
			this.e_icon.style.textShadow = '0px 0px 6px rgba(255,255,255,' + this.value + ')';
			this.e_slider.appendChild(this.e_icon);
		}
		else
		{
			this.e_icon = null;
		}

		this.e_label = document.createElement('span');
		this.e_label.innerText = this.label;
		this.e_slider.appendChild(this.e_label);

		this.e_fill = document.createElement('div');
		this.e_fill.className = 'setting-slider-fill';
		this.e_slider.appendChild(this.e_fill);

		this.last_value_update_ts = 0;
		this.UpdateStyling();

		this.parent.appendChild(this.e_slider);
		this.e_slider.addEventListener('mousedown', e => this.DragStart(e));
	}

	UpdateStyling()
	{
		if (this.value > 0.0) this.e_slider.classList.add('setting-root-on');
		else this.e_slider.classList.remove('setting-root-on');

		this.e_fill.style.width = (this.value * 100) + '%';
		this.e_icon.style.color = 'rgba(255,255,255,' + (this.value * 0.6 + 0.4) + ')';
		this.e_icon.style.textShadow = '0px 0px 6px rgba(255,255,255,' + this.value + ')';

		if (this.tooltip) this.e_slider.title = this.tooltip();
	}

	HandleMouse(e, force = false) 
	{
		if (!this.dragging) return;

		this.e_slider.focus();

		const update_delay_ms = 50;
		let now = new Date();
		if (!force && (now - this.last_value_update_ts) < update_delay_ms) return;
		this.last_value_update_ts = now;

		let slider_rect = this.e_slider.getBoundingClientRect();
		let click_phase = (e.pageX - slider_rect.x) / slider_rect.width;
		click_phase = (click_phase - 0.5) * 1.025 + 0.5;
		click_phase = clamp(click_phase, 0.0, 1.0)
		if (this.value_step > 0.0) click_phase = Math.round(click_phase / this.value_step) * this.value_step;
		this.value = click_phase;

		if (this.onValueChange) this.onValueChange(this);
		this.UpdateStyling();

		Autosave.InvokeSoon();
	}

	DragStart(e)
	{
		if (this.dragging !== true)
		{
			this.dragging = true;
			this.HandleMouse(e); // first update on mouse down
			window.addEventListener('mouseup', e => this.DragEnd(e));
			window.addEventListener('mousemove', e => this.HandleMouse(e));// one update per mouse move
			this.e_slider.style.cursor = 'grabbing';
			Ripples.SpawnFromElement(this.e_slider, 0);
		}
	}

	DragEnd(e)
	{
		if (this.dragging === true)
		{
			this.e_slider.blur();
			window.removeEventListener('mouseup', e => this.DragEnd(e));
			window.removeEventListener('mousemove', e => this.HandleMouse(e));
			this.HandleMouse(e, true); // last update on mouse up
			this.dragging = false;
			this.e_slider.style.cursor = 'grab';
			Ripples.SpawnFromElement(this.e_slider, 0);
		}
	}
}

class SettingToggle extends SettingControl
{
	constructor(parent = {}, label = '', icon = '', toggled = false, tooltip = () => '', onValueChange = _ => { })
	{
		super(parent, label, icon);
		this.toggled = toggled;
		this.tooltip = tooltip;
		this.onValueChange = onValueChange;

		this.CreateElements();
	}

	CreateElements()
	{
		this.e_root = addElement(this.parent, 'div', 'setting-root setting-root-toggle');

		if (this.toggled) this.e_root.classList.add('setting-root-on');

		this.e_root.innerHTML = '<span>' + this.label + '</span>' + (this.icon ? ("<i class='material-symbols icon'>" + this.icon + "</i>") : "");
		this.e_root.addEventListener(
			'click',
			_ =>
			{
				this.toggled = !this.toggled;
				if (this.onValueChange) this.onValueChange(this);
				this.UpdateStyle();
				Ripples.SpawnFromElement(this.e_root, 0);
			}
		);

		this.UpdateStyle();
	}

	UpdateStyle()
	{
		if (this.tooltip) this.e_root.title = this.tooltip();
		if (this.toggled) this.e_root.classList.add('setting-root-on');
		else this.e_root.classList.remove('setting-root-on');
	}
}

export class PageSettings extends PageDescriptor
{
	pinnable = true;
	extra_page = true;
	hidden_page = true;

	GetTitle() { return 'settings'; }
	GetIcon() { return 'settings'; }

	OnLayoutChange(instance)
	{
		if (instance.state_data.docked === true) instance.e_frame.style.maxWidth = '32rem';
		else instance.e_frame.style.maxWidth = 'unset';
	}

	OnCreateElements(instance)
	{
		if (!instance) return;

		instance.e_frame.style.minWidth = '18rem';
		instance.e_frame.style.maxWidth = '32rem';
		instance.e_frame.style.flexBasis = '12rem';
		instance.e_frame.style.flexGrow = '1.0';
		instance.e_content.style.gap = 'var(--gap-025)';


		// toggle section
		CreatePagePanel(
			instance.e_content, true, true, 'flex-grow:0.0;flex-basis:100%;max-height:1.5rem;min-height:1.5rem;align-content:start;overflow:hidden;',
			x =>
			{
				x.classList.remove('scroll-y');
				x.classList.add('expanding-panel');
				addElement(x, 'div', '', 'text-align:center;font-size:0.8rem;font-weight:bold;min-width:100%;letter-spacing:2px;height:1.75rem;align-content:center;', _ => { _.innerText = 'OPTIONS'; });

				instance.e_toggle_layoutrestore = new SettingToggle(
					x, 'remember layout', 'restore_page', UserSettings.GetOptionValue('pagemanager-restore-layout') === true, () => 'Whether or not the page layout will be restored when you load the app, or reset.',
					_ =>
					{
						UserSettings.SetOptionValue('pagemanager-restore-layout', _.toggled === true);
						Autosave.InvokeSoon();
					}
				);


				instance.e_toggle_limitwidth = new SettingToggle(
					x, 'limit width', 'width_wide', GlobalStyling.limitContentWidth.enabled === true, () => 'Whether or not to limit the width of the app to match a typical screen ratio (useful for wider screens)',
					_ =>
					{
						GlobalStyling.limitContentWidth.enabled = _.toggled === true;
						GlobalStyling.limitContentWidth.Apply(true);
					}
				);

				instance.e_toggle_hidesensitive = new SettingToggle(
					x, 'hide sensitive info', 'visibility_lock', GlobalStyling.hideSensitiveInfo.enabled === true, () => 'Whether or not sensitive information like contact details will be obscured until you hover over them.',
					_ =>
					{
						GlobalStyling.hideSensitiveInfo.enabled = _.toggled === true;
						GlobalStyling.hideSensitiveInfo.Apply(true);
					}
				);

				instance.e_toggle_spotlight = new SettingToggle(
					x, 'spotlight', 'highlight', GlobalStyling.spotlight.enabled === true, () => 'Whether or not elements on the page will be highlighted as you hover over them. Hover over an element for a moment to see the effect.',
					_ =>
					{
						GlobalStyling.spotlight.enabled = _.toggled === true;
						GlobalStyling.spotlight.Apply(true);
					}
				);

				instance.e_toggle_ripples = new SettingToggle(
					x, 'ripples', 'water_drop', GlobalStyling.ripples.enabled === true, () => 'Whether or not ripples are created from pages or certain other events.',
					_ =>
					{
						GlobalStyling.ripples.enabled = _.toggled === true;
						GlobalStyling.ripples.Apply(true);
					}
				);

				if (DevMode.active === true)
				{
					instance.e_toggle_debuglog = new SettingToggle(
						x, 'show debug log', 'problem', GlobalStyling.showDebugLog.enabled === true, () => 'Whether or not the debugging log is visible.',
						_ =>
						{
							GlobalStyling.showDebugLog.enabled = _.toggled === true;
							GlobalStyling.showDebugLog.Apply(true);
						}
					);
				}

				instance.e_slider_animspeed = new SettingSlider(
					x, 'animation speed', 'speed', GlobalStyling.animationSpeed.value, 0.05, () => 'UI animation speed',
					_ =>
					{
						GlobalStyling.animationSpeed.value = _.value;
						GlobalStyling.animationSpeed.Apply(true);
					}
				);
			}
		);


		// theme section
		CreatePagePanel(
			instance.e_content, true, true, 'flex-grow:0.0;flex-basis:100%;max-height:1.5rem;min-height:1.5rem;align-content:start;overflow:hidden;',
			x =>
			{
				x.classList.remove('scroll-y');
				x.classList.add('expanding-panel');
				const title_style = 'text-align:center;font-size:0.8rem;font-weight:bold;min-width:100%;letter-spacing:2px;height:1.75rem;align-content:center;';
				addElement(x, 'div', '', title_style, _ => { _.innerText = 'THEME'; });



				instance.e_toggle_lightmode = new SettingToggle(
					x, 'light mode', 'invert_colors', GlobalStyling.lightMode.enabled === true, () => 'Toggle light mode',
					_ =>
					{
						GlobalStyling.lightMode.enabled = _.toggled === true;
						GlobalStyling.lightMode.Apply(true);
					}
				);

				instance.e_slider_themehue = new SettingSlider(
					x, 'hue', 'palette', GlobalStyling.themeColor.hue, 0.01, () => 'UI theme hue',
					_ =>
					{
						GlobalStyling.themeColor.hue = _.value;
						GlobalStyling.themeColor.Apply(true);
						_.e_icon.style.color = 'hsl(from var(--theme-color) h 100% 50%)';
						_.e_icon.style.textShadow = '0px 0px 0.5rem hsl(from var(--theme-color) h 100% 50%)';
						updateColorWarning(instance.e_theme_color_warning);
					}
				);
				instance.e_slider_themehue.e_slider.classList.add('rainbow-foreground-h');
				instance.e_slider_themehue.e_fill.style.backgroundOpacity = '0%';

				instance.e_slider_themesat = new SettingSlider(
					x, 'saturation', 'opacity', GlobalStyling.themeColor.saturation, 0.05, () => 'UI theme saturation',
					_ =>
					{
						GlobalStyling.themeColor.saturation = _.value;
						GlobalStyling.themeColor.Apply(true);
						_.e_icon.style.color = 'hsl(from var(--theme-color) h 100% 50%)';
						_.e_icon.style.textShadow = '0px 0px 0.5rem hsl(from var(--theme-color) h 100% 50%)';
						updateColorWarning(instance.e_theme_color_warning);
					}
				);
				instance.e_slider_themesat.e_slider.classList.add('gradient-saturation-foreground-h');
				instance.e_slider_themesat.e_fill.style.backgroundOpacity = '50%';



				instance.e_slider_contrast = new SettingSlider(
					x, 'contrast', 'contrast', GlobalStyling.themeContrast.value, 0.05, () => 'UI theme contrast',
					_ =>
					{
						GlobalStyling.themeContrast.value = _.value;
						GlobalStyling.themeContrast.Apply(true);
						updateColorWarning(instance.e_theme_color_warning);
					}
				);

				instance.e_slider_brightness = new SettingSlider(
					x, 'brightness', 'brightness_7', GlobalStyling.themeBrightness.value, 0.05, () => 'UI theme brightness',
					_ =>
					{
						GlobalStyling.themeBrightness.value = _.value;
						GlobalStyling.themeBrightness.Apply(true);
						updateColorWarning(instance.e_theme_color_warning);
					}
				);
				instance.e_slider_brightness.e_slider.classList.add('gradient-value-foreground-h');







				instance.e_slider_spacing = new SettingSlider(
					x, 'spacing', 'compress', GlobalStyling.spacing.value, 0.05, () => 'UI spacing',
					_ =>
					{
						GlobalStyling.spacing.value = _.value;
						GlobalStyling.spacing.Apply(true);
					}
				);

				instance.e_theme_color_warning = addElement(x, 'div', 'setting-root-warning', null, e => { e.innerText = '' });
			}
		);

		const updateColorWarning = (e) =>
		{
			let hue = GlobalStyling.themeColor.hue;
			let sat = GlobalStyling.themeColor.saturation;
			let contrast = GlobalStyling.themeContrast.value;
			let brightness = GlobalStyling.themeBrightness.value;

			if ((hue < 0.43 || hue > 0.95) && sat > 0.25)
			{
				e.innerText = 'COLOR MIGHT CONFLICT WITH COLOR CODING';
				e.style.color = '#fa0';
				e.style.display = 'block';
			}
			else if (((hue > 0.55 && hue < 0.75) || (hue < 0.1 || hue > 0.9)) && sat > 0.75)
			{
				e.innerText = 'COLOR MIGHT MAKE SOME TEXT OR ICONS DIFFICULT TO READ';
				e.style.color = '#fa0';
				e.style.display = 'block';
			}
			else if (contrast < 0.15 || contrast > 0.85)
			{
				e.innerText = 'CONTRAST MIGHT MAKE SOME TEXT OR ICONS DIFFICULT TO READ';
				e.style.color = '#fa0';
				e.style.display = 'block';
			}
			else if (brightness < 0.15 || (brightness > 0.75 && contrast > 0.75))
			{
				e.innerText = 'BRIGHTNESS MIGHT MAKE SOME TEXT OR ICONS DIFFICULT TO READ';
				e.style.color = '#fa0';
				e.style.display = 'block';
			}
			else 
			{
				e.innerText = 'looks fine to me ¯\\(ツ)/¯';
				e.style.color = '#0f08';
				e.style.display = 'block';
			}
		};
		updateColorWarning(instance.e_theme_color_warning);



		// modules section
		if (DevMode.active === true)
		{
			CreatePagePanel(
				instance.e_content, true, true, 'flex-grow:0.0;flex-basis:100%;max-height:1.5rem;min-height:1.5rem;align-content:start;overflow:hidden;',
				x =>
				{
					x.classList.remove('scroll-y');
					x.classList.add('expanding-panel');
					addElement(x, 'div', '', 'text-align:center;font-size:0.8rem;font-weight:bold;min-width:100%;letter-spacing:2px;height:1.75rem;align-content:center;', _ => { _.innerText = 'LOADED MODULES'; });
					for (let report_id in Modules.reported)
					{
						let module_info = Modules.reported[report_id];
						CreatePagePanel(
							x, false, false, 'text-align:center;font-size:0.7rem;align-content:center;',
							_ =>
							{
								_.innerText = module_info.name;
								_.title = module_info.desc;
								_.classList.add('hover-lift');
							}
						);
					}
				}
			);
		}

		// hotkeys section
		CreatePagePanel(
			instance.e_content, true, true, 'flex-grow:0.0;flex-basis:100%;max-height:1.5rem;min-height:1.5rem;align-content:start;overflow:hidden;',
			x =>
			{
				x.classList.remove('scroll-y');
				x.classList.add('expanding-panel');
				const title_style = 'text-align:center;font-size:0.8rem;font-weight:bold;min-width:100%;letter-spacing:2px;height:1.75rem;align-content:center;';
				addElement(x, 'div', '', title_style, _ => { _.innerText = 'HOTKEYS'; });

				const about_style = 'text-align:center;font-size:0.7rem;align-content:center;flex-basis:100%;flex-grow:1.0;';
				const addKey = (key = '', effect = '', tooltip = '', allow_emulate = true) => CreatePagePanel(
					x, false, false, about_style,
					_ =>
					{
						_.innerHTML = '<span style="position:absolute;display:block;inset:0;right:80%;align-content:center;background:#0003;">' + key.toUpperCase() + '</span>'
							+ '<span style="position:absolute;display:block;inset:0;left:20%;align-content:center;text-align:left;padding-left:0.5rem;">' + effect + '</span>';
						if (allow_emulate)
						{
							_.style.cursor = 'pointer';
							_.title = tooltip;
							_.addEventListener('click', e => { Hotkeys.Emulate(key, e.ctrlKey, e.altKey, e.shiftKey) });
						}
					}
				);

				for (let hotkey_id in Hotkeys.descriptors)
				{
					let hotkey = Hotkeys.descriptors[hotkey_id];
					if ('permission' in hotkey && !UserAccountInfo.HasPermission(hotkey.permission)) continue;
					if ('dev_only' in hotkey && hotkey.dev_only !== DevMode.active) continue;
					let label = 'key_description' in hotkey ? hotkey.key_description : hotkey.key;
					addKey(label, hotkey.action_description, 'Select to trigger this hotkey now', hotkey.requires_target !== true);
				}
			}
		);

		// permissions section
		CreatePagePanel(
			instance.e_content, true, true, 'flex-grow:0.0;flex-basis:100%;max-height:1.5rem;min-height:1.5rem;align-content:start;overflow:hidden;',
			x =>
			{
				x.classList.remove('scroll-y');
				x.classList.add('expanding-panel');
				addElement(x, 'div', '', 'text-align:center;font-size:0.8rem;font-weight:bold;min-width:100%;letter-spacing:2px;height:1.75rem;align-content:center;', _ => { _.innerText = 'MY PERMISSIONS'; });

				//const get_key = _ => _.Title.split('.')[0];
				const get_key = _ =>
				{
					let last_dot_id = _.Title.split('').reverse().indexOf('.');
					if (last_dot_id < 0) return 'global';
					return _.Title.substring(0, _.Title.length - last_dot_id);
				};
				const match_first_index = (v, i, self) => self.indexOf(v) === i;
				const not_deprecated = _ => _.permission_flags === undefined || _.permission_flags.indexOf('deprecated') < 0;
				const group_from_key = (_, permissions) => { return { key: _, perms: permissions.filter(p => p.Title.startsWith(_)) }; };

				let perms = UserAccountInfo.user_permissions.filter(not_deprecated);
				let perm_groups = perms.map(get_key).filter(match_first_index).map(_ => group_from_key(_, perms));
				let base_hue = Math.random();
				for (let gid in perm_groups)
				{
					let hue = base_hue;
					base_hue += 0.45;
					perm_groups[gid].color = `hsl(${Math.round(hue * 3600) * 0.1}deg 30% 100%)`;
				}

				for (let pid in perms)
				{
					let info = perms[pid];
					let group = perm_groups.find(x => info.Title.startsWith(x.key));
					CreatePagePanel(
						x, false, false, 'text-align:center;font-size:0.7rem;align-content:center;',
						y =>
						{
							y.innerText = info.permission_name;
							y.title = info.permission_desc;
							y.style.setProperty('--theme-color', group.color);
							y.classList.add('hover-lift');
						}
					);
				}
			}
		);

		// about section
		if (false && DevMode.active)
		{
			CreatePagePanel(
				instance.e_content, true, true, 'flex-grow:0.0;flex-basis:100%;max-height:1.5rem;min-height:1.5rem;align-content:start;overflow:hidden;',
				x =>
				{
					x.classList.remove('scroll-y');
					x.classList.add('expanding-panel');
					const title_style = 'text-align:center;font-size:0.8rem;font-weight:bold;min-width:100%;letter-spacing:2px;height:1.75rem;align-content:center;';
					addElement(x, 'div', '', title_style, _ => { _.innerText = 'ABOUT ' + AppInfo.name.toUpperCase(); });

					const about_style = 'text-align:center;font-size:0.7rem;align-content:center;flex-basis:100%;flex-grow:1.0;';
					const addAbout = (text = '') => CreatePagePanel(x, false, false, about_style, _ => { _.innerHTML = text; });

					About.GetLines().then(
						_ => 
						{
							for (let aboutid in About.all)
							{
								addAbout(About.all[aboutid]);
							}
						}
					);



					//addAbout('AURA stands for Arrow User Resource Assistant.');
					//addAbout('AURA is a home-grown tool used to manage company operations at Arrow Land Group on several distinct levels.');
					//addAbout('AURA utilizes a Microsoft account for login, but is prepared to accomodate database backends outside of the Microsoft ecosystem.');
					//addAbout('AURA itself has no external dependencies, thus it can run in any standard web browser and could be made portable to run locally on any device with a standard browser. This also means AURA avoids any vulnerabilities that might be introduced by commonly used web dependencies like <a href="https://www.upguard.com/blog/critical-middleware-bypass-vulnerability-in-next-js-cve-2025-29927" target="_blank">Next.js</a>.');
					//addAbout('AURA is a static site, meaning it runs entirely on your device aside from external service calls like SharePoint.');
					//addAbout('© 2025 Arrow Land Group LLC');
				}
			);
		}
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

		let dragging = false;

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
			if (!dragging) return;

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
				dragging = true;
				handleMouse(e);
				Ripples.SpawnFromElement(e_slider, 0);

				const fn_MouseMove = e => { handleMouse(e); };
				const fn_MouseUp = e =>
				{
					handleMouse(e, true);
					Ripples.SpawnFromElement(e_slider, 0);
					dragging = false;
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

PageManager.RegisterPage(new PageSettings('settings'), 's', 'Settings');
Help.Register(
	'pages.settings', 'The Settings Page',
	'The Settings page allows Users to configure various aspects of ' + AppInfo.name + '.'
	+ '\nUsers can also find extra information in Settings, such as the hotkeys they can use or which permissions they have been granted.'
);