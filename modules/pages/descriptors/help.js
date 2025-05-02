
import { PageManager } from "../../pagemanager.js";
import { PageDescriptor } from "../pagebase.js";

export class PageHelp extends PageDescriptor
{
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