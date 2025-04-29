import { Autosave } from "./autosave.js";
import { DebugLog } from "./debuglog.js";
import { EventSource } from "./eventsource.js";
import { Modules } from "./modules.js";
import { PageDescriptor, PageInstance } from "./pages/pagebase.js";
import { UserAccountInfo, UserAccountManager } from "./useraccount.js";

//const e_actionbar_title_label = document.getElementById('action-bar-title');
const e_pages_root = document.getElementById('content-pages-root');

const lskey_page_layout = 'pagemanager_layout';

export class PageManager
{
	static page_descriptors = [];
	static page_instances = [];

	static onLayoutChange = new EventSource();

	static sub_AutosaveOnLayoutChange = PageManager.onLayoutChange.RequestSubscription(Autosave.InvokeSoon);

	static RegisterPage(page = PageDescriptor.Nothing) { PageManager.page_descriptors.push(page); }
	static GetDescriptorIndex(page_title = '')
	{
		for (let pdid = 0; pdid < PageManager.page_descriptors.length; pdid++)
		{
			let this_title = PageManager.page_descriptors[pdid].title;
			if (this_title === page_title) return pdid;
		}
		return -1;
	}

	static CacheCurrentLayout()
	{
		const get_page_data = _ => { return { title: _.page_descriptor.title, state: _.state_data } };
		const pages_sort = (x, y) =>
		{
			if (x.siblingIndex > y.siblingIndex) return 1;
			if (x.siblingIndex < y.siblingIndex) return -1;
			return 0;
		};
		let page_instances_sorted = PageManager.page_instances.sort(pages_sort).map(get_page_data);
		localStorage.setItem(lskey_page_layout, JSON.stringify({ pages: page_instances_sorted }));
	}

	static RestoreCachedLayout()
	{
		let got_pages = localStorage.getItem(lskey_page_layout);
		if (got_pages)
		{
			let page_instances_sorted = JSON.parse(got_pages).pages;
			for (let id in page_instances_sorted) 
			{
				let p = page_instances_sorted[id];
				PageManager.OpenPageByTitle(p.title, p.state);
			}
			return page_instances_sorted.length > 0;
		}
		return false;
	}

	static GetPageIndexFromTitle(pages = [], title = '')
	{
		for (let pid in pages)
		{
			let p = pages[pid];
			if (p.page_descriptor.title.toLowerCase().trim() === title) return pid;
		}
		return -1;
	}

	static OpenPageByIndex(index, state = undefined) { PageManager.OpenPageFromDescriptor(PageManager.page_descriptors[index], state); }
	static OpenPageByTitle(title, state = undefined)
	{
		var target_title = title.toLowerCase().trim();
		for (let pid in PageManager.page_descriptors)
		{
			let p = PageManager.page_descriptors[pid];
			if (p.title === target_title) 
			{
				PageManager.OpenPageFromDescriptor(p, state);
				return;
			}
		}
	}

	static IsPageAvailable(title = '')
	{
		let page_id = PageManager.GetDescriptorIndex(title);
		if (page_id < 0) return false;

		let page_desc = PageManager.page_descriptors[page_id];
		if (typeof page_desc.permission === 'string' && page_desc.permission.length > 0)
			return UserAccountInfo.HasPermission(page_desc.permission);

		return true;
	}

	static TogglePageByTitle(title, state = undefined)
	{
		title = title.toLowerCase().trim();
		if (!PageManager.IsPageAvailable(title)) 
		{
			DebugLog.Log('nav failed: page unavailable');
			return;
		}

		let desc_id = PageManager.GetDescriptorIndex(title);
		if (desc_id < 0)
		{
			DebugLog.Log('nav failed: invalid descriptor index');
			return;
		}

		let desc = PageManager.page_descriptors[desc_id];
		let existing = desc.GetInstance();
		if (existing)
		{
			desc.CloseInstance(existing);
			return;
		}

		PageManager.OpenPageFromDescriptor(desc, state);
	}


	static OpenPageFromDescriptor(page = PageDescriptor.Nothing, state = undefined, force_new = false)
	{
		if (!page) return false;

		DebugLog.StartGroup('loading page ' + page.title);

		if (force_new === true)
		{
			let pageInstance = page.CreateInstance(state);
			pageInstance.CreateElements();
			pageInstance.ApplyStateData();
			PageManager.page_instances.push(pageInstance);
		}
		else
		{
			let pageInstance = page.GetInstance();
			if (!pageInstance)
			{
				pageInstance = page.CreateInstance(state);
				pageInstance.CreateElements();
				pageInstance.ApplyStateData();
				PageManager.page_instances.push(pageInstance);
			}
		}

		DebugLog.SubmitGroup();
		PageManager.onLayoutChange.Invoke();

		return true;
	}

	static AfterPageClosed()
	{
		let no_pages_open = PageManager.page_instances.length < 1;
		if (no_pages_open) PageManager.ShowNavMenu();
		PageManager.onLayoutChange.Invoke();
	}

	static ShowNavMenu(delay = 250)
	{
		window.setTimeout(() => { PageManager.TogglePageByTitle('nav menu'); }, delay);
	}
}

Modules.Report('Page Manager', 'This module opens and closes pages and remembers their layout (if the option is enabled)');

Autosave.HookSaveEvent(PageManager.CacheCurrentLayout);