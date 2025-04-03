import { addElement, CreatePagePanel } from "../domutils.js";
import { PanelBase } from "./panel_base.js";

export class FieldValuePanel extends PanelBase
{
	label = '';
	value = '';

	minWidth = '10rem';

	OnCreate()
	{
		this.e_root = CreatePagePanel(this.e_parent, false, false, 'margin:1px; padding:1px; border-radius:0.25rem; flex-grow:0.0;');
		const style_shared = 'display:inline-block; position:relative; align-content:center; height:fit-content; font-size:0.7rem;';
		this.e_label = addElement(
			this.e_root, 'div', '',
			style_shared
			+ 'text-align:right; left:0; width:calc(max(' + this.minWidth + ', 25%) - 0.5rem); padding-right:0.5rem;'
			+ 'background:#0003; float:left; height:100%; border-radius:0 0.5rem  0.5rem 0;'
		)
		this.e_value = addElement(
			this.e_root, 'div', '',
			style_shared + 'text-align:left; right:0; width:calc(100% - max(' + this.minWidth + ', 25%) - 0.5rem); padding-left:0.5rem;'
		)
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