import { DebugLog } from "./debuglog.js";
import { Modules } from "./modules.js";
import { PageBase } from "./pages/pagebase.js";

export class PageManager
{
	static currentPage = {};
	static all_pages = [];

	static RegisterPage(page = PageBase.Default())
	{
		PageManager.all_pages.push(page);
	}

	static SetPageByIndex(index) { PageManager.SetPageDirectly(PageManager.all_pages[index]); }
	static SetPageByTitle(title)
	{
		DebugLog.StartGroup('loading page');
		var target_title = title.toLowerCase().trim();
		for (let pid in PageManager.all_pages)
		{
			let p = PageManager.all_pages[pid];
			if (p.title.toLowerCase().trim() === target_title)
				PageManager.SetPageDirectly(p);
		}
		DebugLog.SubmitGroup();
	}

	static SetPageDirectly(page = PageBase.Default())
	{
		if (page)
		{
			PageManager.currentPage = page;
			console.info("Set Page: " + PageManager.currentPage.title);

			document.getElementById('action-bar-title').innerText = PageManager.currentPage.title.toUpperCase();
		}
		else
		{
			console.info("Set Page: " + PageManager.currentPage.title);
		}
	}
}

Modules.Report("Page Manager");