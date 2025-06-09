import { addElement, CreatePagePanel } from "../../utils/domutils.js";
import { PageManager } from "../../pagemanager.js";
import { PageDescriptor } from "../pagebase.js";
import { UserAccountInfo } from "../../useraccount.js";
import { MegaTips } from "../../systems/megatips.js";
import { FillBar } from "../../ui/fillbar.js";

const style_panel_title = 'text-align:center; height:1.25rem; line-height:1.25rem; font-size:0.9rem; flex-grow:0.0; flex-shrink:0.0;';
const style_panel_label = 'text-align:center; align-content:center; position:absolute; inset:0;';

export class PageTimekeep extends PageDescriptor
{
	order_index = -1;
	title = 'time keeper';

	OnCreateElements(instance)
	{
		if (!instance) return;

		instance.CreatePanel(
			instance.e_content, true, true, 'overflow:hidden;',
			e =>
			{
				instance.e_root_list = instance.CreatePanel(
					e, false, true, 'flex-direction:column; align-content:stretch;',
					e =>
					{
						addElement(e, 'div', '', style_panel_title, e => { e.innerText = "Active Allocations" });
						instance.e_unused_root = instance.CreatePanel(e, true, false, 'display:flex; flex-direction:column; flex-grow:1.0; overflow-y:auto; padding:var(--gap-05); gap:var(--gap-025); justify-content:flex-start;');
						addElement(e, 'div', '', style_panel_title, e => { e.innerText = "Past Allocations" });
						instance.e_used_root = instance.CreatePanel(e, true, false, 'display:flex; flex-direction:column; flex-basis:fit-content; flex-grow:0.0; overflow-y:auto; padding:var(--gap-05); gap:var(--gap-025); justify-content:flex-start;');
					}
				);
			}
		);

		instance.RefreshContent = () => this.RefreshContent(instance, 20);
		instance.RefreshContent();
	}

	RefreshContent(instance, delay = -1)
	{
		if (delay > 0)
		{
			window.setTimeout(() => { this.RefreshContent(instance); }, delay);
			return;
		}

		instance.e_used_root.innerHTML = '';
		instance.e_unused_root.innerHTML = '';

		let records = window.SharedData.userAllocations.instance.data.filter(_ => _.user_id === UserAccountInfo.account_info.user_id);
		let records_used = records.filter(_ => _.use_total >= _.allocation_max);
		let records_unused = records.filter(_ => _.use_total < _.allocation_max);

		const create_in = (x, e) =>
		{
			const style_smol = 'font-size:80%; padding-left:var(--gap-1);';
			let sum_used = x.use_total;// x.use_history.reduce((sum, record) => sum + record.hours, 0);

			let e_item = CreatePagePanel(
				e, false, false, 'display:flex; flex-direction:row; border-radius:var(--gap-05); flex-basis:fit-content; flex-grow:0.0; flex-shrink:0.0; padding:var(--gap-05);',
				_ =>
				{
					addElement(_, 'div', undefined, 'align-content:center;', x.Title.toUpperCase());

					let fillbar = FillBar.Create(
						_,
						`${Math.round(sum_used / x.allocation_max * 100)}% used`,
						sum_used / x.allocation_max,
						{
							label_alt: `${x.allocation_max - sum_used} hours available`,
							from_hue_deg: 35.0, to_hue_deg: 65.0,
							style_full: _ => { _.style.border = 'solid 1px cyan'; },
							style_overfull: _ => { _.style.border = 'solid 2px orange'; },
							check_color: (c, fill) =>
							{
								if (fill > 1.0) c = '#f003';
								else if (fill == 1.0) c = '#0ff3'
								else if (fill > 0.9) c = '#0f03';
								return c;
							}
						}
					);
				}
			);

			MegaTips.RegisterSimple(
				e_item,
				[
					x.Title.toUpperCase(),
					`(((${sum_used}))) / (((${x.allocation_max}))) hours used`,
					`[[[${x.allocation_max - sum_used}]]] hours available`,
				].join('<br>')
			);
		};

		records_used.forEach((x, i, a) => { create_in(x, instance.e_used_root) });
		records_unused.forEach((x, i, a) => { create_in(x, instance.e_unused_root) });
	}

	OnOpen(instance)
	{
		window.SharedData.userAllocations.instance.addEventListener('datachange', instance.RefreshContent);
		instance.relate_allocations = window.SharedData.userAllocations.AddNeeder();
	}

	OnClose(instance)
	{
		window.SharedData.userAllocations.instance.removeEventListener('datachange', instance.RefreshContent);
		window.SharedData.userAllocations.RemoveNeeder(instance.relate_allocations);
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
			if (instance.state.data.expanding === true) instance.e_frame.style.maxWidth = '64rem';
			else instance.e_frame.style.maxWidth = '32rem';
		}
		else
		{
			instance.e_frame.style.maxWidth = 'unset';
		}
	}
}

PageManager.RegisterPage(new PageTimekeep('time keeper', 'time.keep', 'chronic', 'View and manage your billable time.'), 'k', 'Time Keeper');