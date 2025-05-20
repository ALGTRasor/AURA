import { AppInfo } from "../../app_info.js";
import { PageManager } from "../../pagemanager.js";
import { addElement, CreatePagePanel } from "../../utils/domutils.js";
import { PageDescriptor } from "../pagebase.js";

export class Help
{
	static all_help = {};

	static Register(topic = '', label = '', body = '')
	{
		Help.all_help[topic] = { label: label, body: body };
	}
}

// either a category of help items or a single help item
class HelpListItem
{
	constructor(groups = [])
	{
		this.groups = groups;
	}
}

export class PageHelp extends PageDescriptor
{
	title = 'help';
	icon = 'help';
	extra_page = true;
	order_index = 99;

	OnCreateElements(instance)
	{
		instance.e_help_root = CreatePagePanel(instance.e_content, true, false, 'display:flex; flex-direction:column; gap:var(--gap-025); text-align:center;');
		this.UpdateHelpContent(instance);
	}

	OnStateChange(instance)
	{
		if (instance.e_help_root)
			this.UpdateHelpContent(instance);
	}

	UpdateHelpContent(instance)
	{
		instance.e_help_root.innerHTML = '';

		if (instance.state_data.topic && instance.state_data.topic.length > 0)
		{
			let any_found = false;
			for (let hid in Help.all_help) 
			{
				let help_info = Help.all_help[hid];
				if (!hid.startsWith(instance.state_data.topic)) continue;
				any_found = true;
				CreatePagePanel(
					instance.e_help_root, false, false,
					'flex-grow:0.0; font-size:115%;',
					_ =>
					{
						addElement(_, 'div', null, 'padding-bottom:var(--gap-025);', help_info.label);
						CreatePagePanel(_, true, false, 'padding:var(--gap-05);', _ => { _.innerText = help_info.body; });
					}
				);
			}
			if (!any_found)
			{
				CreatePagePanel(
					instance.e_help_root, false, false,
					'flex-grow:0.0; font-size:115%;',
					_ =>
					{
						addElement(_, 'div', null, 'padding-bottom:var(--gap-025);', instance.state_data.topic);
						CreatePagePanel(_, true, false, 'padding:var(--gap-05);', _ => { _.innerText = 'Uh oh! No help information has been added for this topic!'; });
					}
				);
			}
		}
		else
		{
			let top_level_groups = [];
			for (let hid in Help.all_help) top_level_groups.push(hid.substring(hid.indexOf('.'), -1));
			top_level_groups = top_level_groups.filter((x, i, a) => a.indexOf(x) === i);
			for (let gid in top_level_groups)
			{
				CreatePagePanel(
					instance.e_help_root, false, false, 'flex-grow:0.0; cursor:pointer;',
					_ =>
					{
						_.innerText = top_level_groups[gid];
						_.addEventListener('click', _ => { instance.UpdateStateData({ topic: top_level_groups[gid] }); });
					}
				);
			}
		}
	}

	UpdateSize(instance)
	{
		instance.UpdateBodyTransform();
		this.OnLayoutChange(instance);
	}

	OnLayoutChange(instance)
	{
		if (instance.state_data.docked === true)
		{
			if (instance.state_data.expanding === true) instance.e_frame.style.maxWidth = '48rem';
			else instance.e_frame.style.maxWidth = '24rem';
		}
		else instance.e_frame.style.maxWidth = 'unset';
	}
}


Help.Register('pages.help', 'The Help Page', 'The help page shows you information about specific pages or other aspects of ' + AppInfo.name);
Help.Register('pages.nav menu', 'Navigation Menu', 'The Navigation Menu shows all pages which you have access to. Click an item in the list to open that page, or to close it if there is one already open. You can also hold Shift to force a new instance of the page you want to open.');
Help.Register('pages.settings', 'The Settings Page', 'The Settings page allows you to configure various aspects of ' + AppInfo.name + '. You can also find extra information here, like which hotkeys you can use.');
Help.Register('pages.directory', 'The Directory', 'The Directory contains information for internal users and external contacts. You can use the Directory as a sort of phone book.');
Help.Register('pages.external links', 'External Links', 'The External Links page provides a list of websites you might find useful.');

PageManager.RegisterPage(new PageHelp('help'), '/', 'Help');