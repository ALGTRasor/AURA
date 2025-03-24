import { PageBase } from "./pagebase.js";

export class PageHR extends PageBase
{
	GetTitle() { return 'hr'; }
	CreateElements(parent)
	{
		if (!parent) return;
		this.CreateBody();
		this.e_content.innerText = 'hr will be here';
		this.FinalizeBody(parent);
	}
}