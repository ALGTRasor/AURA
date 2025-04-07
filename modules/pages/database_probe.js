import { SharedData } from "../datashared.js";
import { addElement, CreatePagePanel } from "../domutils.js";
import { PageManager } from "../pagemanager.js";
import { PageBase } from "./pagebase.js";
import { RecordViewer } from "../ui/recordviewer.js";
import { RecordFormUtils } from "../ui/recordform.js";

export class DatabaseProbe extends PageBase
{
	GetTitle() { return 'database probe'; }

	CreateElements(parent)
	{
		if (!parent) return;

		this.viewer = new RecordViewer();

		this.CreateBody();

		this.e_content.style.display = 'flex';
		this.e_content.style.flexDirection = 'column';
		this.e_content.style.flexWrap = 'nowrap';
		this.e_content.style.alignContent = 'flex-start';
		this.e_content.style.setProperty('--theme-color', 'white');
		this.e_table_buttons = CreatePagePanel(this.e_content, true, true, 'flex-grow:0.0;flex-shrink:0.0;flex-basis:fit-content;', x => { });
		for (var sdi in SharedData.all_tables)
		{
			let sd = SharedData.all_tables[sdi];
			CreatePagePanel(
				this.e_table_buttons, false, false, 'padding:0.5rem;text-align:center;align-content:center;',
				x =>
				{
					x.className += ' panel-button';
					x.innerHTML = sd.key;
					if (sd.data && sd.data.length) x.innerHTML += ` (${sd.data.length})`;
					x.addEventListener('click', _ => this.SetTableData(sd.source.list_title, sd.data, sd.source.data_model.field_descs, x => x[sd.source.label_field], x => x[sd.source.sorting_field]));
				}
			);
		}
		this.e_table_view = CreatePagePanel(this.e_content, true, true, 'flex-grow:1.0;flex-shrink:1.0;flex-direction:column;flex-wrap:nowrap;', x => { });

		this.FinalizeBody(parent);
	}

	SetTableData(title = '', data = [], field_descs = {}, getLabel = x => x.Title, getSortingField = x => x.Title)
	{
		this.e_table_view.innerHTML = '';

		CreatePagePanel(this.e_table_view, false, false, 'pointer-events:none;flex-grow:0.0;flex-shrink:0.0;flex-basis:fit-content;text-align:center;align-content:center;padding:0.5rem;margin:0.25rem;', x => { x.innerText = title; });

		this.viewer.RemoveElements();
		this.viewer.SetData(data);

		this.viewer.SetListItemBuilder((table, x, e) => { addElement(e, 'span', '', '', c => { c.innerText = getLabel(table[x]) }); });

		const sort = (x, y) =>
		{
			let xsf = getSortingField(x);
			let ysf = getSortingField(y);
			if (xsf < ysf) return -1;
			if (xsf > ysf) return 1;
			return 0;
		};
		this.viewer.SetListItemSorter(sort);
		this.viewer.SetViewBuilder(records => this.BuildRecordView(records, field_descs, getLabel));
		this.viewer.CreateElements(this.e_table_view);
	}

	BuildRecordView(records, field_descs = {}, getLabel = x => x.Title)
	{
		if (!records || records.length < 1) return;

		for (let id in records)
		{
			let record = records[id];

			let e_info_root = CreatePagePanel(this.viewer.e_view_root, false, false, 'min-width:28rem;', e => { });
			addElement(e_info_root, 'div', '', 'text-align:center;', x => { x.innerText = getLabel(record); });
			let e_info_body = CreatePagePanel(e_info_root, true, false, '', x => { });

			RecordFormUtils.CreateRecordInfoList(e_info_body, record, field_descs, 'info', records.length < 2);
		}
	}

	OnLayoutChange()
	{
		this.viewer.RefreshElementVisibility();
	}
}

PageManager.RegisterPage(new DatabaseProbe('database probe'));