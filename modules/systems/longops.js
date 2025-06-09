import { addElement, CreatePagePanel, FlashElement, getTransitionStyle } from "../utils/domutils.js";
import { NotificationLog } from "../notificationlog.js";
import { ActionBar } from "../actionbar.js";
import { Trench } from "../ui/trench.js";
import { MegaTips } from "./megatips.js";
import { getDurationString } from "../utils/timeutils.js";

const lskey_history = 'longops-history';

export class LongOpInstance extends EventTarget
{
	static Nothing = new LongOpInstance();

	constructor(id = 'long.operation.xyz', data = { label: 'A Long Operation' })
	{
		super();
		this.id = id;
		this.stopped = false;

		for (let pid in data) this[pid] = data[pid];

		if ('ts_start' in this && typeof this.ts_start === 'string') this.ts_start = Number.parseInt(this.ts_start);
		if ('ts_stop' in this && typeof this.ts_stop === 'string') this.ts_stop = Number.parseInt(this.ts_stop);
		if ('duration' in this && typeof this.duration === 'string') this.duration = Number.parseInt(this.duration);
	}

	GetData()
	{
		return {
			id: this.id,
			label: this.label,
			icon: this.icon,
			verb: this.verb,
			ts_start: this.ts_start,
			ts_stop: this.ts_stop,
			stopped: this.stopped,
			duration: this.duration,
			error: this.error
		};
	}

	SetData(data = { label: 'A Long Operation' })
	{
		for (let pid in data) this[pid] = data[pid];
		this.dispatchEvent(new CustomEvent('datachange', {}));
	}

	Start()
	{
		if ('ts_start' in this) return;
		this.ts_start = Date.now();
		this.dispatchEvent(new CustomEvent('start', {}));
		this.stopped = false;
	}

	Stop()
	{
		if (this.stopped === true) 
		{
			NotificationLog.Log('Operation Already Stopped!');
			return;
		}
		this.stopped = true;
		this.ts_stop = Date.now();
		if (this.ts_start) this.duration = this.ts_stop - this.ts_start;
		this.dispatchEvent(new CustomEvent('stop', {}));
	}
}

export class LongOpsHistory
{
	static ops = [];
	static loaded = false;

	static Load()
	{
		LongOpsHistory.ops = [];
		let lsitem = localStorage.getItem(lskey_history);
		if (lsitem)
		{
			let lsobj = JSON.parse(lsitem);
			if ('op_data' in lsobj) LongOpsHistory.ops = lsobj.op_data.map(_ => new LongOpInstance(_.id, _));
		}
		LongOpsHistory.loaded = true;
	}
	static Save() { localStorage.setItem(lskey_history, JSON.stringify({ op_data: LongOpsHistory.ops.map(_ => _.GetData()) })); }

	static CheckLoaded() { if (LongOpsHistory.loaded !== true) LongOpsHistory.Load(); }
	static Add(op = LongOpInstance.Nothing)
	{
		LongOpsHistory.CheckLoaded();
		LongOpsHistory.ops.push(op);
		if (LongOpsHistory.ops.length > 20) LongOpsHistory.ops = LongOpsHistory.ops.slice(LongOpsHistory.ops.length - 20, LongOpsHistory.ops.length);
		LongOpsHistory.Save();
	}

	static Clear()
	{
		LongOpsHistory.ops = [];
		LongOpsHistory.Save();
	}
}

export class LongOpsEntryUI
{
	constructor(e_ops_list, op = LongOpInstance.Nothing, fade_delay = 25)
	{
		this.op = op;

		let op_done = 'duration' in this.op;
		let op_error = 'error' in this.op && typeof this.op.error === 'string' && this.op.error.length > 0;

		let col = op_error ? '#fa0' : (op_done ? '#0f0a' : '#fa0f');
		this.e_op = CreatePagePanel(
			e_ops_list, false, false,
			'display:flex; flex-direction:row; flex-wrap:nowrap; overflow:hidden; opacity:0%; transition-property:opacity; transition-duration:var(--trans-dur-off-slow);',
			_ =>
			{
				_.classList.add('progress-filling');
				_.style.opacity = '0%';
				_.style.setProperty('--theme-color', op_done ? '#6f7' : 'unset');

				if (this.op.icon) this.e_icon = addElement(_, 'i', 'material-symbols', 'font-size:1rem; color:' + col + ';', _ => { _.innerText = this.op.icon; });

				this.e_label = addElement(
					_, 'div', undefined,
					'font-size:0.7rem; align-content:center; line-height:0; text-wrap:nowrap; flex-grow:1.0; flex-shrink:0.0; min-width:10rem;',
					_ =>
					{
						_.innerText = this.op.label ?? this.op.id;
					}
				);
				this.e_icon_status = addElement(_, 'i', 'material-symbols', 'font-size:1rem; color:' + col + ';', _ => { _.innerText = op_done ? 'task_alt' : 'circle'; });
			}
		);

		this.megatip = MegaTips.RegisterSimple(this.e_op, null);

		window.setTimeout(() => { this.UpdateElements(); }, fade_delay);

		const dismiss_action = () => { LongOpsUI.instance.RemoveListEntry(this); LongOps.Dismiss(this.op); };
		this.e_op.addEventListener('click', e => { if ('duration' in this.op) dismiss_action(); });

		if ('addEventListener' in this.op)
		{
			this.op.addEventListener('start', e => this.UpdateElements());
			this.op.addEventListener('stop', e => this.UpdateElements());
			this.op.addEventListener('datachange', () => this.UpdateElements());
		}
	}

	UpdateElements()
	{
		let op_done = 'duration' in this.op;
		let op_error = 'error' in this.op && typeof this.op.error === 'string' && this.op.error.length > 0;

		if (this.op.error) this.e_label.style.textDecoration = '#fa0 dashed line-through';
		else this.e_label.style.textDecoration = 'none';

		if (op_done)
		{
			this.e_op.classList.remove('progress-filling');
			this.e_op.style.setProperty('--theme-color', op_error ? '#f82' : '#6f7');

			this.e_op.style.cursor = 'pointer';
			this.e_op.style.opacity = '70%';

			this.megatip.prep = _ =>
			{
				_.innerHTML = MegaTips.FormatHTML('(((OPERATION))) ' + (this.op.error ?? (this.op.verb ?? 'UNKNOWN')));
				if ('ts_start' in this.op) _.innerHTML += MegaTips.FormatHTML('<br>(((STARTED))) ' + new Date(this.op.ts_start).toLocaleString());
				if ('ts_stop' in this.op) _.innerHTML += MegaTips.FormatHTML('<br>(((ENDED))) ' + new Date(this.op.ts_stop).toLocaleString());
				if ('duration' in this.op)
				{
					_.innerHTML += MegaTips.FormatHTML('<br>(((DURATION))) ' + getDurationString(this.op.duration));
					_.innerHTML += MegaTips.FormatHTML('<br>[[[Click to Dismiss]]]');
				}
			};

			this.e_icon_status.innerText = op_error ? 'error' : 'task_alt';
			this.e_icon_status.style.color = op_error ? '#fa0a' : '#0f0a';
			if (this.e_icon) this.e_icon.style.color = op_error ? '#fa0a' : '#0f0a';
		}
		else
		{
			this.e_op.style.cursor = 'wait';
			this.e_op.style.setProperty('--theme-color', 'unset');
			this.e_op.classList.remove('progress-filling');
			this.e_op.classList.add('progress-filling');

			this.e_op.style.opacity = '100%';
			this.megatip.prep = _ =>
			{
				_.innerHTML = MegaTips.FormatHTML('(((OPERATION))) ' + (this.op.error ?? (this.op.verb ?? 'UNKNOWN')));
				_.innerHTML += MegaTips.FormatHTML('<br>[[[IN PROGRESS]]]');
			};

			this.e_icon_status.innerText = 'pending';
			this.e_icon_status.style.color = '#fa0f';
			if (this.e_icon) this.e_icon.style.color = '#fa0f';
		}
	}

	RemoveElements()
	{
		this.e_op.remove();
	}
}

export class LongOpsUI
{
	static instance = new LongOpsUI();

	created = false;
	visible = false;

	CreateElements()
	{
		if (this.created === true) return;
		this.e_root = CreatePagePanel(
			document.body, false, false,
			'z-index:50000; position:absolute; top:50%; right:1rem; transform:translate(0%, -50%);'
			+ 'outline:solid 2px orange; box-shadow:0px 0px 1rem black;'
			+ 'display:flex; flex-direction:column; flex-wrap:nowrap; gap:var(--gap-025);'
			+ 'min-width:2rem; max-height:70vh;' + getTransitionStyle('opacity'),
			_ =>
			{
				_.id = 'long_ops-output';

				let trench = new Trench(_, true, '0.8rem');
				trench.AddLabel('OPERATIONS', 'Here you can see operations that are expected to take some time, and their progress or status.');
				let e_btn_close = trench.AddIconButton('close', e => { LongOps.ToggleVisibility(); }, 'Hide the Operations panel');
				e_btn_close.style.setProperty('--theme-color', '#f00');

				const style_opslist = 'display:flex; flex-direction:column-reverse; flex-wrap:nowrap; flex-basis:100%;';
				this.e_ops_list = CreatePagePanel(_, true, true, style_opslist);

				CreatePagePanel(
					_, true, false,
					'font-size:0.7rem; font-weight:bold; text-align:center; align-content:center; opacity:60%; padding:var(--gap-025); flex-shrink:0.0;',
					_ =>
					{
						_.classList.add('panel-button');
						_.innerText = 'DISMISS ALL';
						_.addEventListener(
							'click',
							e =>
							{
								LongOps.ToggleVisibility();
								LongOpsHistory.Clear();
							}
						);
					}
				);
			}
		);
		this.created = true;

		this.SetVisible(this.visible);
		//this.RefreshListElements();
	}

	RemoveListEntry(entry)
	{
		let existing_id = this.op_entries.indexOf(entry);
		if (existing_id < 0) return;
		this.op_entries[existing_id].RemoveElements();
		this.op_entries.splice(existing_id, 1);
	}

	RefreshListElements()
	{
		this.e_ops_list.innerHTML = '';
		if (this.created !== true) return;

		for (let eid in this.op_entries) this.op_entries[eid].RemoveElements();

		LongOpsHistory.CheckLoaded();

		this.op_entries = [];
		for (let opid in LongOpsHistory.ops) this.op_entries.push(new LongOpsEntryUI(this.e_ops_list, LongOpsHistory.ops[opid], 25 + 5 * this.op_entries.length));
		for (let opid in LongOps.active) this.op_entries.push(new LongOpsEntryUI(this.e_ops_list, LongOps.active[opid], 25 + 5 * this.op_entries.length));

		this.e_ops_list.scrollTop = -this.e_ops_list.scrollHeight;
	}

	AppendListElement(op = LongOpInstance.Nothing)
	{
		this.op_entries.push(new LongOpsEntryUI(this.e_ops_list, op, 25));
		this.e_ops_list.scrollTop = -this.e_ops_list.scrollHeight;
	}

	RemoveElements()
	{
		if (this.created !== true) return;
		this.e_root.remove();
		this.created = false;
	}

	ToggleVisible()
	{
		this.SetVisible(!this.visible);
	}

	SetVisible(visible = true)
	{
		this.visible = visible;
		this.CreateElements();

		if (this.created !== true) return;
		this.RefreshListElements();

		if (this.visible === true)
		{
			this.e_root.style.opacity = '100%';
			this.e_root.style.pointerEvents = 'unset';
		}
		else 
		{
			this.e_root.style.opacity = '0%';
			this.e_root.style.pointerEvents = 'none';
		}
	}
}

export class LongOps extends EventTarget
{
	constructor()
	{
		super();
	}

	static active = [];
	static instance = new LongOps();

	static AddEventListener(event = 'opchange', action = op => { })
	{
		instance.addEventListener(event, action);
	}

	static RemoveEventListener(event = 'opchange', action = op => { })
	{
		instance.removeEventListener(event, action);
	}

	static Start(id = 'long.operation.xyz', data = { label: 'A Long Operation' })
	{
		let op = new LongOpInstance(id, data);
		LongOps.active.push(op);
		op.Start();

		LongOps.instance.dispatchEvent(new CustomEvent("startop", { detail: { op: op } }));
		LongOps.instance.dispatchEvent(new CustomEvent("opchange", { detail: { op: op } }));

		if (data.silent !== true || LongOpsUI.instance.visible === true) LongOpsUI.instance.SetVisible(true);

		//LongOps.toggle_info.e_icon.style.opacity = '80%';
		//LongOps.toggle_info.e_btn.style.setProperty('--theme-color', '#ff0');
		//FlashElement(LongOps.toggle_info.e_btn, 1.0, 1.0, 'black');

		return op;
	}

	static Dismiss(op = LongOpInstance.Nothing)
	{
		let existing_id = LongOpsHistory.ops.indexOf(op);
		if (existing_id < 0) return undefined;
		LongOpsHistory.ops.splice(existing_id, 1);
		if (LongOpsHistory.ops.length < 1 && LongOps.active.length < 1) LongOps.ToggleVisibility();
	}

	static Stop(op = LongOpInstance.Nothing, error = undefined)
	{
		op.error = error;

		let active_id = LongOps.active.indexOf(op);
		if (active_id > -1) 
		{
			LongOps.active.splice(active_id, 1)[0];
			op.Stop();

			LongOps.instance.dispatchEvent(new CustomEvent("stopop", { detail: { op: op } }));
			LongOps.instance.dispatchEvent(new CustomEvent("opchange", { detail: { op: op } }));
			LongOpsHistory.Add(op);
		}
		return op;
	}

	static CreateActionBarElements()
	{
		LongOps.toggle_info = ActionBar.AddIcon('chronic', _ => { _.innerHTML = LongOpsUI.instance.visible ? 'Hide Operations List' : 'Show Operations List' }, e => { LongOps.ToggleVisibility(); });
		LongOps.toggle_info.e_icon.style.opacity = '50%';
	}

	static ToggleVisibility()
	{
		//FlashElement(LongOps.toggle_info.e_btn, 1.0, 3.0, 'gold');
		LongOpsUI.instance.ToggleVisible();

		if (LongOpsUI.instance.visible)
		{
			LongOps.toggle_info.e_icon.style.opacity = '80%';
			LongOps.toggle_info.e_btn.style.setProperty('--theme-color', '#ff0');
			FlashElement(LongOps.toggle_info.e_btn, 1.0, 1.0, 'black');
		}
		else
		{
			LongOps.toggle_info.e_icon.style.opacity = '50%';
			LongOps.toggle_info.e_btn.style.removeProperty('--theme-color');
			FlashElement(LongOps.toggle_info.e_btn, 1.0, 1.0, 'black');
		}
	}
}