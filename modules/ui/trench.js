import { MegaTips } from "../systems/megatips.js";
import { addElement, CreatePagePanel } from "../utils/domutils.js";

export class Trench
{
	constructor(e_parent, inset = true, fontSize = '1rem')
	{
		this.inset = inset;
		this.fontSize = fontSize;
		this.e_root = CreatePagePanel(
			e_parent, this.inset, false,
			'display:flex; flex-direction:row; justify-content:flex-end; flex-wrap:nowrap; flex-shrink:0.0; flex-grow:0.0; font-size:' + this.fontSize + ';'
		);
	}

	AddIconButton(icon = 'help', on_click = e => { }, tooltip = '', color = '')
	{
		let e = CreatePagePanel(
			this.e_root, !this.inset, false, 'flex-grow:0.0; flex-shrink:0.0; aspect-ratio:1.0;',
			_ =>
			{
				_.classList.add('panel-button');
				if (on_click) _.addEventListener('click', on_click);
				if (color && color.length > 0) _.style.setProperty('--theme-color', color);
				addElement(_, 'i', 'material-symbols', 'position:absolute; inset:0; font-weight:normal; align-content:center; text-align:center; opacity:60%; font-size:' + this.fontSize + ';', _ => { _.innerText = icon; });
			}
		);
		if (tooltip) MegaTips.RegisterSimple(e, tooltip);
		return e;
	}

	AddLabel(text = '', tooltip = '')
	{
		let e = addElement(this.e_root, 'div', '', 'flex-grow:1.0; font-weight:bold; align-content:center; text-align:center; opacity:60%; font-size:' + this.fontSize + ';');
		e.innerHTML = text;
		if (tooltip) MegaTips.RegisterSimple(e, tooltip);
		return e;
	}

	AddFlexibleSpace(minWidth = '0px')
	{
		return addElement(this.e_root, 'div', '', 'flex-grow:1.0; flex-shrink:1.0; min-width:' + minWidth);
	}
}