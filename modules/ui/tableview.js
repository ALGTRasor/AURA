import { MegaTips } from "../systems/megatips.js";
import { addElement, ClearElementLoading, CreatePagePanel, MarkElementLoading } from "../utils/domutils.js";
import { FieldValidation } from "../utils/field_validation.js";
import { RunningTimeout } from "../utils/running_timeout.js";
import { GlobalStyling } from "./global_styling.js";
import { PanelContent } from "./panel_content.js";

class TableViewEntry extends PanelContent
{
	constructor(table_view, record = {})
	{
		super(table_view.e_records);
		this.table_view = table_view;
		this.record = record;
	}

	OnCreateElements()
	{
		this.e_root = addElement(this.e_parent, 'div', 'tableview-row', '');
		this.OnRefreshElements();
	}

	OnRemoveElements()
	{
		this.e_root.remove();
	}

	RefreshColumns()
	{
		this.table_view.columns.forEach(
			(x, i) =>
			{
				if (x.hidden !== true) x.ApplyStyling(this.e_props[i]);
			}
		);
	}

	OnRefreshElements()
	{
		if (this.table_view.columns.all && this.table_view.columns.all.length > 0)
		{
			this.e_props = [];
			const add_prop = column =>
			{
				if (column.hidden === true)
				{
					this.e_props.push(undefined);
					return;
				}

				let value_string = '';
				value_string = column.GetValueString(this.record);
				if (column.value_suffix) value_string = value_string + column.value_suffix;
				if (column.format) 
				{
					let validator = FieldValidation.GetValidator(column.format);
					if (validator) value_string = validator(value_string);
				}
				let e_prop = addElement(
					this.e_root, 'div', 'tableview-cell', '',
					_ =>
					{
						column.ApplyStyling(_);
						if (column.calc_theme_color) _.style.setProperty('--theme-color', column.calc_theme_color(this.record, this.record[column.key]));
						_.innerText = value_string;
					}
				);

				if (column.coming_soon === true) 
				{
					e_prop.style.backgroundColor = 'black';
					e_prop.style.color = '#333';
				}
				this.e_props.push(e_prop);
			};
			this.table_view.columns.forEach(add_prop);

			this.e_actions = [];
			const add_action = action_data =>
			{
				let e_btn_action = addElement(
					this.e_root, 'div', 'tableview-action', '',
					_ =>
					{
						_.style.setProperty('--theme-color', action_data.color);
						addElement(
							_, 'i', 'material-symbols icon-button tableview-action-icon', '',
							_ =>
							{
								_.innerText = action_data.icon;
							}
						);
					}
				);
				this.e_actions.push(e_btn_action);
			}
			this.table_view.actions.forEach(add_action);
		}
		else
		{
			addElement(this.e_root, 'div', 'tableview-cell', '', _ => { _.innerText = 'NO COLUMNS'; });
		}
	}
}

class TableViewData
{
	constructor(table_view)
	{
		this.table_view = table_view;
		this.records_base = [];
		this.records_view = [];
		this.filters = [];
		this.sorters = [];
	}

	ClearRecords()
	{
		this.records_base = [];
		this.records_view = [];
	}

	SetRecords(records = [], append = true, refresh = true)
	{
		if (records.length < 1)
		{
			if (append !== true) this.ClearRecords();
			return;
		}

		if (append !== true) this.records_base = [];
		records.forEach(_ => this.records_base.push(_));

		if (refresh === true) this.RefreshViewRecords();
	}

	RefreshViewRecords()
	{
		this.ApplyFilters();
		this.ApplySorters();
	}

	ClearFilters() { this.filters = []; }
	AddFilter(filter = record => true) { if (filter) this.filters.push(filter); }
	ApplyFilters()
	{
		this.records_view = Array.from(this.records_base);
		this.filters.forEach(f => this.records_view = this.records_view.filter(f));
	}

	ClearSorters() { this.sorters = []; }
	AddSorter(sorter = (x, y) => 0) { if (sorter) this.sorters.push(sorter); }
	ApplySorters() { this.sorters.forEach(s => this.records_view.sort(s)); }
}

class TableViewColumn
{
	static Nothing = new TableViewColumn();

	constructor(table_view, key = '', data = {})
	{
		this.table_view = table_view;
		this.key = key;

		for (let prop_key in data)
		{
			this[prop_key] = data[prop_key];
		}

		this.sorting = false;
		this.sorting_reverse = false;
		this.sort_icon = undefined;

		this.collapsed = false;
	}

	GetState()
	{
		return {
			key: this.key,
			sorting: this.sorting,
			sorting_reverse: this.sorting_reverse,
			collapsed: this.collapsed,
			filter_value: this.filter_value ?? '',
		};
	}

	SetState(data)
	{
		if (!data) return;

		this.sorting = data.sorting ?? false;
		this.sorting_reverse = data.sorting_reverse ?? false;
		this.collapsed = data.collapsed ?? false;
		this.filter_value = data.filter_value ?? '';

		if (this.e_txt_filter) this.e_txt_filter.value = this.filter_value;

		this.SetSorting(this.sorting, this.sorting_reverse);
	}

	GetValueString(record, no_value_string = '---') { return (record[this.key] ?? this.no_value_string) ?? no_value_string; }

	ApplyStyling(element, is_search_field = false, is_action = false)
	{
		if (!element) return;
		element.style.opacity = '0.7';

		element.style.minWidth = this.table_view.column_width_min ?? '2rem';

		if (this.flexGrow) element.style.flexGrow = this.flexGrow;
		if (this.flexBasis) element.style.flexBasis = this.flexBasis;
		if (this.maxWidth) element.style.maxWidth = this.maxWidth;
		if (this.textAlign) element.style.textAlign = this.textAlign;

		if (this.collapsed === true) 
		{
			element.style.flexBasis = this.table_view.column_width_min ?? '2rem';
			element.style.flexGrow = '0.0';
			element.style.opacity = '0.35';
		}

		if (is_search_field === true)
		{
			if (this.search)
			{
				element.style.pointerEvents = 'all';
				element.style.visibility = 'visible';
				if ('placeholder' in element) element.placeholder = '...';
			}
			else
			{
				element.style.visibility = 'hidden';
				element.style.pointerEvents = 'none';
				element.style.userSelect = 'none';
			}
		}

		if (is_action === true)
			element.style.visibility = 'hidden';
	}

	ToggleSorting()
	{
		if (this.sorting === true) 
		{
			if (this.sorting_reverse === true)
			{
				this.sorting = false;
				this.sorting_reverse = false;
				this.sort_icon = undefined;
			}
			else
			{
				this.sorting_reverse = true;
				this.sort_icon = 'arrow_upward';
				this.sort_icon_angle = '180deg';
			}
		}
		else
		{
			this.sorting = true;
			this.sorting_reverse = false;
			this.sort_icon = 'arrow_upward';
			this.sort_icon_angle = '0deg';
		}
		this.RefreshSortingStyling();
	}

	SetSorting(sorting = true, reverse = false)
	{
		this.sorting = sorting;
		this.sorting_reverse = sorting && reverse;

		if (this.sorting === true) 
		{
			if (this.sorting_reverse === true)
			{
				this.sort_icon = 'arrow_upward';
				this.sort_icon_angle = '180deg';
			}
			else
			{
				this.sort_icon = 'arrow_upward';
				this.sort_icon_angle = '0deg';
			}
		}
		else
		{
			this.sort_icon = undefined;
		}
		this.RefreshSortingStyling();
	}

	RefreshSortingStyling()
	{
		if (this.sort_icon)
		{
			if (this.e_sort_icon)
			{
				this.e_sort_icon.innerText = this.sort_icon;
				this.e_sort_icon.style.rotate = this.sort_icon_angle;
				this.e_sort_icon.style.opacity = '100%';
			}
			if (this.e_label)
			{
				this.e_label.style.color = GlobalStyling.GetThemeColor(60, true);
				this.e_label.style.paddingLeft = 'calc(var(--gap-05) * 2)';
				this.e_label.style.paddingRight = '0';
			}
		}
		else 
		{
			if (this.e_sort_icon)
			{
				this.e_sort_icon.style.rotate = '90deg';
				this.e_sort_icon.style.opacity = '0%';
			}
			if (this.e_label)
			{
				this.e_label.style.removeProperty('color');
				this.e_label.style.removeProperty('padding-left');
				this.e_label.style.removeProperty('padding-right');
			}
		}
	}
}

class TableViewColumns
{
	constructor(table_view)
	{
		this.table_view = table_view;
		this.all = [];
	}

	GetState() { return { columns: this.all.map(_ => _.GetState()) }; }
	SetState(data = {}) { this.all.forEach((_, i) => _.SetState(data.columns[i])); }

	forEach = (action = (x, i, a) => { }) => this.all.forEach(action);

	IndexOf(key = '') { return this.all.findIndex(x => x.key === key); }
	Register(key, options)
	{
		let column = new TableViewColumn(this.table_view, key, options);
		if (this.IndexOf(column.key) > -1) return;
		this.all.push(column);
		this.table_view?.RefreshSoon();
	}

	Reset()
	{
		this.all = [];
		this.table_view?.RefreshSoon();
	}
}

export class TableView extends PanelContent
{
	constructor(e_parent, records = [])
	{
		super(e_parent);
		this.dirty = false;
		this.change_timeout = new RunningTimeout(
			() =>
			{
				this.dirty = false;
				this.RefreshElements();
			},
			0.5, false, 70
		);
		this.column_width_min = '2rem';

		this.group_by_property = '';

		this.actions = [];
		this.columns = new TableViewColumns(this);
		this.data = new TableViewData(this);
		this.data.SetRecords(records, false, false);
	}

	AddAction(icon = 'help', action = record => { }, color = undefined) { this.actions.push({ icon: icon, action: action, color: color }) };

	GetState() { return this.columns.GetState(); }
	SetState(data) { this.columns.SetState(data); }

	OnCreateElements()
	{
		this.e_root = addElement(this.e_parent, 'div', 'tableview-root', 'position:absolute; inset:0;');
		this.e_search_row = addElement(this.e_root, 'div', 'tableview-columns tableview-filters', '');
		this.e_column_row = addElement(this.e_root, 'div', 'tableview-columns', '');
		this.e_records = addElement(this.e_root, 'div', 'tableview-rows', '');
		this.record_entries = [];
		this.RecreateColumns();
	}

	OnRemoveElements()
	{
		this.record_entries.forEach(_ => _.RemoveElements());
		this.record_entries = [];
		this.e_root.remove();
	}

	OnRefreshElements()
	{
		this.data.RefreshViewRecords();

		const before = () =>
		{
			MarkElementLoading(this.e_records);
			this.e_records.style.pointerEvents = 'none';
		};

		const after = () =>
		{
			ClearElementLoading(this.e_records, 250);
			this.e_records.style.pointerEvents = 'all';
		};

		const during = () =>
		{
			this.e_records.innerHTML = '';
			this.RefreshColumns();
			if (this.group_by_property && this.group_by_property.length > 0)
			{
				this.e_records.style.paddingTop = 'var(--gap-025)';
				this.e_records.style.paddingBottom = 'var(--gap-025)';
				this.e_records.style.gap = 'var(--gap-025)';
				let groups = Object.groupBy(this.data.records_view, _ => _[this.group_by_property]);
				for (let key in groups)
				{
					let records = groups[key];
					let e_group = addElement(
						this.e_records, 'div', 'tableview-row-group', '',
						_ => { addElement(_, 'div', 'tableview-row-group-title', '', _ => { _.innerText = key.toUpperCase(); }); }
					);
					records.forEach(
						_ =>
						{
							let entry = new TableViewEntry(this, _);
							entry.e_parent = e_group;
							entry.CreateElements();
							this.record_entries.push(entry);
						}
					);
				}
			}
			else
			{
				this.data.records_view.forEach(
					_ =>
					{
						let entry = new TableViewEntry(this, _);
						entry.CreateElements();
						this.record_entries.push(entry);
					}
				);
			}
		};

		this.TransitionElements(
			before, during, after,
			{
				fade_target: () => this.e_records,
				fade_duration: 0.125,
				skip_fade_out: false,
				skip_fade_in: false
			}
		);
	}

	RefreshSoon()
	{
		this.dirty = true;
		this.change_timeout.ExtendTimer();
	}

	RecreateColumns()
	{
		this.e_column_row.innerHTML = '';
		this.e_search_row.innerHTML = '';
		this.data.ClearSorters();
		this.data.ClearFilters();
		this.columns.forEach(
			col =>
			{
				if (col.hidden === true) return;

				const handle_sorter_click = e =>
				{
					if (e.button === 0)
					{
						if (col.collapsed === true)
						{
							col.collapsed = false;
							this.RefreshColumns();
						}
						if (col.sorter)
						{
							if (e.shiftKey === true)
							{
								col.ToggleSorting();
							}
							else
							{
								let was_sorting = col.sorting;
								let was_sorting_reverse = col.sorting_reverse;
								this.columns.forEach(_ => { _.SetSorting(false); });
								col.SetSorting(was_sorting !== true || was_sorting_reverse !== true, was_sorting === true && was_sorting_reverse !== true);
							}
							this.RefreshSoon();
						}
					}
					else if (e.button === 1)
					{
						col.collapsed = col.collapsed !== true;
						this.RefreshColumns();
					}
					this.EmitViewChange();
				};

				col.e_label = addElement(
					this.e_column_row, 'div', 'tableview-cell', '',
					_ =>
					{
						_.innerText = col.label;
						if (col.format_label && col.format_label.length > 0)
						{
							let e_format = addElement(_, 'div', '', '', _ => { _.innerText = col.format_label; });
							e_format.style.fontSize = '70%';
							e_format.style.opacity = '60%';
						}
						else if (col.coming_soon === true)
						{
							let e_format = addElement(_, 'div', '', '', _ => { _.innerText = 'WIP'; });
							e_format.style.fontSize = '70%';
							e_format.style.opacity = '60%';
						}

						if (col.coming_soon === true) 
						{
							_.style.setProperty('--theme-color', '#333');
							_.style.backgroundColor = '#000';
							_.style.opacity = '50%';
						}

						_.classList.add('tableview-cell-button');
						_.addEventListener('click', handle_sorter_click);
						_.addEventListener('auxclick', handle_sorter_click);

						if (col.sorter)
						{
							col.e_sort_icon = addElement(
								_, 'div', 'tableview-column-icon', '',
								_ =>
								{
									_.innerText = col.sort_icon;
									_.style.rotate = col.sort_icon_angle;
								}
							);
						}
						MegaTips.RegisterSimple(
							_,
							[
								col.coming_soon ? '<<<THIS COLUMN CONTAINS INCOMPLETE OR INVALID DATA.>>><br>' : undefined,
								col.label_long ?? col.label,
								col.desc ? `(((${col.desc})))` : undefined,
								'<div style="height:var(--gap-025);padding:0;margin:0;"></div>',
								col.sorter ? '[[[CLICK]]] (((to))) {{{SORT ONLY}}} (((by this column)))' : undefined,
								col.sorter ? '[[[SHIFT CLICK]]] (((to))) {{{SORT ALSO}}} (((by this column)))' : undefined,
								'[[[MIDDLE CLICK]]] (((to))) {{{COLLAPSE / EXPAND}}} (((this column)))',
								'<div style="height:var(--gap-05);padding:0;margin:0;"></div>',
								col.sorter ? '(((Sorting multiple columns will apply from left to right.)))' : undefined,
								col.sorter ? '(((Sorting columns cannot be collapsed.)))' : undefined,
							].filter(_ => _ != undefined).join('<br>')
						);
					}
				);
				col.ApplyStyling(col.e_label, false);


				col.e_txt_filter = addElement(
					this.e_search_row, 'input', 'tableview-cell', 'min-width:0;',
					_ =>
					{
						_.type = 'text';
						_.value = this.filter_value ?? '';

						_.addEventListener(
							'click',
							e =>
							{
								col.collapsed = false;
								this.RefreshColumns();
							}
						);
						_.addEventListener('keyup', e =>
						{
							if (col.filter_value === _.value) return;
							e.stopPropagation();
							col.filter_value = _.value;
							this.EmitViewChange();
							this.RefreshSoon();
						});
					}
				);
				col.ApplyStyling(col.e_txt_filter, true);

				MegaTips.RegisterSimple(
					col.e_txt_filter,
					[
						'(((Filter by))) ' + col.label,
						'(((Start with an exclamation mark))) [[[!]]] (((to negate the results.)))',
					].join('<br>')
				);

				col.column_filter = record =>
				{
					if (col.search) return col.search(record, col.e_txt_filter.value);
					return true;
				};
				this.data.AddFilter(col.column_filter);

				col.column_sorter = (x, y) =>
				{
					if (col.sorting !== true) return 0;
					let sort_result = col.sorter(x, y);
					if (col.sorting_reverse === true) sort_result *= -1;
					return sort_result;
				};
				this.data.AddSorter(col.column_sorter);
			}
		);

		this.actions.forEach(
			action_data =>
			{
				addElement(this.e_column_row, 'div', 'tableview-action', 'pointer-events:none;visibility:hidden;');
				addElement(this.e_search_row, 'div', 'tableview-action', 'pointer-events:none;visibility:hidden;');
			}
		);
	}

	RefreshColumns()
	{
		this.columns.forEach(
			col =>
			{
				if (col.hidden === true) return;
				col.e_txt_filter.value = col.filter_value ?? '';
				col.ApplyStyling(col.e_label);
				col.ApplyStyling(col.e_txt_filter);
			}
		);
		this.record_entries.forEach(_ => _.RefreshColumns());
	}

	EmitViewChange() { this.dispatchEvent(new CustomEvent('viewchange')); }
}