import { addElement, CreatePagePanel } from "../../utils/domutils.js";
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
import { MultiContentPanel } from "../../ui/multicontentpanel.js";





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
	let record_value_string = x[prop]?.toString().trim().toLowerCase();
	let includes = !search_value || search_value.length < 1 || record_value_string.indexOf(search_value) > -1;

	if (invert) return !includes;
	return includes;
}
const search_by_guid = (x, term) => { return search_by(x, 'guid', term); };
const search_by_created = (x, term) => { return search_by(x, 'created', term); };

const date_gradient = ['#0ff2', '#0f02', '#ffe1', '#f502'];
const available_time_gradient = ['#f002', '#f601', '#f601', '#0f02', '#0f02', '#0ff2'];



// per diem : nights_stay
// mileage : road
// expenses : receipt
let hours_days_prefix = '<span style="display:inline-block;position:relative; box-sizing:border-box; flex-basis:0.0;flex-grow:1.0;'
	+ 'flex-shrink:1.0; padding-left:var(--gap-025); border-left:solid 2px hsl(0deg 0% var(--theme-l090) / 0.1);">';
let hours_days_suffix = '</span>';
const hours_days_subcolumn_string = `${hours_days_prefix}HOURS${hours_days_suffix}${hours_days_prefix}DAYS${hours_days_suffix}`;

const ALLOCATION_TABLE_COLUMNS =
	[
		{
			key: 'client', label: 'CLIENT', label_long: 'PROJECT CLIENT',
			desc: 'The client that this project is associated with.',
			flexBasis: '4rem', flexGrow: '0.0', format: 'uppercase',
			coming_soon: true,
			//sorter: sort_guid, search: search_by_guid,
			//hidden: true,
		},
		{
			key: 'created', label: 'DATE ADDED', label_long: 'DATE ADDED',
			desc: 'The date this allocation was created.',
			flexBasis: '7rem', flexGrow: '0.5', format: 'date',
			calc_theme_color: (record, val) => SampleArray(date_gradient, hoursDelta(new Date(record.created)) / (24.0 * 60.0)),
			sorter: sort_created, search: search_by_created,
			hidden: true,
		},
		{
			key: 'guid', label: 'PROJECT NAME', label_long: 'ALLOCATION GROUP',
			desc: 'The name or ID of the allocation group.',
			flexBasis: '11rem', flexGrow: '0.5', format: 'uppercase',
			sorter: sort_guid, search: search_by_guid,
			//hidden: true,
		},
		{
			key: 'project_percent', label: 'COMP. %', label_long: 'PROJECT COMPLETION PERCENT',
			desc: 'The percentage progress of the project.',
			flexBasis: '5rem', flexGrow: '0.0',
			format: 'percentage',
			coming_soon: true,
			sorter: sort_remaining,
		},
		{
			key: 'allocation_max', label: 'TOTAL', label_long: 'TOTAL ALLOCATED TIME', format_label: hours_days_subcolumn_string,
			desc: 'The total amount of time originally made available in this allocation.',
			flexBasis: '10rem', flexGrow: '0.0',
			format: 'billable_days',
			sorter: sort_max,
		},
		{
			key: 'use_total', label: 'USED', label_long: 'USED TIME', format_label: hours_days_subcolumn_string,
			desc: 'The amount of time that has been used from this allocation.',
			flexBasis: '8rem', flexGrow: '0.0',
			calc_theme_color: (record, val) => SampleArray(available_time_gradient, 1.0 - record.use_total / record.allocation_max),
			format: 'billable_days',
			sorter: sort_used,
		},
		{
			key: 'remaining_total', label: 'FREE', label_long: 'FREE / AVAILABLE TIME', format_label: hours_days_subcolumn_string,
			desc: 'The amount of time that has not been used from this allocation.',
			flexBasis: '8rem', flexGrow: '0.0',
			calc_theme_color: (record, val) => SampleArray(available_time_gradient, record.remaining_total / record.allocation_max),
			format: 'billable_days',
			sorter: sort_remaining,
		},
	];


const HISTORY_TABLE_COLUMNS =
	[
		{
			key: 'created', label: 'DATE ADDED', label_long: 'DATE ADDED',
			desc: 'The date this allocation was created.',
			flexBasis: '7rem', flexGrow: '0.5', format: 'date',
			calc_theme_color: (record, val) => SampleArray(date_gradient, hoursDelta(new Date(record.created)) / (24.0 * 60.0)),
			sorter: sort_created, search: search_by_created,
			hidden: true,
		},
		{
			key: 'client', label: 'CLIENT', label_long: 'PROJECT CLIENT',
			desc: 'The client that this project is associated with.',
			flexBasis: '4rem', flexGrow: '0.0', format: 'uppercase',
			coming_soon: true,
			//sorter: sort_guid, search: search_by_guid,
			//hidden: true,
		},
		{
			key: 'guid', label: 'PROJECT NAME', label_long: 'ALLOCATION GROUP',
			desc: 'The name or ID of the allocation group.',
			flexBasis: '11rem', flexGrow: '1.0', format: 'uppercase',
			sorter: sort_guid, search: search_by_guid,
			//hidden: true,
		},
		{
			key: 'per_diem', label: 'PER DIEM', label_long: 'PER DIEM',
			desc: 'Time billed per diem.',
			flexBasis: '6rem', flexGrow: '1.0',
			sorter: sort_guid, search: search_by_guid,
			format: 'dollars', format_label: '$USD',
			//hidden: true,
		},
		{
			key: 'mileage', label: 'MILEAGE', label_long: 'MILEAGE',
			desc: 'Time billed per diem.',
			flexBasis: '6rem', flexGrow: '1.0',
			sorter: sort_guid, search: search_by_guid,
			format: 'dollars', format_label: '$USD',
			//hidden: true,
		},
		{
			key: 'expenses', label: 'EXPENSES', label_long: 'EXPENSES',
			desc: 'Extra billable expenses.',
			flexBasis: '6rem', flexGrow: '1.0',
			sorter: sort_guid, search: search_by_guid,
			format: 'dollars', format_label: '$USD',
			//hidden: true,
		},
		{
			key: 'project_percent', label: 'COMP. %', label_long: 'PROJECT COMPLETION PERCENT',
			desc: 'The percentage progress of the project.',
			flexBasis: '5rem', flexGrow: '0.0',
			format: 'percentage',
			coming_soon: true,
			sorter: sort_remaining,
			hidden: true,
		},
		{
			key: 'allocation_max', label: 'TOTAL', label_long: 'TOTAL ALLOCATED TIME', format_label: 'HOURS / DAYS',
			desc: 'The total amount of time originally made available in this allocation.',
			flexBasis: '10rem', flexGrow: '0.0',
			format: 'billable_days',
			sorter: sort_max,
			hidden: true,
		},
		{
			key: 'use_total', label: 'USED', label_long: 'USED TIME', format_label: 'HOURS / DAYS',
			desc: 'The amount of time that has been used from this allocation.',
			flexBasis: '8rem', flexGrow: '0.0',
			calc_theme_color: (record, val) => SampleArray(available_time_gradient, 1.0 - record.use_total / record.allocation_max),
			format: 'billable_days',
			sorter: sort_used,
			hidden: true,
		},
		{
			key: 'remaining_total', label: 'FREE', label_long: 'FREE / AVAILABLE TIME', format_label: 'HOURS / DAYS',
			desc: 'The amount of time that has not been used from this allocation.',
			flexBasis: '8rem', flexGrow: '0.0',
			calc_theme_color: (record, val) => SampleArray(available_time_gradient, record.remaining_total / record.allocation_max),
			format: 'billable_days',
			sorter: sort_remaining,
			hidden: true,
		},
	];


class TKAllocations extends PanelContent
{
	constructor(page_content)
	{
		super(page_content.multicontent.e_root);
		this.page_content = page_content;
		this.page = page_content.page_instance;
	}

	OnCreateElements()
	{
		let data = window.SharedData['user allocations'].instance.data.filter(_ => _.user_id === UserAccountInfo.account_info.user_id);
		this.e_tableview = new TableView(this.e_parent, undefined);
		this.e_tableview.addEventListener('viewchange', () => { this.StoreState(this.page); this.page.TriggerStateDataChange(); });

		//this.e_tableview.group_by_property = 'guid';
		this.e_tableview.title = 'TIME PER PROJECT';
		this.e_tableview.description = 'This table shows your used and remaining  billable time per project.';

		this.e_tableview.configuration_active.columns.Reset();
		ALLOCATION_TABLE_COLUMNS.forEach(_ => this.e_tableview.configuration_active.columns.Register(_.key, _));
		this.e_tableview.configuration_active.columns.all[4].format = 'billable_time';
		this.e_tableview.configuration_active.columns.all[5].format = 'billable_time';
		this.e_tableview.configuration_active.columns.all[6].format = 'billable_time';
		this.e_tableview.configuration_active.AddAction('more_time', _ => { }, { color: 'skyblue', description: 'Use this time.' });

		this.e_tableview.data.SetRecords(data, false);

		this.OnRefreshElements();
	}

	OnRemoveElements() { this.e_tableview.RemoveElements(); }

	OnRefreshElements()
	{
		this.e_tableview.RefreshElements();
	}

	StoreState()
	{
		let data = this.e_tableview.configuration_active.GetState();
		this.page.SetStateValue('allocation_table_state', data);
	}

	RestoreState()
	{
		if (this.page.state.HasValue('allocation_table_state'))
		{
			let data = this.page.GetStateValue('allocation_table_state');
			this.e_tableview.configuration_active.SetState(data);
		}
	}
}



class TKHistoryContent extends PanelContent
{
	constructor(page_content)
	{
		super(page_content.multicontent.e_root);
		this.page_content = page_content;
		this.page = page_content.page_instance;
	}

	OnCreateElements()
	{
		let data = window.SharedData['user allocations'].instance.data.filter(_ => _.user_id === UserAccountInfo.account_info.user_id);

		this.e_tableview = new TableView(this.e_parent, undefined);
		this.e_tableview.addEventListener('viewchange', () => { this.StoreState(this.page); this.page.TriggerStateDataChange(); });
		this.e_tableview.group_by_property = 'created_date';
		this.e_tableview.title = 'DAILY USAGE';
		this.e_tableview.description = 'This table shows your billable time usage by date.';

		this.e_tableview.configuration_active.columns.Reset();
		HISTORY_TABLE_COLUMNS.forEach(_ => this.e_tableview.configuration_active.columns.Register(_.key, _));
		this.e_tableview.configuration_active.AddAction('chronic', _ => { }, { color: 'gold', description: 'Amend this usage.' });

		this.e_tableview.data.SetRecords(data, false, true);

		this.OnRefreshElements();
	}

	OnRemoveElements() { this.e_tableview.RemoveElements(); }

	OnRefreshElements()
	{
		this.e_tableview.RefreshElements();
	}

	StoreState()
	{
		let data = this.e_tableview.configuration_active.GetState();
		this.page.SetStateValue('table_state_history', data);
		console.warn('state stored: TKHistoryContent');
	}

	RestoreState()
	{
		if (this.page.state.HasValue('table_state_history'))
		{
			let data = this.page.GetStateValue('table_state_history');
			this.e_tableview.configuration_active.SetState(data);
			console.warn('state restored: TKHistoryContent');
		}
	}
}

class TKCalendar extends PanelContent
{
	constructor(page_content)
	{
		super(page_content.multicontent.e_root);
		this.page_content = page_content;
		this.page = page_content.page_instance;
	}

	OnCreateElements()
	{
		this.records = window.SharedData['user allocations'].instance.data.filter(_ => _.user_id === UserAccountInfo.account_info.user_id);
		this.all_uses = [];
		this.records.forEach(_ => { this.all_uses = this.all_uses.concat(_.use_history); });

		this.e_root = addElement(
			this.e_parent, 'div', '', 'display:flex; flex-direction:column; overflow:visible; flex-basis:0.0; flex-grow:1.0; padding:var(--gap-05);',
			_ => { this.e_root_list = CreatePagePanel(_, false, true, 'flex-direction:column; overflow:visible;'); }
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



class TimekeepContent extends PanelContent
{
	constructor(page)
	{
		super(page.e_content);
		this.page_instance = page;
	}

	OnCreateElements()
	{
		this.e_root = CreatePagePanel(this.e_parent, false, false, 'display:flex; flex-direction:column; flex-basis:1.0;');

		this.slide_mode = new SlideSelector();
		const modes = [
			{ label: 'CALENDAR', on_click: _ => { }, tooltip: 'Billable time by calendar period.' },
			{ label: 'PROJECTS', on_click: _ => { }, tooltip: 'Billable time by project (detailed view).' },
			{ label: 'CHARTS', on_click: _ => { }, tooltip: 'Billable time by project (simplified view).' },
			{ label: 'HISTORY', on_click: _ => { }, tooltip: 'Billable time usage history.' },
		];
		this.slide_mode.CreateElements(this.e_root, modes);

		this.e_multicontent_container = CreatePagePanel(this.e_root, true, false, 'display:flex; flex-direction:column; flex-basis:1.0; padding:0;');
		this.multicontent = new MultiContentPanel(this.e_multicontent_container);
		this.multicontent.addEventListener(
			'beforetransition',
			() =>
			{
				this.slide_mode.SetDisabled(true);
				let can_store = this.multicontent.content_active && this.multicontent.content_active.StoreState;
				if (can_store === true) this.multicontent.content_active.StoreState();
			}
		);
		this.multicontent.addEventListener(
			'aftertransition',
			() =>
			{
				let can_restore = this.multicontent.content_active && this.multicontent.content_active.RestoreState;
				if (can_restore === true) this.multicontent.content_active.RestoreState();
				this.slide_mode.SetDisabled(false);
			}
		);
		this.multicontent.CreateElements();

		//this.e_mode_content_container = addElement(this.e_root, 'div', '', 'border-radius:inherit; position:relative; flex-basis:100%;');
		//this.e_mode_content = addElement(this.e_mode_content_container, 'div', '', 'border-radius:inherit; display:flex; flex-direction:column; gap:var(--gap-05); overflow:hidden; top:0; left:0; width:100%; height:100%; padding:0; margin:0;');
		//this.e_mode_content.id = 'e_mode_content';

		this.mode_allocations = new TKAllocations(this);
		this.mode_history = new TKHistoryContent(this);
		this.mode_calendar = new TKCalendar(this);

		//this.content_current = undefined;

		this.on_mode_change = () => { this.AfterModeChange(); };
		this.refresh_soon = () => { this.RefreshContentSoon(); };
		this.update_content = () => { this.UpdateModeContent(); };

		this.content_timeout = new RunningTimeout(this.update_content, 0.25, false, 70);
		window.SharedData.Subscribe('user allocations', this.refresh_soon);

		this.slide_mode.Subscribe(this.on_mode_change);
		this.slide_mode.SelectIndexAfterDelay(this.page_instance.state.GetValue('view_mode') ?? 0, 150, true);
	}

	OnRemoveElements()
	{
		window.SharedData.Unsubscribe('user allocations', this.refresh_soon);
		this.e_root.remove();
	}

	OnRefreshElements()
	{
		this.e_root.innerHTML = '';
		this.UpdateModeContent();
	}

	AfterModeChange()
	{
		this.page_instance.state.SetValue('view_mode', this.slide_mode.selected_index);
		this.slide_mode.SetDisabled(true);
		this.RefreshContentSoon();
	}

	RefreshContentSoon() 
	{
		this.content_timeout.ExtendTimer();
	}

	UpdateModeContent()
	{
		switch (this.slide_mode.selected_index) 
		{
			case 0: this.multicontent.QueueContent(this.mode_calendar, false, false); break;
			case 1: this.multicontent.QueueContent(this.mode_allocations, false, false); break;
			case 2: this.multicontent.QueueContent(this.mode_allocations, false, false); break;
			case 3: this.multicontent.QueueContent(this.mode_history, false, false); break;
		}
	}

	/*
	TransitionContent(content_next = PanelContent.Nothing)
	{
		const PerformTransition = async () =>
		{
			this.slide_mode.SetDisabled(true);
			MarkElementLoading(this.e_mode_content);

			let can_store_state = this.content_current && this.content_current.StoreState;
			if (this.content_current && this.content_current.StoreState) this.content_current.StoreState();

			if (this.content_current && this.content_current.e_root)
			{
				await FadeElement(this.content_current.e_root, 100, 0, 0.125);
				this.content_current.RemoveElements();
			}

			this.content_current = content_next;
			this.content_current.CreateElements();

			let can_restore_state = this.content_current && this.content_current.RestoreState;
			if (this.content_current && this.content_current.RestoreState) this.content_current.RestoreState();

			this.slide_mode.SetDisabled(false);
			await FadeElement(this.content_current.e_root, 0, 100, 0.125);
			ClearElementLoading(this.e_mode_content, 250);
		};

		if (content_next) PerformTransition();
		else console.warn('invalid next content');
	}
	*/
}

export class PageTimekeep extends PageDescriptor
{
	order_index = -1;
	title = 'time keeper';
	icon = 'more_time';

	OnCreateElements(instance)
	{
		instance.e_frame.style.minWidth = 'min(100vw - 3 * var(--gap-1), 20rem)';
		instance.e_content.style.flexDirection = 'column';
		instance.e_content.style.gap = 'var(--gap-05)';

		instance.content = new TimekeepContent(instance);
		instance.content.CreateElements();
	}

	OnRemoveElements() { instance.content.RemoveElements(); }
	OnRefreshElements() { instance.content.RefreshElements(); }

	OnOpen(instance)
	{
		instance.relate_allocations = window.SharedData['user allocations'].AddNeeder();
	}

	OnClose(instance)
	{
		if (instance.relate_allocations) window.SharedData['user allocations'].RemoveNeeder(instance.relate_allocations);
		instance.relate_allocations = null;
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
			if (instance.state.data.expanding === true) instance.ClearMaxFrameWidth();
			else instance.SetMaxFrameWidth('80vh');
		}
		else
		{
			instance.ClearMaxFrameWidth();
		}
		//instance.content.RefreshContentSoon();
	}
}

PageManager.RegisterPage(new PageTimekeep('time keeper', 'time.keep', 'more_time', 'View and manage your billable time.'), 'k', 'Time Keeper');