import { PageManager } from "../pagemanager.js";
import { PageBase } from "./pagebase.js";

export class PageTaskHub extends PageBase
{
	GetTitle() { return 'task hub'; }
	CreateElements(parent)
	{
		if (!parent) return;
		this.CreateBody();
		this.SetContentBodyLabel('tasks will be here');
		this.FinalizeBody(parent);
	}
}

PageManager.RegisterPage(new PageTaskHub('task hub'));