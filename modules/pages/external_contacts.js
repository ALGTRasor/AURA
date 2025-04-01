import { ExternalContact } from "../datamodels/external_contact.js";
import { SharedData } from "../datashared.js";
import { addElement, CreatePagePanel } from "../domutils.js";
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
		this.e_body.style.minWidth = '32rem';

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
		this.viewer.SetViewBuilder(records => this.BuildRecordView(records));
		this.viewer.CreateElements(this.e_content);

		this.FinalizeBody(parent);
	}

	BuildRecordView(records)
	{
		if (!records || records.length < 1) return;

		for (let id in records)
		{
			let record = records[id];

			let e_info_root = CreatePagePanel(this.viewer.e_view_root, false, false, 'min-width:28rem;', e => { });
			addElement(e_info_root, 'div', '', 'text-align:center;', x => { x.innerText = record.contact_name; });
			let e_info_body = CreatePagePanel(e_info_root, true, false, '', x => { });

			RecordFormUtils.CreateRecordInfoList(e_info_body, record, ExternalContact.field_descs);
		}
	}

	OnLayoutChange()
	{
		this.viewer.RefreshElementVisibility();
	}
}

PageManager.RegisterPage(new PageExternalContacts('external contacts'));