import { PageBase } from "./pagebase.js";

export class PageExternalContacts extends PageBase
{
	GetTitle() { return 'external contacts'; }
	CreateElements(parent)
	{
		if (!parent) return;
		this.CreateBody();
		this.SetContentBodyLabel('external contacts will be here');
		this.FinalizeBody(parent);
	}
}