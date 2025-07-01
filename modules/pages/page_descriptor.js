import { DebugLog } from "../debuglog.js";
import { PageManager } from "../pagemanager.js";
import { PageInstance } from "./pagebase.js";

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
		this.descriptor_id = Math.round(Math.random() * 8999999 + 1000000);
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

	OnRemoveElements(instance) { }
}
