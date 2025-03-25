import { PageBase } from "./pagebase.js";

export class PageTimekeep extends PageBase
{
	GetTitle() { return 'timekeep'; }
	CreateElements(parent)
	{
		if (!parent) return;
		this.CreateBody();
		this.SetContentBodyLabel('timekeep will be here');
		this.FinalizeBody(parent);
	}
}