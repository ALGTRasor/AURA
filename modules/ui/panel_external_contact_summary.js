import { ExternalContact } from "../datamodels/external_contact.js";
import { RecordSummaryPanelBase } from "./panel_record_summary_base.js";

export class ExternalContactSummary extends RecordSummaryPanelBase
{
	//GetPanelTitle() { return 'External Contact Summary'; }
	GetRecordTitleLabel() { return 'Contact ID'; };
	GetRecordTitleField() { return 'contact_name'; };
	OnAppendFields() { this.AutoAppendFields(ExternalContact.data_model.field_descs); }
	OnUpdateFields() { this.AutoUpdateFields(ExternalContact.data_model.field_descs); }
	OnClearFields() { for (let fid in this.fields) this.fields[fid].SetValue(undefined, false, true); }
	BeforeRemoveFields() { }
}