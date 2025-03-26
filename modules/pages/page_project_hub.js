import { PageManager } from "../pagemanager.js";
import { PageBase } from "./pagebase.js";

export class PageProjectHub extends PageBase
{
	GetTitle() { return 'project hub'; }
	CreateElements(parent)
	{
		if (!parent) return;
		this.CreateBody();
		this.SetContentBodyLabel('projects will be here');
		this.FinalizeBody(parent);
	}
}

PageManager.RegisterPage(new PageProjectHub('project hub'));