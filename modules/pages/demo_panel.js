import { SharedData } from "../datashared.js";
import { DebugLog } from "../debuglog.js";
import { CreatePagePanel } from "../domutils.js";
import { PageManager } from "../pagemanager.js";
import { ExternalContactList } from "../ui/panel_external_contact_list.js";
import { InternalUserList } from "../ui/panel_internal_user_list.js";
import { ProjectList } from "../ui/panel_project_list.js";
import { RecordListPanel } from "../ui/panel_record_list.js";
import { FieldValidation } from "../utils/field_validation.js";
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
						//this.demo_panel.projects = SharedData.projects.data.slice(0, 5);
						this.demo_panel.Create(this.e_panel);
					},
				onRemove: () =>
				{
					this.demo_panel.Remove();
					this.demo_panel = null;
				}
			},
			{ name: 'PROJECT DETAILS', onCreate: () => { }, onRemove: () => { } },
			{ name: 'TRACT DETAILS', onCreate: () => { }, onRemove: () => { } },
			{
				name: 'INTERNAL USER',
				onCreate:
					() =>
					{
						this.demo_panel = new RecordListPanel(SharedData.users.data, 'Title', 'user id');
						this.demo_panel.createFieldPanels = _ =>
						{
							_.field_panels.id = _.CreateField('user id', undefined, true);
							_.field_panels.name = _.CreateField('legal name');
							_.field_panels.team = _.CreateField('department');
							_.field_panels.role = _.CreateField('role(s)');
							_.field_panels.manager = _.CreateField('manager id');
							_.field_panels.email_company = _.CreateField('company email', FieldValidation.CheckEmail);
							_.field_panels.email_personal = _.CreateField('personal email', FieldValidation.CheckEmail);
							_.field_panels.address_company = _.CreateField('company address', undefined, false, true);
							_.field_panels.address_personal = _.CreateField('personal address', undefined, false, true);
							_.field_panels.phone_company = _.CreateField('company phone', FieldValidation.CheckPhone);
							_.field_panels.phone_personal = _.CreateField('personal phone', FieldValidation.CheckPhone);
							_.field_panels.birth_date = _.CreateField('birth date', FieldValidation.CheckDate);
							_.field_panels.start_date = _.CreateField('tenure start', FieldValidation.CheckDate);
							_.field_panels.end_date = _.CreateField('tenure end', FieldValidation.CheckDate);
						};
						this.demo_panel.updateFieldPanelValues = _ =>
						{
							_.field_panels.id.value = _.record.Title;
							_.field_panels.name.value = _.record.display_name_full;
							_.field_panels.team.value = _.record.user_team;
							_.field_panels.role.value = _.record.user_role;
							_.field_panels.manager.value = _.record.user_manager_id;

							_.field_panels.email_company.value = _.record.email_work;
							_.field_panels.email_personal.value = _.record.email_home;
							_.field_panels.address_company.value = _.record.address_work;
							_.field_panels.address_personal.value = _.record.address_home;
							_.field_panels.phone_company.value = _.record.phone_work;
							_.field_panels.phone_personal.value = _.record.phone_home;

							_.field_panels.birth_date.value = _.record.user_birthdate;
							_.field_panels.start_date.value = _.record.date_start;
							_.field_panels.end_date.value = _.record.date_end === undefined ? '-' : _.record.date_end;
						};
						this.demo_panel.clearFieldPanelValues = _ =>
						{
							_.field_panels.id.value = undefined;
							_.field_panels.name.value = undefined;
							_.field_panels.team.value = undefined;
							_.field_panels.role.value = undefined;
							_.field_panels.manager.value = undefined;

							_.field_panels.email_company.value = undefined;
							_.field_panels.email_personal.value = undefined;
							_.field_panels.address_company.value = undefined;
							_.field_panels.address_personal.value = undefined;
							_.field_panels.phone_company.value = undefined;
							_.field_panels.phone_personal.value = undefined;

							_.field_panels.birth_date.value = undefined;
							_.field_panels.start_date.value = undefined;
							_.field_panels.end_date.value = undefined;
						};
						//this.demo_panel = new InternalUserList();
						//this.demo_panel.users = SharedData.users.data.slice(0, 7);
						this.demo_panel.Create(this.e_panel);
					},
				onRemove: () =>
				{
					this.demo_panel.Remove();
					this.demo_panel = null;
				}
			},
			{
				name: 'EXTERNAL CONTACT',
				onCreate:
					() =>
					{
						this.demo_panel = new ExternalContactList();
						//this.demo_panel.users = SharedData.users.data.slice(0, 7);
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

PageManager.RegisterPage(new PageDemoPanel('demo panel', 'aura.access'));