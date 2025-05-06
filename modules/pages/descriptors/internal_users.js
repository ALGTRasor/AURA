import { InternalUser } from "../../datamodels/internal_user.js";
import { SharedData } from "../../datashared.js";
import { DebugLog } from "../../debuglog.js";
import { addElement, CreatePagePanel } from "../../utils/domutils.js";
import { PageManager } from "../../pagemanager.js";
import { RecordFormUtils } from "../../ui/recordform.js";
import { RecordViewer } from "../../ui/recordviewer.js";
import { PageDescriptor } from "../pagebase.js";

export class PageInternalUsers extends PageDescriptor
{
	GetTitle() { return 'internal users'; }
	OnCreateElements(instance)
	{
		if (!instance) return;

		instance.e_frame.style.minWidth = '32rem';
		//this.e_frame.style.backgroundColor = 'hsl(from var(--theme-color) h s 20%)';

		instance.viewer = new RecordViewer();
		instance.viewer.SetData(SharedData.users.instance.data);
		const sort = (x, y) =>
		{
			if (x.Title < y.Title) return -1;
			if (x.Title > y.Title) return 1;
			return 0;
		};
		instance.viewer.SetListItemSorter(sort);
		instance.viewer.SetListItemBuilder((table, x, e) => { addElement(e, 'span', '', '', c => { c.innerText = table[x].display_name_full }); });
		instance.viewer.SetViewBuilder(records => this.BuildRecordView(instance, records));
		instance.viewer.CreateElements(instance.e_content);
	}

	BuildRecordView(instance, records)
	{
		if (!records || records.length < 1) return;

		for (let id in records)
		{
			let record = records[id];

			let e_info_root = CreatePagePanel(instance.viewer.e_view_root, false, false, 'min-width:28rem;', e => { });
			addElement(e_info_root, 'div', '', 'text-align:center;', x => { x.innerText = record.display_name_full; });
			let e_info_body = CreatePagePanel(e_info_root, true, false, '', x => { });

			RecordFormUtils.CreateRecordInfoList(e_info_body, record, InternalUser.data_model.field_descs, 'info', records.length < 2);
		}
	}

	OnLayoutChange(instance)
	{
		instance.viewer.RefreshElementVisibility();
	}
}

PageManager.RegisterPage(new PageInternalUsers('internal users', 'users.view'));