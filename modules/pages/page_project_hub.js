import { PageBase } from "./pagebase.js";

export class PageProjectHub extends PageBase
{
	GetTitle() { return 'project hub'; }
	CreateElements(parent)
	{
		if (!parent) return;
		this.CreateBody();
		this.e_content.innerText = 'projects will be here';
		this.FinalizeBody(parent);
	}
}