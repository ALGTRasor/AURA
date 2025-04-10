import { InternalUser } from "../datamodels/internal_user.js";
import { SharedData } from "../datashared.js";
import { DebugLog } from "../debuglog.js";
import { addElement, CreatePagePanel } from "../domutils.js";
import { PageManager } from "../pagemanager.js";
import { RecordFormUtils } from "../ui/recordform.js";
import { RecordViewer } from "../ui/recordviewer.js";
import { PageBase } from "./pagebase.js";

export class PageInternalUsers extends PageBase
{
	GetTitle() { return 'internal users'; }
	CreateElements(parent)
	{
		if (!parent) return;
		this.CreateBody();
		this.e_body.style.minWidth = '32rem';
		this.e_body.style.backgroundColor = 'hsl(from var(--theme-color) h s 20%)';

		this.viewer = new RecordViewer();
		this.viewer.SetData(SharedData.users.data);
		const sort = (x, y) =>
		{
			if (x.Title < y.Title) return -1;
			if (x.Title > y.Title) return 1;
			return 0;
		};
		this.viewer.SetListItemSorter(sort);
		this.viewer.SetListItemBuilder((table, x, e) => { addElement(e, 'span', '', '', c => { c.innerText = table[x].display_name_full }); });
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

			let e_info_root = CreatePagePanel(this.viewer.e_view_root, false, false, 'min-width:28rem;', e => { });
			addElement(e_info_root, 'div', '', 'text-align:center;', x => { x.innerText = record.display_name_full; });
			let e_info_body = CreatePagePanel(e_info_root, true, false, '', x => { });

			RecordFormUtils.CreateRecordInfoList(e_info_body, record, InternalUser.data_model.field_descs, 'info', records.length < 2);
		}
	}

	OnLayoutChange()
	{
		this.viewer.RefreshElementVisibility();
	}
}

PageManager.RegisterPage(new PageInternalUsers('internal users', 'users.view'));