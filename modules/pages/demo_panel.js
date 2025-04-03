import { SharedData } from "../datashared.js";
import { DebugLog } from "../debuglog.js";
import { CreatePagePanel } from "../domutils.js";
import { PageManager } from "../pagemanager.js";
import { InternalUserList } from "../ui/panel_internal_user_list.js";
import { ProjectList } from "../ui/panel_project_list.js";
import { PageBase } from "./pagebase.js";

export class PageDemoPanel extends PageBase
{
	GetTitle() { return 'demo panel'; }
	CreateElements(parent)
	{
		const style_button = 'text-align:center;align-content:center;padding:1rem;font-weight:bold;';
		const AddButton = (parent, demo = {}) =>
		{
			let e_btn = CreatePagePanel(parent, false, false, style_button, x => { x.className += ' panel-button'; x.innerText = demo.name; });
			if (demo.onCreate) e_btn.addEventListener('click', e => { this.LoadDemo(demo); });
		};


		if (!parent) return;

		const demos = [
			{
				name: 'PROJECT LIST',
				onCreate:
					() =>
					{
						this.demo_panel = new ProjectList();
						this.demo_panel.Create(this.e_panel);
					},
				onRemove: () =>
				{
					this.demo_panel.Remove();
					this.demo_panel = null;
				}
			},
			{ name: 'PROJECT DETAILS', onCreate: () => { }, onRemove: () => { } },
			{ name: 'PROJECT TRACTS', onCreate: () => { }, onRemove: () => { } },
			{ name: 'TRACT DETAILS', onCreate: () => { }, onRemove: () => { } },
			{
				name: 'INTERNAL USER',
				onCreate:
					() =>
					{
						this.demo_panel = new InternalUserList();
						this.demo_panel.users = SharedData.users.data.slice(0, 7);
						this.demo_panel.Create(this.e_panel);
					},
				onRemove: () =>
				{
					this.demo_panel.Remove();
					this.demo_panel = null;
				}
			},
		];

		this.demo = null;
		this.demo_panel = null;

		this.CreateBody();
		let e_body_root = CreatePagePanel(this.e_content, true, true, 'align-content:start; min-height:fit-content; flex-grow:0.0; flex-shrink:0.0; overflow:hidden;', x => { });
		for (let demo_id in demos) AddButton(e_body_root, demos[demo_id]);
		this.e_panel = CreatePagePanel(this.e_content, true, false, 'flex-grow:1.0; flex-shrink:1.0;', x => { x.innerHTML = ''; });
		this.FinalizeBody(parent);
	}

	LoadDemo(demo = {})
	{
		this.ClearDemo();
		this.demo = demo;
		if (!this.demo) return;
		if (this.demo.onCreate) this.demo.onCreate();
	}

	ClearDemo()
	{
		if (this.demo && this.demo.onRemove) this.demo.onRemove();
		this.e_panel.innerHTML = '';
		this.demo = null;
	}
}

PageManager.RegisterPage(new PageDemoPanel('demo panel'));