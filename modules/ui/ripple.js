import { addElement } from "../utils/domutils.js";
import { GlobalStyling } from "./global_styling.js";
import { AnimJob } from "../AnimJob.js";


class RippleTypeBase
{
	constructor(x, y, w, h)
	{
		this.ripple_phase = 0.0;
		this.origin_offset_x = -50;
		this.origin_offset_y = -50;
		this.scale_offset_x = 0;
		this.scale_offset_y = 0;
		this.scale_x = 1.0;
		this.scale_y = 1.0;
		this.e_ripple = addElement(document.body, 'div', 'ripple');
		this.SetPosition(x, y);
		this.SetSize(w, h);
		this.Initiate();
	}

	Initiate()
	{
		this.RefreshElements();
		this.anim = new AnimJob(
			16,
			dt =>
			{
				this.ripple_phase += dt;
				if (this.ripple_phase > 1.0)
				{
					this.ripple_phase = Math.min(this.ripple_phase, 1.0);
					this.RefreshElements();
					this.anim.Stop();
					this.e_ripple.remove();
					return;
				}
				this.RefreshElements();
			}
		);
		this.anim.Start();
	}

	SetPosition(x, y)
	{
		if (x)
		{
			this.x = x;
			this.e_ripple.style.left = this.x + 'px';
		}
		if (y)
		{
			this.y = y;
			this.e_ripple.style.top = this.y + 'px';
		}
	}

	SetSize(w, h)
	{
		if (w)
		{
			this.w = w;
			this.e_ripple.style.width = this.w + 'px';
		}
		if (h)
		{
			this.h = h;
			this.e_ripple.style.height = this.h + 'px';
		}
	}

	RefreshElements()
	{
		this.RefreshOpacity();
		this.RefreshSize();
	}

	RefreshOpacity()
	{
		const opacity_wave = x => 1.0 - Math.pow(2.0 * Math.sqrt(x) - 1.0, 2);
		let opacity = opacity_wave(this.ripple_phase);
		opacity = Math.pow(opacity, 2);
		this.e_ripple.style.opacity = (opacity * 100) + '%';
	}

	RefreshSize()
	{
		let perc = this.ripple_phase * 100;
		this.e_ripple.style.transform = `scale(${perc * this.scale_x + this.scale_offset_x}%,${perc * this.scale_y + this.scale_offset_y}%) translate(${this.origin_offset_x}%, ${this.origin_offset_y}%)`;
	}
}

class PointRipple extends RippleTypeBase
{
	constructor(x, y, w, h)
	{
		super(x, y, w, h);
	}
}
class RectRipple extends RippleTypeBase
{
	constructor(element)
	{
		let rect = element.getBoundingClientRect();
		super(rect.x, rect.y, rect.width, rect.height);
		this.e_ripple.style.borderRadius = window.getComputedStyle(element).borderRadius;
		this.e_ripple.style.transformOrigin = '50% 50%';
		this.origin_offset_x = 0;
		this.origin_offset_y = 0;
		this.scale_offset_x = 100;
		this.scale_offset_y = 100;
		this.scale_x = 0.15;
		this.scale_y = 0.15;
	}
}

export class Ripples
{
	static SpawnFromElement(element, delay = 250)
	{
		if (GlobalStyling.ripples.enabled !== true) return;

		if (delay > 0)
		{
			window.setTimeout(() => { Ripples.SpawnFromElement(element, -1); }, delay);
			return;
		}

		new RectRipple(element);
	}

	static SpawnFromEvent(event, width, height, echoes, variation = 7)
	{
		Ripples.Spawn(event.clientX, event.clientY, width, height, echoes, variation);
	}

	static Spawn(pos_x, pos_y, width, height, echoes, variation = 0)
	{
		if (GlobalStyling.ripples.enabled !== true) return;
		Ripples.#DoRipples(pos_x, pos_y, width, height, echoes, variation);
	}

	static #DoRipples(pos_x, pos_y, width, height, echoes, variation = 0)
	{
		Ripples.#DoRipple(pos_x, pos_y, width, height);
		if (!echoes || echoes.length < 1) return;
		for (let eid in echoes)
		{
			let echo_delay = echoes[eid];
			window.setTimeout(
				() =>
				{
					let x = pos_x + (Math.random() * 2.0 - 1.0) * variation;
					let y = pos_y + (Math.random() * 2.0 - 1.0) * variation;
					Ripples.#DoRipple(x, y, width, height);
				},
				echo_delay
			);
		}
	}

	static #DoRipple(pos_x, pos_y, width, height)
	{
		let e_ripple = addElement(
			document.body, 'div', 'ripple', null,
			_ =>
			{
				if (pos_x) _.style.left = pos_x + 'px';
				if (pos_y) _.style.top = pos_y + 'px';
				if (width) _.style.width = width + 'px';
				if (height) _.style.height = height + 'px';
			}
		);

		let ripple_phase = 0.0;
		const apply_phase = () =>
		{
			const opacity_wave = x => 1.0 - Math.pow(2.0 * Math.sqrt(x) - 1.0, 2);

			let opacity = opacity_wave(ripple_phase);
			opacity = Math.pow(opacity, 3);
			e_ripple.style.opacity = (opacity * 100) + '%';

			let perc = ripple_phase * 100;
			e_ripple.style.transform = `scale(${perc}%,${perc}%) translate(-50%, -50%)`;
		};

		apply_phase();
		let anim = new AnimJob(
			16,
			dt =>
			{
				ripple_phase += dt;
				if (ripple_phase > 1.0)
				{
					ripple_phase = Math.min(ripple_phase, 1.0);
					apply_phase();
					anim.Stop();
					e_ripple.remove();
					e_ripple = undefined;
					return;
				}
				apply_phase();
			}
		);
		anim.Start();
	}
}