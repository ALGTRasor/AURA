import { ProjectCoreData } from "../../datamodels/project_data_core.js";
import { ProjectData } from "../../datamodels/project_data.js";
import { SharedData } from "../../datashared.js";
import { DebugLog } from "../../debuglog.js";
import { addElement, CreatePagePanel } from "../../domutils.js";
import { PageManager } from "../../pagemanager.js";
import { RecordFormUtils } from "../../ui/recordform.js";
import { RecordViewer } from "../../ui/recordviewer.js";
import { PageDescriptor } from "../pagebase.js";

export class PageProjectHub extends PageDescriptor
{
	GetTitle() { return 'project hub'; }
	OnCreateElements(instance)
	{
		if (!instance) return;
		instance.e_body.style.minWidth = '32rem';

		instance.viewer = new RecordViewer();
		instance.viewer.SetData(SharedData.projects.instance.data);
		const sort = (x, y) =>
		{
			if (x.id < y.id) return -1;
			if (x.id > y.id) return 1;
			return 0;
		};
		instance.viewer.SetListItemSorter(sort);
		instance.viewer.SetListItemBuilder((table, x, e) => { addElement(e, 'span', '', '', c => { c.innerText = table[x].Title }); });
		instance.viewer.SetViewBuilder(records => this.BuildViewer(instance, records));
		instance.viewer.CreateElements(instance.e_content);
	}

	BuildViewer(instance, records)
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


			let e_info_root = CreatePagePanel(instance.viewer.e_view_root, false, false, 'min-width:20vw;', e => { });
			addElement(e_info_root, 'div', '', 'text-align:center;', x => { x.innerText = record.project_name; });
			let e_info_body = CreatePagePanel(e_info_root, true, false, '', x => { });
			RecordFormUtils.CreateRecordInfoList(e_info_body, project_data, ProjectData.data_model.field_descs);
		}

	}

	OnLayoutChange(instance)
	{
		instance.viewer.RefreshElementVisibility();
	}
}

PageManager.RegisterPage(new PageProjectHub('project hub', 'projects.view'));