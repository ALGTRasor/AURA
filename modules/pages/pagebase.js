import { DebugLog } from "../debuglog.js";
import { addElement, fadeAppendChild, fadeRemoveElement, fadeTransformElement, getSiblingIndex, setSiblingIndex } from "../domutils.js";
import { Modules } from "../modules.js";
import { PageManager } from "../pagemanager.js";
import { PageTitleBar } from "./pagetitlebar.js";

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
		this.e_body = {};
		this.e_content = {};
		this.state_data = {};

		this.UpdateStateData(state_data);
	}

	SetContentBodyLabel(text)
	{
		if (!this.e_content) return;
		this.e_content.innerHTML = "<div style='position:absolute;inset:0;text-align:center;align-content:center;'>" + text + "</div>";
	}

	CreateBody()
	{
		this.e_body = document.createElement('div');
		this.e_body.id = 'page-' + this.page_descriptor.title + '[' + this.instance_id + ']';
		this.e_body.className = 'page-root';
		this.e_body.addEventListener('mouseenter', _ => PageManager.SetPageHovered(this));
		this.e_body.addEventListener('mousedown', _ => PageManager.FocusPage(this));
		this.e_content = document.createElement('div');
		this.e_content.className = 'page-content-root';
		this.title_bar = new PageTitleBar(this, true);
		fadeAppendChild(this.e_body, this.e_content);
		this.title_bar.RefreshAllButtons();
		//this.e_body.appendChild(this.e_content);
	}

	MoveLeft(toEnd = false)
	{
		if (this.moving === true) return;
		if (this.e_body.previousElementSibling == null) return;
		this.moving = true;

		fadeTransformElement(
			this.e_body.parentElement,
			() =>
			{
				if (toEnd === true) setSiblingIndex(this.e_body, 0);
				else this.e_body.parentElement.insertBefore(this.e_body, this.e_body.previousSibling);
			},
			() =>
			{
				this.moving = false;
				PageManager.onLayoutChange.Invoke();
			}
		);
	}

	MoveRight(toEnd = false)
	{
		if (this.moving === true) return;
		if (this.e_body.nextElementSibling == null) return;
		this.moving = true;

		fadeTransformElement(
			this.e_body.parentElement,
			() =>
			{
				if (toEnd === true) setSiblingIndex(this.e_body, this.e_body.parentElement.childElementCount);
				else this.e_body.parentElement.insertBefore(this.e_body.nextSibling, this.e_body);
			},
			() =>
			{
				this.moving = false;
				PageManager.onLayoutChange.Invoke();
			}
		);
	}

	SetParentElement(new_parent)
	{
		if (!new_parent) return;

		let old_parent = this.e_body.parentElement;
		if (old_parent)
		{
			if (old_parent === new_parent) return;
			old_parent.removeChild(this.e_body);
		}
		new_parent.appendChild(this.e_body);
		PageManager.onLayoutChange.Invoke();
	}

	DetermineBodyParent()
	{
		const loose_root = 'content-pages-loose';
		const docked_root = 'content-pages-root';
		if (this.state_data.docked === true) return document.getElementById(docked_root);
		return document.getElementById(loose_root);
	}

	UpdateBodyParent()
	{
		let new_parent = this.DetermineBodyParent();
		if (this.e_body.parentElement !== new_parent) 
		{
			DebugLog.Log("Moved Page to root: " + new_parent.id);
			this.SetParentElement(new_parent);
		}
	}

	DetermineBodyClassList()
	{
		if (this.state_data.docked !== true)
		{
			this.e_body.classList.remove('page-loose');
			this.e_body.classList.add('page-loose');
			this.e_body.style.resize = 'both';
			this.e_body.style.left = this.state_data.position_x + 'px';
			this.e_body.style.top = this.state_data.position_y + 'px';
			this.e_body.style.width = '16rem';
			this.e_body.style.height = '16rem';
		}
		else
		{
			this.e_body.classList.remove('page-loose');
			this.e_body.style.resize = 'unset';
			this.e_body.style.left = 'unset';
			this.e_body.style.top = 'unset';
			this.e_body.style.width = 'unset';
			this.e_body.style.height = 'unset';
		}
	}

	SetDepth(depth = 10)
	{
		this.state_data.depth = depth;
		if (this.e_body) this.e_body.style.zIndex = this.state_data.depth;
	}

	ModifyDepth(depth_delta = 0)
	{
		if ('depth' in this.state_data) this.state_data.depth += depth_delta;
		else this.state_data.depth = depth_delta;

		if (this.e_body) this.e_body.style.zIndex = this.state_data.depth;
	}

	TryToggleDocked() { if (this.state_data.docked === true) this.TryUndock(); else this.TryDock(); }

	TryUndock()
	{
		this.state_data.docked = false;
		this.ApplyDockState();
		if (!this.state_data.position_x) this.state_data.position_x = 0;
		if (!this.state_data.position_y) this.state_data.position_y = 0;

	}

	TryDock()
	{
		if (this.page_descriptor.dockable !== true) return;
		this.state_data.docked = this.page_descriptor.dockable === true;
		this.ApplyDockState();
	}

	ApplyDockState()
	{
		this.UpdateBodyParent();
		this.DetermineBodyClassList();
		this.ApplyLoosePosition();
		PageManager.onLayoutChange.Invoke();
	}

	ApplyLoosePosition(trigger_layout_change = true)
	{
		if (!this.e_body) return;
		if (!this.e_body.style) return;
		if (this.state_data.docked !== true)
		{
			this.e_body.style.left = this.state_data.position_x + 'px';
			this.e_body.style.top = this.state_data.position_y + 'px';
			if (trigger_layout_change === true) PageManager.onLayoutChange.Invoke();
		}
	}

	SetLoosePosition(new_x = 0, new_y = 0, trigger_layout_change = true)
	{
		if (this.state_data.docked === true) return;
		this.state_data.position_x = Math.round(new_x);
		this.state_data.position_y = Math.round(new_y);
		this.ApplyLoosePosition(trigger_layout_change);
	}

	CloseInstance() { this.page_descriptor.CloseInstance(this); }

	RemoveElements(immediate = false)
	{
		PageManager.onLayoutChange.RemoveSubscription(this.sub_LayoutChange);

		if (immediate)
		{
			if (this.page_descriptor.OnClose) this.page_descriptor.OnClose(this);
			this.e_body.remove();
			this.e_body = null;
		}
		else
		{
			fadeRemoveElement(
				this.e_body,
				() =>
				{
					if (this.page_descriptor.OnClose) this.page_descriptor.OnClose(this);
				}
			);
		}
	}

	CreateElements()
	{
		parent = this.DetermineBodyParent();
		if (!parent) 
		{
			DebugLog.Log("PageInstance.CreateElements failed! Null parent");
			return;
		}

		this.CreateBody();
		if (this.page_descriptor.OnCreateElements) this.page_descriptor.OnCreateElements(this);
		if (this.page_descriptor.UpdateSize) this.page_descriptor.UpdateSize(this);

		fadeAppendChild(parent, this.e_body);
		this.sub_LayoutChange = PageManager.onLayoutChange.RequestSubscription(() => { this.UpdatePageContext(); });
		this.page_descriptor.OnOpen(this);
	}

	UpdatePageContext()
	{
		this.title_bar.RemoveAllButtons();
		this.title_bar.RefreshAllButtons();

		/*
		if (PageManager.page_instances.length < 2)
		{
			if (this.page_descriptor.title !== 'nav menu') this.title_bar.AddCloseButton();
			else this.title_bar.RemoveCloseButton();
			this.title_bar.RemoveNavigationButtons();
		}
		else
		{
			this.title_bar.AddCloseButton();
			this.title_bar.RemoveNavigationButtons();
			this.title_bar.AddNavigationButtons(this.e_body.previousElementSibling != null, this.e_body.nextElementSibling != null);
		}

		this.title_bar.RefreshExtraButtons();
		*/

		this.siblingIndex = this.e_body ? getSiblingIndex(this.e_body) : -1;
		this.page_descriptor.OnLayoutChange(this);
	}

	RequireStateProperty(property_name = '', default_value = undefined)
	{
		if (!(property_name in this.state_data)) this.state_data[property_name] = default_value;
	}

	ValidateStateData()
	{
		this.RequireStateProperty('docked', this.page_descriptor.dockable);
	}

	UpdateStateData(state_data = undefined)
	{
		if (state_data)
		{
			let any_applied = false;
			for (let prop_id in state_data)
			{
				this.state_data[prop_id] = state_data[prop_id];
				any_applied = true;
			}
			if (any_applied === true) this.page_descriptor.OnStateChange(this);
		}
	}

	ApplyStateData()
	{
		this.ValidateStateData();
		this.ApplyDockState();
	}

	CreatePanel(parent = {}, inset = false, tiles = false, styling = '', prep = e => { })
	{
		let classes = 'page-panel';
		if (inset) classes += ' inset-box';
		if (tiles) classes += ' page-panel-tiles scroll-y';
		return addElement(parent, 'div', classes, styling, prep);
	}
}















export class PageDescriptor
{
	static Nothing = new PageDescriptor(null);
	instances = [];

	dockable = true;

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
	//UpdateSize(instance) { }
	OnLayoutChange(instance) { }
	OnStateChange(instance) { }

	OnCreateElements(instance)
	{
		instance.e_content.innerText = 'content :: ' + this.title;
	}
}

Modules.Report("Page Descriptors", "This module adds support for page type descriptors, which are used to create instances of available pages");