
import { AppEvents } from "../../appevents.js";
import { PageManager } from "../../pagemanager.js";
import { PanelContent } from "../../ui/panel_content.js";
import { addElement, CreatePagePanel } from "../../utils/domutils.js";
import { RunningTimeout } from "../../utils/running_timeout.js";
import { PageDescriptor } from "../pagebase.js";


class PanelUserAllocationGroup extends PanelContent
{
	constructor(e_parent, group_id, records, get_row_label = _ => { _.user_id })
	{
		super(e_parent);
		this.group_id = group_id;
		this.records = records;
		this.get_row_label = get_row_label;
	}

	static CreateFillBar(e_parent, label, fill)
	{
		let fill_angle = 35.0 + 65.0 * fill;
		let color = 'rgba(from hsl(' + fill_angle + 'deg 100% 50%) r g b / 0.2)';
		if (fill > 1.0) color = '#f003';
		else if (fill == 1.0) color = '#0ff3';
		else if (fill > 0.9) color = '#0f03';

		let fill_style = `pointer-events:none;box-sizing:border-box;position:absolute;inset:0;width:${Math.min(1, fill) * 100.0}%; background:${color};`;
		if (fill > 1.0) fill_style += 'border:solid 2px orange;';
		else fill_style += 'border-right:solid 4px #fff1;';

		return CreatePagePanel(
			e_parent, true, false,
			'text-align:center;padding:var(--gap-025);align-content:center;border:solid 2px hsl(from var(--theme-color) h s 12%);',
			_ =>
			{
				addElement(_, 'div', null, fill_style);
				addElement(_, 'div', null, null, label);
			}
		);
	}

	static CreateAllocationRow(e_parent, allocation = {}, get_row_label = _ => { _.user_id }, cap_max = false)
	{
		let hoursUsed = 0.0;
		let allocationUses = allocation.use_history;
		allocationUses.forEach(x => hoursUsed += x.hours);
		if (cap_max === true) hoursUsed = Math.min(hoursUsed, allocation.allocation_max);

		let use_percent = hoursUsed / allocation.allocation_max;
		let use_color = 'rgba(from hsl(33% 100% 50%) r g b / 0.1)';
		if (use_percent > 1.0) use_color = '#f002';
		else if (use_percent == 1.0) use_color = '#0ff2';
		else if (use_percent > 0.9) use_color = '#0f02';
		let use_fill_style = `pointer-events:none;box-sizing:border-box;position:absolute;inset:0;width:${Math.min(1, use_percent) * 100.0}%; background:${use_color};`;
		if (use_percent > 1.0) use_fill_style += 'border:solid 2px orange;';
		else use_fill_style += 'border-right:solid 4px #fff1;';

		let use_note = 'pending';
		let use_note_color = '#8f0';
		if (use_percent > 1.0) { use_note = 'error'; use_note_color = '#f40'; }
		else if (use_percent == 1.0) { use_note = 'task_alt'; use_note_color = '#0ff'; }

		return CreatePagePanel(
			e_parent, false, false, 'display:flex;padding:var(--gap-025);box-shadow:none;',
			_ =>
			{
				if (allocation.user_id && allocation.user_id.length > 0)
				{
					addElement(
						_, 'div', null,
						'text-align:right;align-content:center;flex-grow:0.0;flex-shrink:0.0;flex-basis:8rem;padding:var(--gap-05);',
						_ => { _.innerText = get_row_label(allocation); }
					);
				}

				PanelUserAllocationGroup.CreateFillBar(_, `${hoursUsed} of ${allocation.allocation_max} hrs used`, use_percent, use_color);

				addElement(
					_, 'i', 'material-symbols',
					'flex-basis:2rem;text-align:center;align-content:center;opacity:60%;font-size:1.25rem;color:' + use_note_color + ';',
					use_note.toUpperCase()
				);
			}
		);
	}

	OnCreateElements()
	{
		this.e_root = CreatePagePanel(
			this.e_parent, false, false, 'display:flex;flex-direction:column;padding:var(--gap-05);gap:var(--gap-05);flex-grow:0.0;flex-shrink:0.0;',
			_ =>
			{
				let summary_max = 0.0;
				let summary_used = 0.0;
				let summary_history = [];
				for (let rid in this.records)
				{
					summary_max += this.records[rid].allocation_max;
					for (let hid in this.records[rid].use_history) 
					{
						let use = this.records[rid].use_history[hid];
						summary_used += use.hours;
						summary_history.push(use);
					}
				}

				addElement(
					_, 'div', null, 'display:flex;flex-direction:row;flex-basis:0.0;padding:var(--gap-025);gap:var(--gap-025);',
					_ =>
					{
						addElement(
							_, 'i', 'material-symbols',
							'text-align:center; align-content:center; font-size:1.75rem; line-height:1.75rem; flex-shrink:0.0; opacity:30%;',
							_ =>
							{
								_.innerText = 'deployed_code';
							}
						);


						addElement(
							_, 'div', null,
							'text-align:center; align-content:center; flex-shrink:0.0; flex-grow:1.0; background:#0003; border-radius:var(--gap-05);',
							_ =>
							{
								_.innerText = this.group_id.toUpperCase();
								_.setAttribute('showcopy', '');
							}
						);

						let e_fill_total = PanelUserAllocationGroup.CreateFillBar(_, `${Math.round(summary_used / summary_max * 100)}% used`, summary_used / summary_max, '#333');
						e_fill_total.style.flexGrow = '5.0';
						e_fill_total.style.flexShrink = '0.0';


						addElement(
							_, 'div', null, 'display:flex;flex-direction:row;justify-content:flex-end;gap:var(--gap-05);',
							_ =>
							{
								CreatePagePanel(
									_, true, false, 'display:flex;flex-direction:row;flex-grow:0.0;flex-shrink:0.0;',
									_ =>
									{
										const style_action_button = 'align-content:center;text-align:center;flex-grow:0.0;padding:0.25rem;opacity:80%;cursor:pointer;';
										const style_action_icon = 'position:absolute; top:50%; left:50%; transform:translate(-50%,-50%); font-size:1.25rem;';

										CreatePagePanel(
											_, false, false, style_action_button,
											_ =>
											{
												_.classList.add('hover-lift');
												_.classList.add('panel-button');
												_.style.setProperty('--theme-color', '#5f9');
												_.title = 'Add an allocation to this allocation group';

												addElement(
													_, 'i', 'material-symbols', style_action_icon,
													_ => _.innerText = 'add'
												);
											}
										);

										CreatePagePanel(
											_, false, false, style_action_button,
											_ =>
											{
												_.classList.add('hover-lift');
												_.classList.add('panel-button');
												_.style.setProperty('--theme-color', '#fb2');
												_.title = 'Send this allocation group to the archive';

												addElement(
													_, 'i', 'material-symbols', style_action_icon,
													_ => _.innerText = 'archive'
												);
											}
										);
									}
								);
							}
						);
					}
				);

				const style_section_title = 'text-align:left; font-size:70%; text-align:center; opacity:50%; letter-spacing:1px;';

				addElement(_, 'div', null, style_section_title, _ => _.innerText = 'ALLOCATIONS');
				CreatePagePanel(
					_, true, false, 'display:flex; flex-direction:column; padding:var(--gap-05); gap:0;',
					_ =>
					{
						let e_container = addElement(_, 'div', null, 'flex-basis:100%; border-radius:var(--gap-05); overflow:hidden; clip-path:fill;');
						for (let rid in this.records)
						{
							let p_record = PanelUserAllocationGroup.CreateAllocationRow(e_container, this.records[rid], this.get_row_label);
							p_record.style.borderRadius = 0;
						}
					}
				);
			}
		);
	}

	OnRefreshElements()
	{

	}

	OnRemoveElements() { this.e_root.remove(); }
}

class PanelUserAllocationList extends PanelContent
{
	constructor(e_parent, records, get_record_group = _ => _.Title, get_record_label = _ => _.user_id)
	{
		super(e_parent);
		this.filter_dirty = new RunningTimeout(() => this.RefreshElements(), 0.5, false, 150);
		this.records = records;
		this.get_record_label = get_record_label;
		this.get_record_group = get_record_group;
	}

	OnCreateElements()
	{
		this.e_root = addElement(this.e_parent, 'div', null, 'position:relative;display:flex;flex-direction:column;gap:var(--gap-025);flex-basis:100%;flex-grow:1.0;overflow:hidden;');

		this.e_filters_root = CreatePagePanel(this.e_root, true, false, 'display:flex; flex-direction:row; flex-grow:0.0; flex-shrink:0.0;');
		this.e_input_search = addElement(
			this.e_filters_root, 'input', null,
			'flex-basis:100%;padding:var(--gap-05); color:hsl(from var(--theme-color) h s 45%);',
			_ =>
			{
				_.type = 'text';
				_.placeholder = 'Filter Allocations...';
				_.addEventListener('keyup', e => { e.stopPropagation(); e.preventDefault(); this.filter_dirty.ExtendTimer(); });
			}
		);

		this.e_root_records = CreatePagePanel(this.e_root, true, false, 'display:flex;flex-direction:column;gap:var(--gap-1);padding:var(--gap-05);');
		this.e_root_records.classList.add('scroll-y');

		this.e_actions = CreatePagePanel(this.e_root, true, true, 'gap:var(--gap-025);flex-basis:2.5rem;flex-grow:0.0;flex-shrink:0.0;justify-content:space-around;');
		this.e_btn_create_new = CreatePagePanel(
			this.e_actions, false, false, 'align-content:center;text-align:center;max-width:12rem;',
			_ =>
			{
				_.classList.add('panel-button');
				_.style.setProperty('--theme-color', '#5f9');
				_.innerText = 'Create Allocation';
			}
		);

		this.filter_dirty.ExtendTimer();
	}

	OnRefreshElements()
	{
		for (let record_id in this.record_panels) this.record_panels[record_id].RemoveElements();

		this.record_panels = [];
		this.e_root_records.innerHTML = '';

		let search_strs = [];
		if (this.e_input_search && this.e_input_search.value.length > 0)
			search_strs = this.e_input_search.value.split(',').map(_ => _.trim().toLowerCase()).filter(_ => _.length > 0);

		let groups = Object.groupBy(this.records, this.get_record_group);
		for (let group_id in groups)
		{
			let search_blob = '';
			let allocations = groups[group_id].records;
			let filter_match = true;

			if (search_strs.length > 0)
			{
				filter_match = false;
				let search_targets = [];
				search_targets.push(group_id);
				for (let allocation_id in allocations)
				{
					let allocation = allocations[allocation_id];
					search_targets.push(allocation.user_id);
				}
				search_blob = search_targets.filter(_ => typeof _ === 'string').map(_ => _.trim().toLowerCase()).filter(_ => _.length > 0).join('::');

				for (let ssi in search_strs)
				{
					let search_str = search_strs[ssi];
					if (search_blob.indexOf(search_str) > -1)
					{
						filter_match = true;
						break;
					}
				}
			}

			if (filter_match !== true) continue;
			this.record_panels.push(new PanelUserAllocationGroup(this.e_root_records, group_id, groups[group_id], this.get_record_label));
		}
		for (let record_id in this.record_panels) this.record_panels[record_id].CreateElements();
	}
	OnRemoveElements() { this.e_root.remove(); }
}









export class PageUserAllocations extends PageDescriptor
{
	title = 'user allocations';
	icon = 'help';
	order_index = 10;
	page_extra = true;

	OnCreateElements(instance)
	{
		instance.e_content.style.overflow = 'hidden';
		//instance.panel_list = new PanelUserAllocationList(instance.e_content, window.SharedData.userAllocations.instance.data, _ => _.user_id, _ => _.Title.toUpperCase());
		instance.panel_list = new PanelUserAllocationList(instance.e_content, window.SharedData.userAllocations.instance.data, _ => _.Title.toUpperCase(), _ => _.user_id);
		instance.panel_list.CreateElements();
	}

	UpdateSize(instance)
	{
		instance.UpdateBodyTransform();
		this.OnLayoutChange(instance);
	}

	OnLayoutChange(instance)
	{
		if (instance.state_data.docked === true)
		{
			if (instance.state_data.expanding === true) instance.e_frame.style.maxWidth = '72rem';
			else instance.e_frame.style.maxWidth = '32rem';
		}
		else instance.e_frame.style.maxWidth = 'unset';
	}

	OnOpen(instance)
	{
		instance.relate_UserAllocations = window.SharedData.userAllocations.AddNeeder();
		instance.sub_dataReload = AppEvents.onDataReloaded.RequestSubscription(
			_ =>
			{
				instance.panel_list.records = window.SharedData.userAllocations.instance.data;
				instance.panel_list.RecreateElements();
			}
		);
	}

	OnClose(instance)
	{
		window.SharedData.userAllocations.RemoveNeeder(instance.relate_UserAllocations);
		AppEvents.onDataReloaded.RemoveSubscription(instance.sub_dataReload);
	}
}

PageManager.RegisterPage(new PageUserAllocations('user allocations', 'projects.create'));