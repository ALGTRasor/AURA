import { addElement, ClearElementLoading, CreatePagePanel, FadeElement, MarkElementLoading } from "../../utils/domutils.js";
import { RunningTimeout } from "../../utils/running_timeout.js";
import { SampleArray } from "../../utils/arrayutils.js";
import { PanelContent } from "../../ui/panel_content.js";

import { TableView } from "../../ui/tableview.js";
import { SlideSelector } from "../../ui/slide_selector.js";
import { Calendar } from "../../ui/calendar.js";

import { UserAccountInfo } from "../../useraccount.js";
import { PageManager } from "../../pagemanager.js";
import { PageDescriptor } from "../page_descriptor.js";
import { hoursDelta } from "../../utils/timeutils.js";





const sort_by = (x, y, prop = 'guid') =>
{
	if (x[prop] < y[prop]) return -1;
	if (x[prop] > y[prop]) return 1;
	return 0;
};
const sort_guid = (x, y) => { return sort_by(x, y, 'guid'); };
const sort_max = (x, y) => { return sort_by(x, y, 'allocation_max'); };
const sort_remaining = (x, y) => { return sort_by(x, y, 'remaining_total'); };
const sort_used = (x, y) => { return sort_by(x, y, 'use_total'); };
const sort_created = (x, y) => { return sort_by(x, y, 'created'); };


const search_by = (x, prop, term) =>
{
	let invert = term.startsWith('!');
	if (invert) term = term.replaceAll('!', '');
	let search_value = term.trim().toLowerCase();
	let record_value_string = x[prop].toString().trim().toLowerCase();
	let includes = !search_value || search_value.length < 1 || record_value_string.indexOf(search_value) > -1;

	if (invert) return !includes;
	return includes;
}
const search_by_guid = (x, term) => { return search_by(x, 'guid', term); };
const search_by_created = (x, term) => { return search_by(x, 'created', term); };

const date_gradient = ['#0ff2', '#0f02', '#ffe1', '#f502'];
const available_time_gradient = ['#f002', '#ff01', '#ff01', '#0f02', '#0f02', '#0ff2'];

const ALLOCATION_TABLE_COLUMNS =
	[
		{
			key: 'created', label: 'DATE ADDED', label_long: 'DATE ADDED',
			desc: 'The date this allocation was created.',
			flexBasis: '7rem', flexGrow: '0.0', format: 'date',
			calc_theme_color: (record, val) => SampleArray(date_gradient, hoursDelta(new Date(record.created)) / (24.0 * 60.0)),
			sorter: sort_created, search: search_by_created,
		},
		{
			key: 'guid', label: 'ALLOCATION', label_long: 'ALLOCATION GROUP',
			desc: 'The name or ID of the allocation group.',
			flexBasis: '11rem', flexGrow: '1.0', format: 'uppercase',
			sorter: sort_guid, search: search_by_guid,
			hidden: true,
		},
		{
			key: 'allocation_max', label: 'TOTAL', label_long: 'TOTAL ALLOCATED TIME',
			desc: 'The total amount of time originally made available in this allocation.',
			flexBasis: '5rem', flexGrow: '0.0',
			sorter: sort_max,
		},
		{
			key: 'use_total', label: 'USED', label_long: 'USED TIME',
			desc: 'The amount of time that has been used from this allocation.',
			flexBasis: '5rem', flexGrow: '0.0',
			calc_theme_color: (record, val) => SampleArray(available_time_gradient, 1.0 - record.use_total / record.allocation_max),
			sorter: sort_used,
		},
		{
			key: 'remaining_total', label: 'AVAILABLE', label_long: 'AVAILABLE TIME',
			desc: 'The amount of time that has not been used from this allocation.',
			flexBasis: '8rem', flexGrow: '0.0',
			calc_theme_color: (record, val) => SampleArray(available_time_gradient, record.remaining_total / record.allocation_max),
			sorter: sort_remaining,
		},
	];


class TKAllocations extends PanelContent
{
	constructor(page)
	{
		super(page.e_mode_content);
		this.page = page;
	}

	OnCreateElements()
	{
		this.e_root = CreatePagePanel(
			this.e_parent, true, false, 'flex-basis:100%; flex-direction:column;',
			_ =>
			{
				let data = window.SharedData['user allocations'].instance.data.filter(_ => _.user_id === UserAccountInfo.account_info.user_id);
				this.e_tableview = new TableView(_, undefined);
				this.e_tableview.addEventListener('viewchange', () => { this.StoreState(this.page); this.page.TriggerStateDataChange(); });
				this.e_tableview.group_by_property = 'guid';

				this.e_tableview.columns.Reset();
				ALLOCATION_TABLE_COLUMNS.forEach(_ => this.e_tableview.columns.Register(_.key, _));
				this.e_tableview.AddAction('chronic', _ => { }, 'hsl(from #0ff h s var(--theme-l030))');

				this.e_tableview.data.SetRecords(data, false);
			}
		);

		this.OnRefreshElements();
	}

	OnRemoveElements() { this.e_root.remove(); }

	OnRefreshElements()
	{
		this.e_tableview.RefreshElements();
	}

	StoreState(page_instance)
	{
		let data = this.e_tableview.GetState();
		page_instance.SetStateValue('allocation_table_state', data);
	}

	RestoreState(page_instance)
	{
		if (page_instance.state.HasValue('allocation_table_state'))
		{
			let data = page_instance.GetStateValue('allocation_table_state');
			this.e_tableview.SetState(data);
		}
	}
}

class TKCalendar extends PanelContent
{
	constructor(page)
	{
		super(page.e_mode_content);
		this.page = page;
	}

	OnCreateElements()
	{
		this.records = window.SharedData['user allocations'].instance.data.filter(_ => _.user_id === UserAccountInfo.account_info.user_id);
		this.all_uses = [];
		this.records.forEach(_ => { this.all_uses = this.all_uses.concat(_.use_history); });

		this.e_root = CreatePagePanel(
			this.e_parent, true, true, 'flex-direction:column; overflow:visible;',
			_ => { this.e_root_list = CreatePagePanel(_, false, true, 'flex-direction:column; align-content:stretch;'); }
		);

		this.calendar = new Calendar(this.e_root_list, new Date());
		this.calendar.CreateDayContent = (date, element) => this.CreateDayContent(date, element);
		this.calendar.CreateDayDetailsContent = (date, element) => this.CreateDayDetailsContent(date, element);
		this.calendar.CreateElements();
		this.calendar.SetFocusDate(new Date());
	}

	OnRemoveElements() { this.e_root.remove(); }

	CreateDayContent(date, element) 
	{
		let relevant_usages = this.all_uses.filter(_ => _.date === date.toShortDateString());
		let sum_hours = 0;
		relevant_usages.forEach((x, i, a) => sum_hours += x.hours);
		if (sum_hours > 0)
		{
			addElement(
				element, 'div', '', 'min-height:0;',
				_ =>
				{
					addElement(
						_, 'span', '', 'color:var(--theme-color-highlight);',
						_ =>
						{
							_.innerText = `${sum_hours} hr`;
						}
					);
				}
			);
		}
	}

	CreateDayDetailsContent(date, element) 
	{
		let relevant_usages = this.all_uses.filter(_ => _.date === date.toShortDateString());
		let sum_used = 0;
		relevant_usages.forEach((x, i, a) => sum_used += x.hours);
		addElement(
			element, 'div', '', 'padding:var(--gap-025);',
			_ =>
			{
				if (relevant_usages.length > 1)
					_.innerText = `${sum_used} Billable Hours in ${relevant_usages.length} spans`;
				else
					_.innerText = `${sum_used} Billable Hours`;
			}
		);
		let ii = 0;
		while (ii < relevant_usages.length)
		{
			CreatePagePanel(
				element, false, false, '',
				_ =>
				{
					let usage = relevant_usages[ii];
					addElement(
						_, 'div', '',
						'padding:var(--gap-025);',
						_ => { _.innerHTML = `<span style='color:var(--theme-color-highlight);'>${usage.hours}</span> hrs`; }
					);
					CreatePagePanel(_, true, false, 'padding:var(--gap-05);', _ => { _.innerText = usage.desc; });
				}
			);
			ii++;
		}
	}
}

export class PageTimekeep extends PageDescriptor
{
	order_index = -1;
	title = 'time keeper';
	icon = 'chronic';

	OnCreateElements(instance)
	{
		instance.e_frame.style.minWidth = 'min(100% - 3 * var(--gap-1), 20rem)';
		instance.e_content.style.flexDirection = 'column';
		instance.e_content.style.gap = 'var(--gap-05)';

		instance.slide_mode = new SlideSelector();
		const modes = [
			{ label: 'ALLOCATIONS', on_click: _ => { }, tooltip: 'Billable time by allocation.' },
			{ label: 'CALENDAR', on_click: _ => { }, tooltip: 'Billable time by calendar period.' }
		];
		instance.slide_mode.CreateElements(instance.e_content, modes);

		instance.e_mode_content_container = addElement(instance.e_content, 'div', '', 'border-radius:inherit; position:relative; flex-basis:100%;');
		instance.e_mode_content = addElement(instance.e_mode_content_container, 'div', '', 'border-radius:inherit; display:flex; flex-direction:column; gap:var(--gap-05); overflow:hidden; top:0; left:0; width:100%; height:100%; padding:0; margin:0;');
		instance.e_mode_content.id = 'e_mode_content';

		instance.mode_allocations = new TKAllocations(instance);
		instance.mode_calendar = new TKCalendar(instance);

		instance.content_current = undefined;

		instance.content_timeout = new RunningTimeout(() => { this.UpdateModeContent(instance); }, 0.5, false, 70);
		instance.RefreshContentSoon = () =>
		{
			instance.SetStateValue('view_mode', instance.slide_mode.selected_index);
			instance.content_timeout.ExtendTimer();
		};

		instance.slide_mode.Subscribe(instance.RefreshContentSoon);
		instance.slide_mode.SelectIndexAfterDelay(instance.state.data.view_mode ?? 0, 150, true);
	}

	UpdateModeContent(instance)
	{
		switch (instance.slide_mode.selected_index) 
		{
			case 0: this.TransitionContent(instance, instance.mode_allocations); break;
			case 1: this.TransitionContent(instance, instance.mode_calendar); break;
		}
	}

	TransitionContent(instance, content_next = PanelContent.Nothing)
	{
		const PerformTransition = async () =>
		{
			instance.slide_mode.SetDisabled(true);
			MarkElementLoading(instance.e_mode_content);
			if (instance.content_current && instance.content_current.e_root)
			{
				if (instance.content_current.StoreState) instance.content_current.StoreState(instance);
				await FadeElement(instance.content_current.e_root, 100, 0, 0.125);
				instance.content_current.RemoveElements();
			}

			instance.content_current = content_next;
			instance.content_current.CreateElements();

			instance.slide_mode.SetDisabled(false);
			if (instance.content_current && instance.content_current.RestoreState) instance.content_current.RestoreState(instance);
			await FadeElement(instance.content_current.e_root, 0, 100, 0.125);
			ClearElementLoading(instance.e_mode_content, 250);
		};

		if (content_next) PerformTransition();
		else console.warn('invalid next content');
	}

	OnOpen(instance)
	{
		window.SharedData.Subscribe('user allocations', instance.RefreshContentSoon);
		instance.relate_allocations = window.SharedData['user allocations'].AddNeeder();
	}

	OnClose(instance)
	{
		window.SharedData.Unsubscribe('user allocations', instance.RefreshContentSoon);
		window.SharedData['user allocations'].RemoveNeeder(instance.relate_allocations);
	}

	UpdateSize(instance)
	{
		instance.UpdateBodyTransform();
		this.OnLayoutChange(instance);
	}

	OnLayoutChange(instance)
	{
		if (instance.state.data.docked === true)
		{
			if (instance.state.data.expanding === true) instance.SetMaxFrameWidth('100vh');
			else instance.SetMaxFrameWidth('60vh');
		}
		else
		{
			instance.ClearMaxFrameWidth();
		}
		instance.slide_mode.ApplySelectionSoon();
	}
}

PageManager.RegisterPage(new PageTimekeep('time keeper', 'time.keep', 'chronic', 'View and manage your billable time.'), 'k', 'Time Keeper');