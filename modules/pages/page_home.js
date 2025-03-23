import { PageManager } from "../pagemanager.js";
import { PageBase } from "./pagebase.js";

export class PageHome extends PageBase
{
	GetTitle() { return 'home' }
	CreateElements(parent)
	{
		if (!parent) return;
		this.CreateBody();
		this.e_body.style.width = '500px';
		this.e_body.style.flexShrink = 0.0;
		this.e_body.style.flexGrow = 0.0;
		this.FinalizeBody(parent);
	}
}

PageManager.RegisterPage(new PageHome());