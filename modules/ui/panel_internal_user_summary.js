import { addElement, CreatePagePanel } from "../domutils.js";
import { PanelBase } from "./panel_base.js";
import { FieldValuePanel } from "./panel_field_value.js";

export class InternalUserSummary extends PanelBase
{
	user_data = null;

	info_id = null;
	info_name = null;
	info_emailCompany = null;
	info_emailPersonal = null;
	info_addressCompany = null;
	info_addressPersonal = null;
	info_phoneCompany = null;
	info_phonePersonal = null;
	info_team = null;
	info_role = null;
	info_manager = null;
	info_birthDate = null;
	info_startDate = null;
	info_endDate = null;

	OnCreate()
	{
		this.e_root = CreatePagePanel(this.e_parent, false, true, 'min-width:24rem;min-height:8rem;align-content:start;');

		const style_title = 'flex-basis:100%;padding-left:2rem;text-align:left;height:1.5rem;line-height:1.5rem;font-weight:bold;letter-spacing:1px;';
		this.e_title = CreatePagePanel(this.e_root, true, false, style_title);

		const style_block = 'display:flex;flex-basis:0.0;flex-wrap:nowrap;flex-direction:column;padding:2px;';
		this.e_block = CreatePagePanel(this.e_root, true, false, style_block);

		this.info_id = this.PushChild(new FieldValuePanel());
		this.info_id.label = "user id";
		this.info_id.Create(this.e_block);

		this.info_name = this.PushChild(new FieldValuePanel());
		this.info_name.label = "legal name";
		this.info_name.Create(this.e_block);

		this.info_team = this.PushChild(new FieldValuePanel());
		this.info_team.label = "department";
		this.info_team.Create(this.e_block);

		this.info_role = this.PushChild(new FieldValuePanel());
		this.info_role.label = "role(s)";
		this.info_role.Create(this.e_block);

		this.info_manager = this.PushChild(new FieldValuePanel());
		this.info_manager.label = "manager id";
		this.info_manager.Create(this.e_block);

		this.info_emailCompany = this.PushChild(new FieldValuePanel());
		this.info_emailCompany.label = "company email";
		this.info_emailCompany.Create(this.e_block);
		this.info_emailPersonal = this.PushChild(new FieldValuePanel());
		this.info_emailPersonal.label = "personal email";
		this.info_emailPersonal.Create(this.e_block);

		this.info_addressCompany = this.PushChild(new FieldValuePanel());
		this.info_addressCompany.label = "company address";
		this.info_addressCompany.Create(this.e_block);
		this.info_addressPersonal = this.PushChild(new FieldValuePanel());
		this.info_addressPersonal.label = "personal address";
		this.info_addressPersonal.Create(this.e_block);

		this.info_phoneCompany = this.PushChild(new FieldValuePanel());
		this.info_phoneCompany.label = "company phone";
		this.info_phoneCompany.Create(this.e_block);
		this.info_phonePersonal = this.PushChild(new FieldValuePanel());
		this.info_phonePersonal.label = "personal phone";
		this.info_phonePersonal.Create(this.e_block);

		this.info_birthDate = this.PushChild(new FieldValuePanel());
		this.info_birthDate.label = "birth date";
		this.info_birthDate.Create(this.e_block);

		this.info_startDate = this.PushChild(new FieldValuePanel());
		this.info_startDate.label = "tenure start";
		this.info_startDate.Create(this.e_block);

		this.info_endDate = this.PushChild(new FieldValuePanel());
		this.info_endDate.label = "tenure end";
		this.info_endDate.Create(this.e_block);
	}

	OnRefresh()
	{
		if (this.user_data)
		{
			this.e_title.innerText = this.user_data.display_name_full;
			this.info_id.value = this.user_data.Title;
			this.info_name.value = this.user_data.display_name_full;
			this.info_team.value = this.user_data.user_team;
			this.info_role.value = this.user_data.user_role;
			this.info_manager.value = this.user_data.user_manager_id;

			this.info_emailCompany.value = this.user_data.email_work;
			this.info_emailPersonal.value = this.user_data.email_home;
			this.info_addressCompany.value = this.user_data.address_work;
			this.info_addressPersonal.value = this.user_data.address_home;
			this.info_phoneCompany.value = this.user_data.phone_work;
			this.info_phonePersonal.value = this.user_data.phone_home;

			this.info_birthDate.value = this.user_data.user_birthdate;
			this.info_startDate.value = this.user_data.date_start;
			this.info_endDate.value = this.user_data.date_end === undefined ? '-' : this.user_data.date_end;
		}
		else this.ClearValues();
	}

	OnRemove()
	{
		this.ReleaseReferences();
		this.e_title.remove();
		this.e_block.remove();
		this.e_root.remove();
		this.e_title = null;
		this.e_block = null;
		this.e_root = null;
	}

	ClearValues()
	{
		this.info_id.value = undefined;
		this.info_name.value = undefined;
		this.info_team.value = undefined;
		this.info_role.value = undefined;
		this.info_manager.value = undefined;

		this.info_emailCompany.value = undefined;
		this.info_emailPersonal.value = undefined;
		this.info_addressCompany.value = undefined;
		this.info_addressPersonal.value = undefined;
		this.info_phoneCompany.value = undefined;
		this.info_phonePersonal.value = undefined;

		this.info_birthDate.value = undefined;
		this.info_startDate.value = undefined;
		this.info_endDate.value = undefined;
	}

	ReleaseReferences()
	{
		this.info_id = null;
		this.info_name = null;
		this.info_team = null;
		this.info_role = null;
		this.info_manager = null;

		this.info_emailCompany = null;
		this.info_emailPersonal = null;
		this.info_addressCompany = null;
		this.info_addressPersonal = null;
		this.info_phoneCompany = null;
		this.info_phonePersonal = null;

		this.info_birthDate = null;
		this.info_startDate = null;
		this.info_endDate = null;
	}
}