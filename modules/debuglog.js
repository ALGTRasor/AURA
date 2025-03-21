import { DevMode } from "./devmode.js";
import { Fax } from "./fax.js";
import { Modules } from "./modules.js";

export class DebugLog
{
	static entries = [];
	static entry_elements = [];
	static ui = {};

	static Create()
	{
		if (DebugLog.ui.e_root) return;

		DebugLog.ui.e_root = document.createElement('div');
		DebugLog.ui.e_root.id = 'debug-log-root';
		DebugLog.ui.e_root.className = 'debug-log-root';
		document.body.appendChild(DebugLog.ui.e_root);
	}

	static Hide() { if (DebugLog.ui.e_root) DebugLog.ui.e_root.style.display = 'none'; }
	static Show() { if (DebugLog.ui.e_root) DebugLog.ui.e_root.style.display = 'flex'; }

	static async FillFax() { for (let x = 0; x < 30; x++) DebugLog.Log(await Fax.GetOne(), false); }

	static Log(message, appendToConsole = true, color = '', allow_duplicates = false)
	{
		message = message.trim();

		if (DebugLog.current_group && DebugLog.current_group.name)
		{
			DebugLog.current_group.entries.push(message);
		}
		else
		{
			DebugLog.AppendMessageElement(message, color, allow_duplicates);
		}
		if (appendToConsole) console.info(message);
	}

	static GetEntryColor(message = '', color = '')
	{
		if (color && color.length > 0) return color;
		else if (message.endsWith('...')) return '#ff0';
		else if (message.startsWith('...')) return '#0ff';
		else if (message.startsWith('~')) return '#f0f';
		else if (message.startsWith('!')) return '#f00';
		return '';
	}

	static AppendMessageElement(message, color = '', allow_duplicates = false)
	{
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

			let ecol = DebugLog.GetEntryColor(message, color);
			if (ecol && ecol.length > 0) e_log_entry.style.color = ecol;

			DebugLog.entry_elements.push(e_log_entry);

			if (!DebugLog.ui.e_root) DebugLog.Create();
			DebugLog.ui.e_root.appendChild(e_log_entry);
		}
	}

	static Clear()
	{
		for (let e in DebugLog.entry_elements) e.remove();
		DebugLog.entry_elements = [];
		DebugLog.ui.e_root.innerHTML = '';
	}

	static open_groups = [];
	static current_group = {};
	static StartGroup(group_name)
	{
		DebugLog.current_group = { name: group_name, entries: [] };
		DebugLog.open_groups.push(DebugLog.current_group);
		let e_sep = DebugLog.InjectSeparator(group_name, 'var(--theme-color-20)');
		e_sep.style.borderRadius = '6px 6px 0px 0px';
		e_sep.style.marginTop = '2px';
	}

	static SubmitGroup()
	{
		if (DebugLog.open_groups.length < 1 || !DebugLog.current_group || !DebugLog.current_group.name) return; // no group was open
		for (let eid in DebugLog.current_group.entries) DebugLog.AppendMessageElement(DebugLog.current_group.entries[eid]);

		let e_sep = DebugLog.InjectSeparator(null, 'var(--theme-color-20)');
		e_sep.style.borderRadius = '0px 0px 3px 3px';
		e_sep.style.marginBottom = '2px';

		DebugLog.open_groups.splice(DebugLog.open_groups.length - 1, 1);

		if (DebugLog.open_groups.length < 1) DebugLog.current_group = null;
		else DebugLog.current_group = DebugLog.open_groups[DebugLog.open_groups.length - 1];
	}

	static InjectSeparator(text, color = '')
	{
		let e_sep = document.createElement('div');
		e_sep.className = 'debug-log-separator';
		if (text) e_sep.innerText = text;
		if (color && color.length > 0) e_sep.style.background = color;
		e_sep.style.marginLeft = (DebugLog.open_groups.length * 6) + "px";
		DebugLog.ui.e_root.appendChild(e_sep);
		return e_sep;
	}
}

DevMode.AddActivateAction(DebugLog.Show);
DevMode.AddDeactivateAction(DebugLog.Hide);

Modules.Report("Debug Log");