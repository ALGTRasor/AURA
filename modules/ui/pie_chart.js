import { addElement } from "../utils/domutils.js";
import { PanelContent } from "./panel_content.js";

export class PieChart extends PanelContent
{
	layers = [];

	constructor(e_parent, size = '10rem', layers = [])
	{
		super(e_parent);
		this.size = size ?? '10rem';
		this.layers = layers;
	}

	OnCreateElements(data)
	{
		this.e_root = addElement(this.e_parent, 'div', 'pie-chart-root', `width:${this.size}; height:${this.size};`);
		this.e_layers = addElement(this.e_root, 'div', 'pie-chart-layer-root');
		this.e_info = addElement(this.e_root, 'div', 'pie-chart-info');
		this.OnRefreshElements();
	}

	SetInfo(prep = _ => { }) { prep(this.e_info); }

	OnRemoveElements(data)
	{
		this.e_root.remove();
	}

	OnRefreshElements(data)
	{
		this.e_layers.innerHTML = '';
		for (let layer_id in this.layers)
		{
			let layer = this.layers[layer_id];
			addElement(
				this.e_layers, 'div', 'pie-chart-layer', '',
				_ =>
				{
					let delay = Math.round(Math.random() * 50) + 100;
					_.style.setProperty('--pie-phase-offset', layer.offset ?? '0%');
					window.setTimeout(
						() =>
						{
							_.style.setProperty('--pie-phase', layer.phase ?? '35%');
							_.style.setProperty('--pie-layer-color', layer.color ?? '#aaa');
						},
						delay + Math.round(250 * Math.random())
					);
				}
			);
		}
	}

	AppendLayer(data = { phase: '50%', offset: '0%', color: 'white' })
	{
		this.layers.push(data);
	}
}