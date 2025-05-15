
import { PageManager } from "../../pagemanager.js";
import { PageDescriptor } from "../pagebase.js";

export class PageContactLogs extends PageDescriptor
{
	title = 'contact logs';
	order_index = -3;

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