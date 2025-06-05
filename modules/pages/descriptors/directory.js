import { addElement, CreatePagePanel, FadeElement } from "../../utils/domutils.js";
import { PageManager } from "../../pagemanager.js";
import { SlideSelector } from "../../ui/slide_selector.js";
import { PageDescriptor } from "../pagebase.js";
import { PanelContent } from "../../ui/panel_content.js";
import { SharedData } from "../../remotedata/datashared.js";
import { RunningTimeout } from "../../utils/running_timeout.js";
import { ExpandingSummary } from "../../ui/expanding_summary.js";
import { Help } from "./help.js";
import { AppEvents } from "../../appevents.js";

const style_directory_root = 'position:absolute; inset:0; padding:var(--gap-05); margin:0; display:flex; flex-direction:column; flex-wrap:nowrap; gap:var(--gap-025); overflow: hidden auto;';

const search_records = (records = [], record_check = _ => { return true; }) =>
{
	let passed = [];
	for (let rid in records)
	{
		if (record_check(records[rid]) === true) passed.push(records[rid]);
	}
	return passed;
}

class DirectoryContentBase extends PanelContent
{
	e_root = {};
	summaries = [];
	search_term = '';
	page_instance = {};

	get_data = () => [];
	get_entry_title = _ => 'NO ITEM TITLE';
	get_entry_search_blob = _ => '';

	constructor(e_parent, page_instance)
	{
		super(e_parent);
		this.page_instance = page_instance;
	}

	OnCreateElements()
	{
		this.e_root = addElement(this.e_parent, 'div', null, style_directory_root);
		this.OnRefreshElements();
	}

	OnRefreshElements()
	{
		for (let eid in this.summaries) this.summaries[eid].RemoveElements();

		const filter_record = _ => { return this.search_term.length < 1 || this.get_entry_search_blob(_).indexOf(this.search_term) > -1; };
		let filtered = search_records(this.get_data(), filter_record);

		for (let id in filtered)
		{
			let entry = filtered[id];
			let e_entry = new ExpandingSummary(this.get_entry_title(entry));
			e_entry.CreateElements(this.e_root);
			e_entry.e_root.style.minHeight = '1.25rem';
			e_entry.e_root.style.textOverflow = 'ellipsis';
			e_entry.e_root.style.textWrapMode = 'nowrap';
			e_entry.e_root.style.flexGrow = '0.0';
			e_entry.before_expand = () => this.CollapseAll();
			this.summaries.push(e_entry);
		}
	}

	CollapseAll() { for (let id in this.summaries) this.summaries[id].Collapse(); }
	OnRemoveElements() { this.e_root.remove(); }
}

class DirectoryContentInternal extends DirectoryContentBase
{
	get_data = () => SharedData.users.instance.data;
	get_entry_title = _ => _.display_name_full;
	get_entry_search_blob = _ => _.display_name_full.toLowerCase().trim();
	constructor(e_parent, page_instance) { super(e_parent, page_instance); }
}

class DirectoryContentExternal extends DirectoryContentBase
{
	get_data = () => SharedData.contacts.instance.data;
	get_entry_title = _ => _.contact_name;
	get_entry_search_blob = _ => _.contact_name.toLowerCase().trim();
	constructor(e_parent, page_instance) { super(e_parent, page_instance); }
}


export class PageDirectory extends PageDescriptor
{
	title = 'directory';
	icon = 'contacts';
	order_index = 4;

	ApplyFilters(instance)
	{
		instance.search_term = instance.filter_search.value.trim().toLowerCase();
		instance.directory_internal.search_term = instance.search_term;
		instance.directory_external.search_term = instance.search_term;
		instance.directory_internal.RefreshElements();
		instance.directory_external.RefreshElements();
	}

	OnCreateElements(instance)
	{
		if (!instance) return;

		instance.e_content.style.gap = 'var(--gap-025)';

		instance.slide_directory = new SlideSelector();
		const directories = [
			{ label: 'INTERNAL', on_click: _ => { } },
			{ label: 'EXTERNAL', on_click: _ => { } }
		];
		instance.slide_directory.CreateElements(instance.e_content, directories);

		instance.filters_root = CreatePagePanel(instance.e_content, true, false, 'flex-grow:0.0; flex-shrink:0.0; flex-basis:1.5rem;');
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
		instance.directory_internal = new DirectoryContentInternal(instance.directory_content_root, instance);
		instance.directory_external = new DirectoryContentExternal(instance.directory_content_root, instance);

		instance.UpdateDirectoryContent = () => this.UpdateDirectoryContent(instance);
		instance.afterDirChange = () => { this.OnDirectoryChange(instance); };
		instance.sub_directoryChange = instance.slide_directory.afterSelectionChanged.RequestSubscription(instance.afterDirChange);
		instance.slide_directory.SelectIndexAfterDelay(0, 150, true);

		instance.directory_content_timeout = new RunningTimeout(() => this.UpdateDirectoryContent(instance), 0.25, false, 150);
	}

	OnDirectoryChange(instance)
	{
		switch (instance.slide_directory.selected_index)
		{
			case 0:
				if (instance.relate_contacts) window.SharedData.contacts.RemoveNeeder(instance.relate_contacts);
				instance.relate_users = window.SharedData.users.AddNeeder();
				break;
			case 1:
				if (instance.relate_users) window.SharedData.users.RemoveNeeder(instance.relate_users);
				instance.relate_contacts = window.SharedData.contacts.AddNeeder();
				break;
		}
		instance.SetDirectoryContentDirty = () => instance.directory_content_timeout.ExtendTimer();
		instance.SetDirectoryContentDirty();
	}

	UpdateDirectoryContent(instance)
	{
		switch (instance.slide_directory.selected_index) 
		{
			case 0: this.SetContent(instance, instance.directory_internal); break;
			case 1: this.SetContent(instance, instance.directory_external); break;
		}
	}

	IsValidContent(content = PanelContent.Nothing) { return content && 'RemoveElements' in content; }

	SetContent(instance, content_next = PanelContent.Nothing)
	{
		if (content_next === instance.content_current)
		{
			console.warn('same next content');
			return;
		}

		if (this.IsValidContent(content_next) === false)
		{
			console.warn('invalid next content');
			return;
		}

		instance.slide_directory.SetDisabled(true);
		if (this.IsValidContent(instance.content_current) === true) 
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
				async _ =>
				{
					instance.slide_directory.SetDisabled(false);
					await FadeElement(instance.content_current.e_root, 0, 100, 0.125);
				}
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
		if (instance.state_data.docked === true && instance.state_data.expanding === false) instance.e_frame.style.maxWidth = '24rem';
		else instance.e_frame.style.maxWidth = 'unset';

		window.setTimeout(() => instance.slide_directory.ApplySelection(), 250);
	}

	OnOpen(instance)
	{
		window.SharedData.Subscribe('users', instance.SetDirectoryContentDirty);
		window.SharedData.Subscribe('contacts', instance.SetDirectoryContentDirty);
		//AppEvents.AddListener('data-loaded', instance.SetDirectoryContentDirty);
	}

	OnClose(instance)
	{

		window.SharedData.Unsubscribe('users', instance.SetDirectoryContentDirty);
		window.SharedData.Unsubscribe('contacts', instance.SetDirectoryContentDirty);
		//if (instance.SetDirectoryContentDirty) AppEvents.RemoveListener('data-loaded', instance.SetDirectoryContentDirty);
		if (instance.relate_contacts) window.SharedData.contacts.RemoveNeeder(instance.relate_contacts);
		if (instance.relate_users) window.SharedData.users.RemoveNeeder(instance.relate_users);
	}
}

PageManager.RegisterPage(new PageDirectory('directory', undefined, 'phone_book', 'View and manage a list of Arrow\'s internal and external contacts.'), 'd', 'Directory', 'users.view');
Help.Register(
	'pages.directory', 'The Directory',
	'The Directory contains information for internal users and external contacts.'
	+ '\nUsers can use the Directory as a sort of phone book.'
);