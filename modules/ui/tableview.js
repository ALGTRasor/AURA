import { MegaTips } from "../systems/megatips.js";
import { addElement, ClearElementLoading, MarkElementLoading } from "../utils/domutils.js";
import { FieldValidation } from "../utils/field_validation.js";
import { RunningTimeout } from "../utils/running_timeout.js";
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
		if (this.table_view.view_columns && this.table_view.view_columns.length > 0)
		{
			this.table_view.view_columns.forEach((x, i) => { x.ApplyStyling(this.e_props[i]); });
		}
	}

	OnRefreshElements()
	{
		if (this.table_view.view_columns && this.table_view.view_columns.length > 0)
		{
			this.e_props = [];
			const add_prop = column =>
			{
				let value_string = '';
				value_string = column.GetValueString(this.record);
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
						_.innerText = value_string;
					}
				);
				this.e_props.push(e_prop);
			};
			this.table_view.view_columns.forEach(add_prop);
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

	SetRecords(records = [], append = true)
	{
		if (records.length < 1)
		{
			if (append !== true) this.ClearRecords();
			return;
		}

		if (append !== true) this.records_base = [];
		records.forEach(_ => this.records_base.push(_));
		this.RefreshViewRecords();
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

export class TableViewColumn
{
	static Nothing = new TableViewColumn();

	constructor(key = '', label = '', data = {})
	{
		this.key = key;
		this.label = label;

		for (let prop_key in data)
		{
			this[prop_key] = data[prop_key];
		}

		this.sorting = false;
		this.sorting_reverse = false;
		this.sort_icon = undefined;

		this.collapsed = false;
	}

	GetValueString(record, no_value_string = '---') { return (record[this.key] ?? this.no_value_string) ?? no_value_string; }

	ApplyStyling(element)
	{
		element.style.opacity = '0.7';

		if (this.flexGrow) element.style.flexGrow = this.flexGrow;
		if (this.flexBasis) element.style.flexBasis = this.flexBasis;
		if (this.maxWidth) element.style.maxWidth = this.maxWidth;
		if (this.textAlign) element.style.textAlign = this.textAlign;

		if (this.collapsed === true) 
		{
			element.style.flexBasis = '2rem';
			element.style.flexGrow = '0.0';
			element.style.opacity = '0.35';
		}
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
	}
}

export class TableView extends PanelContent
{
	constructor(e_parent, records = [])
	{
		super(e_parent);
		this.change_timeout = new RunningTimeout(() => this.RefreshElements(), 0.25, false, 70);

		this.view_columns = [];
		this.data = new TableViewData(this);
		this.data.SetRecords(records, false);
	}

	OnCreateElements()
	{
		this.e_root = addElement(this.e_parent, 'div', 'tableview-root', 'position:absolute; inset:0;');
		this.e_search_row = addElement(this.e_root, 'div', 'tableview-columns tableview-filters', '');
		this.e_column_row = addElement(this.e_root, 'div', 'tableview-columns', '');
		this.e_records = addElement(this.e_root, 'div', 'tableview-rows', '');
		this.record_entries = [];
		this.RecreateColumns();
		this.RefreshSoon();
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
		this.TransitionElements(
			() =>
			{
				MarkElementLoading(this.e_records);
				this.e_records.style.pointerEvents = 'none';
			},
			() =>
			{
				this.e_records.innerHTML = '';
				this.RefreshColumns();
				this.data.records_view.forEach(
					_ =>
					{
						let entry = new TableViewEntry(this, _);
						entry.CreateElements();
						this.record_entries.push(entry);
					}
				);
			},
			() =>
			{
				ClearElementLoading(this.e_records);
				this.e_records.style.pointerEvents = 'all';
			},
			{
				fade_target: () => this.e_records,
				fade_duration: 0.125,
				skip_fade_out: false,
				skip_fade_in: false
			}
		);
	}

	RefreshSoon() { this.change_timeout.ExtendTimer(); }

	RecreateColumns()
	{
		this.e_column_row.innerHTML = '';
		this.e_search_row.innerHTML = '';
		this.data.ClearSorters();
		this.data.ClearFilters();
		this.view_columns.forEach(
			col =>
			{
				col.e_label = addElement(
					this.e_column_row, 'div', 'tableview-cell', '',
					_ =>
					{
						_.innerText = col.label;
						col.ApplyStyling(_);
						if (col.sorter)
						{
							let e_col_sort_icon = addElement(
								_, 'div', 'tableview-column-icon', '',
								_ =>
								{
									_.innerText = col.sort_icon;
									_.style.rotate = col.sort_icon_angle;
								}
							);
							_.classList.add('tableview-cell-button');
							const handle_click = e =>
							{
								if (e.button === 0)
								{
									if (col.collapsed === true)
									{
										col.collapsed = false;
										this.RefreshColumns();
									}
									else
									{
										col.ToggleSorting();

										if (col.sort_icon)
										{
											e_col_sort_icon.innerText = col.sort_icon;
											e_col_sort_icon.style.rotate = col.sort_icon_angle;
											e_col_sort_icon.style.opacity = '100%';
										}
										else 
										{
											e_col_sort_icon.style.rotate = '90deg';
											e_col_sort_icon.style.opacity = '0%';
										}
										this.RefreshSoon();
									}
								}
								else if (e.button === 1)
								{
									if (col.sorting !== true)
									{
										col.collapsed = col.collapsed !== true;
										this.RefreshColumns();
									}
								}
							};
							_.addEventListener('click', handle_click);
							_.addEventListener('auxclick', handle_click);
							MegaTips.RegisterSimple(
								_,
								[
									col.label,
									'[[[CLICK]]] (((to sort by this column)))',
									'[[[MIDDLE CLICK]]] (((to collapse / expand this column)))',
								].join('<br>')
							);
						}
					}
				);

				col.e_txt_filter = addElement(
					this.e_search_row, 'input', 'tableview-cell', 'min-width:0;',
					_ =>
					{
						col.ApplyStyling(_);

						_.type = 'text';
						if (col.search)
						{
							_.placeholder = '...';
						}
						else
						{
							_.style.pointerEvents = 'none';
							_.style.userSelect = 'none';
						}
						_.addEventListener(
							'click',
							e =>
							{
								col.collapsed = false;
								this.RefreshColumns();
							}
						);
						_.addEventListener('keyup', e => { e.stopPropagation(); this.RefreshSoon(); });
					}
				);
				MegaTips.RegisterSimple(
					col.e_txt_filter,
					[
						'[[[CLICK]]] (((to filter by))) ' + col.label,
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
	}

	RefreshColumns()
	{
		this.view_columns.forEach(
			col =>
			{
				col.ApplyStyling(col.e_label);
				col.ApplyStyling(col.e_txt_filter);
			}
		);

		this.record_entries.forEach(_ => _.RefreshColumns());
	}

	IndexOfColumn(key = '') { return this.view_columns.findIndex(x => x.key === key); }
	RegisterColumn(column = TableViewColumn.Nothing)
	{
		if (this.IndexOfColumn(column.key) > -1) return;
		this.view_columns.push(column);
		this.RefreshSoon();
	}

	ResetColumns()
	{
		this.view_columns = [];
		this.RefreshSoon();
	}
}