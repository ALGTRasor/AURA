import { ExternalContactSummary } from "./panel_external_contact_summary.js";
import { RecordListPanelBase } from "./panel_record_list_base.js";

export class ExternalContactList extends RecordListPanelBase
{
	GetPanelTitle() { return 'External Contact List'; }
	GetListLabel() { return 'External Contacts'; }
	GetRecordTitleField() { return 'Title'; }
	GetRecordTitleLabel() { return 'Contact ID'; }
	GetSpoofRecord()
	{
		let spoof = {};
		spoof.Title = 'contact.id.' + (Math.round(Math.random() * 899999) + 100000);
		spoof.contact_name = 'Contact Name ' + (Math.round(Math.random() * 899999) + 100000);
		return spoof;
	}

	CreateRecordSummary(record = {})
	{
		let summary = new ExternalContactSummary();
		summary.record = record;
		summary.Create(this.e_root);
		this.PushChild(summary);
	}
}