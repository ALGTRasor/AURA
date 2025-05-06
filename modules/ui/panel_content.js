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

	RecreateElements()
	{
		this.RemoveElements();
		this.CreateElements(this.e_parent);
	}

	CreateElements()
	{
		if (this.created === true) return;

		try
		{
			this.OnCreateElements();
			this.created = true;
		}
		catch (e) { this.OnError(e); }
	}

	RefreshElements()
	{
		if (this.created === false) return;
		try { this.OnRefreshElements(); } catch (e) { this.OnError(e); }
	}

	RemoveElements()
	{
		if (this.created === false) return;
		try { this.OnRemoveElements(); } catch (e) { this.OnError(e); }
		this.created = false;
	}

	// override functions
	OnCreateElements() { throw new Error('Panel Content Create Not Implemented'); }
	OnRefreshElements() { throw new Error('Panel Content Refresh Not Implemented'); }
	OnRemoveElements() { throw new Error('Panel Content Remove Not Implemented'); }

	OnError(error = new Error('UNDEFINED ERROR')) { console.error(error.stack); }
}