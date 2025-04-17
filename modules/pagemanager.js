import { Autosave } from "./autosave.js";
import { DebugLog } from "./debuglog.js";
import { EventSource } from "./eventsource.js";
import { Modules } from "./modules.js";
import { PageBase } from "./pages/pagebase.js";
import { UserAccountInfo, UserAccountManager } from "./useraccount.js";

//const e_actionbar_title_label = document.getElementById('action-bar-title');
const e_pages_root = document.getElementById('content-pages-root');

const lskey_page_layout = 'pagemanager_layout';

export class PageManager
{
	static currentPages = [];
	static all_pages = [];

	static onLayoutChange = new EventSource();

	static sub_AutosaveOnLayoutChange = PageManager.onLayoutChange.RequestSubscription(Autosave.InvokeSoon);

	static RegisterPage(page = PageBase.Default()) { PageManager.all_pages.push(page); }

	static CacheCurrentLayout()
	{
		const get_page_data = _ => { return { title: _.title, state: _.state_data } };
		const pages_sort = (x, y) =>
		{
			if (x.siblingIndex > y.siblingIndex) return 1;
			if (x.siblingIndex < y.siblingIndex) return -1;
			return 0;
		};
		let pages = PageManager.currentPages.sort(pages_sort).map(get_page_data);
		let layout_json = JSON.stringify({ pages: pages });
		localStorage.setItem(lskey_page_layout, layout_json);
	}

	static RestoreCachedLayout()
	{
		let got_pages = localStorage.getItem(lskey_page_layout);
		if (got_pages)
		{
			let pages = JSON.parse(got_pages).pages;
			for (let id in pages) 
			{
				let p = pages[id];
				PageManager.OpenPageByTitle(p.title, p.state);
			}
			return pages.length > 0;
		}
		return false;
	}

	static GetPageIndexFromTitle(pages = [], title = '')
	{
		var target_title = title.toLowerCase().trim();
		for (let pid in pages)
		{
			let p = pages[pid];
			if (p.title.toLowerCase().trim() === target_title) return pid;
		}
		return -1;
	}

	static OpenPageByIndex(index, state = {}) { PageManager.OpenPageDirectly(PageManager.all_pages[index], state); }
	static OpenPageByTitle(title, state = {})
	{
		var target_title = title.toLowerCase().trim();
		for (let pid in PageManager.all_pages)
		{
			let p = PageManager.all_pages[pid];
			if (p.title.toLowerCase().trim() === target_title) 
			{
				PageManager.OpenPageDirectly(p, state);
				return;
			}
		}
	}

	static IsPageAvailable(title = '')
	{
		let page_id = PageManager.GetPageIndexFromTitle(PageManager.all_pages, title);
		let page_available = page_id > -1;

		if (page_available)
		{
			let page = PageManager.all_pages[page_id];
			if (typeof page.permission === 'string' && page.permission.length && page.permission.length > 0)
				page_available = page_available && UserAccountInfo.HasPermission(page.permission);
		}

		return page_available;
	}

	static TogglePageByTitle(title, state = {})
	{
		title = title.toLowerCase().trim();
		if (!PageManager.IsPageAvailable(title)) 
		{
			DebugLog.Log('nav failed: page unavailable');
			return;
		}

		let existing_page_id = PageManager.GetPageIndexFromTitle(PageManager.currentPages, title);
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
					PageManager.OpenPageDirectly(p, state);
					return;
				}
			}
			DebugLog.Log('nav failed: ' + title);
		}
	}


	static OpenPageDirectly(page = PageBase.Default(), state = {}, force_new = false)
	{
		if (!page || !page.title) return false;

		let existing_page_id = PageManager.GetPageIndexFromTitle(PageManager.currentPages, page.title);
		if (!force_new && existing_page_id > -1) return false;

		DebugLog.StartGroup('loading page ' + page.title);
		PageManager.currentPages.push(page);
		if (state) 
		{
			page.UpdateStateData(state);
		}

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
			if (PageManager.currentPages.length < 1) window.setTimeout(() => { PageManager.OpenPageByTitle('nav menu'); }, 250);
			else PageManager.onLayoutChange.Invoke();
		};


		if (layoutEventDelay < 1) do_remove();
		else window.setTimeout(do_remove, layoutEventDelay);
	}
}

Modules.Report('Page Manager', 'This module opens and closes pages and remembers their layout (if you have that option enabled).');

Autosave.HookSaveEvent(PageManager.CacheCurrentLayout);