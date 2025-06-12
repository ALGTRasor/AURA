import { CreatePagePanel } from "../utils/domutils.js";
import { FieldValidation } from "../utils/field_validation.js";
import { PanelBase } from "./panel_base.js";
import { FieldValuePanel } from "./panel_field_value.js";

export class RecordSummaryPanelBase extends PanelBase
{
	record = undefined;
	HasRecord() { return this.record != undefined; };
	GetRecordTitle() { return this.record[this.GetRecordTitleField()]; }

	fields_created = false;
	/// Array of FieldValuePanel
	fields = {};

	// + overrides section
	GetPanelTitle() { return ''; }
	GetRecordTitleLabel() { return 'User ID'; }
	GetRecordTitleField() { return 'Title'; }
	OnAppendFields() { }
	OnClearFields() { }
	OnUpdateFields() { }
	GetSpoofRecord() { return {}; }
	BeforeRemoveFields() { }
	// - overrides section

	OnCreate()
	{
		this.e_root = CreatePagePanel(this.e_parent, false, false, '', _ => { _.className += ' record-summary-root'; });
		this.e_title = CreatePagePanel(this.e_root, true, false, '', _ => { _.className += ' record-summary-title'; });
		this.e_block = CreatePagePanel(this.e_root, true, false, '', _ => { _.className += ' record-summary-fields'; });

		this.e_title.innerHTML = this.GetRecordTitle();
		this.color_og_title = this.e_title.style.color;

		this.fields = {};
	}

	OnRefresh()
	{
		this.e_title.innerHTML = this.GetRecordTitle();
		this.AppendFields();
		this.UpdateFields();
	}

	OnRemove()
	{
		this.RemoveFields();
		this.e_title.remove();
		this.e_block.remove();
		this.e_root.remove();
		this.e_title = null;
		this.e_block = null;
		this.e_root = null;
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



	AppendFields()
	{
		if (this.fields_created === true) this.RemoveFields();
		this.fields_created = true;
		this.fields = {};
		this.OnAppendFields();
	}

	RemoveFields()
	{
		if (this.fields_created !== true) return;
		this.fields_created = false;
		this.BeforeRemoveFields();
		for (let fid in this.fields) this.fields[fid].Remove();
		this.fields = {};
	}

	UpdateFields()
	{
		if (this.fields_created !== true) return;
		if (this.HasRecord() === true) this.OnUpdateFields();
		else this.ClearFields();
	}

	ClearFields()
	{
		if (this.fields_created !== true) return;
		this.OnClearFields();
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





	AutoAppendFields(field_descs = {})
	{
		for (let fid in field_descs)
		{
			let info = field_descs[fid];
			if (info.exclude !== true) this.fields[info.key] = this.CreateField(info);
		}
	}

	AutoUpdateFields(field_descs = {})
	{
		for (let fid in field_descs)
		{
			let info = field_descs[fid];
			if (info.exclude !== true) this.fields[info.key].SetValue(this.record[info.key], false, true);
		}
	}





	CreateField(info = {}) 
	{
		let fvp = new FieldValuePanel();
		fvp.label = info.label;
		fvp.multiline = info.multiline;
		fvp.edit_mode = info.read_only !== true;
		if (info.spellcheck) fvp.spellcheck = info.spellcheck;
		if ('format' in info) fvp.validator = FieldValidation.GetValidator(info.format);

		fvp.addEventListener('change', _ => { this.OnAnyValueChanged(); });

		let e_fvp = this.PushChild(fvp);
		e_fvp.Create(this.e_block);

		return fvp;
	};
}