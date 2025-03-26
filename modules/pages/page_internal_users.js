import { SharedData } from "../datashared.js";
import { addElement } from "../domutils.js";
import { PageManager } from "../pagemanager.js";
import { RecordViewer } from "../recordviewer.js";
import { PageBase } from "./pagebase.js";

export class PageInternalUsers extends PageBase
{
	GetTitle() { return 'internal users'; }
	CreateElements(parent)
	{
		if (!parent) return;
		this.CreateBody();

		this.viewer = new RecordViewer();
		this.viewer.SetData(SharedData.users.data);
		const sort = (x, y) =>
		{
			if (x.Title < y.Title) return -1;
			if (x.Title > y.Title) return 1;
			return 0;
		};
		this.viewer.SetListItemSorter(sort);
		this.viewer.SetListItemBuilder((table, x, e) =>
		{
			addElement(e, 'span', '', '', c => { c.innerText = table[x].display_name_full });
		});
		this.viewer.CreateElements(this.e_content);

		this.FinalizeBody(parent);
	}

	OnLayoutChange()
	{
		this.viewer.RefreshElementVisibility();
	}
}

PageManager.RegisterPage(new PageInternalUsers('internal users'));