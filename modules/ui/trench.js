import { addElement, CreatePagePanel } from "../utils/domutils.js";

export class Trench
{
	constructor(e_parent, inset = true)
	{
		this.inset = inset;
		this.e_root = CreatePagePanel(
			e_parent, this.inset, false,
			'display:flex; flex-direction:row; justify-content:flex-end; flex-wrap:nowrap; flex-shrink:0.0; flex-grow:0.0;'
		);
	}

	AddIconButton(icon = 'help', on_click = e => { }, tooltip = '')
	{
		return CreatePagePanel(
			this.e_root, !this.inset, false, 'flex-grow:0.0; flex-shrink:0.0; aspect-ratio:1.0;',
			_ =>
			{
				_.classList.add('panel-button');
				if (tooltip) _.title = tooltip;
				if (on_click) _.addEventListener('click', on_click);
				addElement(_, 'i', 'material-symbols', 'position:absolute; inset:0; font-size:0.8rem; font-weight:bold; align-content:center; text-align:center; opacity:60%;', icon);
			}
		);
	}

	AddLabel(text = '')
	{
		return addElement(this.e_root, 'div', '', 'flex-grow:1.0; font-size:0.7rem; font-weight:bold; align-content:center; text-align:center; opacity:60%;', text);
	}
}