import { SharedData } from "../../datashared.js";
import { CreatePagePanel } from "../../domutils.js";
import { PageManager } from "../../pagemanager.js";
import { ExternalContactList } from "../../ui/panel_external_contact_list.js";
import { InternalUserList } from "../../ui/panel_internal_user_list.js";
import { ProjectList } from "../../ui/panel_project_list.js";
import { UserAccountInfo } from "../../useraccount.js";
import { PageDescriptor } from "../pagebase.js";

export class PageDemoPanel extends PageDescriptor
{
	GetTitle() { return 'demo panel'; }
	OnCreateElements(instance)
	{
		const CreateDemoElements = _ =>
		{
			instance.demo_panel = _;
			instance.demo_panel.Create(instance.e_panel);
			instance.demo_panel.e_root.id = 'demo-panel-demo';
		};
		const RemoveDemoElements = () =>
		{
			instance.demo_panel.Remove();
			instance.demo_panel = null;
		};

		const demos = [
			{
				name: 'PROJECT LIST',
				onCreate: () => CreateDemoElements(new ProjectList(SharedData.projects.instance.data.slice(0, 7))),
				onRemove: RemoveDemoElements
			},
			{
				name: 'INTERNAL USER',
				onCreate: () => CreateDemoElements(new InternalUserList(SharedData.users.instance.data.slice(0, 7))),
				onRemove: RemoveDemoElements
			},
			{
				name: 'EXTERNAL CONTACT',
				onCreate: () => CreateDemoElements(new ExternalContactList(SharedData.contacts.instance.data.slice(0, 7))),
				onRemove: RemoveDemoElements
			},
		];

		const style_button = 'text-align:center; align-content:center; padding:1rem; font-weight:bold; flex-basis:0%;';
		const AddButton = (parent, demo = {}) =>
		{
			let e_btn = CreatePagePanel(parent, false, false, style_button, x => { x.className += ' panel-button'; x.innerText = demo.name; });
			e_btn.addEventListener('click', e => { this.CreateDemo(instance, demo); });
		};

		if (!instance) return;

		instance.demo = null;
		instance.demo_panel = null;

		instance.e_body_root = CreatePagePanel(instance.e_content, true, false, '', x => { x.className += ' panel-button-row'; });
		for (let demo_id in demos) AddButton(instance.e_body_root, demos[demo_id]);
		instance.e_panel = CreatePagePanel(instance.e_content, true, false, 'flex-grow:1.0; flex-shrink:1.0;', x => { x.innerHTML = ''; });
	}

	CreateDemo(instance, demo = {})
	{
		this.ClearDemo(instance);
		instance.demo = demo;
		if (!instance.demo) return;
		if (instance.demo.onCreate) instance.demo.onCreate();
	}

	ClearDemo(instance)
	{
		if (instance.demo && instance.demo.onRemove) instance.demo.onRemove();
		instance.e_panel.innerHTML = '';
		instance.demo = null;
	}
}

PageManager.RegisterPage(new PageDemoPanel('demo panel', UserAccountInfo.app_access_permission));