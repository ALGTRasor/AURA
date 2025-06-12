import { DebugLog } from "../debuglog.js";

export class PanelBase extends EventTarget
{
	constructor()
	{
		super();
		this.created = false;
		this.e_parent = {};
		this.children = [];
	}

	Create(e_parent = {})
	{
		if (this.created) return;

		this.e_parent = e_parent;
		if (this.e_parent && this.e_parent.PushChild) this.e_parent.PushChild(this);

		try
		{
			this.OnCreate();
			this.created = true;
		}
		catch (e) { this.OnError(e); }


		this.Refresh(false);
	}

	Refresh(refresh_children = true)
	{
		if (!this.created) return;

		try
		{
			this.OnRefresh();
			if (refresh_children == true && this.children && this.children.length && this.children.length > 0)
			{
				for (let cid in this.children)
				{
					let this_child = this.children[cid];
					if (this_child && this_child.Refresh) this_child.Refresh();
				}
			}
		}
		catch (e) { this.OnError(e); }

		let panel_title = this.GetPanelTitle();
		let has_panel_title = panel_title && panel_title.length > 0;
		if (has_panel_title === true) DebugLog.Log('...Refreshed Panel: ' + panel_title);
	}

	Remove()
	{
		if (!this.created) return;
		this.RemoveAllChildren();
		try { this.OnRemove(); }
		catch (e) { this.OnError(e); }
		this.created = false;
	}

	PushChild(child)
	{
		if (!child) return child;
		if (this.children.indexOf(child) > -1) return child;
		this.children.push(child);
		return child;
	}

	RefreshAllChildren()
	{
		for (let cid in this.children)
		{
			let this_child = this.children[cid];
			if (this_child && this_child.Refresh) this_child.Refresh();
		}
	}

	RemoveAllChildren()
	{
		for (let cid in this.children)
		{
			let this_child = this.children[cid];
			if (this_child && this_child.Remove) this_child.Remove();
		}
		this.children = [];
	}

	// override functions
	OnCreate() { throw new Error('Panel Create Not Implemented'); }
	OnRefresh() { throw new Error('Panel Refresh Not Implemented'); }
	OnRemove() { throw new Error('Panel Remove Not Implemented'); }

	OnError(error = '') { console.error(error.stack); }

	GetPanelTitle() { return ''; }
}