import { addElement } from "../utils/domutils.js";
import { AnimJob } from "../AnimJob.js";
import { GlobalStyling } from "./global_styling.js";

export class Ripples
{
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