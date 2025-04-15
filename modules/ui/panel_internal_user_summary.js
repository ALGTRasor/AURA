import { InternalUser } from "../datamodels/internal_user.js";
import { RecordSummaryPanelBase } from "./panel_record_summary_base.js";

export class InternalUserSummary extends RecordSummaryPanelBase
{
	//GetPanelTitle() { return 'Internal User Summary'; }
	GetRecordTitleLabel() { return 'User ID'; };
	GetRecordTitleField() { return 'Title'; };
	OnAppendFields() { this.AutoAppendFields(InternalUser.data_model.field_descs); }
	OnUpdateFields() { this.AutoUpdateFields(InternalUser.data_model.field_descs); }
	OnClearFields() { for (let fid in this.fields) this.fields[fid].SetValue(undefined, false, true); }
	BeforeRemoveFields() { }
}