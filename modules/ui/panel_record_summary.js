import { CreatePagePanel } from "../domutils.js";
import { PanelBase } from "./panel_base.js";
import { FieldValuePanel } from "./panel_field_value.js";

export class RecordSummaryPanel extends PanelBase
{
	record = null;
	title_field = 'user_id';
	title_label = 'user id';

	createFieldPanels = _ => { };
	updateFieldPanelValues = _ => { };
	clearFieldPanelValues = _ => { };

	field_panels = {};

	constructor(record = [], title_field = 'user_id', title_label = 'user id')
	{
		super();
		this.record = record;
		this.title_field = title_field;
		this.title_label = title_label;
	}

	CreateField(label = '[field label]', validator = _ => _.trim(), read_only = false, spellcheck = false)
	{
		let fvp = new FieldValuePanel();
		fvp.label = label;
		fvp.edit_mode = read_only !== true;
		fvp.spellcheck = spellcheck;
		fvp.validator = validator;
		fvp.onValueChangedDelayed.RequestSubscription(_ => { this.OnAnyValueChanged(); });

		let e_fvp = this.PushChild(fvp);
		e_fvp.Create(this.e_block);
		return e_fvp;
	};

	OnCreate()
	{
		this.e_root = CreatePagePanel(this.e_parent, false, true, 'min-width:24rem; min-height:8rem; align-content:start;');

		const style_title = 'flex-basis:100%; padding-left:2rem; text-align:left; height:1.5rem; line-height:1.5rem; font-weight:bold; letter-spacing:1px;';
		this.e_title = CreatePagePanel(this.e_root, true, false, style_title);
		this.color_og_title = this.e_title.style.color;

		const style_field_block = 'display:flex; flex-basis:0.0; flex-wrap:nowrap; flex-direction:column; padding:2px; gap:3px;';
		this.e_block = CreatePagePanel(this.e_root, true, false, style_field_block);

		if (this.createFieldPanels) this.createFieldPanels(this);
	}

	OnAnyValueChanged()
	{
		for (let fid in this.field_panels)
		{
			let field = this.field_panels[fid];
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
		if (this.record) this.UpdateValues();
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

	UpdateValues()
	{
		this.e_title.innerText = this.record[this.title_field];
		if (this.updateFieldPanelValues) this.updateFieldPanelValues(this);
	}
	ClearValues() { if (this.clearFieldPanelValues) this.clearFieldPanelValues(this); }

	ReleaseReferences()
	{
		this.field_panels = {};
	}
}