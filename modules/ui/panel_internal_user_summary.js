import { DebugLog } from "../debuglog.js";
import { addElement, CreatePagePanel } from "../domutils.js";
import { FieldValidation } from "../utils/field_validation.js";
import { PanelBase } from "./panel_base.js";
import { FieldValuePanel } from "./panel_field_value.js";

export class InternalUserSummary extends PanelBase
{
	user_data = null;
	fields = {};

	OnCreate()
	{
		this.e_root = CreatePagePanel(this.e_parent, false, true, 'min-width:24rem; min-height:8rem; align-content:start;');

		const style_title = 'flex-basis:100%; padding-left:2rem; text-align:left; height:1.5rem; line-height:1.5rem; font-weight:bold; letter-spacing:1px;';
		this.e_title = CreatePagePanel(this.e_root, true, false, style_title);
		this.color_og_title = this.e_title.style.color;

		const style_field_block = 'display:flex; flex-basis:0.0; flex-wrap:nowrap; flex-direction:column; padding:2px; gap:3px;';
		this.e_block = CreatePagePanel(this.e_root, true, false, style_field_block);

		const CreateField = (label = 'user id', validator = _ => _.trim(), read_only = false) =>
		{
			let fvp = new FieldValuePanel();
			fvp.label = label;
			fvp.edit_mode = read_only !== true;
			fvp.validator = validator;
			fvp.onValueChangedDelayed.RequestSubscription(_ => { this.OnAnyValueChanged(); });

			let e_fvp = this.PushChild(fvp);
			e_fvp.Create(this.e_block);
			return e_fvp;
		};

		this.fields.id = CreateField('user id', undefined, true);
		this.fields.name = CreateField('legal name');
		this.fields.team = CreateField('department');
		this.fields.role = CreateField('role(s)');
		this.fields.manager = CreateField('manager id');
		this.fields.email_company = CreateField('company email', FieldValidation.CheckEmail);
		this.fields.email_personal = CreateField('personal email', FieldValidation.CheckEmail);
		this.fields.address_company = CreateField('company address');
		this.fields.address_personal = CreateField('personal address');
		this.fields.phone_company = CreateField('company phone', FieldValidation.CheckPhone);
		this.fields.phone_personal = CreateField('personal phone', FieldValidation.CheckPhone);
		this.fields.birth_date = CreateField('birth date', FieldValidation.CheckDate);
		this.fields.start_date = CreateField('tenure start', FieldValidation.CheckDate);
		this.fields.end_date = CreateField('tenure end', FieldValidation.CheckDate);
	}

	OnAnyValueChanged()
	{
		for (let fid in this.fields)
		{
			let field = this.fields[fid];
			if (field.value_dirty === true)
			{
				this.e_title.style.color = 'yellow';
				return;
			}
		}
		this.e_title.style.color = this.color_og_title;
	}

	OnRefresh()
	{
		if (this.user_data)
		{
			this.e_title.innerText = this.user_data.display_name_full;

			this.fields.id.value = this.user_data.Title;
			this.fields.name.value = this.user_data.display_name_full;
			this.fields.team.value = this.user_data.user_team;
			this.fields.role.value = this.user_data.user_role;
			this.fields.manager.value = this.user_data.user_manager_id;

			this.fields.email_company.value = this.user_data.email_work;
			this.fields.email_personal.value = this.user_data.email_home;
			this.fields.address_company.value = this.user_data.address_work;
			this.fields.address_personal.value = this.user_data.address_home;
			this.fields.phone_company.value = this.user_data.phone_work;
			this.fields.phone_personal.value = this.user_data.phone_home;

			this.fields.birth_date.value = this.user_data.user_birthdate;
			this.fields.start_date.value = this.user_data.date_start;
			this.fields.end_date.value = this.user_data.date_end === undefined ? '-' : this.user_data.date_end;
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
		this.fields.id.value = undefined;
		this.fields.name.value = undefined;
		this.fields.team.value = undefined;
		this.fields.role.value = undefined;
		this.fields.manager.value = undefined;

		this.fields.email_company.value = undefined;
		this.fields.email_personal.value = undefined;
		this.fields.address_company.value = undefined;
		this.fields.address_personal.value = undefined;
		this.fields.phone_company.value = undefined;
		this.fields.phone_personal.value = undefined;

		this.fields.birth_date.value = undefined;
		this.fields.start_date.value = undefined;
		this.fields.end_date.value = undefined;
	}

	ReleaseReferences()
	{
		this.fields = {};
	}
}