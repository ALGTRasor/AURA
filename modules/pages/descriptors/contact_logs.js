
import { PageManager } from "../../pagemanager.js";
import { PageDescriptor } from "../pagebase.js";

export class PageContactLogs extends PageDescriptor
{
	GetTitle() { return 'contact logs'; }
	CreateElements(instance)
	{
		if (!instance) return;
		this.icon = 'help';
	}

	OnLayoutChange(instance)
	{
	}
}

PageManager.RegisterPage(new PageContactLogs('contact logs'));