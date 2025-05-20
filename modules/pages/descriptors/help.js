import { addElement, CreatePagePanel } from "../../utils/domutils.js";
import { AppInfo } from "../../app_info.js";
import { PageManager } from "../../pagemanager.js";
import { PageDescriptor } from "../pagebase.js";

export class Help
{
	static all_help = {};

	static Register(topic = '', label = '', body = '')
	{
		Help.all_help[topic] = { topic: topic, label: label, body: body };
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
		let all_topics = [];

		if (instance.state_data.topic && instance.state_data.topic.length > 0) all_topics = instance.state_data.topic.split(';');
		if (all_topics.length < 1) instance.state_data.topic = '';

		if (all_topics.length > 0) // topic(s) provided
		{
			let any_found = false;
			for (let hid in Help.all_help) 
			{
				let relevant = false;
				for (let tid in all_topics) if (hid.startsWith(all_topics[tid])) relevant = true;
				if (relevant !== true) continue;

				const help_info = Help.all_help[hid];
				any_found = true;
				CreatePagePanel(
					instance.e_help_root, false, false,
					'flex-grow:0.0; font-size:1rem;',
					_ =>
					{
						addElement(_, 'div', null, 'padding-bottom:var(--gap-025);', help_info.label);
						let body_parts = help_info.body.split('\n');
						for (let bpid in body_parts) CreatePagePanel(_, true, false, 'padding:calc(0.25rem + var(--gap-025)); font-size:0.85rem;', _ => { _.innerText = body_parts[bpid]; });

						let e_btn_root = CreatePagePanel(_, true, false);
						addElement(
							e_btn_root, 'div', 'page-panel panel-button', 'align-content:center;',
							e_btn =>
							{
								e_btn.addEventListener(
									'click',
									e =>
									{
										let topics = instance.state_data.topic.split(';');
										topics.splice(topics.indexOf(help_info.topic), 1);
										instance.UpdateStateData({ topic: (topics.length > 0 ? topics.join(';') : []) });
									}
								);
								e_btn.title = 'Dismiss';
								addElement(
									e_btn, 'i', 'material-symbols', 'display:block;',
									e_icon => { e_icon.innerText = 'task_alt'; }
								);
							}
						);
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
		else // no topic provided
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


window.RegisterHelp = (topic, label, body) => Help.Register(topic, label, body);
Help.Register(
	'pages.help', 'The Help Page',
	'The help page provides information about specific aspects of ' + AppInfo.name + '.'
	+ '\nUsers can get help for each available page by clicking the help button from a page\'s title bar.'
);
PageManager.RegisterPage(new PageHelp('help'), '/', 'Help');