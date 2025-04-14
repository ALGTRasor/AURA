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

		this.fields = {};
	}

	static CreateFields(parent)
	{
		const CreateField = (parent, label = 'user id', validator = _ => _.trim(), read_only = false, spellcheck = false) =>
		{
			let fvp = new FieldValuePanel();
			fvp.label = label;
			fvp.edit_mode = read_only !== true;
			fvp.spellcheck = spellcheck;
			fvp.validator = validator;
			fvp.onValueChangedDelayed.RequestSubscription(_ => { parent.OnAnyValueChanged(); });

			let e_fvp = parent.PushChild(fvp);
			e_fvp.Create(parent.e_block);

			return fvp;
		};

		parent.fields = {};
		parent.fields.id = CreateField(parent, 'user id', undefined, true);
		parent.fields.name = CreateField(parent, 'legal name');
		parent.fields.team = CreateField(parent, 'department');
		parent.fields.role = CreateField(parent, 'role(s)');
		parent.fields.manager = CreateField(parent, 'manager id');
		parent.fields.email_company = CreateField(parent, 'company email', FieldValidation.CheckEmail);
		parent.fields.email_personal = CreateField(parent, 'personal email', FieldValidation.CheckEmail);
		parent.fields.address_company = CreateField(parent, 'company address', undefined, false, true);
		parent.fields.address_personal = CreateField(parent, 'personal address', undefined, false, true);
		parent.fields.phone_company = CreateField(parent, 'company phone', FieldValidation.CheckPhone);
		parent.fields.phone_personal = CreateField(parent, 'personal phone', FieldValidation.CheckPhone);
		parent.fields.birth_date = CreateField(parent, 'birth date', FieldValidation.CheckDate);
		parent.fields.start_date = CreateField(parent, 'tenure start', FieldValidation.CheckDate);
		parent.fields.end_date = CreateField(parent, 'tenure end', FieldValidation.CheckDate);
	}

	static UpdateFields(fvp)
	{
		if (fvp.record)
		{
			fvp.fields.id.SetValue(fvp.record.Title);
			fvp.fields.name.SetValue(fvp.record.display_name_full);
			fvp.fields.team.SetValue(fvp.record.user_team);
			fvp.fields.role.SetValue(fvp.record.user_role);
			fvp.fields.manager.SetValue(fvp.record.user_manager_id);

			fvp.fields.email_company.SetValue(fvp.record.email_work);
			fvp.fields.email_personal.SetValue(fvp.record.email_home);
			fvp.fields.address_company.SetValue(fvp.record.address_work);
			fvp.fields.address_personal.SetValue(fvp.record.address_home);
			fvp.fields.phone_company.SetValue(fvp.record.phone_work);
			fvp.fields.phone_personal.SetValue(fvp.record.phone_home);

			fvp.fields.birth_date.SetValue(fvp.record.user_birthdate);
			fvp.fields.start_date.SetValue(fvp.record.date_start);
			fvp.fields.end_date.SetValue(fvp.record.date_end === undefined ? '' : fvp.record.date_end);
			return true;
		}
		return false;
	}

	static ClearFields(fields)
	{
		fields.id.SetValue(undefined, false, true);
		fields.name.SetValue(undefined, false, true);
		fields.team.SetValue(undefined, false, true);
		fields.role.SetValue(undefined, false, true);
		fields.manager.SetValue(undefined, false, true);

		fields.email_company.SetValue(undefined, false, true);
		fields.email_personal.SetValue(undefined, false, true);
		fields.address_company.SetValue(undefined, false, true);
		fields.address_personal.SetValue(undefined, false, true);
		fields.phone_company.SetValue(undefined, false, true);
		fields.phone_personal.SetValue(undefined, false, true);

		fields.birth_date.SetValue(undefined, false, true);
		fields.start_date.SetValue(undefined, false, true);
		fields.end_date.SetValue(undefined, false, true);
	}

	static GetSpoofRecord()
	{
		let spoof = {};
		spoof.Title = 'user.id.' + (Math.round(Math.random() * 899999) + 100000);
		spoof.display_name_full = 'User Name ' + (Math.round(Math.random() * 899999) + 100000);
		spoof.user_team = '';
		spoof.user_role = '';
		spoof.user_manager_id = '';
		spoof.email_work = '';
		spoof.email_home = '';
		spoof.address_work = '';
		spoof.address_home = '';
		spoof.phone_work = '';
		spoof.phone_home = '';
		spoof.user_birthdate = '';
		spoof.date_start = '';
		spoof.date_end = '';
		return spoof;
	}

	OnRefresh()
	{
		if (this.user_data)
		{
			this.e_title.innerText = this.user_data.display_name_full;

			this.fields.id.SetValue(this.user_data.Title);
			this.fields.name.SetValue(this.user_data.display_name_full);
			this.fields.team.SetValue(this.user_data.user_team);
			this.fields.role.SetValue(this.user_data.user_role);
			this.fields.manager.SetValue(this.user_data.user_manager_id);

			this.fields.email_company.SetValue(this.user_data.email_work);
			this.fields.email_personal.SetValue(this.user_data.email_home);
			this.fields.address_company.SetValue(this.user_data.address_work);
			this.fields.address_personal.SetValue(this.user_data.address_home);
			this.fields.phone_company.SetValue(this.user_data.phone_work);
			this.fields.phone_personal.SetValue(this.user_data.phone_home);

			this.fields.birth_date.SetValue(this.user_data.user_birthdate);
			this.fields.start_date.SetValue(this.user_data.date_start);
			this.fields.end_date.SetValue(this.user_data.date_end === undefined ? '-' : this.user_data.date_end);
		}
		else InternalUserSummary.ClearFields(this.fields);
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

	ReleaseReferences()
	{
		this.fields = {};
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
}