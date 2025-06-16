import { addElement, ClearElementLoading, CreatePagePanel, FadeElement, MarkElementLoading } from "../../utils/domutils.js";
import { PageManager } from "../../pagemanager.js";
import { PageDescriptor } from "../pagebase.js";
import { UserAccountInfo } from "../../useraccount.js";
import { MegaTips } from "../../systems/megatips.js";
import { FillBar } from "../../ui/fillbar.js";
import { SlideSelector } from "../../ui/slide_selector.js";
import { ChoiceOverlay } from "../../ui/overlays/overlay_choice.js";
import { RunningTimeout } from "../../utils/running_timeout.js";
import { PanelContent } from "../../ui/panel_content.js";
import { Calendar } from "../../ui/calendar.js";

const style_panel_title = 'text-align:center; height:1.25rem; line-height:1.25rem; font-size:0.9rem; flex-grow:0.0; flex-shrink:0.0;';

const week_days = ['Sunday', 'Monday', 'Tuesday', 'Wednesday', 'Thursday', 'Friday', 'Saturday'];
const month_names = ['January', 'February', 'March', 'April', 'May', 'June', 'July', 'August', 'September', 'October', 'November', 'December'];

class TKAllocations extends PanelContent
{
	OnCreateElements()
	{
		this.e_root = CreatePagePanel(
			this.e_parent, true, true, 'overflow:visible; flex-basis:100%; flex-direction:column;',
			_ =>
			{
				this.e_root_list = CreatePagePanel(
					_, false, true, 'flex-direction:column; align-content:stretch; flex-basis:100%;',
					_ =>
					{
						addElement(_, 'div', '', style_panel_title, e => { e.innerText = "Available" });
						this.e_unused_root = CreatePagePanel(_, true, false, 'display:flex; flex-direction:column; flex-grow:1.0; overflow-y:auto; padding:var(--gap-05); gap:var(--gap-05); justify-content:flex-start;');
						addElement(_, 'div', '', style_panel_title, e => { e.innerText = "Completed" });
						this.e_used_root = CreatePagePanel(_, true, false, 'display:flex; flex-direction:column; flex-basis:fit-content; flex-grow:0.0; overflow-y:auto; max-height:33vh; padding:var(--gap-05); gap:var(--gap-05); justify-content:flex-start;');
					}
				);
			}
		);

		this.Populate();
	}

	OnRemoveElements()
	{
		this.e_root.remove();
	}

	Populate()
	{
		this.e_used_root.innerHTML = '';
		this.e_unused_root.innerHTML = '';

		let records = window.SharedData['user allocations'].instance.data.filter(_ => _.user_id === UserAccountInfo.account_info.user_id);
		let records_used = records.filter(_ => _.use_total >= _.allocation_max);
		let records_unused = records.filter(_ => _.use_total < _.allocation_max);

		const create_in = (x, e_parent) =>
		{
			const style_smol = 'font-size:80%; padding-left:var(--gap-1);';
			let sum_used = x.use_total;// x.use_history.reduce((sum, record) => sum + record.hours, 0);

			let e_item = CreatePagePanel(
				e_parent, false, false, 'display:flex; flex-direction:column; border-radius:var(--corner-05); flex-basis:fit-content; flex-grow:0.0; flex-shrink:0.0; padding:var(--gap-05);',
				_ =>
				{
					addElement(
						_, 'div', null, 'display:flex; flex-direction:row; flex-grow:0.0;',
						_ =>
						{
							addElement(_, 'div', undefined, 'align-content:center; flex-basis:100%;', x.Title.toUpperCase());
							this.e_btn_add_usage = CreatePagePanel(
								_, false, false, 'width:1.5rem; height:1.5rem; flex-shrink:0.0; flex-grow:0.0;',
								_ =>
								{
									_.classList.add('panel-button');
									_.addEventListener(
										'click',
										e =>
										{
											ChoiceOverlay.ShowNew({ prompt: 'Meaningless Message', choices: [{ label: 'ok', on_click: overlay => { overlay.Dismiss(); } }] });
										}
									);

									_.appendElement(
										'i',
										_ =>
										{
											_.classList.add('material-symbols');
											_.style = 'position:absolute; inset:0; text-align:center; align-content:center;'
												+ 'font-size:1rem;';
											_.innerHTML = 'more_time';
										}
									);
								}
							);
						}
					);

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

			MegaTips.RegisterSimple(this.e_btn_add_usage, 'Add a new billable usage to this allocation.');

			MegaTips.RegisterSimple(
				e_item,
				[
					x.Title.toUpperCase(),
					`(((${sum_used}))) / (((${x.allocation_max}))) hours used`,
					`[[[${x.allocation_max - sum_used}]]] hours available`,
				].join('<br>')
			);
		};

		records_used.forEach((x, i, a) => { create_in(x, this.e_used_root) });
		records_unused.forEach((x, i, a) => { create_in(x, this.e_unused_root) });
	}
}

class TKCalendar extends PanelContent
{
	OnCreateElements()
	{
		let records = window.SharedData['user allocations'].instance.data.filter(_ => _.user_id === UserAccountInfo.account_info.user_id);
		let all_uses = [];
		records.forEach(_ => { all_uses = all_uses.concat(_.use_history); });

		this.e_root = CreatePagePanel(
			this.e_parent, true, true, 'flex-direction:column; overflow:visible;',
			_ => { this.e_root_list = CreatePagePanel(_, false, true, 'flex-direction:column; align-content:stretch;'); }
		);

		this.calendar = new Calendar(this.e_root_list, new Date());
		this.calendar.CreateDayContent = (date, element) =>
		{
			let relevant_usages = all_uses.filter(_ => _.date === date.toShortDateString());
			let sum_hours = 0;
			relevant_usages.forEach((x, i, a) => sum_hours += x.hours);
			addElement(
				element, 'div', '', '',
				_ =>
				{
					if (sum_hours > 0)
					{
						addElement(
							_, 'span', '', 'color:orange;',
							_ =>
							{
								_.innerText = `${sum_hours} hr`;
							}
						);
					}
				}
			);
		};
		this.calendar.CreateElements();
	}

	OnRemoveElements()
	{
		this.e_root.remove();
	}
}

export class PageTimekeep extends PageDescriptor
{
	order_index = -1;
	title = 'time keeper';

	OnCreateElements(instance)
	{
		if (!instance) return;

		instance.e_content.style.flexDirection = 'column';
		instance.e_content.style.gap = 'var(--gap-05)';

		instance.slide_mode = new SlideSelector();
		const modes = [
			{ label: 'ALLOCATIONS', on_click: _ => { }, tooltip: 'Your billable time by allocation.' },
			{ label: 'CALENDAR', on_click: _ => { }, tooltip: 'Your billable time by calendar period.' }
		];
		instance.slide_mode.CreateElements(instance.e_content, modes);

		instance.e_mode_content = addElement(instance.e_content, 'div', '', 'display:flex; flex-direction:column; gap:var(--gap-05); overflow:hidden; flex-basis:100%;');
		instance.mode_allocations = new TKAllocations(instance.e_mode_content);
		instance.mode_calendar = new TKCalendar(instance.e_mode_content);
		instance.content_current = undefined;

		instance.content_timeout = new RunningTimeout(() => { this.UpdateModeContent(instance); }, 0.25, false, 150);
		instance.RefreshContentSoon = () => { instance.content_timeout.ExtendTimer(); };

		instance.slide_mode.Subscribe(instance.RefreshContentSoon);
		instance.slide_mode.SelectIndexAfterDelay(0, 150, true);
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
				await FadeElement(instance.content_current.e_root, 100, 0, 0.125);
				instance.content_current.RemoveElements();
			}
			instance.content_current = content_next;
			instance.content_current.CreateElements();
			instance.slide_mode.SetDisabled(false);
			await FadeElement(instance.content_current.e_root, 0, 100, 0.125);
			ClearElementLoading(instance.e_mode_content, 250);
		};

		if ('RemoveElements' in content_next) PerformTransition();
		else console.warn('invalid next content');
	}

	/*
	RefreshContent(instance, delay = -1)
	{
		MarkElementLoading(instance.e_root_list);

		if (delay > 0)
		{
			window.setTimeout(() => { this.RefreshContent(instance); }, delay);
			return;
		}

		instance.e_used_root.innerHTML = '';
		instance.e_unused_root.innerHTML = '';

		let records = window.SharedData['user allocations'].instance.data.filter(_ => _.user_id === UserAccountInfo.account_info.user_id);
		let records_used = records.filter(_ => _.use_total >= _.allocation_max);
		let records_unused = records.filter(_ => _.use_total < _.allocation_max);

		const create_in = (x, e_parent) =>
		{
			const style_smol = 'font-size:80%; padding-left:var(--gap-1);';
			let sum_used = x.use_total;// x.use_history.reduce((sum, record) => sum + record.hours, 0);

			instance.e_item = CreatePagePanel(
				e_parent, false, false, 'display:flex; flex-direction:column; border-radius:var(--corner-05); flex-basis:fit-content; flex-grow:0.0; flex-shrink:0.0; padding:var(--gap-05);',
				_ =>
				{
					addElement(
						_, 'div', null, 'display:flex; flex-direction:row; flex-grow:0.0;',
						_ =>
						{
							addElement(_, 'div', undefined, 'align-content:center; flex-basis:100%;', x.Title.toUpperCase());
							instance.e_btn_add_usage = CreatePagePanel(
								_, false, false, 'width:1.5rem; height:1.5rem; flex-shrink:0.0; flex-grow:0.0;',
								_ =>
								{
									_.classList.add('panel-button');
									_.addEventListener(
										'click',
										e =>
										{
											ChoiceOverlay.ShowNew({ prompt: 'Meaningless Message', choices: [{ label: 'ok', on_click: overlay => { overlay.Dismiss(); } }] });
										}
									);

									_.appendElement(
										'i',
										_ =>
										{
											_.classList.add('material-symbols');
											_.style = 'position:absolute; inset:0; text-align:center; align-content:center;'
												+ 'font-size:1rem;';
											_.innerHTML = 'more_time';
										}
									);
								}
							);
						}
					);

					instance.fillbar = FillBar.Create(
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

			MegaTips.RegisterSimple(instance.e_btn_add_usage, 'Add a new billable usage to this allocation.');

			MegaTips.RegisterSimple(
				instance.e_item,
				[
					x.Title.toUpperCase(),
					`(((${sum_used}))) / (((${x.allocation_max}))) hours used`,
					`[[[${x.allocation_max - sum_used}]]] hours available`,
				].join('<br>')
			);
		};

		records_used.forEach((x, i, a) => { create_in(x, instance.e_used_root) });
		records_unused.forEach((x, i, a) => { create_in(x, instance.e_unused_root) });
		ClearElementLoading(instance.e_root_list, 250);
	}
	*/

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
			if (instance.state.data.expanding === true) instance.e_frame.style.maxWidth = '64rem';
			else instance.e_frame.style.maxWidth = '32rem';
		}
		else
		{
			instance.e_frame.style.maxWidth = 'unset';
		}
		instance.slide_mode.ApplySelectionSoon();
	}
}

PageManager.RegisterPage(new PageTimekeep('time keeper', 'time.keep', 'chronic', 'View and manage your billable time.'), 'k', 'Time Keeper');