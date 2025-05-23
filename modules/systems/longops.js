import { ActionBar } from "../actionbar.js";
import { addElement, CreatePagePanel, FlashElement, getTransitionStyle, secondsDelta } from "../utils/domutils.js";

const lskey_history = 'longops-history';

export class LongOpInstance extends EventTarget
{
	static Nothing = new LongOpInstance();

	constructor(id = 'long.operation.xyz', data = { label: 'A Long Operation' })
	{
		super();
		this.id = id;
		for (let pid in data) this[pid] = data[pid];

		if ('ts_start' in this)
		{
			if (typeof this.ts_start === 'string') this.ts_start = Number.parseInt(this.ts_start);
			if (typeof this.ts_start === 'number')
			{
				this.ts_start = new Date();
				this.ts_start.setTime(this.ts_start);
			}
		}
		if ('ts_stop' in this)
		{
			if (typeof this.ts_stop === 'string') this.ts_stop = Number.parseInt(this.ts_stop);
			if (typeof this.ts_stop === 'number')
			{
				this.ts_stop = new Date();
				this.ts_stop.setTime(this.ts_stop);
			}
		}
	}

	GetData()
	{
		return {
			id: this.id,
			label: this.label,
			ts_start: ('ts_start' in this && 'valueOf' in this.ts_start) ? this.ts_start.getTime() : undefined,
			ts_stop: ('ts_stop' in this && 'valueOf' in this.ts_stop) ? this.ts_stop.getTime() : undefined,
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
		this.ts_start = new Date();
		this.dispatchEvent(new CustomEvent('start', {}));
	}

	Stop()
	{
		this.ts_stop = new Date();
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

		if (this.op.addEventListener)
		{
			this.op.addEventListener('start', () => this.UpdateElements());
			this.op.addEventListener('stop', () => this.UpdateElements());
			this.op.addEventListener('datachange', () => this.UpdateElements());
		}

		let op_done = 'duration' in op;
		let col = op_done ? '#0f0a' : '#fa0f';
		this.e_op = CreatePagePanel(
			e_ops_list, false, false,
			'display:flex; flex-direction:row; flex-wrap:nowrap; overflow:hidden; opacity:0%; transition-property:opacity; transition-duration:var(--trans-dur-off-slow);',
			_ =>
			{
				_.style.opacity = '0%';

				this.e_label = addElement(_, 'div', undefined, 'font-size:0.7rem; align-content:center; line-height:0; text-wrap:nowrap; flex-grow:1.0; flex-shrink:0.0;', _ => { _.innerText = op.label ?? op.id; });
				this.e_icon = addElement(_, 'i', 'material-symbols', 'font-size:1rem; color:' + col + ';', _ => { _.innerText = op_done ? 'task_alt' : 'circle'; });
				this.e_btn_dismiss = CreatePagePanel(
					_, false, false,
					'display:none; font-size:0.7rem; align-content:center; line-height:0; align-content:center; flex-grow:0.0; flex-shrink:0.0;'
					+ 'top:50%; transform:translate(0%, -50%); padding:0;',
					_ =>
					{
						_.title = 'Dismiss this operation';
						//_.style.setProperty('--theme-color', '#fa0');
						addElement(_, 'i', 'material-symbols', 'position:absolute; inset:0; font-size:1rem;', _ => { _.innerText = 'close_small'; });
						_.classList.add('panel-button');
						_.addEventListener('click', e => { LongOps.Dismiss(this.op); LongOpsUI.instance.RemoveListEntry(this); });
					}
				);
			}
		);
		window.setTimeout(() => { this.UpdateElements(); }, fade_delay);
	}

	UpdateElements()
	{
		let op_done = 'duration' in this.op;
		this.e_op.style.opacity = op_done ? '70%' : '100%';
		this.e_icon.innerText = op_done ? 'task_alt' : 'circle';
		this.e_op.title = op_done ? `COMPLETE: ${Math.round(secondsDelta(this.op.ts_start, this.op.ts_end) * 1000)}ms` : 'PENDING';
		this.e_icon.style.color = op_done ? '#0f0a' : '#fa0f';
		this.e_btn_dismiss.style.display = op_done ? 'block' : 'none';
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
				addElement(_, 'div', '', 'font-size:0.7rem; font-weight:bold; text-align:center; opacity:60%; padding:var(--gap-025);', 'OPERATIONS');
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
							e => { LongOpsHistory.Clear(); this.RefreshListElements(); LongOps.ToggleVisibility(); }
						);
					}
				);
			}
		);
		this.created = true;
		this.RefreshListElements();
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
		if (this.created !== true) return;
		this.e_ops_list.innerHTML = '';

		for (let eid in this.op_entries)
		{
			this.op_entries[eid].RemoveElements();
		}

		LongOpsHistory.CheckLoaded();

		this.op_entries = [];
		for (let opid in LongOpsHistory.ops) this.op_entries.push(new LongOpsEntryUI(this.e_ops_list, LongOpsHistory.ops[opid], 25 + 25 * this.op_entries.length));
		for (let opid in LongOps.active) this.op_entries.push(new LongOpsEntryUI(this.e_ops_list, LongOps.active[opid], 25 + 25 * this.op_entries.length));
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

		if (this.visible === true)
		{
			this.e_root.style.opacity = '100%';
			this.e_root.style.pointerEvents = 'all';
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


		let event_data = { op: op };
		LongOps.instance.dispatchEvent(new CustomEvent("startop", event_data));
		LongOps.instance.dispatchEvent(new CustomEvent("opchange", event_data));

		LongOpsUI.instance.SetVisible(true);
		LongOpsUI.instance.AppendListElement(op);

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
		if (active_id < 0) return undefined;

		LongOps.active.splice(active_id, 1)[0];
		op.Stop();

		let event_data = { op: op };
		LongOps.instance.dispatchEvent(new CustomEvent("stopop", event_data));
		LongOps.instance.dispatchEvent(new CustomEvent("opchange", event_data));
		LongOpsHistory.Add(op);
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