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

	static RegisterOption(key, defaultValue) { UserSettings.SetOptionValue(key, defaultValue, true); }

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
		if (existing_index < 0) { if (addIfNew) UserSettings.options.push(new UserSettingsOption(option_key, value)); }
		else UserSettings.options[existing_index].value = value;
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
				let kvp = loaded_options[x];
				UserSettings.SetOptionValue(kvp.key, kvp.value);
			}
		}
		DebugLog.SubmitGroup();
	}
}


Modules.Report('User Settings', 'This module stores users options that affect general aspects of AURA.');
Autosave.HookSaveEvent(() => { UserSettings.SaveToStorage(); });
