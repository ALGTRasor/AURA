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
		this.created = true;
		this.e_parent = e_parent;
		this.children = [];
		try { this.OnCreate(); }
		catch (e) { this.OnError('ERROR IN PANEL CREATE:: ' + e); }

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
					if (this.children[cid] && this.children[cid].Refresh) this.children[cid].Refresh();
				}
			}
		}
		catch (e) { this.OnError('ERROR IN PANEL REFRESH:: ' + e); }
	}

	Remove()
	{
		if (!this.created) return;
		this.created = false;
		try
		{
			if (this.children && this.children.length && this.children.length > 0)
			{
				for (let cid in this.children)
				{
					if (this.children[cid] && this.children[cid].Remove) this.children[cid].Remove();
				}
			}
			this.OnRemove();
		}
		catch (e) { this.OnError('ERROR IN PANEL REMOVE:: ' + e); }
	}

	PushChild(child) { this.children.push(child); return child; }
	RemoveChild(child) { this.children = this.children.filter(x => x !== child); }

	// override functions
	OnCreate() { throw 'Panel Create Not Implemented'; }
	OnRefresh() { throw 'Panel Refresh Not Implemented'; }
	OnRemove() { throw 'Panel Remove Not Implemented'; }

	OnError(error = '') { console.trace(); console.error(error); }
}