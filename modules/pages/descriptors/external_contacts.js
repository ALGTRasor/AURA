import { ExternalContact } from "../../datamodels/external_contact.js";
import { SharedData } from "../../datashared.js";
import { addElement, CreatePagePanel } from "../../utils/domutils.js";
import { PageManager } from "../../pagemanager.js";
import { RecordFormUtils } from "../../ui/recordform.js";
import { RecordViewer } from "../../ui/recordviewer.js";
import { PageDescriptor } from "../pagebase.js";

export class PageExternalContacts extends PageDescriptor
{
	GetTitle() { return 'external contacts'; }
	OnCreateElements(instance)
	{
		if (!instance) return;
		instance.e_frame.style.minWidth = '32rem';

		instance.viewer = new RecordViewer();
		instance.viewer.SetData(SharedData.contacts.instance.data);
		const sort = (x, y) =>
		{
			if (x.contact_name < y.contact_name) return -1;
			if (x.contact_name > y.contact_name) return 1;
			return 0;
		};
		instance.viewer.SetListItemSorter(sort);
		instance.viewer.SetListItemBuilder((table, x, e) => { addElement(e, 'span', '', '', c => { c.innerText = table[x].contact_name }); });
		instance.viewer.SetViewBuilder(records => this.BuildRecordView(instance, records));
		instance.viewer.CreateElements(instance.e_content);
	}

	BuildRecordView(instance, records)
	{
		if (!records || records.length < 1) return;

		for (let id in records)
		{
			let record = records[id];

			let e_info_root = CreatePagePanel(instance.viewer.e_view_root, false, false, 'min-width:28rem;', e => { });
			addElement(e_info_root, 'div', '', 'text-align:center;', x => { x.innerText = record.contact_name; });
			let e_info_body = CreatePagePanel(e_info_root, true, false, '', x => { });

			RecordFormUtils.CreateRecordInfoList(e_info_body, record, ExternalContact.data_model.field_descs);
		}
	}

	OnLayoutChange(instance)
	{
		instance.viewer.RefreshElementVisibility();
	}
}

PageManager.RegisterPage(new PageExternalContacts('external contacts', 'contacts.view'));