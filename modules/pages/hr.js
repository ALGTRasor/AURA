import { HrRequest } from "../datamodels/hr_request.js";
import { SharedData } from "../datashared.js";
import { addElement, CreatePagePanel } from "../domutils.js";
import { PageManager } from "../pagemanager.js";
import { RecordFormUtils } from "../ui/recordform.js";
import { RecordViewer } from "../ui/recordviewer.js";
import { PageBase } from "./pagebase.js";

export class PageHR extends PageBase
{
	GetTitle() { return 'hr'; }
	CreateElements(parent)
	{
		if (!parent) return;
		this.CreateBody();
		this.e_body.style.minWidth = '32rem';
		this.CreateHrRequestBlock();
		this.FinalizeBody(parent);
	}

	BuildRecordView_HrReqs(records = [])
	{
		if (!records || records.length < 1) return;

		for (let id in records)
		{
			let record = records[id];
			let e_info_root = CreatePagePanel(this.viewer_hr_requests.e_view_root, false, false, 'min-width:20vw;', e => { });
			addElement(e_info_root, 'div', '', 'text-align:center;', x => { x.innerText = record.request_name; });
			let e_info_body = CreatePagePanel(e_info_root, true, false, '', x => { });
			RecordFormUtils.CreateRecordInfoList(e_info_body, record, HrRequest.data_model.field_descs, null, records.length < 2);
		}
	}

	CreateHrRequestBlock()
	{
		this.viewer_hr_requests = new RecordViewer();
		const sort = (x, y) =>
		{
			if (x.request_name < y.request_name) return -1;
			if (x.request_name > y.request_name) return 1;
			return 0;
		};
		this.viewer_hr_requests.SetListItemSorter(sort);
		this.viewer_hr_requests.SetListItemBuilder((table, x, e) => { addElement(e, 'span', '', '', c => { c.innerText = table[x].request_name }); });
		this.viewer_hr_requests.SetViewBuilder(records => this.BuildRecordView_HrReqs(records));
		this.viewer_hr_requests.SetData(SharedData.hrRequests.data);
		this.viewer_hr_requests.CreateElements(this.e_content);
	}

	OnLayoutChange()
	{
		this.viewer_hr_requests.RefreshElementVisibility();
	}
}

PageManager.RegisterPage(new PageHR('hr'));