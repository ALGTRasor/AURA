import { HrRequest } from "../../datamodels/hr_request.js";
import { CreatePagePanel } from "../../utils/domutils.js";
import { PageManager } from "../../pagemanager.js";
import { PageDescriptor } from "../page_descriptor.js";
import { TableView } from "../../ui/tableview.js";
import { PanelContent } from "../../ui/panel_content.js";
import { AppEvents } from "../../appevents.js";
import { SlideSelector } from "../../ui/slide_selector.js";


const USERS_TABLE_COLUMNS = [
	{
		key: 'user_id', label: 'USER ID', label_long: 'USER ID',
		desc: 'The ID assigned to this user. This should be the first segment of their company email address.',
		flexBasis: '6rem', flexGrow: '0.25',
	},
	{
		key: 'display_name_full', label: 'NAME', label_long: 'DISPLAY NAME',
		desc: 'The chosen full name for this user.',
		flexBasis: '6rem', flexGrow: '0.5',
	},
	{
		key: 'role', label: 'ROLE(S)', label_long: 'ROLE(S)',
		desc: 'The role or roles assigned to this user.',
		flexBasis: '6rem', flexGrow: '0.0',
		format: 'upper',
	},
	{
		key: 'standing', label: 'STANDING', label_long: 'STANDING',
		desc: 'The company standing for this user.',
		flexBasis: '6rem', flexGrow: '0.0',
		format: 'upper',
		calc_theme_color: (record, val) =>
		{
			switch (val)
			{
				case 'pending': return '#ff0';
				case 'active': return '#0f0';
				case 'terminated': return '#f00';
			}
		},
	},
	{
		key: 'active_requests', label: 'REQUESTS', label_long: 'STANDING',
		desc: 'The company standing for this user.',
		flexBasis: '8rem', flexGrow: '0.25',
		format: 'list', value_suffix: ' requests',
		calc_theme_color: (record, val) =>
		{
			if (val.length < 1) return '#0f0';
			return '#ff0';
		},
	},
	{
		key: 'docs_status', label: 'DOCUMENTS', label_long: 'DOCUMENTS STATUS',
		desc: 'The documents status for this user.',
		flexBasis: '8rem', flexGrow: '0.0',
		format: 'upper',
		calc_theme_color: (record, val) =>
		{
			switch (val)
			{
				case 'compliant': return '#0ff';
				case 'incompliant': return '#fc0';
			}
		},
	},
];

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
		calc_theme_color: (record, val) =>
		{
			if (!val || val.length < 1) return '#ff0';
			return '#0f0';
		},
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


class HRUsersContent extends PanelContent
{
	constructor(page)
	{
		super(page.e_content);
		this.page = page;
	}

	OnCreateElements()
	{
		this.e_root = CreatePagePanel(this.e_parent, true, false, 'overflow:hidden;');

		this.table_view = new TableView(this.e_root, undefined);
		this.table_view.title = 'ALL USERS';
		this.table_view.description = 'This table shows the compliancy status of all users.';
		this.table_view.placeholder_data = true;

		this.table_view.configuration_active.columns.Reset();
		USERS_TABLE_COLUMNS.forEach(_ => this.table_view.configuration_active.columns.Register(_.key, _));
		this.table_view.configuration_active.AddAction('person', _ => { }, 'hsl(from #0fd h s var(--theme-l050))');

		const data = [
			{
				user_id: 't.rasor',
				display_name_full: 'Thomas Rasor',
				role: 'dba',
				standing: 'active',
				active_requests: [{}, {}, {}],
				docs_status: 'compliant',
			},
			{
				user_id: 't.wink',
				display_name_full: 'Todd Wink',
				role: 'hr',
				standing: 'active',
				active_requests: [],
				docs_status: 'incompliant',
			},
		];
		this.table_view.data.SetRecords(data, false);
	}

	OnRefreshElements()
	{
	}

	OnRemoveElements() { this.e_root.remove(); }
}

class HRRequestsContent extends PanelContent
{
	constructor(page)
	{
		super(page.e_content);
		this.page = page;
	}

	OnCreateElements()
	{
		this.e_root = CreatePagePanel(this.e_parent, true, false, 'overflow:hidden;');

		this.table_view = new TableView(this.e_root, undefined);
		this.table_view.title = 'HR REQUESTS';
		this.table_view.description = 'This table shows the history of HR Requests.';
		this.table_view.placeholder_data = true;

		this.table_view.configuration_active.columns.Reset();
		REQS_TABLE_COLUMNS.forEach(_ => this.table_view.configuration_active.columns.Register(_.key, _));
		this.table_view.configuration_active.AddAction('upload', _ => { }, 'hsl(from #0fd h s var(--theme-l050))');

		const data_reqs = [
			{
				created: '2025-05-21',
				date_uploaded: '2025-05-24',
				requester_id: 't.wink',
				requestee_id: 't.rasor',
				type_id: 'trec',
				status: 'required',
			},
			{
				created: '2025-05-21',
				date_uploaded: '2025-05-24',
				requester_id: 't.wink',
				requestee_id: 't.rasor',
				type_id: 'notary',
				status: 'required',
			},
			{
				created: '2025-05-21',
				date_uploaded: '2025-05-24',
				requester_id: 't.wink',
				requestee_id: 't.rasor',
				type_id: 'eo ins',
				status: 'required',
			},
			{
				created: '2025-05-21',
				date_uploaded: '2025-05-24',
				requester_id: 't.wink',
				requestee_id: 't.rasor',
				type_id: 'gl ins',
				status: 'required',
			},
			{
				created: '2025-05-21',
				date_uploaded: '2025-05-24',
				requester_id: 't.wink',
				requestee_id: 't.rasor',
				type_id: 'msa',
				status: 'required',
			}
		];
		this.table_view.data.SetRecords(data_reqs, false);
	}

	OnRefreshElements()
	{
	}

	OnRemoveElements() { this.e_root.remove(); }
}

class HRContent extends PanelContent
{
	constructor(page)
	{
		super(page.e_content);
		this.page = page;
	}
}


export class PageHR extends PageDescriptor
{
	title = 'hr';
	icon = 'demography';
	order_index = -9999;
	extra_page = true;
	coming_soon = true;

	OnCreateElements(instance)
	{
		instance.e_content.style.gap = 'var(--gap-025)';

		instance.content = new HRContent(this);
		instance.content.CreateElements();

		const modes = [
			{ label: 'USERS', on_click: _ => { } },
			{ label: 'DOCUMENTS', on_click: _ => { } },
		];
		instance.mode_slider = new SlideSelector();
		instance.mode_slider.CreateElements(instance.e_content, modes);

		instance.content_users = new HRUsersContent(instance);
		instance.content_users.CreateElements();

		instance.content_reqs = new HRRequestsContent(instance);
		instance.content_reqs.CreateElements();

		instance.refresh = () =>
		{
			instance.content_users.RefreshElements();
			instance.content_reqs.RefreshElements();
		}

		instance.mode_slider.Subscribe(instance.refresh);
		instance.mode_slider.SelectIndexAfterDelay(instance.state.data.view_mode ?? 0, 150, true);
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
		if (instance.state.data.docked === true && instance.state.data.expanding === false) instance.SetMaxFrameWidth('32rem');
		else instance.ClearMaxFrameWidth();
	}
}

PageManager.RegisterPage(new PageHR('hr', 'hr.access', undefined, 'View and manage HR related activities.'), 'h', 'HR');