import { addElement } from "../utils/domutils.js";
import { PanelBase } from "./panel_base.js";

export class RecordListPanelBase extends PanelBase
{
	records = [];

	// + overrides
	GetPanelTitle() { return 'Record List'; }
	GetListLabel() { return 'Records'; }
	GetRecordTitleField() { return 'Title'; }
	GetRecordTitleLabel() { return 'Title'; }
	GetSpoofRecord() { return {}; }
	CreateRecordSummary(record = {}) { }
	// - overrides

	constructor(records = [])
	{
		super();
		this.records = records;
	}

	OnCreate()
	{
		const style_root = 'display:flex; flex-direction:row; flex-wrap:wrap; gap:0.5rem; position:absolute; inset:0; padding:0.5rem; align-content:flex-start;';
		this.e_root = addElement(this.e_parent, 'div', 'scroll-y', style_root);
	}

	OnRefresh()
	{
		//DebugLog.StartGroup('Record List Populating: ' + this.GetListLabel());
		this.RemoveAllChildren();

		if (this.records && this.records.length > 0)
		{
			for (let ii = 0; ii < this.records.length; ii++) this.CreateRecordSummary(this.records[ii]);
		}
		else // spoof records
		{
			for (let ii = 0; ii < 7; ii++) this.CreateRecordSummary(this.GetSpoofRecord());
		}
		//DebugLog.SubmitGroup();
	}

	OnRemove()
	{
		this.e_root.remove();
	}
}