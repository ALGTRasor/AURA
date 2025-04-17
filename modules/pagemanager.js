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
		const get_page_data = _ => { return { title: _.page_descriptor.title, state: _.page_descriptor.state_data } };
		const pages_sort = (x, y) =>
		{
			if (x.siblingIndex > y.siblingIndex) return 1;
			if (x.siblingIndex < y.siblingIndex) return -1;
			return 0;
		};
		let page_instances_sorted = PageManager.page_instances.sort(pages_sort).map(get_page_data);
		let layout_json = JSON.stringify({ pages: page_instances_sorted });
		localStorage.setItem(lskey_page_layout, layout_json);
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

	static OpenPageByIndex(index, state = {}) { PageManager.OpenPageFromDescriptor(PageManager.page_descriptors[index], state); }
	static OpenPageByTitle(title, state = {})
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

	static TogglePageByTitle(title, state = {})
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


	static OpenPageFromDescriptor(page = PageDescriptor.Nothing, state = {}, force_new = false)
	{
		if (!page) return false;

		DebugLog.StartGroup('loading page ' + page.title);

		if (force_new === true)
		{
			let pageInstance = page.CreateInstance();
			pageInstance.CreateElements(e_pages_root);
			PageManager.page_instances.push(pageInstance);
			if (state) pageInstance.UpdateStateData(state);
		}
		else
		{
			let pageInstance = page.GetInstance(force_new);
			if (!pageInstance)
			{
				pageInstance = page.CreateInstance();
				pageInstance.CreateElements(e_pages_root);
				PageManager.page_instances.push(pageInstance);
			}
			if (state) pageInstance.UpdateStateData(state);
		}

		DebugLog.SubmitGroup();
		PageManager.onLayoutChange.Invoke();

		return true;
	}

	static AfterPageClosed()
	{
		if (PageManager.page_instances.length < 1) window.setTimeout(() => { PageManager.TogglePageByTitle('nav menu'); }, 500);
		else PageManager.onLayoutChange.Invoke();
	}

	/*
	static RemoveFromCurrent(page = PageInstance.Nothing, layoutEventDelay = 0)
	{
		page.page_descriptor.CloseInstance(page);

		const do_remove = () =>
		{
			let i = PageManager.page_instances.indexOf(page);
			if (i < 0) return;

			PageManager.page_instances.splice(i, 1);
			if (PageManager.page_instances.length < 1) window.setTimeout(() => { PageManager.TogglePageByTitle('nav menu'); }, 250);
			else PageManager.onLayoutChange.Invoke();
		};

		if (layoutEventDelay < 1) do_remove();
		else window.setTimeout(do_remove, layoutEventDelay);
	}
	*/
}

Modules.Report('Page Manager', 'This module opens and closes pages and remembers their layout (if you have that option enabled).');

Autosave.HookSaveEvent(PageManager.CacheCurrentLayout);