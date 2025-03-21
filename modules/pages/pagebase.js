import { Modules } from "../modules.js";

export class PageBase
{
	static Default = new PageBase();

	constructor()
	{
		this.title = "Default Page"
	}
}

Modules.Report("Pages");