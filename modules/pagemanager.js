import { Autosave } from "./autosave.js";
import { DebugLog } from "./debuglog.js";
import { EventSource } from "./eventsource.js";
import { Modules } from "./modules.js";
import { PageBase } from "./pages/pagebase.js";

//const e_actionbar_title_label = document.getElementById('action-bar-title');
const e_pages_root = document.getElementById('content-pages-root');

const lskey_page_layout = 'pagemanager_layout';

export class PageManager
{
	static currentPages = [];
	static all_pages = [];

	static onLayoutChange = new EventSource();

	static sub_AutosaveOnLayoutChange = PageManager.onLayoutChange.RequestSubscription(Autosave.InvokeSoon);

	static CacheCurrentLayout()
	{
		let titles = PageManager.currentPages.map(x => x.title);
		localStorage.setItem(lskey_page_layout, JSON.stringify({ titles: titles }));
	}

	static RestoreCachedLayout()
	{
		let got_titles = localStorage.getItem(lskey_page_layout);
		if (got_titles)
		{
			let titles = JSON.parse(got_titles).titles;
			for (let id in titles) PageManager.OpenPageByTitle(titles[id]);
			return titles.length > 0;
		}
		return false;
	}

	static RegisterPage(page = PageBase.Default())
	{
		DebugLog.Log('+page: ' + page.title.toUpperCase());
		PageManager.all_pages.push(page);
	}

	static GetPageIndexFromTitle(title = '')
	{
		var target_title = title.toLowerCase().trim();
		for (let pid in PageManager.currentPages)
		{
			let p = PageManager.currentPages[pid];
			if (p.title.toLowerCase().trim() === target_title) return pid;
		}
		return -1;
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
	static TogglePageByTitle(title)
	{
		title = title.toLowerCase().trim();
		let existing_page_id = PageManager.GetPageIndexFromTitle(title);

		if (existing_page_id > -1)
		{
			if (title !== 'nav menu' || PageManager.currentPages.length > 1)
				PageManager.currentPages[existing_page_id].Close();
		}
		else
		{
			for (let pid in PageManager.all_pages)
			{
				let p = PageManager.all_pages[pid];
				if (p.title.toLowerCase().trim() === title)
				{
					PageManager.OpenPageDirectly(p);
					return;
				}
			}
			DebugLog.Log('nav failed: ' + title);
		}
	}


	static OpenPageDirectly(page = PageBase.Default(), force_new = false)
	{
		if (!page || !page.title) return false;

		let existing_page_id = PageManager.GetPageIndexFromTitle(page.title);
		if (!force_new && existing_page_id > -1) return false;

		DebugLog.StartGroup('loading page ' + page.title);
		PageManager.currentPages.push(page);

		page.CreateElements(e_pages_root);
		DebugLog.SubmitGroup();

		PageManager.onLayoutChange.Invoke();

		return true;
	}

	static RemoveFromCurrent(page = PageBase.Default, layoutEventDelay = 0)
	{
		let do_remove = () =>
		{
			let i = PageManager.currentPages.indexOf(page);
			if (i < 0) return;

			PageManager.currentPages.splice(i, 1);
			if (PageManager.currentPages.length < 1) window.setTimeout(() => { fxn.OpenPageById('nav menu'); }, 250);
			else PageManager.onLayoutChange.Invoke();
		};


		if (layoutEventDelay < 1) do_remove();
		else window.setTimeout(do_remove, layoutEventDelay);
	}
}

Modules.Report('Page Manager', 'This module opens and closes pages and remembers their layout (if you have that option enabled).');

Autosave.HookSaveEvent(PageManager.CacheCurrentLayout);