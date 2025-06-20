import { addElement, CreatePagePanel, getTransitionStyle } from "../utils/domutils.js";

export class FillBar
{
	static GetColor(fill, params = { from_hue_deg: 35.0, to_hue_deg: 65.0, check_color: (color, fill) => color })
	{
		let fill_angle = params.from_hue_deg + params.to_hue_deg * fill;
		let color = 'rgba(from hsl(' + fill_angle + 'deg 100% 50%) r g b / 0.2)';
		if (params.check_color) color = params.check_color(color, fill);
		return color;
	}

	static Create(
		e_parent, label, fill,
		params = {
			from_hue_deg: 35.0,
			to_hue_deg: 65.0,
			style_full: _ => { _.style.backgroundColor = 'cyan'; _.style.border = 'solid 1px hsl(from cyan h s var(--theme-l050))'; },
			style_overfull: _ => { _.style.backgroundColor = 'red'; _.style.border = 'solid 2px hsl(from orange h s var(--theme-l050))'; },
			check_color: (color, fill) => color
		}
	)
	{
		let fill_style = 'pointer-events:none; box-sizing:border-box; position:absolute; inset:0; width:0%;'
			+ 'transition-property:width, background-color, border; transition-duration:var(--trans-dur-off-slow); transition-timing-function:ease-in-out;'
			+ 'background:hsl(from var(--theme-color) h s 10%); border-radius:inherit;';

		return CreatePagePanel(
			e_parent, true, false,
			'text-align:center; padding:var(--gap-025); align-content:center; border:solid 2px hsl(from var(--theme-color) h s 12%);',
			_ =>
			{
				let e_fill = addElement(_, 'div', null, fill_style);

				let e_label = addElement(
					_, 'div', null,
					'position:absolute; inset:0; align-content:center; text-align:center;' + getTransitionStyle('opacity, transform', '--trans-dur-on-slow'),
					label
				);

				if ('label_alt' in params)
				{
					e_label.classList.add('hover-fade-out');

					let e_label_alt = addElement(
						_, 'div', null,
						'position:absolute; inset:0; align-content:center; text-align:center;' + getTransitionStyle('opacity, transform', '--trans-dur-on-slow'),
						params.label_alt
					);
					e_label_alt.classList.add('hover-fade-in');
				}

				window.setTimeout(
					() =>
					{
						e_fill.style.background = FillBar.GetColor(fill, params);
						if (fill > 1.0 && params.style_overfull) params.style_overfull(e_fill);
						else if (fill == 1.0 && params.style_full) params.style_full(e_fill);
						e_fill.style.width = `${Math.min(1, fill) * 100.0}%`;
					},
					30 + Math.random() * 200
				);
			}
		);
	}
}