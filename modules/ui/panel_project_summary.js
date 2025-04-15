import { ProjectCoreData } from "../datamodels/project_data_core.js";
import { RecordSummaryPanelBase } from "./panel_record_summary_base.js";

export class ProjectSummary extends RecordSummaryPanelBase
{
	//GetPanelTitle() { return 'Project Summary'; }
	GetRecordTitleLabel() { return 'Project Name'; };
	GetRecordTitleField() { return 'project_name'; };
	OnAppendFields() { this.AutoAppendFields(ProjectCoreData.data_model.field_descs); }
	OnUpdateFields() { this.AutoUpdateFields(ProjectCoreData.data_model.field_descs); }
	OnClearFields() { for (let fid in this.fields) this.fields[fid].SetValue(undefined, false, true); }
	BeforeRemoveFields() { }
}