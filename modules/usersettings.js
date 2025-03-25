import { AppEvents } from "./appevents.js";
import { Autosave } from "./autosave.js";
import { DebugLog } from "./debuglog.js";
import { Modules } from "./modules.js";

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
			DebugLog.Log('cfg: +' + option_key + ' ( ' + value + ' )');
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
	}

	static UpdateSpotlight()
	{
		let use_spotlight = UserSettings.GetOptionValue('spotlight') === true;
		if (e_spotlight) e_spotlight.style.display = use_spotlight ? 'block' : 'none';
	}

	static UpdateHideSensitiveInfo()
	{
		let hide_sensitive = UserSettings.GetOptionValue('hide-sensitive-info') === true;
		document.documentElement.style.setProperty('--sensitive-info-cover', hide_sensitive ? 1.0 : 0.0);
	}

	static UpdateLimitContentWidth()
	{
		let limit = UserSettings.GetOptionValue('limit-content-width') === true;
		document.documentElement.style.setProperty('--limit-content-width', limit ? 1.0 : 0.0);
	}

	static UpdateDebugLog()
	{
		let show = UserSettings.GetOptionValue('show-debug-log') === true;
		DebugLog.ui.e_root.style.display = show ? 'block' : 'none';
	}

	static UpdateAnimSpeed()
	{
		let anim_speed = UserSettings.GetOptionValue('anim-speed');
		document.documentElement.style.setProperty('--trans-dur-mult', 1.5 * Math.pow(1.0 - anim_speed, 2));
	}

	static UpdateThemeColor()
	{
		let theme_hue = UserSettings.GetOptionValue('theme-hue');
		let theme_sat = UserSettings.GetOptionValue('theme-saturation');

		document.documentElement.style.setProperty('--theme-color', 'hsl(' + Math.round(theme_hue * 360) + 'deg, ' + Math.round(theme_sat * 100) + '%, 70%)');
	}
}

//UserSettings.RegisterOption('theme-color', '#f0f');
//UserSettings.RegisterOption('light-mode', false);
//UserSettings.RegisterOption('spotlight', false);
//UserSettings.RegisterOption('show-debug-log', true);
//UserSettings.RegisterOption('anim-speed', 0.5);
//UserSettings.RegisterOption('theme-hue', 0.0);
//UserSettings.RegisterOption('theme-saturation', 1.0);

Modules.Report("User Settings");

Autosave.HookSaveEvent(() => { UserSettings.SaveToStorage(); });
