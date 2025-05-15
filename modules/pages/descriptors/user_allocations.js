
import { AppEvents } from "../../appevents.js";
import { UserAllocation } from "../../datamodels/user_allocation.js";
import { PageManager } from "../../pagemanager.js";
import { PanelContent } from "../../ui/panel_content.js";
import { addElement, CreatePagePanel } from "../../utils/domutils.js";
import { PageDescriptor } from "../pagebase.js";


class PanelUserAllocationGroup extends PanelContent
{
	constructor(e_parent, group_id, records)
	{
		super(e_parent);
		this.group_id = group_id;
		this.records = records;
	}

	static CreateAllocationRow(e_parent, allocation = {}, cap_max = false)
	{
		let hoursUsed = 0.0;
		let allocationUses = allocation.use_history;
		allocationUses.forEach(x => hoursUsed += x.hours);
		if (cap_max === true) hoursUsed = Math.min(hoursUsed, allocation.allocation_max);
		let use_percent = hoursUsed / allocation.allocation_max;
		let use_color = '#ff02';
		if (use_percent > 1.0) use_color = '#f002';
		else if (use_percent == 1.0) use_color = '#0ff2';
		else if (use_percent > 0.9) use_color = '#0f02';
		let use_fill_style = `pointer-events:none;position:absolute;inset:0;width:${Math.min(1, use_percent) * 100.0}%; background:${use_color};`;
		if (use_percent > 1.0) use_fill_style += 'border:solid 2px orange;box-sizing:border-box;';
		else use_fill_style += 'border-right:solid 4px #fff1;';

		let use_note = 'pending';
		let use_note_color = '#8f0';
		if (use_percent > 1.0) { use_note = 'error'; use_note_color = '#f40'; }
		else if (use_percent == 1.0) { use_note = 'task_alt'; use_note_color = '#0ff'; }

		return CreatePagePanel(
			e_parent, false, false, 'display:flex;padding:var(--gap-025);',
			_ =>
			{
				CreatePagePanel(
					_, true, false,
					'text-align:right;align-content:center;flex-grow:0.0;flex-shrink:0.0;flex-basis:8rem;padding:var(--gap-05);',
					_ => { _.innerText = allocation.user_id; }
				);
				CreatePagePanel(
					_, true, false, 'text-align:center;flex-basis:1.0;padding:var(--gap-05);align-content:center;',
					_ =>
					{
						_.innerText = `${hoursUsed} of ${allocation.allocation_max} hrs used`;
						addElement(_, 'div', null, use_fill_style);
					}
				);

				//addElement(_, 'div', null, 'flex-basis:5rem;align-content:center;font-size:80%;font-weight:bold;color:' + use_note_color + ';', use_note.toUpperCase());
				addElement(
					_, 'i', 'material-symbols',
					'flex-basis:2rem;text-align:center;align-content:center;opacity:80%;font-size:1.25rem;color:' + use_note_color + ';',
					use_note.toUpperCase()
				);
			}
		);
	}

	OnCreateElements()
	{
		this.e_root = CreatePagePanel(
			this.e_parent, false, false, 'display:flex;flex-direction:column;padding:var(--gap-05);flex-grow:0.0;',
			_ =>
			{
				let summary_max = 0.0;
				let summary_history = [];
				for (let rid in this.records)
				{
					summary_max += this.records[rid].allocation_max;
					for (let hid in this.records[rid].use_history) summary_history.push(this.records[rid].use_history[hid]);
				}

				addElement(_, 'div', null, 'text-align:left;padding:calc(var(--gap-025) + 0.25rem);', _ => { _.innerText = this.group_id.toUpperCase(); });
				addElement(_, 'div', null, 'text-align:left;font-size:75%;text-align:center;opacity:50%;', 'Allocated Users');
				CreatePagePanel(
					_, true, false, 'display:flex;flex-direction:column;padding:var(--gap-05);gap:var(--gap-025);',
					_ =>
					{
						for (let rid in this.records)
							PanelUserAllocationGroup.CreateAllocationRow(_, this.records[rid]);
					}
				);

				CreatePagePanel(
					_, true, false, 'display:flex;flex-direction:column;padding:var(--gap-05);gap:var(--gap-025);',
					_ =>
					{
						let panel_total = PanelUserAllocationGroup.CreateAllocationRow(
							_,
							{
								user_id: 'TOTAL',
								allocation_max: summary_max,
								use_history: summary_history
							},
							true
						);
						panel_total.style.setProperty('--theme-color', '#fff');
					}
				);
			}
		);
	}
	OnRefreshElements() { }
	OnRemoveElements() { this.e_root.remove(); }
}

class PanelUserAllocationList extends PanelContent
{
	constructor(e_parent, records)
	{
		super(e_parent);
		this.records = records;
	}
	OnCreateElements()
	{
		let record_panels = [];
		this.e_root = CreatePagePanel(
			this.e_parent, true, false, 'display:flex;flex-direction:column;gap:var(--gap-1);padding:var(--gap-1);',
			_ =>
			{
				let records_grouped = Object.groupBy(this.records, _ => _.Title);
				for (let group_id in records_grouped)
				{
					record_panels.push(new PanelUserAllocationGroup(_, group_id, records_grouped[group_id]));
				}
			}
		);
		for (let record_id in record_panels) record_panels[record_id].CreateElements();

		this.e_actions = CreatePagePanel(this.e_parent, true, true, 'gap:var(--gap-025);flex-basis:2.5rem;flex-grow:0.0;flex-shrink:0.0;justify-content:space-around;');
		this.e_btn_create_new = CreatePagePanel(
			this.e_actions, false, false, 'align-content:center;text-align:center;max-width:12rem;',
			_ =>
			{
				_.classList.add('panel-button');
				_.style.setProperty('--theme-color', '#5f9');
				_.innerText = 'Create Allocation';
			}
		);
	}
	OnRefreshElements() { }
	OnRemoveElements() { this.e_root.remove(); this.e_actions.remove(); }
}









export class PageUserAllocations extends PageDescriptor
{
	title = 'user allocations';
	icon = 'help';
	order_index = 10;
	page_extra = true;

	OnCreateElements(instance)
	{
		instance.panel_list = new PanelUserAllocationList(instance.e_content, window.SharedData.userAllocations.instance.data);
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
			else instance.e_frame.style.maxWidth = '36rem';
		}
		else instance.e_frame.style.maxWidth = 'unset';
	}

	OnOpen(instance)
	{
		instance.sub_dataReload = AppEvents.onDataReloaded.RequestSubscription(_ =>
		{
			instance.panel_list.records = window.SharedData.userAllocations.instance.data;
			instance.panel_list.RecreateElements();
		});
	}

	OnClose(instance)
	{
		AppEvents.onDataReloaded.RemoveSubscription(instance.sub_dataReload);
	}
}

PageManager.RegisterPage(new PageUserAllocations('user allocations', 'projects.create'));