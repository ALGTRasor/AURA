import { SharedData } from "../../datashared.js";
import { addElement, CreatePagePanel } from "../../domutils.js";
import { PageManager } from "../../pagemanager.js";
import { PageDescriptor } from "../pagebase.js";
import { RecordViewer } from "../../ui/recordviewer.js";
import { RecordFormUtils } from "../../ui/recordform.js";

export class DatabaseProbe extends PageDescriptor
{
	GetTitle() { return 'database probe'; }

	OnCreateElements(instance)
	{
		if (!instance) return;

		instance.viewer = new RecordViewer();
		instance.e_content.style.display = 'flex';
		instance.e_content.style.flexDirection = 'column';
		instance.e_content.style.flexWrap = 'nowrap';
		instance.e_content.style.alignContent = 'flex-start';
		instance.e_content.style.setProperty('--theme-color', 'white');
		instance.e_table_buttons = CreatePagePanel(instance.e_content, true, true, 'flex-grow:0.0;flex-shrink:0.0;flex-basis:fit-content;', x => { });
		this.CreateTableButtons(instance);
		instance.e_table_view = CreatePagePanel(instance.e_content, true, true, 'flex-grow:1.0;flex-shrink:1.0;flex-direction:column;flex-wrap:nowrap;', x => { });
	}

	CreateTableButtons(instance)
	{
		instance.e_table_buttons.innerHTML = '';
		for (var sdi in SharedData.all_tables)
		{
			let sd = SharedData.all_tables[sdi];
			CreatePagePanel(
				instance.e_table_buttons, false, false, 'padding:0.5rem;text-align:center;align-content:center;',
				x =>
				{
					x.className += ' panel-button';
					x.innerHTML = sd.key;
					if (sd.data && sd.data.length) x.innerHTML += ` (${sd.data.length})`;

					const view_this_table = _ => { this.SetTableData(instance, sd.source.list_title, sd.data, sd.source.data_model.field_descs, x => x[sd.source.label_field], x => x[sd.source.sorting_field]); };
					x.addEventListener('click', view_this_table);
				}
			);
		}
	}

	SetTableData(instance, title = '', data = [], field_descs = {}, getLabel = x => x.Title, getSortingField = x => x.Title)
	{
		instance.e_table_view.innerHTML = '';

		CreatePagePanel(instance.e_table_view, false, false, 'pointer-events:none;flex-grow:0.0;flex-shrink:0.0;flex-basis:fit-content;text-align:center;align-content:center;padding:0.5rem;', x => { x.innerText = title; });

		instance.viewer.RemoveElements();
		instance.viewer.SetData(data);

		instance.viewer.SetListItemBuilder((table, x, e) => { addElement(e, 'span', '', '', c => { c.innerText = getLabel(table[x]) }); });

		const sort = (x, y) =>
		{
			let xsf = getSortingField(x);
			let ysf = getSortingField(y);
			if (xsf < ysf) return -1;
			if (xsf > ysf) return 1;
			return 0;
		};
		instance.viewer.SetListItemSorter(sort);
		instance.viewer.SetViewBuilder(records => this.BuildRecordView(instance, records, field_descs, getLabel));
		instance.viewer.CreateElements(instance.e_table_view);
	}

	BuildRecordView(instance, records, field_descs = {}, getLabel = x => x.Title)
	{
		if (!records || records.length < 1) return;

		for (let id in records)
		{
			let record = records[id];

			let e_info_root = CreatePagePanel(instance.viewer.e_view_root, false, false, 'min-width:28rem;', e => { });
			addElement(e_info_root, 'div', '', 'text-align:center;', x => { x.innerText = getLabel(record); });
			let e_info_body = CreatePagePanel(e_info_root, true, false, '', x => { });

			RecordFormUtils.CreateRecordInfoList(e_info_body, record, field_descs, 'info', records.length < 2);
		}
	}

	OnLayoutChange(instance)
	{
		instance.viewer.RefreshElementVisibility();
	}

	OnOpen(instance)
	{
		instance.sub_sharedDataCached = SharedData.onSavedToCache.RequestSubscription(_ => { this.RefeshTablesData(instance); });
	}

	OnClose(instance)
	{
		SharedData.onSavedToCache.RemoveSubscription(instance.sub_sharedDataCached);
	}

	RefeshTablesData(instance)
	{
		instance.viewer.RemoveElements();
		instance.e_table_view.innerHTML = '';
		this.CreateTableButtons(instance);
	}
}

PageManager.RegisterPage(new DatabaseProbe('database probe', 'aura.access'));