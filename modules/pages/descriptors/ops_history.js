import { UserAccountInfo } from "../../useraccount.js";
import { PageManager } from "../../pagemanager.js";
import { PageDescriptor } from "../page_descriptor.js";
import { Help } from "./help.js";
import { LongOps, LongOpsHistory } from "../../systems/longops.js";
import { addElement, CreatePagePanel } from "../../utils/domutils.js";
import { RunningTimeout } from "../../utils/running_timeout.js";
import { getDurationString } from "../../utils/timeutils.js";
import { MegaTips } from "../../systems/megatips.js";


export class PageLongOpsHistory extends PageDescriptor
{
	title = 'ops history';
	hidden_page = true;

	OnCreateElements(instance)
	{
		if (!instance) return;

		instance.e_frame.style.minWidth = 'min(100% - 3 * var(--gap-1), 20rem)';
		instance.e_content.style.overflow = 'hidden';

		instance.e_ops_root = CreatePagePanel(instance.e_content, true, true, 'flex-direction:column; flex-wrap:nowrap; flex-basis:1.0;');
		instance.e_ops_root.style.clipPath = 'border-box';

		LongOpsHistory.CheckLoaded();
		window.setTimeout(() => { LongOps.RefreshIconStyle(); }, 100);

		this.OnRefreshElements(instance);
	}

	OnRefreshElements(instance)
	{
		instance.e_ops_root.innerHTML = '';

		let ii = 0;
		let ops_grouped = Object.groupBy(LongOpsHistory.ops, _ => new Date(_.ts_start).getDateStart().toFancyDateString());
		for (let group_key in ops_grouped)
		{
			let op_group = ops_grouped[group_key];
			CreatePagePanel(
				instance.e_ops_root, false, false, 'flex-grow:0.0; flex-shrink:0.0;',
				_ =>
				{
					addElement(_, 'div', '', 'padding:var(--gap-025); font-size:110%; opacity:100%; color:var(--theme-color-text-80); text-align:center;', _ => { _.innerText = group_key; });
					let e_ops = CreatePagePanel(_, true, true, 'flex-direction:column; flex-wrap:nowrap; flex-basis:1.0; gap:0; padding:0;');

					let ii = 0;
					while (ii < op_group.length)
					{
						let op = op_group[ii];
						let id = op_group.length - ii;
						ii++;
						let e_op = addElement(e_ops, 'div', '', 'display:flex;flex-direction:row; padding:4px;');
						e_op.style.backgroundColor = 'hsl(from ' + (op.error ? 'red' : 'green') + ' h s 50% / 0.1)';
						e_op.addEventListener('click', e => { LongOps.Dismiss(op); });
						MegaTips.RegisterSimple(e_op, 'Click to dismiss');
						addElement(e_op, 'div', '', 'min-width:2rem;flex-grow:0.0;flex-shrink:0.0;font-size:80%;padding-right:1rem;text-align:right;', _ => { _.innerText = id.toString(); });
						addElement(e_op, 'div', '', 'min-width:5rem;flex-grow:0.0;flex-shrink:0.0;font-size:80%;padding-right:1rem;', _ => { _.innerText = new Date(op.ts_start).toLocaleTimeString().replaceAll(' ', ''); });
						addElement(e_op, 'div', '', 'min-width:3rem;flex-grow:0.0;flex-shrink:0.0;font-size:80%;text-align:right;padding-right:1rem;text-wrap:nowrap;', _ => { _.innerText = getDurationString(op.duration); });
						addElement(
							e_op, 'div', '', 'min-width:6rem;flex-shrink:0.0;flex-grow:0.0;text-overflow:ellipsis;overflow:hidden;font-size:90%; padding-right:1rem;text-wrap:nowrap;',
							_ =>
							{
								_.innerText = (op.error ?? (op.verb ?? 'UNKNOWN'));
								_.style.color = 'hsl(from ' + (op.error ? 'red' : 'green') + ' h s 50%)';
							}
						);
						addElement(
							e_op, 'div', '', 'flex-shrink:1.0;flex-grow:1.0;text-overflow:ellipsis;overflow:hidden;text-wrap:nowrap; text-align:right;',
							_ =>
							{
								_.innerText = op.label;
							}
						);
					}
				}
			);
			ii++;
		}
	}

	UpdateSize(instance)
	{
		instance.UpdateBodyTransform();
		this.OnLayoutChange(instance);
	}

	OnLayoutChange(instance)
	{
		if (instance.state.data.docked === true && instance.state.data.expanding === false) instance.e_frame.style.maxWidth = '36rem';
		else instance.e_frame.style.maxWidth = 'unset';
	}

	OnOpen(instance)
	{
		instance.RefreshContent = () => { this.OnRefreshElements(instance); };
		instance.content_timeout = new RunningTimeout(() => { instance.RefreshContent(); }, 0.1, false, 30);
		instance.RefreshContentSoon = () => { instance.content_timeout.ExtendTimer(); };
		LongOps.AddEventListener('opchange', instance.RefreshContentSoon);
	}

	OnClose(instance)
	{
		LongOps.RemoveEventListener('opchange', instance.RefreshContentSoon);
	}
}

PageManager.RegisterPage(new PageLongOpsHistory('ops history', UserAccountInfo.app_access_permission, 'chronic'), 'o', 'Long Operations History');
Help.Register(
	'pages.ops history', 'Long Operations History',
	'The Long Operations History shows a list of past completed long operations.'
);