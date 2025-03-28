import "../datamodels/project_data.js";
import { SharedData } from "../datashared.js";
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
		this.viewer.SetViewBuilder(x => this.BuildViewer(x));
		this.viewer.CreateElements(this.e_content);

		this.FinalizeBody(parent);
	}

	BuildViewer(record)
	{
		let project_data = {};
		if (record.project_json && record.project_json.length > 0)
		{
			try { project_data = JSON.parse(record.project_json); }
			catch (e) { this.SetContentBodyLabel(e); return; }
		}
		project_data.id = record.id;
		project_data.Title = record.Title;
		RecordFormUtils.CreateRecordInfoList(this.viewer.e_view_root, project_data, data_models.project_data.field_descs);

	}

	OnLayoutChange()
	{
		this.viewer.RefreshElementVisibility();
	}
}

PageManager.RegisterPage(new PageProjectHub('project hub'));