import { PageManager } from "../pagemanager.js";
import { PageBase } from "./pagebase.js";

export class PageHome extends PageBase
{
	constructor()
	{
		super();
		this.title = "home";
	}
}

PageManager.RegisterPage(new PageHome());