
import { CreatePagePanel } from "../../domutils.js";
import { PageManager } from "../../pagemanager.js";
import { SlideSelector } from "../../ui/slide_selector.js";
import { PageDescriptor } from "../pagebase.js";

export class PageDirectory extends PageDescriptor
{
	icon = 'contacts';
	GetTitle() { return 'directory'; }
	OnCreateElements(instance)
	{
		if (!instance) return;
		instance.slide_mode = new SlideSelector();

		const modes = [
			{ label: 'INTERNAL', on_click: _ => { } },
			{ label: 'EXTERNAL', on_click: _ => { } }
		];
		instance.slide_mode.CreateElements(instance.e_content, modes);
		instance.slide_mode.e_root.style.maxHeight = '2.5rem';
		instance.slide_mode.SelectIndex(0);

		CreatePagePanel(instance.e_content, true, false);
	}

	OnLayoutChange(instance)
	{
		window.setTimeout(
			() => instance.slide_mode.SelectIndex(instance.slide_mode.selected_index),
			250
		);
	}
}

PageManager.RegisterPage(new PageDirectory('directory'));