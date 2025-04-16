import { SharedData } from "../datashared.js";
import { DebugLog } from "../debuglog.js";
import { CreatePagePanel } from "../domutils.js";
import { PageManager } from "../pagemanager.js";
import { ExternalContactList } from "../ui/panel_external_contact_list.js";
import { InternalUserList } from "../ui/panel_internal_user_list.js";
import { InternalUserSummary } from "../ui/panel_internal_user_summary.js";
import { ProjectList } from "../ui/panel_project_list.js";
import { RecordListPanel } from "../ui/panel_record_list.js";
import { FieldValidation } from "../utils/field_validation.js";
import { PageBase } from "./pagebase.js";

export class PageDemoPanel extends PageBase
{
	GetTitle() { return 'demo panel'; }
	CreateElements(parent)
	{
		const style_button = 'text-align:center; align-content:center; padding:1rem; font-weight:bold; flex-basis:0%;';
		const AddButton = (parent, demo = {}) =>
		{
			let e_btn = CreatePagePanel(parent, false, false, style_button, x => { x.className += ' panel-button'; x.innerText = demo.name; });
			if (demo.onCreate) e_btn.addEventListener('click', e => { this.LoadDemo(demo); });
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

		if (!parent) return;

		this.demo = null;
		this.demo_panel = null;

		this.CreateBody();
		let e_body_root = CreatePagePanel(this.e_content, true, false, '', x => { x.className += ' panel-button-row'; });
		for (let demo_id in demos) AddButton(e_body_root, demos[demo_id]);
		this.e_panel = CreatePagePanel(this.e_content, true, false, 'flex-grow:1.0; flex-shrink:1.0;', x => { x.innerHTML = ''; });
		this.FinalizeBody(parent);
	}

	LoadDemo(demo = {})
	{
		this.ClearDemo();
		this.demo = demo;
		if (!this.demo) return;
		if (!this.demo.onCreate) return;
		this.demo.onCreate();
	}

	ClearDemo()
	{
		if (this.demo && this.demo.onRemove) this.demo.onRemove();
		this.e_panel.innerHTML = '';
		this.demo = null;
	}
}

PageManager.RegisterPage(new PageDemoPanel('demo panel', 'aura.access'));