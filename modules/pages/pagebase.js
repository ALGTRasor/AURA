import { DebugLog } from "../debuglog.js";
import { addElement, fadeAppendChild, fadeRemoveElement, getSiblingIndex, setSiblingIndex } from "../utils/domutils.js";
import { Modules } from "../modules.js";
import { PageManager } from "../pagemanager.js";
import { PageTitleBar } from "./pagetitlebar.js";
import { Ripples } from "../ui/ripple.js";


// class handling the state and state data of a page instance 
export class PageInstanceState extends EventTarget
{
	constructor(page_instance, data = {})
	{
		super();
		this.page_instance = page_instance;
		this.data = {};
		this.SetData(data);
	}

	SetData(data = {}, skip_equal_values = true)
	{
		let any_change = false;
		for (let prop_id in data)
		{
			if (skip_equal_values === true && this.data[prop_id] === data[prop_id]) continue;
			this.data[prop_id] = data[prop_id];
			any_change = true;
		}
		this.dispatchEvent(new CustomEvent('datachange', { detail: data }));
		return any_change;
	}

	Get(property_name = '', default_value = undefined) { return this.data[property_name] ?? default_value; }
	Set(property_name = '', value = undefined) { this.data[property_name] = value; }
}


// an instance of a page constructed from a PageDescriptor and predetermined state data
export class PageInstance
{
	static Nothing = new PageInstance();

	page_descriptor = {};

	constructor(page_descriptor = {}, state_data = undefined)
	{
		this.page_descriptor = page_descriptor;
		this.instance_id = Math.round(Math.random() * 8_999_999 + 1_000_000);

		this.siblingIndex = -1;
		this.title_bar = null;
		this.e_frame = {};
		this.e_body = {};
		this.e_content = {};

		this.state = new PageInstanceState(this, state_data);

		//this.state.data = {};
		//this.UpdateStateData(state_data);
	}

	RequireSharedDataTable(datatable)
	{
		datatable.instance.addEventListener('datachange', this.Refresh);
		this.relations = datatable.AddNeeder();
	}

	SetContentBodyLabel(text)
	{
		if (!this.e_content) return;
		this.e_content.innerHTML = "<div style='position:absolute;inset:0;text-align:center;align-content:center;'>" + text + "</div>";
	}

	CreateBody()
	{
		this.e_frame = document.createElement('div');
		this.e_frame.id = 'page-frame-' + this.page_descriptor.title + '[' + this.instance_id + ']';
		this.e_frame.className = 'page-root-frame';

		this.e_body = document.createElement('div');
		this.e_body.id = 'page-' + this.page_descriptor.title + '[' + this.instance_id + ']';
		this.e_body.className = 'page-root';
		this.e_body.addEventListener('mouseenter', _ => PageManager.SetPageHovered(this));
		this.e_body.addEventListener('mousedown', _ => PageManager.FocusPage(this));

		this.e_body.tabIndex = '0';

		this.e_content = document.createElement('div');
		this.e_content.className = 'page-content-root';

		this.title_bar = new PageTitleBar(this, true);
		this.title_bar.RefreshAllButtons();
		this.title_bar.tabIndex = '0';

		this.e_body.focus();
		Ripples.SpawnFromElement(this.e_body);
	}

	MoveLeft(toEnd = false)
	{
		if (this.moving === true) return;
		if (this.e_frame.previousElementSibling == null) return;
		this.moving = true;
		if (toEnd === true) setSiblingIndex(this.e_frame, 0);
		else this.e_frame.parentElement.insertBefore(this.e_frame, this.e_frame.previousSibling);
		this.moving = false;
		Ripples.SpawnFromElement(this.e_body);
		PageManager.onLayoutChange.Invoke();
	}

	MoveRight(toEnd = false)
	{
		if (this.moving === true) return;
		if (this.e_frame.nextElementSibling == null) return;
		this.moving = true;

		if (toEnd === true) setSiblingIndex(this.e_frame, this.e_frame.parentElement.childElementCount);
		else this.e_frame.parentElement.insertBefore(this.e_frame.nextSibling, this.e_frame);
		this.moving = false;
		Ripples.SpawnFromElement(this.e_body);
		PageManager.onLayoutChange.Invoke();
	}

	TogglePinned()
	{
		this.state.Set('pinned', this.state.Get('pinned') !== true);
		PageManager.onLayoutChange.Invoke();
	}

	SetFrameParentElement(new_parent)
	{
		if (!new_parent) return;

		let old_parent = this.e_frame.parentElement;
		if (old_parent)
		{
			if (old_parent === new_parent) return;
			old_parent.removeChild(this.e_frame);
		}
		new_parent.appendChild(this.e_frame);
		PageManager.onLayoutChange.Invoke();
	}

	DetermineFrameParent()
	{
		const loose_root = 'content-page-frames-loose';
		const docked_root = 'content-page-frames-root';
		const pinned_root = 'content-page-frames-pinned';
		if (this.state.Get('pinned') === true) return document.getElementById(pinned_root);
		if (this.state.Get('docked') === true) return document.getElementById(docked_root);
		return document.getElementById(loose_root);
	}

	CheckFrameParent()
	{
		let new_parent = this.DetermineFrameParent();
		if (this.e_frame.parentElement !== new_parent) this.SetFrameParentElement(new_parent);
	}

	SetBodyParentElement(new_parent)
	{
		if (!new_parent) return;

		let old_parent = this.e_body.parentElement;
		if (old_parent)
		{
			if (old_parent === new_parent) return;
			old_parent.removeChild(this.e_body);
		}
		new_parent.appendChild(this.e_body);
		//PageManager.onLayoutChange.Invoke();
	}

	DetermineBodyParent()
	{
		const loose_root = 'content-pages-loose';
		const docked_root = 'content-pages-root';
		if (this.state.Get('docked') === true) return document.getElementById(docked_root);
		return document.getElementById(loose_root);
	}

	CheckBodyParent()
	{
		let new_parent = this.DetermineBodyParent();
		if (this.e_body.parentElement !== new_parent) this.SetBodyParentElement(new_parent);
	}

	DetermineFrameClassList()
	{
		this.e_body.classList.remove('page-loose');
		if (this.state.Get('docked') !== true) this.e_body.classList.add('page-loose');
	}

	SetDepth(depth = 10)
	{
		this.state.Get('depth') = depth;
		if (this.e_body) this.e_body.style.zIndex = this.state.Get('depth');
	}

	ModifyDepth(depth_delta = 0)
	{
		if ('depth' in this.state.data) this.state.data.depth += depth_delta;
		else this.state.data.depth = depth_delta;

		if (this.e_body) this.e_body.style.zIndex = this.state.data.depth;
	}

	TryToggleDocked()
	{
		if (this.state.data.docked === true) this.TryUndock(); else this.TryDock();
		Ripples.SpawnFromElement(this.e_body);
	}

	TryUndock()
	{
		this.state.data.expanding = false;
		this.state.data.docked = false;

		let frame_rect = this.e_frame.getBoundingClientRect();
		let frame_parent_rect = this.e_frame.parentElement.getBoundingClientRect();

		this.state.data.position_x = frame_rect.x - frame_parent_rect.x + 8;
		this.state.data.position_y = frame_rect.y - frame_parent_rect.y + 8;
		this.state.data.width = frame_rect.width - 16;
		this.state.data.height = frame_rect.height - 16;

		this.DisableBodyTransitions();
		this.ApplyFrameState();
		this.EnableBodyTransitions();
	}

	TryDock()
	{
		this.state.data.docked = this.page_descriptor.dockable === true;
		this.ApplyFrameState();
	}

	ApplyFrameState(lite = false)
	{
		if (lite === false)
		{
			this.CheckFrameParent();
			this.CheckBodyParent();
			this.DetermineFrameClassList();
		}
		this.UpdateBodyTransform();
		PageManager.onLayoutChange.Invoke();
	}

	// called from titlebar drag event
	SetLoosePosition(new_x = 0, new_y = 0)
	{
		this.state.data.position_x = Math.round(new_x);
		this.state.data.position_y = Math.round(new_y);
		this.ApplyFrameState(true);
	}

	ToggleExpanding()
	{
		this.state.data.expanding = this.state.data.expanding !== true;
		if (this.page_descriptor.UpdateSize) this.page_descriptor.UpdateSize(this);
		this.UpdateBodyTransform();
		this.ApplyFrameState(true);
		Ripples.SpawnFromElement(this.e_body, 0);
	}

	CloseInstance() { this.page_descriptor.CloseInstance(this); }

	RemoveElements(immediate = false)
	{
		PageManager.onLayoutChange.RemoveSubscription(this.sub_LayoutChange);
		Ripples.SpawnFromElement(this.e_body, 0);

		if (immediate)
		{
			if (this.page_descriptor.OnClose) this.page_descriptor.OnClose(this);
			this.e_frame.remove();
			this.e_frame = null;
			this.e_body.remove();
			this.e_body = null;
		}
		else
		{
			this.e_frame.remove();
			this.e_frame = null;
			fadeRemoveElement(
				this.e_body,
				() => { },
				'95%',
				() => { if (this.page_descriptor.OnClose) this.page_descriptor.OnClose(this); },
			);
		}
	}

	CreateElements()
	{
		let frame_parent = this.DetermineFrameParent();
		if (!frame_parent) 
		{
			DebugLog.Log("PageInstance.CreateElements failed! Null frame_parent");
			return;
		}

		let body_parent = this.DetermineBodyParent();
		if (!body_parent) 
		{
			DebugLog.Log("PageInstance.CreateElements failed! Null body_parent");
			return;
		}

		this.CreateBody();
		if (this.page_descriptor.OnCreateElements) this.page_descriptor.OnCreateElements(this);
		if (this.page_descriptor.UpdateSize) this.page_descriptor.UpdateSize(this);

		frame_parent.appendChild(this.e_frame);
		fadeAppendChild(body_parent, this.e_body);
		window.setTimeout(() => { fadeAppendChild(this.e_body, this.e_content); }, 125);

		this.sub_LayoutChange = PageManager.onLayoutChange.RequestSubscription(() => { this.UpdatePageContext(); });
		this.page_descriptor.OnOpen(this);
	}

	UpdatePageContext()
	{
		this.siblingIndex = this.e_frame ? getSiblingIndex(this.e_frame) : -1;
		this.title_bar.RemoveAllButtons();
		this.UpdateBodyTransform();
		this.page_descriptor.OnLayoutChange(this);
		this.title_bar.RefreshAllButtons();
	}

	EnableBodyTransitions() { this.e_body.style.transitionDuration = 'var(--trans-dur-off-slow)'; }
	DisableBodyTransitions() { this.e_body.style.transitionDuration = '0s'; }

	UpdateBodyTransform()
	{
		if (!this.e_frame || !this.e_frame.parentElement) return;

		this.state.data.position_x = Math.round(this.state.data.position_x);
		this.state.data.position_y = Math.round(this.state.data.position_y);

		let frame_rect = this.e_frame.getBoundingClientRect();
		let frame_parent_rect = this.e_frame.parentElement.getBoundingClientRect();

		if (this.state.data.docked === true || this.state.data.pinned === true)
		{
			this.e_frame.style.position = 'relative';
			this.e_frame.style.left = 'unset';
			this.e_frame.style.top = 'unset';
			this.e_frame.style.width = 'unset';
			this.e_frame.style.height = 'unset';
		}
		else
		{
			this.e_frame.style.position = 'absolute';
			if (this.state.data.expanding === true)
			{
				this.e_frame.style.left = 0;
				this.e_frame.style.top = 0;
				this.e_frame.style.width = frame_parent_rect.width + 'px';
				this.e_frame.style.height = frame_parent_rect.height + 'px';
			}
			else
			{
				this.e_frame.style.left = this.state.data.position_x + 'px';
				this.e_frame.style.top = this.state.data.position_y + 'px';
				this.e_frame.style.width = this.state.data.width + 'px';
				this.e_frame.style.height = this.state.data.height + 'px';
			}
		}


		this.e_body.style.left = (frame_rect.x - frame_parent_rect.x) + 'px';
		this.e_body.style.top = (frame_rect.y - frame_parent_rect.y) + 'px';
		this.e_body.style.width = frame_rect.width + 'px';
		this.e_body.style.height = frame_rect.height + 'px';
	}

	RequireStateProperty(property_name = '', default_value = undefined)
	{
		if (!(property_name in this.state.data)) this.state.data[property_name] = default_value;
	}

	ValidateStateData()
	{
		this.RequireStateProperty('docked', true);
		this.RequireStateProperty('expanding', false);
	}

	SetStateValue(key = '', value)
	{
		if (typeof key !== 'string' || key.length < 1) return;
		let data = {};
		data[key] = value;
		this.UpdateStateData(data);
	}

	GetStateValue(key = '', value_default = undefined)
	{
		if (typeof key === 'string' && key.length < 1) return value_default;
		return this.state.data[key] ?? value_default;
	}

	UpdateStateData(state_data = undefined)
	{
		if (this.state.SetData(state_data)) this.page_descriptor.OnStateChange(this);
	}

	ApplyStateData()
	{
		this.ValidateStateData();
		this.ApplyFrameState();
	}

	CreatePanel(frame_parent = {}, inset = false, tiles = false, styling = '', prep = e => { })
	{
		let classes = 'page-panel';
		if (inset) classes += ' inset-box';
		if (tiles) classes += ' page-panel-tiles scroll-y';
		return addElement(frame_parent, 'div', classes, styling, prep);
	}
}






export class PageDescriptor
{
	static Nothing = new PageDescriptor(null);
	instances = [];

	dockable = true;
	order_index = 0;

	constructor(title = '', permission = '', icon = '', description = '')
	{
		this.icon = icon;
		this.title = title;
		this.description = description;
		this.permission = permission;
		this.descriptor_id = Math.round(Math.random() * 8_999_999 + 1_000_000);
	}

	instances = [];

	GetInstance()
	{
		if (this.instances.length > 0) return this.instances[0];
		return null;
	}

	GetOrCreateInstance(forceCreate = false, state_data = undefined)
	{
		if (forceCreate !== true && this.instances.length > 0) return this.instances[0];
		return this.CreateInstance(state_data);
	}

	CreateInstance(state_data = undefined)
	{
		let pinst = new PageInstance(this, state_data);
		this.instances.push(pinst);
		return pinst;
	}

	CloseInstance(instance)
	{
		let instance_index = this.instances.indexOf(instance);
		if (instance_index > -1) this.instances.splice(instance_index, 1);
		else DebugLog.Log('! instance_index invalid', '#ff0');

		if (PageManager.page_instance_hovered === instance) PageManager.page_instance_hovered = undefined;
		if (PageManager.page_instance_focused === instance) PageManager.page_instance_focused = undefined;

		if (instance.RemoveElements) instance.RemoveElements();

		let piid = PageManager.page_instances.indexOf(instance);
		if (piid > -1) PageManager.page_instances.splice(piid, 1);

		window.setTimeout(PageManager.AfterPageClosed, 100);
	}

	OnOpen(instance) { }
	OnClose(instance) { }
	OnLayoutChange(instance) { }
	OnStateChange(instance) { }

	OnCreateElements(instance)
	{
		instance.e_content.innerText = 'content :: ' + this.title;
	}
}

Modules.Report("Page Descriptors", "This module adds support for page type descriptors, which are used to create instances of available pages");