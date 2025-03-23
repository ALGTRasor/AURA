import { Autosave } from "./autosave.js";
import { DebugLog } from "./debuglog.js";
import { Modules } from "./modules.js";

const lskey_usersettings = 'blob_user_settings';

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
			DebugLog.Log('cfg: ' + option_key + ' = ' + value);
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
}

Autosave.HookSaveEvent(() => { UserSettings.SaveToStorage(); });
UserSettings.RegisterOption('theme-color', '#f0f');
Modules.Report("User Settings");