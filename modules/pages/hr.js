import { PageManager } from "../pagemanager.js";
import { PageBase } from "./pagebase.js";

export class PageHR extends PageBase
{
	GetTitle() { return 'hr'; }
	CreateElements(parent)
	{
		if (!parent) return;
		this.CreateBody();
		this.SetContentBodyLabel('hr will be here');
		this.FinalizeBody(parent);
	}
}

PageManager.RegisterPage(new PageHR('hr'));