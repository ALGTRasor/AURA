
import { PageManager } from "../../pagemanager.js";
import { PageDescriptor } from "../pagebase.js";

export class PageScratchPad extends PageDescriptor
{
	title = 'scratch pad';
	icon = 'notepad';

	OnCreateElements(instance)
	{
		if (!instance) return;
		instance.e_frame.style.minWidth = '20rem';
	}

	UpdateSize(instance)
	{
		instance.UpdateBodyTransform();
		this.OnLayoutChange(instance);
	}

	OnLayoutChange(instance)
	{
		let fixed_width = instance.state_data.docked === true && instance.state_data.expanding === false;
		if (fixed_width === true) instance.e_frame.style.maxWidth = '20rem';
		else instance.e_frame.style.maxWidth = 'unset';
	}
}

PageManager.RegisterPage(new PageScratchPad('scratch pad'), 'x', 'Scratch Pad');