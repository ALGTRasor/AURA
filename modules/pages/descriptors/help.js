
import { PageManager } from "../../pagemanager.js";
import { PageDescriptor } from "../pagebase.js";

export class PageHelp extends PageDescriptor
{
	extra_page = true;
	order_index = 99;

	GetTitle() { return 'help'; }
	CreateElements(instance)
	{
		if (!instance) return;
		this.icon = 'help';
	}

	OnLayoutChange(instance)
	{
	}
}

PageManager.RegisterPage(new PageHelp('help'));