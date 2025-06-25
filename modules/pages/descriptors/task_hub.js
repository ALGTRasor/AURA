import "../../utils/stringutils.js";
import { get_guid } from "../../utils/mathutils.js";
import { addElement, CreatePagePanel, ClearElementLoading, MarkElementLoading } from "../../utils/domutils.js";
import { RunningTimeout } from "../../utils/running_timeout.js";
import { NotificationLog } from "../../notificationlog.js";
import { PanelContent } from "../../ui/panel_content.js";
import { TaskData, Tasks } from "../../systems/tasks.js";
import { UserAccountInfo } from "../../useraccount.js";
import { MegaTips } from "../../systems/megatips.js";
import { PageManager } from "../../pagemanager.js";
import { PageDescriptor } from "../pagebase.js";
import { Trench } from "../../ui/trench.js";



class TaskTrackerRowContent extends PanelContent
{
	constructor(tracker_content, task_data)
	{
		super(tracker_content.e_tasks);
		this.tracker_content = tracker_content;
		this.task_data = task_data;
	}

	OnCreateElements()
	{
		const style_info = 'text-overflow:ellipsis; overflow:hidden; align-content:center;';

		this.e_root = CreatePagePanel(
			this.e_parent, false, false,
			'flex-grow:0.0; flex-shrink:0.0; display:flex; flex-direction:row; padding:var(--gap-025);'
		);

		this.e_title = addElement(
			this.e_root, 'div', '',
			style_info + 'flex-grow:0.0; flex-shrink:0.0; font-size:90%; text-wrap:nowrap; padding:var(--gap-05);',
			_ => { _.innerHTML = this.task_data.title; }
		);

		this.e_desc = addElement(
			this.e_root, 'div', '',
			style_info + 'flex-grow:1.0; flex-shrink:1.0; font-size:65%; color:hsl(from var(--theme-color) h s var(--theme-l070));',
			_ => { _.innerHTML = this.task_data.description.or('NO DESCRIPTION'); }
		);

		this.trench = new Trench(this.e_root, true, '1rem');
		this.e_btn_delete = this.trench.AddIconButton('delete', e =>
		{
			const perform = async () =>
			{
				console.info(`deleting task: '${this.task_data.title}' ( ${this.task_data.table_index} )`);
				MarkElementLoading(this.tracker_content.e_root);
				let resp = await Tasks.DeleteExisting(this.task_data.table_index);
				if (resp.status == 204) NotificationLog.Log('Deleted Task', 'hsl(from #0f0 h s 50%)');
				else if (resp.status == 404) NotificationLog.Log('Failed to Delete Task: Task Not Found', 'hsl(from #f00 h s 50%)');
				if ('OnDataRefresh' in this.tracker_content.page.page_descriptor)
					this.tracker_content.page.page_descriptor.OnDataRefresh(this.tracker_content.page);
			};
			perform();
		}, 'Click to delete this task.', 'hsl(from red h s 50%)');
		this.e_btn_view = this.trench.AddIconButton('open_in_new', e => { }, 'Click to view this task.');

		MegaTips.RegisterSimple(
			this.e_root,
			[
				`{{{TASK}}} ${this.task_data.guid}`,
				`{{{TITLE}}} ${this.task_data.title}`,
				`{{{DESCRIPTION}}} ${this.task_data.description.or('[[[NONE]]]')}`,
				`{{{OWNER}}} ${this.task_data.owner_id.or('[[[NONE]]]')}`,
				`{{{PARTICIPANTS}}} ${this.task_data.participant_ids.join(', ').or('[[[NONE]]]')}`,
			].join('<br>')
		);
	}
}

class TaskTrackerContent extends PanelContent
{
	constructor(e_parent, page)
	{
		super(e_parent);
		this.page = page;

		this.content_timeout = new RunningTimeout(() => { this.RefreshElements(); }, 0.25, false, 70);
		this.refresh_soon = () =>
		{
			MarkElementLoading(this.e_root);
			this.content_timeout.ExtendTimer();
		};
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

		let e_btn_new = CreatePagePanel(
			this.e_root, true, false, 'text-align:center; align-content:center; padding:var(--gap-05); flex-grow:0.0;',
			_ =>
			{
				_.classList.add('panel-button');
				_.innerHTML = 'CREATE RANDOM TASK';
			}
		);
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
							description: desc,
							owner_id: UserAccountInfo.account_info.user_id,
							participant_ids: [UserAccountInfo.account_info.user_id]
						}
					)
				);
				const try_refresh_page = () => { if ('OnDataRefresh' in this.page.page_descriptor) this.page.page_descriptor.OnDataRefresh(this.page); };
				window.setTimeout(try_refresh_page, 250);
			}
		);

		this.refresh_soon();
	}

	OnRefreshElements()
	{
		this.TransitionElements(
			() =>
			{
				this.task_datum = Array.from(SharedData['tasks'].instance.data);
				this.e_tasks.style.pointerEvents = 'none';
			},
			() =>
			{
				this.e_tasks.innerHTML = '';
				let ii = 0;
				while (ii < this.task_datum.length)
				{
					let task_row = new TaskTrackerRowContent(this, this.task_datum[ii]);
					task_row.CreateElements();
					ii++;
				}
			},
			() =>
			{
				this.e_tasks.style.pointerEvents = 'all';
				ClearElementLoading(this.e_root);
			},
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
		instance.e_frame.style.minWidth = 'min(100vw - 3 * var(--gap-1), 36rem)';
		instance.e_content.style.display = 'flex';
		instance.e_content.style.gap = 'var(--gap-025)';

		instance.content = new TaskTrackerContent(instance.e_content, instance);
		instance.content.CreateElements();

		instance.relate_tasks = window.SharedData['tasks'].AddNeeder();
		window.SharedData.Subscribe('tasks', instance.content.refresh_soon);
	}

	OnDataRefresh(instance)
	{
		MarkElementLoading(instance.content.e_root);
		window.SharedData['tasks'].Download();
	}

	OnRemoveElements(instance)
	{
		window.SharedData.Unsubscribe('tasks', instance.content.refresh_soon);
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
		else instance.ClearMaxFrameWidth();
	}
}

PageManager.RegisterPage(new PageTaskHub('task tracker', 'tasks.view', undefined, 'View and manage or assign tasks.'), 't', 'Task Tracker');