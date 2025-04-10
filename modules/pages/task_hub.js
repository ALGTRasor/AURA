import { TaskData } from "../datamodels/task_data.js";
import { SharedData } from "../datashared.js";
import { addElement, CreatePagePanel } from "../domutils.js";
import { PageManager } from "../pagemanager.js";
import { RecordFormUtils } from "../ui/recordform.js";
import { RecordViewer } from "../ui/recordviewer.js";
import { PageBase } from "./pagebase.js";

export class PageTaskHub extends PageBase
{
	GetTitle() { return 'task hub'; }
	CreateElements(parent)
	{
		if (!parent) return;
		this.CreateBody();

		this.e_body.style.minWidth = '32rem';

		this.viewer = new RecordViewer();
		this.viewer.SetData(SharedData.tasks.data);
		const sort = (x, y) =>
		{
			if (x.task_title < y.task_title) return -1;
			if (x.task_title > y.task_title) return 1;
			return 0;
		};
		this.viewer.SetListItemSorter(sort);
		this.viewer.SetListItemBuilder((table, x, e) => { addElement(e, 'span', '', '', c => { c.innerText = table[x].task_title }); });
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
			let e_info_root = CreatePagePanel(this.viewer.e_view_root, false, false, 'min-width:20vw;', e => { });
			addElement(e_info_root, 'div', '', 'text-align:center;', x => { x.innerText = record.task_title; });
			let e_info_body = CreatePagePanel(e_info_root, true, false, '', x => { });
			RecordFormUtils.CreateRecordInfoList(e_info_body, record, TaskData.data_model.field_descs);
		}
	}

	OnLayoutChange()
	{
		this.viewer.RefreshElementVisibility();
	}
}

PageManager.RegisterPage(new PageTaskHub('task hub', 'tasks.view'));