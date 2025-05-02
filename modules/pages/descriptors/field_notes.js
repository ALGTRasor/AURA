
import { PageManager } from "../../pagemanager.js";
import { PageDescriptor } from "../pagebase.js";

export class PageFieldNotes extends PageDescriptor
{
	GetTitle() { return 'field notes'; }
	CreateElements(instance)
	{
		if (!instance) return;
		this.icon = 'notepad';
	}

	OnLayoutChange(instance)
	{
	}
}

PageManager.RegisterPage(new PageFieldNotes('field notes'));