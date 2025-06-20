import { addElement, CreatePagePanel } from "../../utils/domutils.js";
import { PageManager } from "../../pagemanager.js";
import { PageDescriptor } from "../pagebase.js";
import { RecordViewer } from "../../ui/recordviewer.js";
import { RecordFormUtils } from "../../ui/recordform.js";
import { AppEvents } from "../../appevents.js";

export class DatabaseProbe extends PageDescriptor
{
	extra_page = true;
	debug_page = true;
	order_index = 9999;

	title = 'database probe';
	icon = 'database';

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
		for (var sdi in window.SharedData.all_tables)
		{
			let sd = window.SharedData.all_tables[sdi];
			CreatePagePanel(
				instance.e_table_buttons, false, false, 'padding:0.5rem;text-align:center;align-content:center;',
				x =>
				{
					x.classList.add('panel-button');
					x.innerHTML = sd.key;
					if (sd.instance.data && sd.instance.data.length) x.innerHTML += ` (${sd.instance.data.length})`;

					const view_this_table = _ =>
					{
						for (let cid in instance.e_table_buttons.children)
						{
							let c = instance.e_table_buttons.children[cid];
							if (c.classList) c.classList.remove('panel-button-selected');
						}
						x.classList.add('panel-button-selected');
						this.SetTableData(
							instance,
							sd.instance,
							sd.instance.descriptor.list_title,
							sd.instance.data,
							sd.instance.descriptor.data_model.field_descs,
							x => x[sd.instance.descriptor.label_field],
							x => x[sd.instance.descriptor.sorting_field]
						);
					};
					x.addEventListener('click', view_this_table);
				}
			);
		}
	}

	SetTableData(instance, datasource_instance, title = '', data = [], field_descs = {}, getLabel = x => x.Title, getSortingField = x => x.Title)
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

		instance.e_table_view.appendElement(
			'div',
			_ =>
			{
				_.innerHTML = 'REFRESH NOW';
				_.classList.add('page-panel');
				_.classList.add('panel-button');
				_.style.width = 'fit-content';
				_.style.padding = 'var(--gap-1)';
				_.style.alignSelf = 'center';
				_.addEventListener(
					'click',
					e =>
					{
						datasource_instance.TryLoad(true);
					}
				);
			},
			_ => { }
		);
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

			RecordFormUtils.CreateRecordInfoList(e_info_body, record, field_descs, 'info', true);
		}
	}

	OnLayoutChange(instance)
	{
		instance.viewer.RefreshElementVisibility();
	}

	OnOpen(instance)
	{
		instance.refresh = _ => { this.RefeshTablesData(instance); };
		AppEvents.AddListener('shared-data-changed', instance.refresh);
	}

	OnClose(instance)
	{
		AppEvents.RemoveListener('shared-data-changed', instance.refresh);
	}

	RefeshTablesData(instance)
	{
		instance.viewer.RemoveElements();
		instance.e_table_view.innerHTML = '';
		this.CreateTableButtons(instance);
	}
}

PageManager.RegisterPage(new DatabaseProbe('database probe', 'app.events.access'));