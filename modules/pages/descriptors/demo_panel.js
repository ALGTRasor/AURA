import { SharedData } from "../../datashared.js";
import { CreatePagePanel } from "../../domutils.js";
import { PageManager } from "../../pagemanager.js";
import { ExternalContactList } from "../../ui/panel_external_contact_list.js";
import { InternalUserList } from "../../ui/panel_internal_user_list.js";
import { ProjectList } from "../../ui/panel_project_list.js";
import { PageDescriptor } from "../pagebase.js";

export class PageDemoPanel extends PageDescriptor
{
	GetTitle() { return 'demo panel'; }
	OnCreateElements(instance)
	{
		const style_button = 'text-align:center; align-content:center; padding:1rem; font-weight:bold; flex-basis:0%;';
		const AddButton = (parent, demo = {}) =>
		{
			let e_btn = CreatePagePanel(parent, false, false, style_button, x => { x.className += ' panel-button'; x.innerText = demo.name; });
			if (demo.onCreate) e_btn.addEventListener('click', e => { this.LoadDemo(instance, demo); });
		};

		const LoadDemo = _ =>
		{
			this.demo_panel = _;
			this.demo_panel.Create(this.e_panel);
			this.demo_panel.e_root.id = 'demo-panel-demo';
		};
		const UnloadDemo = () =>
		{
			this.demo_panel.Remove();
			this.demo_panel = null;
		};

		const demos = [
			{
				name: 'PROJECT LIST',
				onCreate: () => LoadDemo(new ProjectList(SharedData.projects.data.slice(0, 7))),
				onRemove: UnloadDemo
			},
			{
				name: 'INTERNAL USER',
				onCreate: () => LoadDemo(new InternalUserList(SharedData.users.data.slice(0, 7))),
				onRemove: UnloadDemo
			},
			{
				name: 'EXTERNAL CONTACT',
				onCreate: () => LoadDemo(new ExternalContactList(SharedData.contacts.data.slice(0, 7))),
				onRemove: UnloadDemo
			},
		];

		if (!instance) return;

		instance.demo = null;
		instance.demo_panel = null;

		instance.e_body_root = CreatePagePanel(instance.e_content, true, false, '', x => { x.className += ' panel-button-row'; });
		for (let demo_id in demos) AddButton(instance.e_body_root, demos[demo_id]);
		instance.e_panel = CreatePagePanel(instance.e_content, true, false, 'flex-grow:1.0; flex-shrink:1.0;', x => { x.innerHTML = ''; });
	}

	LoadDemo(instance, demo = {})
	{
		this.ClearDemo(instance);
		instance.demo = demo;
		if (!instance.demo) return;
		if (!instance.demo.onCreate) return;
		instance.demo.onCreate();
	}

	ClearDemo(instance)
	{
		if (instance.demo && instance.demo.onRemove) instance.demo.onRemove();
		instance.e_panel.innerHTML = '';
		instance.demo = null;
	}
}

PageManager.RegisterPage(new PageDemoPanel('demo panel', 'aura.access'));