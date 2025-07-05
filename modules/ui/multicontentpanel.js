import { addElement, ClearElementLoading, MarkElementLoading } from "../utils/domutils.js";
import { RunningTimeout } from "../utils/running_timeout.js";
import { PanelContent } from "./panel_content.js";

export class MultiContentPanel extends PanelContent
{
	content_active = null;
	content_queued = [];
	transition_duration = 0.35;

	queue_timeout = new RunningTimeout(() => { this.RefreshElements(); }, 0.05, false, 20);

	OnCreateElements()
	{
		const style_root = 'display:flex; flex-direction:column; position:relative; flex-grow:1.0; overflow:hidden;';
		this.e_root = addElement(this.e_parent, 'div', '', style_root);
		this.e_root.style.filter = 'opacity(0%)';
		this.e_root.id = 'multicontent-root';
	}

	OnRefreshElements()
	{
		this.CheckQueue();
		if (this.processing_queue === true) return;
		if (this.content_active && this.content_active.RefreshElements) this.content_active.RefreshElements();
	}

	OnRemoveElements()
	{
		if (this.content_active && this.content_active.RemoveElements) this.content_active.RemoveElements();
		this.content_active = null;
		this.e_root.remove();
	}

	RefreshSoon() { this.queue_timeout.ExtendTimer(); }

	QueueContent(content, ignore_same = true, ignore_requeue = true)
	{
		if (ignore_same === true && this.content_active === content) return;
		if (ignore_requeue === true && this.content_queued.indexOf(content) > -1) return;

		this.content_queued.push(content);
		this.RefreshSoon();
	}

	CheckQueue()
	{
		if (this.processing_queue === true) return;
		if (this.content_queued.length < 1) return;

		let next_content = this.content_queued.splice(this.content_queued.length - 1, 1)[0];
		this.content_queued = [];

		let half_dur = this.transition_duration * 0.5;
		this.TransitionElements(
			() =>
			{
				this.processing_queue = true;
			},
			() =>
			{
				if (this.content_active && this.content_active.RemoveElements) 
				{
					this.content_active.RemoveElements();
				}
				MarkElementLoading(this.e_root);
				this.e_root.innerHTML = '';

				this.content_queued = [];
				if (next_content)
				{
					this.content_active = next_content;
					if ('CreateElements' in this.content_active)
					{
						this.content_active.e_parent = this.e_root;
						this.content_active.CreateElements();
					}
					else
					{
						console.warn('multicontent: could not create new content.\nActive Content:');
						console.table(this.content_active);
					}
				}
				else
				{
					this.content_active = null;
				}
			},
			() =>
			{
				ClearElementLoading(this.e_root, 150);
				this.processing_queue = false;
				if (this.content_queued.length > 0) this.RefreshSoon();
			},
			{
				fade_target: () => { return this.e_root; },
				fade_duration: half_dur,
				skip_fade_in: false,
				skip_fade_out: false,
			}
		);
	}
}