import { ProjectCoreData } from "../datamodels/project_data_core.js";
import { ProjectData } from "../datamodels/project_data.js";
import { SharedData } from "../datashared.js";
import { DebugLog } from "../debuglog.js";
import { addElement } from "../domutils.js";
import { PageManager } from "../pagemanager.js";
import { RecordFormUtils } from "../ui/recordform.js";
import { RecordViewer } from "../ui/recordviewer.js";
import { PageBase } from "./pagebase.js";

export class PageProjectHub extends PageBase
{
	GetTitle() { return 'project hub'; }
	CreateElements(parent)
	{
		if (!parent) return;
		this.CreateBody();
		this.e_body.style.minWidth = '32rem';

		this.viewer = new RecordViewer();
		this.viewer.SetData(SharedData.projects.data);
		const sort = (x, y) =>
		{
			if (x.id < y.id) return -1;
			if (x.id > y.id) return 1;
			return 0;
		};
		this.viewer.SetListItemSorter(sort);
		this.viewer.SetListItemBuilder((table, x, e) => { addElement(e, 'span', '', '', c => { c.innerText = table[x].Title }); });
		this.viewer.SetViewBuilder(records => this.BuildViewer(records));
		this.viewer.CreateElements(this.e_content);

		this.FinalizeBody(parent);
	}

	BuildViewer(records)
	{
		if (!records || records.length < 1) return;

		for (let id in records)
		{
			let record = records[id];
			let project_data = {};
			if (record.project_json && record.project_json.length > 0)
			{
				try { project_data = JSON.parse(record.project_json); }
				catch (e) { DebugLog.Log(e); }
			}
			project_data.id = record.id;
			project_data.Title = record.Title;
			project_data.name = record.project_name;
			project_data.scope = record.project_scope;

			let e_info_root = addElement(this.viewer.e_view_root, 'div', 'record-viewer-view-block', '', e => { addElement(e, 'span', '', '', x => { x.innerText = project_data.name; }) });
			RecordFormUtils.CreateRecordInfoList(e_info_root, project_data, ProjectData.data_model.field_descs);
		}

	}

	OnLayoutChange()
	{
		this.viewer.RefreshElementVisibility();
	}
}

PageManager.RegisterPage(new PageProjectHub('project hub'));