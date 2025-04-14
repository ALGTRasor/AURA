import { addElement } from "../domutils.js";
import { PanelBase } from "./panel_base.js";
import { RecordSummaryPanel } from "./panel_record_summary.js";

export class RecordListPanel extends PanelBase
{
	records = [];
	record_title_field = '';
	record_title_label = '';

	createFieldPanels = _ => { };
	updateFieldPanelValues = _ => { };
	clearFieldPanelValues = _ => { };

	spoofCount = 7;
	getSpoofRecord = () => { return {}; };

	constructor(records = [], record_title_field = 'user_id', record_title_label = 'user id', getSpoofRecord = () => { return {}; }, spoofCount = 7)
	{
		super();

		this.records = records;
		this.record_title_field = record_title_field;
		this.record_title_label = record_title_label;

		this.getSpoofRecord = getSpoofRecord;
		this.spoofCount = spoofCount;
	}

	OnCreate()
	{
		const style_root = 'position:absolute;inset:0;padding:0.5rem;display:flex;flex-direction:row;flex-wrap:wrap;gap:0.5rem;';
		this.e_root = addElement(this.e_parent, 'div', 'scroll-y', style_root);
	}

	OnRefresh()
	{
		for (let cid in this.children) this.children[cid].Remove();
		this.children = [];

		const addSummary = record =>
		{
			let summary = new RecordSummaryPanel(record, this.record_title_field, this.record_title_label);
			summary.createFieldPanels = this.createFieldPanels;
			summary.updateFieldPanelValues = this.updateFieldPanelValues;
			summary.clearFieldPanelValues = this.clearFieldPanelValues;
			summary.Create(this.e_root);
			this.PushChild(summary);
		};

		if (this.records && this.records.length > 0)
		{
			for (let ii = 0; ii < this.records.length; ii++)
				addSummary(this.records[ii]);
		}
		else // spoof records
		{
			for (let ii = 0; ii < this.spoofCount; ii++)
				addSummary(this.getSpoofRecord());
		}
	}
	OnRemove()
	{
		this.e_root.remove();
	}
}