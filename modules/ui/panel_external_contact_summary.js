import { addElement, CreatePagePanel } from "../domutils.js";
import { PanelBase } from "./panel_base.js";
import { FieldValuePanel } from "./panel_field_value.js";

export class ExternalContactSummary extends PanelBase
{
	contact_data = null;

	info_id = null;
	info_name = null;
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
		this.info_name.label = "name";
		this.info_name.Create(this.e_block);

		this.info_endDate = this.PushChild(new FieldValuePanel());
		this.info_endDate.label = "tenure end";
		this.info_endDate.Create(this.e_block);
	}

	OnRefresh()
	{
		if (this.contact_data)
		{
			this.e_title.innerText = this.contact_data.contact_name;
			this.info_id.value = this.contact_data.Title;
			this.info_name.value = this.contact_data.contact_name;
			this.info_endDate.value = this.contact_data.date_end === undefined ? '-' : this.contact_data.date_end;
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
		this.info_endDate.value = undefined;
	}

	ReleaseReferences()
	{
		this.info_id = null;
		this.info_name = null;
		this.info_endDate = null;
	}
}