import { DebugLog } from "./debuglog.js";
import { Modules } from "./modules.js";
import { PageBase } from "./pages/pagebase.js";

const e_actionbar_title_label = document.getElementById('action-bar-title');
const e_pages_root = document.getElementById('content-pages-root');

export class PageManager
{
	static currentPages = [];

	static all_pages = [];

	static RegisterPage(page = PageBase.Default())
	{
		PageManager.all_pages.push(page);
	}

	static OpenPageByIndex(index) { PageManager.OpenPageDirectly(PageManager.all_pages[index]); }
	static OpenPageByTitle(title)
	{
		var target_title = title.toLowerCase().trim();
		for (let pid in PageManager.all_pages)
		{
			let p = PageManager.all_pages[pid];
			if (p.title.toLowerCase().trim() === target_title) PageManager.OpenPageDirectly(p);
		}
	}


	static OpenPageDirectly(page = PageBase.Default())
	{
		if (!page || !page.title) return;

		DebugLog.StartGroup('loading page ' + page.title);
		PageManager.currentPages.push(page);
		console.info("Set Page: " + page.title);
		e_actionbar_title_label.innerText = page.title.toUpperCase();

		page.CreateElements(e_pages_root);
		DebugLog.SubmitGroup();
	}

	static RemoveFromCurrent(page = PageBase.Default)
	{
		let i = PageManager.currentPages.indexOf(page);
		if (i < 0) return;
		PageManager.currentPages.splice(i, 1);
	}
}

Modules.Report("Page Manager");