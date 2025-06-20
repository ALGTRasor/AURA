import { Autosave } from "./autosave.js";
import { DebugLog } from "./debuglog.js";
import { setSiblingIndex } from "./utils/domutils.js";
import { Modules } from "./modules.js";
import { PageDescriptor } from "./pages/pagebase.js";
import { UserAccountInfo } from "./useraccount.js";
import { DevMode } from "./systems/devmode.js";
import { HotkeyDescriptor, Hotkeys } from "./utils/hotkeys.js";
import { AppEvents } from "./appevents.js";

const lskey_page_layout = 'pagemanager_layout';

export class PageManager
{
	static page_descriptors = [];

	static page_instances = [];
	static page_instance_focused = null;
	static page_instance_hovered = null;
	static pages_being_dragged = 0;

	static pauseLayoutChange = false;

	static GetHotkeyTarget()
	{
		if (PageManager.page_instance_focused && 'e_body' in PageManager.page_instance_focused) return PageManager.page_instance_focused;
		if (PageManager.page_instance_hovered && 'e_body' in PageManager.page_instance_hovered) return PageManager.page_instance_hovered;
		DebugLog.Log('! NULL HOTKEY TARGET');
		return null;
	}

	static RegisterHotkeys()
	{
		Hotkeys.Register(
			new HotkeyDescriptor(
				' ',
				(m, e) =>
				{
					let target = PageManager.GetHotkeyTarget();
					if (m.none && target)
					{
						target.ToggleExpanding();
					}
				},
				{ action_description: 'Toggle Active Page Expanding', key_description: 'Spacebar', requires_target: true }
			)
		);

		Hotkeys.Register(
			new HotkeyDescriptor(
				'ArrowLeft',
				(m, e) =>
				{
					let target = PageManager.GetHotkeyTarget();
					if (m.ctrl === true && target) target.MoveLeft(m.shift);
				},
				{ action_description: 'Move Active Page Left', key_description: 'ctrl﹢←', requires_target: true }
			)
		);

		Hotkeys.Register(
			new HotkeyDescriptor(
				'ArrowRight',
				(m, e) =>
				{
					let target = PageManager.GetHotkeyTarget();
					if (m.ctrl === true && target != null) target.MoveRight(m.shift);
				},
				{ action_description: 'Move Active Page Right', key_description: 'ctrl﹢→', requires_target: true }
			)
		);

		Hotkeys.Register(
			new HotkeyDescriptor(
				'x',
				(m, e) =>
				{
					let target = PageManager.GetHotkeyTarget();
					if (m.ctrl === true && target != null) target.CloseInstance();
				},
				{ action_description: 'Close Active Page', key_description: 'ctrl﹢x', requires_target: true }
			)
		);
	}

	static RegisterPage(page = PageDescriptor.Nothing, hotkey = '', hotkey_description = '')
	{
		if (DevMode.active === true) console.info('registered page: ' + page.title);
		PageManager.page_descriptors.push(page);

		if (typeof hotkey === 'string' && hotkey.length > 0)
		{
			Hotkeys.Register(
				new HotkeyDescriptor(
					hotkey,
					m =>
					{
						if (m.none) PageManager.TogglePageByTitle(page.title);
					},
					{
						action_description: 'Page: ' + hotkey_description,
						permission: page.permission
					}
				)
			);
		}
	}

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
		const get_page_data = _ => { return { title: _.page_descriptor.title, state: _.state.data } };
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

	static OpenPageByIndex(index, state = undefined, force_new = false) { PageManager.OpenPageFromDescriptor(PageManager.page_descriptors[index], state, force_new); }
	static OpenPageByTitle(title, state = undefined, force_new = false)
	{
		var target_title = title.toLowerCase().trim();
		for (let pid in PageManager.page_descriptors)
		{
			let p = PageManager.page_descriptors[pid];
			if (p.title === target_title) 
			{
				PageManager.OpenPageFromDescriptor(p, state, force_new);
				return;
			}
		}
	}
	static GetInstanceByTitle(title)
	{
		var target_title = title.toLowerCase().trim();
		for (let pid in PageManager.page_descriptors)
		{
			let p = PageManager.page_descriptors[pid];
			if (p.title === target_title) 
			{
				return p.GetInstance();
			}
		}
		return undefined;
	}


	static CloseAll()
	{
		const close_first = () =>
		{
			if (PageManager.page_instances.length < 1)
			{
				PageManager.closingAll = false;
				PageManager.pauseLayoutChange = false;
				PageManager.AfterPageClosed();
				return;
			}
			PageManager.page_instances[0].CloseInstance();
			window.setTimeout(close_first, 50);
		};

		PageManager.closingAll = true;
		PageManager.pauseLayoutChange = true;
		close_first();
	}

	static SetPageHovered(page_instance = undefined)
	{
		if (!page_instance) return;
		PageManager.page_instance_hovered = page_instance;
		//DebugLog.Log('Page Hovered: ' + PageManager.page_instance_hovered.page_descriptor.title);
	}

	static ClearPageFocus()
	{
		if (!PageManager.page_instance_focused) return;
		if (!('e_body' in PageManager.page_instance_focused)) return;
		PageManager.page_instance_focused.e_body.classList.remove('page-focused');
	}

	static FocusPage(page_instance = undefined)
	{
		if (!page_instance) return;

		PageManager.ClearPageFocus();

		PageManager.page_instance_focused = page_instance;
		PageManager.page_instance_focused.e_body.classList.add('page-focused');
		page_instance.title_bar.e_root.focus();
		if (page_instance.state.data.docked !== true) PageManager.BringToFront(page_instance);
	}

	static BringToFront(page_instance = undefined)
	{
		if (!page_instance) return;

		if (page_instance.e_body.nextSibling) setSiblingIndex(page_instance.e_body, 999);
	}

	static IsPageAvailable(title = '')
	{
		let page_id = PageManager.GetDescriptorIndex(title);
		if (page_id < 0) return false;

		let page_desc = PageManager.page_descriptors[page_id];

		if (
			typeof page_desc.permission === 'string'
			&& page_desc.permission.length > 0
			&& UserAccountInfo.HasPermission(page_desc.permission) === false
		) return false;

		if (page_desc.debug_page === true && DevMode.active === false) return false;

		return true;
	}

	static TogglePageByTitle(title, state = undefined, force_new = false)
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

		PageManager.OpenPageFromDescriptor(desc, state, force_new);
	}


	static OpenPageFromDescriptor(page = PageDescriptor.Nothing, state = undefined, force_new = false)
	{
		if (!page) return false;

		DebugLog.StartGroup('opening page ' + page.title);

		if (force_new === true)
		{
			let pageInstance = page.CreateInstance(state);
			pageInstance.CreateElements();
			pageInstance.ApplyStateData();
			PageManager.FocusPage(pageInstance);
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
			PageManager.FocusPage(pageInstance);
		}

		DebugLog.SubmitGroup();
		PageManager.NotifyLayoutChange();

		return true;
	}

	static AfterPageClosed()
	{
		if (PageManager.pauseLayoutChange === true) return;
		let no_pages_open = PageManager.page_instances.length < 1;
		if (no_pages_open) PageManager.ShowNavMenuAfter(250, () => PageManager.page_instances.length < 1);
		else PageManager.FocusLastPageInstance();
		PageManager.NotifyLayoutChange();
	}

	static NotifyLayoutChange()
	{
		if (PageManager.pauseLayoutChange === true) return;
		AppEvents.Dispatch('page-layout-change');
		Autosave.InvokeSoon();
	}

	static ShowNavMenuAfter(delay = 250, condition = () => true)
	{
		window.setTimeout(() =>
		{
			if (condition && condition()) PageManager.TogglePageByTitle('nav menu');
		}, delay);
	}
	static FocusLastPageInstance(delay = 250) { window.setTimeout(() => { if (PageManager.page_instances.length > 0) PageManager.FocusPage(PageManager.page_instances[PageManager.page_instances.length - 1]); }, delay); }
}

Modules.Report('Page Manager', 'This module registers Page Descriptors and caches the current page layout when applicable');

Autosave.HookSaveEvent(PageManager.CacheCurrentLayout);