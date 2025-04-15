import { ProjectSummary } from "./panel_project_summary.js";
import { RecordListPanelBase } from "./panel_record_list_base.js";

export class ProjectList extends RecordListPanelBase
{
	GetPanelTitle() { return 'Project List'; }
	GetListLabel() { return 'Projects'; }
	GetRecordTitleField() { return 'project_name'; }
	GetRecordTitleLabel() { return 'Project Name'; }

	CreateRecordSummary(record = {})
	{
		let summary = new ProjectSummary();
		summary.record = record;
		summary.Create(this.e_root);
		this.PushChild(summary);
	}

	GetSpoofRecord()
	{
		let spoof = {};
		spoof.Title = 'project.id.' + (Math.round(Math.random() * 899999) + 100000);
		spoof.project_name = 'Project Name ' + (Math.round(Math.random() * 899999) + 100000);
		return spoof;
	}
}