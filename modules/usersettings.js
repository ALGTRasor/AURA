import { AppEvents } from "./appevents.js";
import { Autosave } from "./autosave.js";
import { DebugLog } from "./debuglog.js";
import { Modules } from "./modules.js";
import { PageManager } from "./pagemanager.js";

const lskey_usersettings = 'blob_user_settings';
const e_spotlight = document.getElementById('spotlight');
//const e_tgl_lightmode = document.getElementById('action-bar-btn-lightmode');

export class UserSettingsOption
{
	key = '';
	value = '';
	defaultValue = '';

	static NullOption = new UserSettingsOption('null_option', null);

	constructor(key, defaultValue)
	{
		this.key = key;
		this.value = defaultValue;
		this.defaultValue = defaultValue;
	}
}

export class UserSettings
{
	static options = [];

	static RegisterOption(key, defaultValue)
	{
		UserSettings.SetOptionValue(key, defaultValue, true);
	}

	static GetOptionIndex(option_key)
	{
		for (let x = 0; x < UserSettings.options.length; x++)
		{
			if (option_key == UserSettings.options[x].key)
				return x;
		}
		return -1;
	}

	static SetOptionValue(option_key, value, addIfNew = true)
	{
		let existing_index = UserSettings.GetOptionIndex(option_key);
		if (existing_index < 0) 
		{
			if (!addIfNew) return;
			UserSettings.options.push(new UserSettingsOption(option_key, value));
			//DebugLog.Log('cfg: +' + option_key + ' ( ' + value + ' )');
		}
		else if (UserSettings.options[existing_index].value != value)
		{
			UserSettings.options[existing_index].value = value;
			//DebugLog.Log('cfg: ' + option_key + ' = ' + value);
		}
	}

	static GetOptionValue(option_key, defaultValue = null)
	{
		let existing_index = UserSettings.GetOptionIndex(option_key);
		if (existing_index < 0) return defaultValue;
		return UserSettings.options[existing_index].value;
	}

	static SaveToStorage()
	{
		let blob = [];
		for (let x = 0; x < UserSettings.options.length; x++)
		{
			let o = UserSettings.options[x];
			blob.push({ key: o.key, value: o.value });
		}
		localStorage.setItem(lskey_usersettings, JSON.stringify({ items: blob }));
	}

	static LoadFromStorage()
	{
		DebugLog.StartGroup('loading user settings');
		let blob = localStorage.getItem(lskey_usersettings);
		if (blob)
		{
			let loaded_options = JSON.parse(blob).items;
			for (let x = 0; x < loaded_options.length; x++)
			{
				let o = loaded_options[x];
				UserSettings.SetOptionValue(o.key, o.value);
			}
		}
		DebugLog.SubmitGroup();
	}

	static HookOptionEvents()
	{
		AppEvents.onToggleLightMode.RequestSubscription(UserSettings.UpdateLightMode);
		AppEvents.onToggleSpotlight.RequestSubscription(UserSettings.UpdateSpotlight);
		AppEvents.onToggleHideSensitiveInfo.RequestSubscription(UserSettings.UpdateHideSensitiveInfo);
		AppEvents.onToggleLimitWidth.RequestSubscription(UserSettings.UpdateLimitContentWidth);
		AppEvents.onToggleDebugLog.RequestSubscription(UserSettings.UpdateDebugLog);
		AppEvents.onSetAnimSpeed.RequestSubscription(UserSettings.UpdateAnimSpeed);
		AppEvents.onSetThemeColor.RequestSubscription(UserSettings.UpdateThemeColor);
	}

	static InitializeDefaults()
	{
		UserSettings.RegisterOption('anim-speed', 0.5);
		UserSettings.RegisterOption('theme-hue', 0.98);
		UserSettings.RegisterOption('theme-saturation', 0.5);

		UserSettings.RegisterOption('spotlight', true);
		UserSettings.RegisterOption('hide-sensitive-info', true);

		UserSettings.RegisterOption('pagemanager-restore-layout', true);
	}

	static UpdateOptionEffects()
	{
		UserSettings.UpdateLightMode();
		UserSettings.UpdateSpotlight();
		UserSettings.UpdateHideSensitiveInfo();
		UserSettings.UpdateLimitContentWidth();
		UserSettings.UpdateDebugLog();
		UserSettings.UpdateAnimSpeed();
		UserSettings.UpdateThemeColor();
	}

	static UpdateLightMode()
	{
		let is_light_mode = UserSettings.GetOptionValue('light-mode') === true;
		document.documentElement.style.setProperty('--theme-invert', is_light_mode ? 1.0 : 0.0);
		//if (is_light_mode) e_tgl_lightmode.innerHTML = "Light Mode<i class='material-symbols icon'>light_mode</i>";
		//else e_tgl_lightmode.innerHTML = "Dark Mode<i class='material-symbols icon'>dark_mode</i>";
		Autosave.InvokeSoon();
	}

	static UpdateSpotlight()
	{
		let use_spotlight = UserSettings.GetOptionValue('spotlight') === true;
		if (e_spotlight) e_spotlight.style.display = use_spotlight ? 'block' : 'none';
		Autosave.InvokeSoon();
	}

	static UpdateHideSensitiveInfo()
	{
		let hide_sensitive = UserSettings.GetOptionValue('hide-sensitive-info') === true;
		document.documentElement.style.setProperty('--sensitive-info-cover', hide_sensitive ? 1.0 : 0.0);
		Autosave.InvokeSoon();
	}

	static UpdateLimitContentWidth()
	{
		let limit = UserSettings.GetOptionValue('limit-content-width') === true;
		document.documentElement.style.setProperty('--limit-content-width', limit ? 1.0 : 0.0);

		PageManager.onLayoutChange.Invoke();
		Autosave.InvokeSoon();
	}

	static UpdateDebugLog()
	{
		let show = UserSettings.GetOptionValue('show-debug-log') === true;
		DebugLog.ui.e_root.style.display = show ? 'block' : 'none';
		Autosave.InvokeSoon();
	}

	static UpdateAnimSpeed()
	{
		let anim_speed = UserSettings.GetOptionValue('anim-speed');
		if (anim_speed >= 1.0)
		{
			document.body.classList.add('notransitions');
		}
		else
		{
			document.body.classList.remove('notransitions');
			document.documentElement.style.setProperty('--trans-dur-mult', 1.5 * (1.0 - anim_speed));
		}
		Autosave.InvokeSoon();
	}

	static UpdateThemeColor()
	{
		let theme_hue = UserSettings.GetOptionValue('theme-hue');
		let theme_sat = UserSettings.GetOptionValue('theme-saturation');

		document.documentElement.style.setProperty('--theme-color', 'hsl(' + Math.round(theme_hue * 360) + 'deg, ' + Math.round(theme_sat * 100) + '%, ' + (100 - Math.round(theme_sat * 50)) + '%)');

		Autosave.InvokeSoon();
	}
}


Modules.Report('User Settings', 'This module stores users options that affect general aspects of AURA.');

UserSettings.UpdateOptionEffects();

Autosave.HookSaveEvent(() => { UserSettings.SaveToStorage(); });
