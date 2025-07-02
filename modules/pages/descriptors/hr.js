import { HrRequest } from "../../datamodels/hr_request.js";
import { SharedData } from "../../remotedata/datashared.js";
import { addElement, CreatePagePanel } from "../../utils/domutils.js";
import { PageManager } from "../../pagemanager.js";
import { RecordFormUtils } from "../../ui/recordform.js";
import { RecordViewer } from "../../ui/recordviewer.js";
import { PageDescriptor } from "../page_descriptor.js";
import { TableView } from "../../ui/tableview.js";
import { PanelContent } from "../../ui/panel_content.js";
import { AppEvents } from "../../appevents.js";



const REQS_TABLE_COLUMNS = [
	{
		key: 'created', label: 'REQUESTED', label_long: 'DATE REQUESTED',
		desc: 'The date this document was first requested.',
		flexBasis: '6rem', flexGrow: '0.0', format: 'date',
	},
	{
		key: 'date_uploaded', label: 'UPLOADED', label_long: 'LAST UPLOAD DATE',
		desc: 'The latest date that a version of this document was uploaded.',
		flexBasis: '6rem', flexGrow: '0.0',
	},
	{
		key: 'type_id', label: 'TYPE', label_long: 'DOCUMENT TYPE',
		desc: 'The type of file this is.',
		flexBasis: '6rem', flexGrow: '1.0',
		format: 'uppercase',
	},
	{
		key: 'requestee_id', label: 'FROM', label_long: 'REQUESTEE USER ID',
		desc: 'The user this request is associated with.',
		flexBasis: '6rem', flexGrow: '0.5',
	},
	{
		key: 'requester_id', label: 'TO', label_long: 'REQUESTER USER ID',
		desc: 'The user that created this request.',
		flexBasis: '6rem', flexGrow: '0.5',
	},
	{
		key: 'date_start', label: 'START', label_long: 'EFFECTIVE START DATE',
		desc: 'The initial date that this document becomes effective.',
		flexBasis: '6rem', flexGrow: '0.0',
		format: 'date',
	},
	{
		key: 'date_end', label: 'END', label_long: 'EFFECTIVE END DATE',
		desc: 'The final date that this document is effective.',
		flexBasis: '6rem', flexGrow: '0.0',
		format: 'date',
	},
	{
		key: 'status', label: 'STATUS', label_long: 'DOCUMENT STATUS',
		desc: 'The status of this document.',
		flexBasis: '6rem', flexGrow: '0.0',
		format: 'uppercase',
		calc_theme_color: (record, val) =>
		{
			switch (val)
			{
				case 'required': return '#fc0';
				case 'pending': return '#0ff';
				case 'approved': return '#0f0';
				case 'expired': return '#f00';
			}
		},
	},
];


class HRRequestsContent extends PanelContent
{
	constructor(page)
	{
		super(page.e_content);
		this.page = page;
	}

	OnCreateElements()
	{
		this.e_root = CreatePagePanel(this.e_parent, true, false);

		this.table_view = new TableView(this.e_root, undefined);
		this.table_view.title = 'HR REQUESTS';
		this.table_view.description = 'This table shows the history of active or completed HR Requests.';
		this.table_view.placeholder_data = true;

		this.table_view.configuration_active.columns.Reset();
		REQS_TABLE_COLUMNS.forEach(_ => this.table_view.configuration_active.columns.Register(_.key, _));
		this.table_view.configuration_active.AddAction('upload', _ => { }, 'hsl(from #0fd h s var(--theme-l050))');

		const data = [
			{
				created: '2025-05-21',
				requester_id: 't.wink',
				requestee_id: 't.rasor',
				type_id: 'trec',
				status: 'required',
			},
			{
				created: '2025-05-21',
				requester_id: 't.wink',
				requestee_id: 't.rasor',
				type_id: 'notary',
				status: 'required',
			},
			{
				created: '2025-05-21',
				requester_id: 't.wink',
				requestee_id: 't.rasor',
				type_id: 'eo ins',
				status: 'required',
			},
			{
				created: '2025-05-21',
				requester_id: 't.wink',
				requestee_id: 't.rasor',
				type_id: 'gl ins',
				status: 'required',
			},
			{
				created: '2025-05-21',
				requester_id: 't.wink',
				requestee_id: 't.rasor',
				type_id: 'msa',
				status: 'required',
			}
		];
		this.table_view.data.SetRecords(data, false);
	}

	OnRefreshElements()
	{
	}

	OnRemoveElements() { this.e_root.remove(); }
}

export class PageHR extends PageDescriptor
{
	extra_page = true;
	order_index = -9999;
	coming_soon = true;

	GetTitle() { return 'hr'; }
	OnCreateElements(instance)
	{
		if (!instance) return;
		instance.e_frame.style.minWidth = 'min(100% - 3 * var(--gap-1), 32rem)';
		instance.content = new HRRequestsContent(instance);
		instance.content.CreateElements();
		instance.refresh = instance.content.RefreshElements();
	}

	OnOpen(instance)
	{
		AppEvents.RemoveListener('shared-data-changed', instance.refresh);
	}

	OnClose(instance)
	{
		AppEvents.RemoveListener('shared-data-changed', instance.refresh);
	}

	UpdateSize(instance)
	{
		instance.UpdateBodyTransform();
		this.OnLayoutChange(instance);
	}

	OnLayoutChange(instance)
	{
		if (instance.state.data.docked === true && instance.state.data.expanding === false) instance.e_frame.style.maxWidth = '36rem';
		else instance.e_frame.style.maxWidth = 'unset';
	}
}

PageManager.RegisterPage(new PageHR('hr', 'hr.access', undefined, 'View and manage HR related activities.'), 'h', 'HR');