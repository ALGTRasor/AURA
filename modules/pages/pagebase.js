import { DebugLog } from "../debuglog.js";
import { addElement, fadeAppendChild, fadeRemoveElement, fadeTransformElement, getSiblingIndex, setSiblingIndex } from "../domutils.js";
import { Modules } from "../modules.js";
import { PageManager } from "../pagemanager.js";
import { PageTitleBar } from "./pagetitlebar.js";

export class PageInstance
{
	static Nothing = new PageInstance();

	page_descriptor = {};
	state_data = {};

	constructor(page_descriptor = {})
	{
		this.page_descriptor = page_descriptor;

		this.siblingIndex = -1;
		this.docked = this.page_descriptor.dockable;
		this.title_bar = null;
		this.e_body = {};
		this.e_content = {};
		this.instance_id = Math.round(Math.random() * 8_999_999 + 1_000_000);
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
		this.e_content = document.createElement('div');
		this.e_content.className = 'page-content-root';
		this.title_bar = new PageTitleBar(this, true);
		this.e_body.appendChild(this.e_content);
	}

	MoveLeft(toEnd = false)
	{
		if (!this.e_body.previousSibling) return;
		fadeTransformElement(
			this.e_body.parentElement,
			() =>
			{
				if (toEnd === true) setSiblingIndex(this.e_body, 0);
				else this.e_body.parentElement.insertBefore(this.e_body, this.e_body.previousSibling);
				PageManager.onLayoutChange.Invoke();
			}
		);
	}

	MoveRight(toEnd = false)
	{
		if (!this.e_body.nextSibling) return;
		fadeTransformElement(
			this.e_body.parentElement,
			() =>
			{
				if (toEnd === true) setSiblingIndex(this.e_body, this.e_body.parentElement.childElementCount);
				else this.e_body.parentElement.insertBefore(this.e_body.nextSibling, this.e_body);
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

	TryToggleDocked()
	{
		if (this.docked === true) this.TryUndock();
		else this.TryDock();
	}

	TryUndock()
	{
		if (this.docked === false) return;
		this.docked = false;
		let loose_root = document.getElementById('content-pages-loose');
		this.SetParentElement(loose_root);
	}

	TryDock()
	{
		if (this.docked === true) return;
		this.docked = true;
		let docked_root = document.getElementById('content-pages-root');
		this.SetParentElement(docked_root);
	}

	Close(immediate = false)
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
					this.e_body = null;
				}
			);
		}
	}

	FinalizeBody(parent)
	{
		if (!parent) return;

		fadeAppendChild(parent, this.e_body);

		this.sub_LayoutChange = PageManager.onLayoutChange.RequestSubscription(() => { this.UpdatePageContext(); });
		this.page_descriptor.OnOpen(this);
	}

	CreateElements(parent)
	{
		if (!parent) return;
		this.CreateBody();
		if (this.page_descriptor.UpdateSize) this.page_descriptor.UpdateSize(this);
		if (this.page_descriptor.OnCreateElements) this.page_descriptor.OnCreateElements(this);
		this.FinalizeBody(parent);
	}

	UpdatePageContext()
	{
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

		this.siblingIndex = this.e_body ? getSiblingIndex(this.e_body) : -1;
		this.page_descriptor.OnLayoutChange(this);
	}

	UpdateStateData(state_data = {})
	{
		let prop_count = 0;
		for (let prop_id in state_data)
		{
			this.state_data[prop_id] = state_data[prop_id];
			prop_count++;
			//DebugLog.Log(` - Page State Data [${prop_count}] ${prop_id}: ${this.state_data[prop_id]}`);
		}
		if (prop_count > 0) this.page_descriptor.OnStateChange(this);
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

	constructor(title = '', permission = '', icon = '', description = '')
	{
		this.icon = icon;
		this.title = title;
		this.description = description;
		this.permission = permission;
		this.descriptor_id = Math.round(Math.random() * 8_999_999 + 1_000_000);

		this.dockable = true;
	}

	instances = [];
	GetInstance()
	{
		if (this.instances.length > 0) return this.instances[0];
		return null;
	}
	GetOrCreateInstance(forceCreate = false)
	{
		if (forceCreate !== true && this.instances.length > 0) return this.instances[0];
		return this.CreateInstance();
	}

	CreateInstance()
	{
		let pinst = new PageInstance(this);
		this.instances.push(pinst);
		return pinst;
	}

	CloseInstance(instance)
	{
		let instance_index = this.instances.indexOf(instance);
		if (instance_index > -1) this.instances.splice(instance_index, 1);
		else DebugLog.Log('! instance_index invalid', '#ff0');
		if (instance.Close) instance.Close();

		let piid = PageManager.page_instances.indexOf(instance);
		if (piid > -1) PageManager.page_instances.splice(piid, 1);
		window.setTimeout(PageManager.AfterPageClosed, 400);
	}

	UpdateSize(instance) { }
	Resize(instance) { }
	OnOpen(instance) { }
	OnClose(instance) { }
	OnLayoutChange(instance) { }
	OnStateChange(instance) { }

	OnCreateElements(instance)
	{
		instance.e_content.innerText = 'content :: ' + this.title;
	}
}

Modules.Report("Page Descriptors");