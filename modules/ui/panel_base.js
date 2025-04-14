export class PanelBase
{
	constructor()
	{
		this.created = false;
		this.e_parent = {};
		this.children = [];
	}

	Create(e_parent = {})
	{
		if (this.created) return;
		this.e_parent = e_parent;
		try
		{
			this.OnCreate();
			this.created = true;
		}
		catch (e) { this.OnError(e); }


		this.Refresh();
	}

	Refresh()
	{
		if (!this.created) return;
		try
		{
			this.OnRefresh();
			if (this.children && this.children.length && this.children.length > 0)
			{
				for (let cid in this.children)
				{
					let this_child = this.children[cid];
					if (this_child && this_child.Refresh) this_child.Refresh();
				}
			}
		}
		catch (e) { this.OnError(e); }
	}

	Remove()
	{
		if (!this.created) return;
		this.RemoveAllChildren();
		try { this.OnRemove(); }
		catch (e) { this.OnError(e); }
		this.created = false;
	}

	PushChild(child) { this.children.push(child); return child; }
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
	OnCreate() { throw 'Panel Create Not Implemented'; }
	OnRefresh() { throw 'Panel Refresh Not Implemented'; }
	OnRemove() { throw 'Panel Remove Not Implemented'; }

	OnError(error = '') { console.error(error.stack); }
}