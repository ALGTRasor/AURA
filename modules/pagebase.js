import { Modules } from "./modules.js";
import { PageManager } from "./pagemanager.js";

export class PageBase
{
	static Default()
	{
		return new PageBase();
	}

	constructor()
	{
		this.title = "Page"
	}
}

Modules.Report("Pages");