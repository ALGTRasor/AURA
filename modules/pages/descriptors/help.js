import { AppInfo } from "../../app_info.js";
import { PageManager } from "../../pagemanager.js";
import { PageDescriptor } from "../page_descriptor.js";
import { TopicExplorer } from "../../ui/topic_explorer.js";

export class Help
{
	static all_help = {};
	static Register(topic = '', label = '', body = '') { Help.all_help[topic] = { topic: topic, label: label, body: body }; }
}

export class PageHelp extends PageDescriptor
{
	title = 'help';
	icon = 'help';
	order_index = 99;

	OnCreateElements(instance)
	{
		//instance.e_help_root = CreatePagePanel(instance.e_content, true, false, 'display:flex; flex-direction:column; gap:var(--gap-025); text-align:center;');
		//this.UpdateHelpContent(instance);

		let all_topics = [];
		for (let topic_id in Help.all_help) all_topics.push(Help.all_help[topic_id]);

		instance.explorer = new TopicExplorer(instance.e_content, all_topics);

		//this.UpdateHelpContent(instance);
		//instance.explorer = new TopicExplorer(instance.e_content, all_topics);
		//instance.explorer.CreateElements();
	}

	OnStateChange(instance)
	{
		if (instance.e_help_root)
			this.UpdateHelpContent(instance);
	}

	UpdateHelpContent(instance)
	{
		instance.e_help_root.innerHTML = '';

		if (instance.topicList) instance.topicList.remove();

		let all_topics = [];
		if (instance.state.data.topic && instance.state.data.topic.length > 0) all_topics = instance.state.data.topic.split(';');
		if (all_topics.length < 1) instance.state.data.topic = '';

		let topics = [];
		for (let hid in Help.all_help)
		{
			let help_info = Help.all_help[hid];
			topics.push(help_info.topic);
		}
		instance.topicList = new TopicList(instance.e_help_root, topics);
	}

	UpdateSize(instance)
	{
		instance.UpdateBodyTransform();
		this.OnLayoutChange(instance);
	}

	OnLayoutChange(instance)
	{
		if (instance.state.data.docked === true)
		{
			if (instance.state.data.expanding === true) instance.SetMaxFrameWidth('48rem');
			else instance.SetMaxFrameWidth('24rem');
		}
		else instance.ClearMaxFrameWidth();
	}
}


window.RegisterHelp = (topic, label, body) => Help.Register(topic, label, body);
Help.Register(
	'pages.help', 'The Help Page',
	'The help page provides information about specific aspects of ' + AppInfo.name + '.'
	+ '\nUsers can get help for each available page by clicking the help button from a page\'s title bar.'
);
Help.Register(
	'general.autosave', 'Autosave',
	'Your settings are saved automatically a moment after you have made some changes.'
);

Help.Register('settings.theme', 'Theme', 'The overall look you want the app to have. You can customize various aspects to your liking.');
Help.Register('settings.theme.hue', 'Theme Hue', 'The overall hue of the color you want the app to be.');
Help.Register('settings.theme.saturation', 'Theme Saturation', 'The overall saturation of the color you want the app to be. 0.0 means grayscale, and your chosen Hue will be ignored.');
Help.Register('settings.theme.contrast', 'Theme Contrast', 'The overall contrast of the app. This can help or hurt readability.');
Help.Register('settings.theme.brightness', 'Theme Brightness', 'The overall brightness of the app. This can help or hurt readability.');

PageManager.RegisterPage(new PageHelp('help', undefined, 'help', 'Get more information about a variety of topics related to the site.'), '/', 'Help');