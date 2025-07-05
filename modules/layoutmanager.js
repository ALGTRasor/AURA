import { Autosave } from "./autosave.js";
import { Modules } from "./modules.js";
import { AppEvents } from "./appevents.js";
import { PageManager } from "./pagemanager.js";
import { ActionBar } from "./ui/actionbar.js";
import { UserAccountManager } from "./useraccount.js";

const lskey_layouts = 'layoutmanager_layouts';
const lskey_layout_index = 'layoutmanager_layout_active';


const default_layout_page = { title: 'nav menu' };
const default_layout_data = { title: 'home', pages: [default_layout_page] };
export class LayoutManager
{
	static layouts_loaded = [default_layout_data];
	static layout_active_index = -1;
	//static layout_active = null;
	static GetActive() { return LayoutManager.layouts_loaded[LayoutManager.layout_active_index]; }

	static Initialize()
	{
		LayoutManager.SwitchTo(LayoutManager.layout_active_index);
		AppEvents.AddListener('page-layout-change', LayoutManager.AfterPageLayoutChange);
	}

	static AfterPageLayoutChange()
	{
		window.setTimeout(() => { LayoutManager.UpdateActiveLayoutPageData(); }, 5);
	}

	static SwitchTo(index)
	{
		PageManager.pauseLayoutChange = true;
		PageManager.CloseAll(
			() =>
			{
				LayoutManager.layout_active_index = index;
				LayoutManager.ApplyActiveLayout();
				ActionBar.RefreshLayoutMenu();
				PageManager.pauseLayoutChange = false;
			}
		);
	}

	static StoreLayouts()
	{
		if (UserAccountManager.account_provider.logged_in !== true) return;

		localStorage.setItem(lskey_layouts, JSON.stringify({ layouts: LayoutManager.layouts_loaded }));
		localStorage.setItem(lskey_layout_index, LayoutManager.layout_active_index.toString());
	}

	static RestoreLayouts()
	{
		let ls_val = localStorage.getItem(lskey_layouts);
		if (ls_val)
		{
			let ls_obj = JSON.parse(ls_val);
			if (ls_obj && ls_obj.layouts)
			{
				LayoutManager.layouts_loaded = ls_obj.layouts;
				LayoutManager.ApplyActiveLayout();

				let restore_index = Number.parseInt(localStorage.getItem(lskey_layout_index));
				if (Number.isNaN(restore_index)) restore_index = 0;
				if (restore_index < 0) restore_index = 0;
				LayoutManager.SwitchTo(restore_index);
				ActionBar.RefreshLayoutMenu();
				if (LayoutManager.layouts_loaded.length > 0) return true;
			}
		}
		LayoutManager.layouts_loaded = [default_layout_data];
		LayoutManager.SwitchTo(0);
		return false;
	}

	static GetActiveLayoutPageData()
	{
		const get_page_data = (_, i, a) => { return { title: _.page_descriptor.title, state: _.state.data } };
		const pages_sort = (x, y) =>
		{
			if (x.siblingIndex > y.siblingIndex) return 1;
			if (x.siblingIndex < y.siblingIndex) return -1;
			return 0;
		};

		return PageManager.page_instances.sort(pages_sort).map(get_page_data);
	}

	// updates the stored layout to match the live layout
	static UpdateActiveLayoutPageData()
	{
		if (LayoutManager.layouts_loaded.length < 1)
		{
			LayoutManager.PushActiveLayout('home', false);
			return;
		}
		if (!LayoutManager.GetActive())
		{
			LayoutManager.layouts_loaded[LayoutManager.layout_active_index] = {
				title: 'new layout',
				pages: LayoutManager.GetActiveLayoutPageData()
			};
			return;
		}
		LayoutManager.GetActive().pages = LayoutManager.GetActiveLayoutPageData();
	}

	static DeleteLayout(target_index = 0)
	{
		if (target_index < 1) return;
		if (LayoutManager.layout_active_index === target_index) LayoutManager.SwitchTo(LayoutManager.layout_active_index - 1);
		LayoutManager.layouts_loaded.splice(target_index, 1);
		ActionBar.RefreshLayoutMenu();
	}

	// adds a new layout using the live layout
	static PushActiveLayout(title, and_switch = true)
	{
		let data = LayoutManager.GetActiveLayoutPageData();
		LayoutManager.layouts_loaded.push({ title: title, pages: data });
		if (and_switch === true) LayoutManager.SwitchTo(LayoutManager.layouts_loaded.length - 1);
		ActionBar.RefreshLayoutMenu();
	}

	static ApplyActiveLayout()
	{
		if (LayoutManager.layout_active_index > -1)
		{
			let page_instances_sorted = LayoutManager.GetActive().pages;
			for (let id in page_instances_sorted) 
			{
				let p = page_instances_sorted[id];
				PageManager.OpenPageByTitle(p.title, p.state, true);
			}
			return page_instances_sorted.length > 0;
		}
		return false;
	}
}




Modules.Report('Layout Manager', 'This module registers manages user layouts');
Autosave.HookSaveEvent(LayoutManager.StoreLayouts);