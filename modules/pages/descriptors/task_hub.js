import { TaskData } from "../../datamodels/task_data.js";
import { SharedData } from "../../remotedata/datashared.js";
import { addElement, CreatePagePanel } from "../../utils/domutils.js";
import { PageManager } from "../../pagemanager.js";
import { RecordFormUtils } from "../../ui/recordform.js";
import { RecordViewer } from "../../ui/recordviewer.js";
import { PageDescriptor } from "../pagebase.js";

export class PageTaskHub extends PageDescriptor
{
	GetTitle() { return 'task tracker'; }
	OnCreateElements(instance)
	{
		if (!instance) return;

		instance.e_frame.style.minWidth = '32rem';

		instance.viewer = new RecordViewer();
		instance.viewer.SetData(SharedData.tasks.data);
		const sort = (x, y) =>
		{
			if (x.task_title < y.task_title) return -1;
			if (x.task_title > y.task_title) return 1;
			return 0;
		};
		instance.viewer.SetListItemSorter(sort);
		instance.viewer.SetListItemBuilder((table, x, e) => { addElement(e, 'span', '', '', c => { c.innerText = table[x].task_title }); });
		instance.viewer.SetViewBuilder(records => this.BuildRecordView(instance, records));
		instance.viewer.CreateElements(instance.e_content);
	}

	BuildRecordView(instance, records)
	{
		if (!records || records.length < 1) return;

		for (let id in records)
		{
			let record = records[id];
			let e_info_root = CreatePagePanel(instance.viewer.e_view_root, false, false, 'min-width:20vw;', e => { });
			addElement(e_info_root, 'div', '', 'text-align:center;', x => { x.innerText = record.task_title; });
			let e_info_body = CreatePagePanel(e_info_root, true, false, '', x => { });
			RecordFormUtils.CreateRecordInfoList(e_info_body, record, TaskData.data_model.field_descs);
		}
	}

	OnLayoutChange(instance)
	{
		instance.viewer.RefreshElementVisibility();
	}
}

PageManager.RegisterPage(new PageTaskHub('task tracker', 'tasks.view'), 't', 'Task Tracker');