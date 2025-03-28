import { ExternalContact } from "../datamodels/external_contact.js";
import { SharedData } from "../datashared.js";
import { addElement } from "../domutils.js";
import { PageManager } from "../pagemanager.js";
import { RecordFormUtils } from "../ui/recordform.js";
import { RecordViewer } from "../ui/recordviewer.js";
import { PageBase } from "./pagebase.js";

export class PageExternalContacts extends PageBase
{
	GetTitle() { return 'external contacts'; }
	CreateElements(parent)
	{
		if (!parent) return;
		this.CreateBody();

		this.viewer = new RecordViewer();
		this.viewer.SetData(SharedData.contacts.data);
		const sort = (x, y) =>
		{
			if (x.contact_name < y.contact_name) return -1;
			if (x.contact_name > y.contact_name) return 1;
			return 0;
		};
		this.viewer.SetListItemSorter(sort);
		this.viewer.SetListItemBuilder((table, x, e) => { addElement(e, 'span', '', '', c => { c.innerText = table[x].contact_name }); });
		this.viewer.SetViewBuilder(x => { RecordFormUtils.CreateRecordInfoList(this.viewer.e_view_root, x, ExternalContact.field_descs); });
		this.viewer.CreateElements(this.e_content);

		this.FinalizeBody(parent);
	}

	OnLayoutChange()
	{
		this.viewer.RefreshElementVisibility();
	}
}

PageManager.RegisterPage(new PageExternalContacts('external contacts'));