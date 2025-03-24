import { PageBase } from "./pagebase.js";

export class PageInternalUsers extends PageBase
{
	GetTitle() { return 'internal users'; }
	CreateElements(parent)
	{
		if (!parent) return;
		this.CreateBody();
		this.e_content.innerText = 'internal users will be here';
		this.FinalizeBody(parent);
	}
}