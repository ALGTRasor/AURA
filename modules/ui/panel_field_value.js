import { addElement, CreatePagePanel } from "../domutils.js";
import { PanelBase } from "./panel_base.js";

export class FieldValuePanel extends PanelBase
{
	label = '';
	value = '';

	OnCreate()
	{
		this.e_root = CreatePagePanel(this.e_parent, false, false, 'margin:1px;border-radius:0.25rem;');
		const style_shared = 'display:inline-block;position:relative; top:0; align-content:end; height:fit-content;';
		this.e_label = addElement(this.e_root, 'div', '', style_shared + 'text-align:right; left:0; width:calc(max(10rem, 25%) - 0.5rem); padding-right:0.5rem; background:#0003; justify-self:stretch; height:100%; font-size: 0.75rem;')
		this.e_value = addElement(this.e_root, 'div', '', style_shared + 'text-align:left; right:0; width:calc(100% - max(10rem, 25%) - 0.5rem); padding-left:0.5rem; font-size:0.7rem;')
	}

	OnRefresh()
	{
		this.e_label.innerText = this.label.toUpperCase();
		this.e_value.innerText = this.value;
		if (this.value === 'NULL' || this.value === undefined) this.e_value.style.color = 'orangered';
		else this.e_value.style.color = 'unset';
	}

	OnRemove() { this.e_root.remove(); }
}