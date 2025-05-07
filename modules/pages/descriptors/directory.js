
import { addElement, CreatePagePanel, FadeElement } from "../../utils/domutils.js";
import { PageManager } from "../../pagemanager.js";
import { SlideSelector } from "../../ui/slide_selector.js";
import { PageDescriptor } from "../pagebase.js";
import { PanelContent } from "../../ui/panel_content.js";
import { SharedData } from "../../datashared.js";
import { RunningTimeout } from "../../utils/running_timeout.js";
import { ExpandingSummary } from "../../ui/expanding_summary.js";

const style_directory_root = 'position:absolute; inset:0; padding:var(--gap-05); margin:0; display:flex; flex-direction:row; flex-wrap:wrap; gap:var(--gap-025); overflow: hidden auto;';
const style_directory_summary = 'position:relative; background:hsl(from var(--theme-color) h s 20%); border-radius:var(--gap-05); align-content:center; text-align:left; padding:var(--gap-1); font-size:0.8rem; flex-grow:0.0;';


const search_records = (records = [], record_check = _ => { return true; }) =>
{
	let passed = [];
	for (let rid in records)
	{
		if (record_check(records[rid]) === true) passed.push(records[rid]);
	}
	return passed;
}

class DirectoryContentInternal extends PanelContent
{
	search_term = '';
	e_summaries = [];

	OnCreateElements()
	{
		this.e_summaries = [];
		this.e_root = addElement(this.e_parent, 'div', null, style_directory_root);
		this.OnRefreshElements();
	}
	OnRefreshElements()
	{
		for (let eid in this.e_summaries) this.e_summaries[eid].remove();

		let filtered = search_records(
			SharedData.users.instance.data,
			_ => 
			{
				return this.search_term.length < 1 || _.display_name_full.toLowerCase().indexOf(this.search_term) > -1;
			}
		);

		for (let id in filtered)
		{
			let user = filtered[id];
			let e_user = new ExpandingSummary(user.display_name_full);
			e_user.CreateElements(this.e_root);
			this.e_summaries.push(e_user);
		}
	}
	OnRemoveElements() { this.e_root.remove(); }
}

class DirectoryContentExternal extends PanelContent
{
	search_term = '';

	OnCreateElements()
	{
		this.e_summaries = [];
		this.e_root = addElement(this.e_parent, 'div', null, style_directory_root);
		this.OnRefreshElements();
	}
	OnRefreshElements()
	{
		for (let eid in this.e_summaries) this.e_summaries[eid].remove();
		let filtered = search_records(
			SharedData.contacts.instance.data,
			_ => 
			{
				return this.search_term.length < 1 || _.contact_name.toLowerCase().indexOf(this.search_term) > -1;
			}
		);

		for (let id in filtered)
		{
			let contact = filtered[id];
			let e_contact = new ExpandingSummary(contact.contact_name);
			e_contact.CreateElements(this.e_root);
			this.e_summaries.push(e_contact);
		}
	}
	OnRemoveElements() { this.e_root.remove(); }
}

export class PageDirectory extends PageDescriptor
{
	title = 'directory';
	icon = 'contacts';


	ApplyFilters(instance)
	{
		instance.directory_internal.search_term = instance.filter_search.value.trim().toLowerCase();
		instance.directory_external.search_term = instance.directory_internal.search_term;
		instance.directory_internal.RefreshElements();
		instance.directory_external.RefreshElements();
	}

	OnCreateElements(instance)
	{
		if (!instance) return;

		instance.slide_directory = new SlideSelector();
		const directories = [
			{ label: 'INTERNAL', on_click: _ => { } },
			{ label: 'EXTERNAL', on_click: _ => { } }
		];
		instance.slide_directory.CreateElements(instance.e_content, directories);

		instance.filters_root = CreatePagePanel(instance.e_content, true, false, 'flex-grow:0.0;flex-shrink:0.0;flex-basis:1.5rem;');
		instance.filter_dirty = new RunningTimeout(() => this.ApplyFilters(instance), 0.5, false, 150);

		instance.filter_search = addElement(
			instance.filters_root, 'input', null,
			'position:absolute; inset:0; padding:var(--gap-1); color:hsl(from var(--theme-color) h s 45%);',
			_ =>
			{
				_.type = 'text';
				_.placeholder = 'Filter Directory...';
				_.addEventListener('keyup', e => { e.stopPropagation(); e.preventDefault(); instance.filter_dirty.ExtendTimer(); });
			}
		);

		instance.content_current = null;
		instance.directory_content_root = CreatePagePanel(instance.e_content, true, false);
		instance.directory_internal = new DirectoryContentInternal(instance.directory_content_root);
		instance.directory_external = new DirectoryContentExternal(instance.directory_content_root);

		const _afterDirChange = () => { this.OnDirectoryChange(instance); };
		instance.sub_directoryChange = instance.slide_directory.afterSelectionChanged.RequestSubscription(_afterDirChange);

		instance.slide_directory.SelectIndexAfterDelay(0, 333, true);
	}

	OnDirectoryChange(instance)
	{
		switch (instance.slide_directory.selected_index) 
		{
			case 0: this.SetContent(instance, instance.directory_internal); break;
			case 1: this.SetContent(instance, instance.directory_external); break;
		}
	}

	IsValidContent(content = PanelContent.Nothing) { return content && content.RemoveElements; }

	SetContent(instance, content_next = PanelContent.Nothing)
	{
		if (content_next === instance.content_current) return;

		if (!this.IsValidContent(content_next)) return;

		instance.slide_directory.SetDisabled(true);
		if (this.IsValidContent(instance.content_current)) 
		{
			FadeElement(
				instance.content_current.e_root, 100, 0, 0.125
			).then(
				_ =>
				{
					instance.content_current.RemoveElements();
					instance.content_current = content_next;
					instance.content_current.CreateElements();
				}
			).then(
				async _ => await FadeElement(instance.content_current.e_root, 0, 100, 0.125)
			).then(
				_ => { instance.slide_directory.SetDisabled(false); }
			);
		}
		else
		{
			instance.content_current = content_next;
			instance.content_current.CreateElements();
			FadeElement(instance.content_current.e_root, 0, 100, 0.25).then(_ => { instance.slide_directory.SetDisabled(false); });
		}
	}

	UpdateSize(instance)
	{
		instance.UpdateBodyTransform();
		this.OnLayoutChange(instance);
	}

	OnLayoutChange(instance)
	{
		if (instance.state_data.docked === true && instance.state_data.expanding === false) instance.e_frame.style.maxWidth = '32rem';
		else instance.e_frame.style.maxWidth = 'unset';

		window.setTimeout(() => instance.slide_directory.ApplySelection(), 250);
	}
}

PageManager.RegisterPage(new PageDirectory('directory'));