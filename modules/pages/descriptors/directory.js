import { addElement, ClearElementLoading, CreatePagePanel, MarkElementLoading } from "../../utils/domutils.js";
import { RunningTimeout } from "../../utils/running_timeout.js";
import { PanelContent } from "../../ui/panel_content.js";
import { PageManager } from "../../pagemanager.js";
import { PageDescriptor } from "../pagebase.js";
import { ExpandingSummary } from "../../ui/expanding_summary.js";
import { SharedData } from "../../remotedata/datashared.js";
import { SlideSelector } from "../../ui/slide_selector.js";
import { Help } from "./help.js";

const style_directory_root = 'position:absolute; inset:0; padding:var(--gap-05); margin:0; display:flex; flex-direction:column; flex-wrap:nowrap; gap:var(--gap-025); overflow: hidden auto;';

const DIRECTORY_MODES = [
	{ label: 'INTERNAL', on_click: _ => { }, tooltip: 'View Internal Contacts' },
	{ label: 'EXTERNAL', on_click: _ => { }, tooltip: 'View External Contacts' }
];

const search_records = (records = [], record_check = _ => { return true; }) =>
{
	let passed = [];
	for (let rid in records)
	{
		if (record_check(records[rid]) === true) passed.push(records[rid]);
	}
	return passed;
}

class DirectoryListContentBase extends PanelContent
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
			const entry = filtered[id];
			let entry_title = this.get_entry_title(entry);
			let e_entry = new ExpandingSummary(entry_title);
			e_entry.CreateElements(this.e_root);
			e_entry.e_root.style.minHeight = '1.25rem';
			e_entry.e_root.style.textOverflow = 'ellipsis';
			e_entry.e_root.style.textWrapMode = 'nowrap';
			e_entry.e_root.style.flexGrow = '0.0';
			e_entry.before_expand = () => this.CollapseAll();
			e_entry.after_expand = () =>
			{
				e_entry.e_btn_inspect = CreatePagePanel(
					e_entry.e_root, true, false,
					'position:absolute; top:2px; right:2px; width:min(1.5rem, 100%); aspect-ratio:1.0; height:auto;',
					_ =>
					{
						_.classList.add('panel-button');
						addElement(_, 'i', 'material-symbols icon-button', '', _ => { _.innerText = 'arrow_outward'; });
						_.addEventListener(
							'click',
							e =>
							{
								let targets = this.page_instance.state.GetValue('inspector_targets', []);
								let existing_index = targets.indexOf(entry_title);
								if (existing_index < 0)
								{
									targets.push(entry_title);
								}
								else
								{
									targets.splice(existing_index, 1);
								}
								this.page_instance.state.SetValue('inspector_targets', targets);
								this.page_instance.SetExpanding(targets.length > 0);

								e.stopPropagation();
								e.preventDefault();
							}
						); // view in page inspector
					}
				);
			};
			e_entry.after_collapse = () => { e_entry.e_btn_inspect.remove(); };
			this.summaries.push(e_entry);
		}
	}

	CollapseAll() { for (let id in this.summaries) this.summaries[id].Collapse(); }
	OnRemoveElements() { this.e_root.remove(); }
}

class DirectoryListContentInternal extends DirectoryListContentBase
{
	get_data = () => SharedData['users'].instance.data;
	get_entry_title = _ => _.display_name_full;
	get_entry_search_blob = _ => _.display_name_full.toLowerCase().trim();
	constructor(e_parent, page_instance) { super(e_parent, page_instance); }
}

class DirectoryListContentExternal extends DirectoryListContentBase
{
	get_data = () => SharedData['contacts'].instance.data;
	get_entry_title = _ => _.contact_name;
	get_entry_search_blob = _ => _.contact_name.toLowerCase().trim();
	constructor(e_parent, page_instance) { super(e_parent, page_instance); }
}

export class DirectoryListPageContent extends PanelContent
{
	constructor(e_parent, page)
	{
		super(e_parent);
		this.page = page;
	}

	OnCreateElements(data)
	{
		this.e_root = addElement(this.e_parent, 'div', '', 'position:relative; padding:0; margin:0;');
		this.e_root.style.display = 'flex';
		this.e_root.style.flexDirection = 'column';
		this.e_root.style.flexBasis = '20rem';
		this.e_root.style.flexGrow = '1.0';
		this.e_root.style.flexShrink = '1.0';
		this.e_root.style.gap = 'var(--gap-025)';

		this.slide_mode = new SlideSelector();
		this.slide_mode.CreateElements(this.e_root, DIRECTORY_MODES);

		this.filters_root = CreatePagePanel(this.e_root, true, false, 'flex-grow:0.0; flex-shrink:0.0; flex-basis:1.5rem;');
		this.filter_dirty = new RunningTimeout(() => this.ApplyFilters(), 0.5, false, 150);

		this.filter_search = addElement(
			this.filters_root, 'input', null,
			'position:absolute; inset:0; padding:var(--gap-1); color:hsl(from var(--theme-color) h s 45%);',
			_ =>
			{
				_.type = 'text';
				_.placeholder = 'Filter Directory...';
				_.addEventListener('keyup', e => { e.stopPropagation(); e.preventDefault(); this.filter_dirty.ExtendTimer(); });
			}
		);

		this.list_current = null;
		this.list_root = CreatePagePanel(this.e_root, true, false);
		this.directory_internal = new DirectoryListContentInternal(this.list_root, this.page);
		this.directory_external = new DirectoryListContentExternal(this.list_root, this.page);

		this.list_update_timeout = new RunningTimeout(() => { this.UpdateList(); }, 0.25, false, 70);
		this.slide_mode.Subscribe(() => { this.OnModeChange(); });
		this.slide_mode.SelectIndexAfterDelay(this.page.state.data.view_mode ?? 0, 150, true);
	}

	SetDirectoryContentDirty()
	{
		this.list_update_timeout.ExtendTimer();
	}

	OnModeChange()
	{
		this.page.state.SetValue('view_mode', this.slide_mode.selected_index);
		switch (this.slide_mode.selected_index)
		{
			case 0:
				if (this.relate_contacts) window.SharedData['contacts'].RemoveNeeder(this.relate_contacts);
				this.relate_users = window.SharedData['users'].AddNeeder();
				break;
			case 1:
				if (this.relate_users) window.SharedData['users'].RemoveNeeder(this.relate_users);
				this.relate_contacts = window.SharedData['contacts'].AddNeeder();
				break;
		}
		this.SetDirectoryContentDirty();
	}

	IsValidContent(content = PanelContent.Nothing) { return content && 'RemoveElements' in content; }

	TransitionList(content_next = PanelContent.Nothing)
	{
		if (this.IsValidContent(content_next) === false)
		{
			console.warn('invalid next content');
			return;
		}

		const before = () =>
		{
			this.valid_next = this.IsValidContent(this.list_current);
			this.slide_mode.SetDisabled(true);
			MarkElementLoading(this.list_root);
		};
		const during = () =>
		{
			this.list_current?.RemoveElements();
			this.list_current = content_next;
			this.list_current.CreateElements();
			this.slide_mode.SetDisabled(false);
		};
		const after = () =>
		{
			ClearElementLoading(this.list_root, 250);
		};
		const options = {
			fade_target: () => { return this.list_current?.e_root; },
			fade_duration: 0.25 - window.TryGetGlobalStylingValue('animationSpeed') * 0.2,
			skip_fade_out: !this.list_current,
			skip_fade_in: !content_next
		};
		this.TransitionElements(before, during, after, options);
	}

	UpdateList()
	{
		switch (this.slide_mode.selected_index) 
		{
			case 0: this.TransitionList(this.directory_internal); break;
			case 1: this.TransitionList(this.directory_external); break;
		}
	}

	ApplyFilters()
	{
		this.search_term = this.filter_search.value.trim().toLowerCase();
		this.directory_internal.search_term = this.search_term;
		this.directory_external.search_term = this.search_term;
		this.directory_internal.RefreshElements();
		this.directory_external.RefreshElements();
	}

	ApplyMode()
	{
		this.slide_mode.ApplySelection();
	}

	OnPageLayoutChange()
	{
		if (this.page.e_frame.getBoundingClientRect().width > 400) 
		{

		}
		else
		{

		}
	}
}

export class DirectoryInspectorPageContent extends PanelContent
{
	constructor(e_parent, page)
	{
		super(e_parent);
		this.page = page;
	}

	OnCreateElements(data)
	{
		this.e_root = addElement(this.e_parent, 'div', '', 'position:relative; padding:0; margin:0;');
		this.e_root.style.display = 'flex';
		this.e_root.style.flexDirection = 'column';
		this.e_root.style.minWidth = '24rem';
		this.e_root.style.flexBasis = '0.0';
		this.e_root.style.flexGrow = '2.0';
		this.e_root.style.flexShrink = '1.0';
		this.e_root.style.gap = 'var(--gap-025)';

		this.inspect_root = CreatePagePanel(this.e_root, true, true, 'flex-direction:column;');

		this.refresh_timeout = new RunningTimeout(() => { this.RefreshContent(); }, 0.25, false, 70);
	}

	RefreshContent()
	{
		this.inspect_root.innerHTML = '';
		let targets = this.page.state.GetValue('inspector_targets', []);
		if (targets.length > 0)
		{
			let ii = 0;
			while (ii < targets.length)
			{
				let t = targets[ii];
				let e_inspected = CreatePagePanel(this.inspect_root, false, false, 'flex-grow:0.0;', _ => { _.innerText = t; });
				const id = ii;
				e_inspected.addEventListener(
					'click',
					e =>
					{
						let targets = this.page.state.GetValue('inspector_targets', []);
						targets.splice(id, 1);
						this.page.state.SetValue('inspector_targets', targets);
						this.refresh_timeout.ExtendTimer();
					}
				);

				ii++;
			}
		}
	}

	Show() { this.e_root.style.display = 'flex'; }
	Hide() { this.e_root.style.display = 'none'; }

	OnPageLayoutChange()
	{
		let targets = this.page.state.GetValue('inspector_targets', []);
		if (targets.length > 0) { this.Show(); this.refresh_timeout.ExtendTimer(); }
		else this.Hide();
	}
}

export class DirectoryPageContent extends PanelContent
{
	constructor(e_parent, page)
	{
		super(e_parent);
		this.page = page;
	}

	OnCreateElements(data)
	{
		this.e_root = addElement(this.e_parent, 'div', '', 'position:absolute; inset:var(--gap-05); padding:0; margin:0;');
		this.e_root.style.display = 'flex';
		this.e_root.style.flexDirection = 'row';
		this.e_root.style.flexWrap = 'wrap';
		this.e_root.style.flexBasis = '1.0';
		this.e_root.style.gap = 'var(--gap-025)';

		this.content_list = new DirectoryListPageContent(this.e_root, this.page);
		this.content_list.CreateElements();

		this.content_inspector = new DirectoryInspectorPageContent(this.e_root, this.page);
		this.content_inspector.CreateElements();
	}

	OnRemoveElements(data)
	{
		this.content_list.RemoveElements();
		this.content_inspector.RemoveElements();
	}

	SetDirectoryContentDirty() { this.content_list.SetDirectoryContentDirty(); }
	OnModeChange() { this.content_list.OnModeChange(); }
	TransitionList(content_next = PanelContent.Nothing) { this.content_list.TransitionList(content_next); }
	UpdateList() { this.content_list.UpdateList(); }
	ApplyFilters() { this.content_list.ApplyFilters(); }
	ApplyMode() { this.content_list.ApplyMode(); }
	OnPageLayoutChange()
	{
		this.content_list.OnPageLayoutChange();
		this.content_inspector.OnPageLayoutChange();
	}
}


export class PageDirectory extends PageDescriptor
{
	title = 'directory';
	icon = 'contacts';
	order_index = 4;

	OnCreateElements(instance)
	{
		instance.e_frame.style.minWidth = '20rem';
		instance.content = new DirectoryPageContent(instance.e_content, instance);
		instance.content.CreateElements();
		window.SharedData.Subscribe('users', instance.UpdateList);
		window.SharedData.Subscribe('contacts', instance.UpdateList);
	}

	OnRemoveElements(instance)
	{
		window.SharedData.Unsubscribe('users', instance.UpdateList);
		window.SharedData.Unsubscribe('contacts', instance.UpdateList);
		instance.content.RemoveElements();
	}

	UpdateSize(instance)
	{
		instance.UpdateBodyTransform();
		this.OnLayoutChange(instance);
	}

	OnLayoutChange(instance)
	{
		let use_fixed_width = instance.state.data.docked === true && instance.state.data.expanding === false;
		if (use_fixed_width === true) instance.SetMaxFrameWidth('24rem');
		else instance.ClearMaxFrameWidth();

		window.setTimeout(() => instance.content.OnPageLayoutChange(), 150);
	}
}

PageManager.RegisterPage(new PageDirectory('directory', undefined, 'phone_book', 'View and manage internal users or external contacts.'), 'd', 'Directory', 'users.view');
Help.Register(
	'pages.directory', 'The Directory',
	'The Directory contains information for internal users and external contacts.'
	+ '\nUsers can use the Directory as a sort of phone book.'
);