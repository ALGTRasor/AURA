import { DevMode } from "./devmode.js";
import { addElement } from "./utils/domutils.js";
import { GlobalStyling } from "./ui/global_styling.js";
import { NotificationLog } from "./notificationlog.js";

class DebugLogGroup
{
	static Nothing = new DebugLogGroup(null, null);

	title = '';
	e_root = {};
	e_parent = {};
	messages = [];
	parent_group = DebugLogGroup.Nothing;

	constructor(log_root, title = '', parent_group = null)
	{
		this.title = title;
		this.parent_group = parent_group;
		if (parent_group && parent_group.e_root) this.e_parent = parent_group.e_root;
		else this.e_parent = log_root;

		this.e_root = addElement(this.e_parent, 'div', 'debug-log-group', null, _ => { _.innerText = this.title; });
	}

	IsValid() { return typeof this.title === 'string' && this.title.length > 0; }

	Append(message = '', color = '')
	{
		this.messages.push(message);
		this.AppendElements(message, color);
	}

	RecreateElements()
	{
		this.e_root.innerHTML = '';
		for (let message_id in this.messages) this.AppendElements(this.messages[message_id]);
	}

	AppendElements(message = '', color = '')
	{
		addElement(
			this.e_root, 'div', 'debug-log-item', null,
			_ =>
			{
				_.title = message;
				_.innerText = message;
				_.style.color = color;
			}
		);
	}
}



export class DebugLog
{
	static lskeys = { show_debug_log: 'show-debug-log' };

	static created = false;
	static active_group = null;

	static StartNewGroup(title = '')
	{
		if (DebugLog.created === false) return;
		DebugLog.active_group = new DebugLogGroup(DebugLog.e_root, title, DebugLog.active_group);
	}

	static CloseCurrentGroup()
	{
		if (DebugLog.created === false) return;
		if (DebugLog.active_group) DebugLog.active_group = DebugLog.active_group.parent_group;
	}

	static VerifyCreated()
	{
		if (DebugLog.created !== true) DebugLog.CreateElements();
		return DebugLog.created === true;
	}

	static CanCreateElements() { return DevMode.available === true && GlobalStyling.showDebugLog.enabled === true; }

	static CreateElements()
	{
		if (DebugLog.created === true) return;
		if (DebugLog.CanCreateElements() === false) return;

		if (DebugLog.e_root) document.body.appendChild(DebugLog.e_root);
		else DebugLog.e_root = addElement(document.body, 'div', 'debug-log-root', null, _ => { _.id = 'debug-log-root'; });

		DebugLog.created = true;

		this.RefreshVisibility();
	}

	static RemoveElements()
	{
		if (DebugLog.created !== true) return;
		DebugLog.e_root.remove();
		DebugLog.created = false;
	}

	static Show() { if (DebugLog.VerifyCreated() === true) DebugLog.e_root.style.display = 'flex'; }
	static Hide() { if (DebugLog.created === true) DebugLog.e_root.style.display = 'none'; }
	static RefreshVisibility() { if (DebugLog.CanCreateElements() === true) DebugLog.Show(); else DebugLog.Hide(); }
	static RecreateElements() { DebugLog.RemoveElements(); DebugLog.CreateElements(); }

	static Log(message, appendToConsole = true, color = '', allow_duplicates = false)
	{
		message = message.trim();

		if (DevMode.active === true) NotificationLog.Log(message, color);

		if (DebugLog.active_group) DebugLog.active_group.Append(message, color);
		else
		{
			addElement(
				DebugLog.e_root, 'div', 'debug-log-item', null,
				_ =>
				{
					_.innerHTML = message;
					_.title = message;
					if (typeof color === 'string' && color.length > 0) _.color = color;
				}
			);
		}
		if (appendToConsole) console.info(message);
	}

	static GetEntryColor(message = '', color = '')
	{
		if (color && color.length > 0) return color;
		else if (message.endsWith('...')) return '#ff0';
		else if (message.startsWith('...')) return '#0ff';
		else if (message.startsWith('~')) return '#faf';
		else if (message.startsWith('!')) return '#f00';
		return '';
	}

	/*
	static AppendMessageElement(message, color = '', allow_duplicates = false)
	{
		if (DebugLog.VerifyCreated() !== true) return;

		if (!allow_duplicates && DebugLog.entry_elements.length > 0 && DebugLog.entry_elements[DebugLog.entry_elements.length - 1].title == message)
		{
			let last_e = DebugLog.entry_elements[DebugLog.entry_elements.length - 1];
			if (last_e.copyCount) last_e.copyCount++;
			else last_e.copyCount = 2;
			last_e.innerHTML = message + "<div class='debug-log-item-count'> x" + last_e.copyCount + "</div>";
		}
		else
		{
			let e_log_entry = document.createElement('div');
			e_log_entry.className = 'debug-log-item';
			e_log_entry.innerHTML = message;
			e_log_entry.title = message;
			e_log_entry.style.marginLeft = (DebugLog.open_groups.length * 6) + "px";
			if (DebugLog.open_groups.length > 0) e_log_entry.style.background = 'var(--theme-color-10)';

			let ecol = DebugLog.GetEntryColor(message, color);
			if (ecol && ecol.length > 0) e_log_entry.style.color = ecol;

			DebugLog.entry_elements.push(e_log_entry);

			DebugLog.e_root.appendChild(e_log_entry);
		}
	}
	*/

	static Clear()
	{
		DebugLog.e_root.innerHTML = '';
		DebugLog.e_root.innerHTML = '';
	}


	static StartGroup(group_name)
	{
		DebugLog.StartNewGroup(group_name);
	}

	static SubmitGroup(background = '', color = '')
	{
		if (DebugLog.active_group)
		{
			if (typeof background === 'string' && background.length > 0) DebugLog.active_group.e_root.style.setProperty('--theme-color', background);
			if (typeof color === 'string' && color.length > 0) DebugLog.active_group.e_root.style.setProperty('color', color);
		}
		DebugLog.CloseCurrentGroup();
	}
}

if (!window.fxn) window.fxn = {};
window.fxn.DebugLog = DebugLog.Log;

window.setTimeout(
	_ =>
	{
		DevMode.AddActivateAction(_ => DebugLog.RefreshVisibility());
		DevMode.AddDeactivateAction(_ => DebugLog.RemoveElements());
		DebugLog.RefreshVisibility();
	},
	300
);