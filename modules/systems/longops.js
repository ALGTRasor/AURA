import { ActionBar } from "../actionbar.js";
import { NotificationLog } from "../notificationlog.js";
import { Trench } from "../ui/trench.js";
import { addElement, CreatePagePanel, FlashElement, getTransitionStyle } from "../utils/domutils.js";

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

		//let rand = Math.round(Math.random() * 89999) + 100000;
		//NotificationLog.Log('OP START: ' + this.id + `   ${rand}`);
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

		//let rand = Math.round(Math.random() * 89999) + 100000;
		//NotificationLog.Log('OP STOP: ' + this.id + `   ${rand}`);
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
		let col = op_done ? '#0f0a' : '#fa0f';
		this.e_op = CreatePagePanel(
			e_ops_list, false, false,
			'display:flex; flex-direction:row; flex-wrap:nowrap; overflow:hidden; opacity:0%; transition-property:opacity; transition-duration:var(--trans-dur-off-slow);',
			_ =>
			{
				_.classList.add('progress-filling');
				_.style.opacity = '0%';

				this.e_label = addElement(_, 'div', undefined, 'font-size:0.7rem; align-content:center; line-height:0; text-wrap:nowrap; flex-grow:1.0; flex-shrink:0.0;', _ => { _.innerText = this.op.label ?? this.op.id; });
				this.e_icon = addElement(_, 'i', 'material-symbols', 'font-size:1rem; color:' + col + ';', _ => { _.innerText = op_done ? 'task_alt' : 'circle'; });
				this.e_btn_dismiss = CreatePagePanel(
					_, false, false,
					'font-size:0.7rem; align-content:center; line-height:0; align-content:center; flex-grow:0.0; flex-shrink:0.0;'
					+ 'top:50%; transform:translate(0%, -50%); padding:0;',
					_ =>
					{
						_.title = 'Dismiss this operation';
						//_.style.setProperty('--theme-color', '#fa0');
						addElement(_, 'i', 'material-symbols', 'position:absolute; inset:0; font-size:1rem;', _ => { _.innerText = 'close_small'; });
						_.classList.add('panel-button');
					}
				);
			}
		);
		window.setTimeout(() => { this.UpdateElements(); }, fade_delay);
		this.e_btn_dismiss.addEventListener(
			'click',
			e =>
			{
				LongOpsUI.instance.RemoveListEntry(this);
				LongOps.Dismiss(this.op);
			}
		);

		if ('addEventListener' in this.op)
		{
			this.op.addEventListener('start', e => this.UpdateElements());
			this.op.addEventListener('stop', e => this.UpdateElements());
			this.op.addEventListener('datachange', () => this.UpdateElements());
		}
	}

	UpdateElements()
	{
		if ('duration' in this.op)
		{
			this.e_op.classList.remove('progress-filling');

			this.e_op.style.opacity = '70%';
			this.e_op.title = `COMPLETE: ${Math.round(this.op.duration)}ms`;

			this.e_icon.innerText = 'task_alt';
			this.e_icon.style.color = '#0f0a';

			this.e_btn_dismiss.style.opacity = '100%';
			this.e_btn_dismiss.style.pointerEvents = 'unset';
		}
		else
		{
			this.e_op.classList.remove('progress-filling');
			this.e_op.classList.add('progress-filling');

			this.e_op.style.opacity = '100%';
			this.e_op.title = 'PENDING';

			this.e_icon.innerText = 'pending';
			this.e_icon.style.color = '#fa0f';

			this.e_btn_dismiss.style.opacity = '25%';
			this.e_btn_dismiss.style.pointerEvents = 'none';
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
			'z-index:50000; position:absolute; top:calc(1rem + var(--action-bar-height)); right:1rem;'
			+ 'outline:solid 2px orange; box-shadow:0px 0px 1rem black;'
			+ 'display:flex; flex-direction:column; flex-wrap:nowrap; gap:var(--gap-025);'
			+ 'min-width:2rem; max-height:50vh;' + getTransitionStyle('opacity'),
			_ =>
			{
				_.id = 'long_ops-output';

				let trench = new Trench(_);
				trench.AddLabel('OPERATIONS');
				trench.AddIconButton('close', e => { LongOps.ToggleVisibility(); }, 'Hide this panel');

				const style_opslist = 'display:flex; flex-direction:column-reverse; justify-content:flex-end; flex-wrap:nowrap;'
					+ 'flex-basis:100%;';
				this.e_ops_list = CreatePagePanel(_, true, true, style_opslist);

				CreatePagePanel(
					_, true, false,
					'font-size:0.7rem; font-weight:bold; text-align:center; opacity:60%; padding:var(--gap-025);',
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
	}

	AppendListElement(op = LongOpInstance.Nothing)
	{
		this.op_entries.push(new LongOpsEntryUI(this.e_ops_list, op, 25));
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

		LongOpsUI.instance.SetVisible(true);
		//LongOpsUI.instance.AppendListElement(op);

		LongOps.toggle_info.e_icon.style.opacity = '80%';
		LongOps.toggle_info.e_btn.style.setProperty('--theme-color', '#ff0');
		FlashElement(LongOps.toggle_info.e_btn, 1.0, 1.0, 'black');
		return op;
	}

	static Dismiss(op = LongOpInstance.Nothing)
	{
		let existing_id = LongOpsHistory.ops.indexOf(op);
		if (existing_id < 0) return undefined;
		LongOpsHistory.ops.splice(existing_id, 1);
		if (LongOpsHistory.ops.length < 1) LongOps.ToggleVisibility();
	}

	static Stop(op = LongOpInstance.Nothing)
	{
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
		LongOps.toggle_info = ActionBar.AddIcon('chronic', 'Show / Hide Long Operations', e => { LongOps.ToggleVisibility(); });
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