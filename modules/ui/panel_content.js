import { FadeElement } from "../utils/domutils.js";
import { until } from "../utils/until.js";

export class PanelContent extends EventTarget
{
	static Nothing = new PanelContent(undefined);

	created = false;
	e_parent = undefined;

	constructor(e_parent)
	{
		super();
		this.created = false;
		this.e_parent = e_parent;
	}

	RecreateElements(data)
	{
		this.RemoveElements(data);
		this.CreateElements(data);
	}

	CreateElements(data)
	{
		if (this.created === true) return;

		try
		{
			this.OnCreateElements(data);
			this.created = true;
		}
		catch (e) { this.OnError(e); }
	}

	RefreshElements(data)
	{
		this.CreateElements(data);
		if (this.created !== true) return;
		try { this.OnRefreshElements(data); } catch (e) { this.OnError(e); }
	}

	RemoveElements(data)
	{
		if (this.created !== true) return;
		try { this.OnRemoveElements(data); } catch (e) { this.OnError(e); }
		this.created = false;
	}

	// override functions
	OnCreateElements(data) { throw new Error('Panel Content Create Not Implemented'); }
	OnRefreshElements(data) { throw new Error('Panel Content Refresh Not Implemented'); }
	OnRemoveElements(data) { throw new Error('Panel Content Remove Not Implemented'); }

	OnError(error = new Error('UNDEFINED ERROR')) { console.error(error.stack); }

	TransitionElements(
		before = async () => { },
		during = async () => { },
		after = async () => { },
		options = {
			fade_target: this.e_parent,
			fade_duration: 0.1,
			skip_fade_out: false,
			skip_fade_in: false
		}
	)
	{
		const perform_transition = async () =>
		{
			const cancel_transition = () =>
			{
				console.warn('cancelled transition');
				this.transitioning = false;
				this.interrupt_transition = false;
			};

			const fade_duration = options.fade_duration ?? 0.05;
			const will_fade = () => { return options.fade_target() && 'style' in options.fade_target() && fade_duration > 0.0 };

			if (this.transitioning === true)
			{
				this.interrupt_transition = true;
				await until(() => this.transitioning !== true);
			}

			await before();
			if (this.interrupt_transition === true) { cancel_transition(); return; }

			this.transitioning = true;
			if (will_fade() === true && options.skip_fade_out !== true) await FadeElement(options.fade_target(), 100, 0, fade_duration);
			if (this.interrupt_transition === true) { cancel_transition(); return; }

			await during();
			if (this.interrupt_transition === true) { cancel_transition(); return; }

			if (will_fade() === true && options.skip_fade_in !== true) await FadeElement(options.fade_target(), 0, 100, fade_duration);
			if (this.interrupt_transition === true) { cancel_transition(); return; }

			this.transitioning = false;
			await after();
		};
		perform_transition();
	}
}