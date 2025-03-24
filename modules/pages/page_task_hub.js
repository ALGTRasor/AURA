import { PageBase } from "./pagebase.js";

export class PageTaskHub extends PageBase
{
	GetTitle() { return 'task hub'; }
	CreateElements(parent)
	{
		if (!parent) return;
		this.CreateBody();
		this.e_content.innerText = 'tasks will be here';
		this.FinalizeBody(parent);
	}
}