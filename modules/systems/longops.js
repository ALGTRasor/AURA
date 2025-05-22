import { ActionBar } from "../actionbar.js";
import { FlashElement } from "../utils/domutils.js";

export class LongOpInstance
{
	static Nothing = new LongOpInstance();

	constructor(id = '')
	{
		this.id = id;
		this.progress = 0.0;
	}

	SetProgress(progress)
	{
		this.progress = progress;
	}
}

export class LongOps
{
	static active = [];

	static Start(id = '', data = {})
	{
		let op = new LongOpInstance(id, data);
		LongOps.active.push(op);
		return op;
	}

	static Stop(op = LongOpInstance.Nothing)
	{
		let active_id = LongOps.active.indexOf(op);
		if (active_id > -1) return LongOps.active.splice(active_id, 1)[0];
		return undefined;
	}

	static CreateActionBarElements()
	{
		LongOps.toggle_info = ActionBar.AddIcon('chronic', 'Show / Hide Long Operations', e => { LongOps.ToggleVisibility(); LongOps.FlashIcon(); });
		LongOps.toggle_info.e_icon.style.opacity = '50%';
	}

	static ToggleVisibility()
	{
	}

	static FlashIcon()
	{
		FlashElement(LongOps.toggle_info.e_btn, 1.0, 3.0, 'gold');
	}
}