export class PanelContent
{
	static Nothing = new PanelContent(null);

	created = false;
	e_parent = undefined;

	constructor(e_parent)
	{
		this.created = false;
		this.e_parent = e_parent;
	}

	RecreateElements(data)
	{
		this.RemoveElements(data);
		this.CreateElements(data);
	}

	CreateElements(data)
	{
		if (this.created === true) return;

		try
		{
			this.OnCreateElements(data);
			this.created = true;
		}
		catch (e) { this.OnError(e); }
	}

	RefreshElements(data)
	{
		this.CreateElements();
		if (this.created === false) return;
		try { this.OnRefreshElements(data); } catch (e) { this.OnError(e); }
	}

	RemoveElements(data)
	{
		if (this.created === false) return;
		try { this.OnRemoveElements(data); } catch (e) { this.OnError(e); }
		this.created = false;
	}

	// override functions
	OnCreateElements(data) { throw new Error('Panel Content Create Not Implemented'); }
	OnRefreshElements(data) { throw new Error('Panel Content Refresh Not Implemented'); }
	OnRemoveElements(data) { throw new Error('Panel Content Remove Not Implemented'); }

	OnError(error = new Error('UNDEFINED ERROR')) { console.error(error.stack); }
}