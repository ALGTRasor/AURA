import { addElement, CreatePagePanel } from "../../utils/domutils.js";
import { RunningTimeout } from "../../utils/running_timeout.js";
import { PanelContent } from "../../ui/panel_content.js";
import { PageManager } from "../../pagemanager.js";
import { PageDescriptor } from "../pagebase.js";
import { MegaTips } from "../../systems/megatips.js";
import "../../utils/stringutils.js";
import { TaskData, Tasks } from "../../systems/tasks.js";
import { get_guid } from "../../utils/mathutils.js";

class TaskTrackerContent extends PanelContent
{
	constructor(e_parent, page)
	{
		super(e_parent);
		this.page = page;

		this.content_timeout = new RunningTimeout(() => { this.RefreshElements(); }, 0.25, false, 70);
		this.refresh_soon = () => { this.content_timeout.ExtendTimer(); };
	}

	OnCreateElements()
	{
		this.e_root = addElement(
			this.e_parent, 'div', undefined,
			'position:absolute; inset:0; display:flex; flex-direction:column; flex-wrap:nowrap;'
			+ 'gap:var(--gap-025); padding:var(--gap-05);'
		);

		this.e_tasks = CreatePagePanel(
			this.e_root, true, false,
			'display:flex; flex-direction:column;'
			+ 'flex-wrap:nowrap; gap:var(--gap-025); padding:var(--gap-05);'
			+ 'overflow: hidden auto;'
		);

		let e_btn_new = CreatePagePanel(this.e_root, false, false);
		e_btn_new.addEventListener(
			'click',
			e =>
			{
				const sort_rand = (x, y) => (Math.round(Math.random()) * 2 - 1);
				const scramble = 'new randomly generated test task temporary';
				let desc = 'A ' + scramble.split(' ').sort(sort_rand).join(' ') + '.';
				Tasks.CreateNew(
					new TaskData(
						{
							guid: get_guid(),
							title: 'Test Task ' + (Math.round(Math.random() * 8999) + 1000),
							description: desc
						}
					)
				);
			}
		);

		this.refresh_soon();
	}

	OnRefreshElements()
	{
		this.TransitionElements(
			() => { this.e_tasks.style.pointerEvents = 'none'; },
			() =>
			{
				this.e_tasks.innerHTML = '';
				let ii = 0;
				while (ii < SharedData['tasks'].instance.data.length)
				{
					let task = SharedData['tasks'].instance.data[ii];
					let e_task = CreatePagePanel(
						this.e_tasks, false, false,
						'flex-grow:0.0; flex-shrink:0.0; display:flex; flex-direction:row; padding-left:var(--gap-05);'
					);
					const style_info = 'text-overflow:ellipsis; overflow:hidden; align-content:center;';
					addElement(e_task, 'div', '', style_info + 'flex-grow:1.0;flex-shrink:0.0;text-wrap:nowrap;', _ => { _.innerHTML = task.title; });
					addElement(e_task, 'div', '', style_info + 'flex-grow:0.0;flex-shrink:1.0;font-size:70%; text-align:right;', _ => { _.innerHTML = task.description.or('NO DESCRIPTION'); });
					let e_btn_view = CreatePagePanel(e_task, true, false, 'width:1.5rem; height:1.5rem; flex-grow:0.0; flex-shrink:0.0;');
					addElement(e_btn_view, 'i', 'material-symbols icon-button', '', _ => { _.innerText = 'open_in_new'; });
					MegaTips.RegisterSimple(
						e_task,
						[
							`{{{TASK}}} ${task.guid}`,
							`{{{TITLE}}} ${task.title}`,
							`{{{DESCRIPTION}}} ${task.description.or('[[[NO DESCRIPTION]]]')}`,
							`{{{OWNER}}} ${task.owner_id.or('[[[NO OWNER]]]')}`,
						].join('<br>')
					);
					MegaTips.RegisterSimple(e_btn_view, 'Click to view this task.');
					ii++;
				}
			},
			() => { this.e_tasks.style.pointerEvents = 'all'; },
			{
				fade_target: () => this.e_tasks,
				fade_duration: 0.125,
				skip_fade_out: false,
				skip_fade_in: false
			}
		);
	}

	OnRemoveElements()
	{
		this.e_root.remove();
	}
}

export class PageTaskHub extends PageDescriptor
{
	title = 'task tracker';
	order_index = -4;

	OnCreateElements(instance)
	{
		instance.e_frame.style.minWidth = '32rem';
		instance.e_content.style.display = 'flex';
		instance.e_content.style.gap = 'var(--gap-025)';

		instance.content = new TaskTrackerContent(instance.e_content, instance);
		instance.content.CreateElements();

		instance.relate_tasks = window.SharedData['tasks'].AddNeeder();
		window.SharedData.Subscribe('tasks', instance.refresh_soon);
	}

	OnRemoveElements(instance)
	{
		window.SharedData.Unsubscribe('tasks', instance.refresh_soon);
		window.SharedData['tasks'].RemoveNeeder(instance.relate_tasks);
		instance.content.RemoveElements();
	}

	UpdateSize(instance)
	{
		instance.UpdateBodyTransform();
		this.OnLayoutChange(instance);
	}

	OnLayoutChange(instance)
	{
		let use_fixed_width = instance.state.data.docked === true && instance.state.data.expanding === false;
		if (use_fixed_width === true) instance.SetMaxFrameWidth('24rem');
		else instance.SetMaxFrameWidth('unset');
	}
}

PageManager.RegisterPage(new PageTaskHub('task tracker', 'tasks.view', undefined, 'View and manage or assign tasks.'), 't', 'Task Tracker');