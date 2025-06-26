import { addElement, CreatePagePanel } from "../../utils/domutils.js";
import { RunningTimeout } from "../../utils/running_timeout.js";
import { SlideSelector } from "../../ui/slide_selector.js";
import { PanelContent } from "../../ui/panel_content.js";
import { PageManager } from "../../pagemanager.js";
import { PageDescriptor } from "../pagebase.js";
import { ProjectData } from "../../datamodels/project_data.js";
import { MegaTips } from "../../systems/megatips.js";

const MAIL_MODES = [
	{ label: 'INBOX', on_click: _ => { }, tooltip: 'View Inbox' },
	{ label: 'DRAFTS', on_click: _ => { }, tooltip: 'View Drafts' },
	{ label: 'OUTBOX', on_click: _ => { }, tooltip: 'View Outbox' },
	{ label: 'SENT', on_click: _ => { }, tooltip: 'View Sent' },
];


class MailPageContent extends PanelContent
{
	constructor(e_parent, page)
	{
		super(e_parent);
		this.page = page;

		this.content_timeout = new RunningTimeout(() => { this.RefreshElements(); }, 0.25, false, 70);
		this.refresh_soon = () => { this.content_timeout.ExtendTimer(); };
	}

	OnCreateElements(data)
	{
		this.e_root = addElement(
			this.e_parent, 'div', undefined,
			'position:absolute; inset:0; display:flex; flex-direction:column; flex-wrap:nowrap;'
			+ 'gap:var(--gap-025); padding:var(--gap-05);'
		);

		this.slide_mode = new SlideSelector();
		this.slide_mode.CreateElements(this.e_root, MAIL_MODES);
		this.e_mail_items = CreatePagePanel(
			this.e_root, true, false,
			'flex-grow:1.0; display:flex; flex-direction:column; justify-content:flex-start;'
			+ 'overflow-x:visible; overflow-y:auto;'
		);

		this.slide_mode.Subscribe(() => { this.OnModeChange(); });
		this.slide_mode.SelectIndexAfterDelay(this.page.state.data.view_mode ?? 0, 150, true);
	}
	OnRemoveElements(data) { this.e_root.remove(); }
	OnRefreshElements(data)
	{
		this.TransitionElements(
			() => { this.e_mail_items.style.pointerEvents = 'none'; },
			() =>
			{
				this.e_mail_items.innerHTML = '';
				const get_messages = async () =>
				{
					const folderNames = ['inbox', 'drafts', 'outbox', 'sentitems'];
					let folderName = folderNames[this.slide_mode.selected_index];
					let messages = [];
					let resp = await window.SharePoint.GetData(window.SharePoint.url_api + '/me/mailFolders/' + folderName + '/messages?$count=true');
					if ('value' in resp) messages = resp.value;
					else messages = resp;
					messages.forEach(
						msg =>
						{
							let e_item = CreatePagePanel(
								this.e_mail_items, false, false,
								'flex-basis:fit-content; flex-shrink:0.0; display:flex; flex-direction:row; flex-wrap:nowrap;'
								+ 'gap:var(--gap-025); padding:var(--gap-05);'
							);

							let e_item_info = addElement(
								e_item, 'div', '',
								'flex-grow:1.0; display:flex; flex-direction:column; gap:var(--gap-025); padding:var(--gap-05);'
							);

							if (msg.isRead !== true) e_item.style.setProperty('--theme-color', 'orange');

							addElement(
								e_item_info, 'div', '',
								'flex-grow:0.0;flex-shrink:0.0; font-size:80%;',
								_ => { _.innerText = msg.receivedDateTime; }
							);

							addElement(
								e_item_info, 'div', '',
								'flex-grow:0.0;flex-shrink:0.0; font-size:80%;',
								_ => { _.innerText = msg.sender.emailAddress.name; }
							);
							addElement(e_item_info, 'div', '', 'flex-grow:1.0;', _ => { _.innerText = msg.subject; });

							if (msg.hasAttachments === true)
							{
								let e_btn_attachments = CreatePagePanel(
									e_item, true, false,
									'flex-grow:0.0;flex-shrink:0.0;height:1.5rem;width:1.5rem;align-self:center;'
								);
								addElement(e_btn_attachments, 'i', 'material-symbols icon-button', '', _ => { _.innerText = 'attach_file' });
							}

							MegaTips.RegisterSimple(e_item, msg.bodyPreview);
						}
					);
				};
				get_messages();
			},
			() => { this.e_mail_items.style.pointerEvents = 'all'; },
			{
				fade_target: () => this.e_projects,
				fade_duration: 0.125,
				skip_fade_out: false,
				skip_fade_in: false
			}
		);
	}

	OnModeChange()
	{
		this.page.state.SetValue('view_mode', this.slide_mode.selected_index);
		this.RefreshElements();
	}
}

export class PageMail extends PageDescriptor
{
	title = 'mail';
	order_index = -2;
	hidden_page = true;

	OnCreateElements(instance)
	{
		instance.e_frame.style.minWidth = 'min(100% - 3 * var(--gap-1), 32rem)';
		instance.e_content.style.display = 'flex';
		instance.e_content.style.gap = 'var(--gap-025)';

		instance.content = new MailPageContent(instance.e_content, instance);
		instance.content.CreateElements();
	}

	OnRemoveElements(instance)
	{
		instance.content.RemoveElements();
	}

	UpdateSize(instance)
	{
		instance.UpdateBodyTransform();
		this.OnLayoutChange(instance);
	}

	OnLayoutChange(instance)
	{
		let use_fixed_width = instance.state.data.docked === true && instance.state.data.expanding === false;
		if (use_fixed_width === true) instance.SetMaxFrameWidth('24rem');
		else instance.ClearMaxFrameWidth();
	}
}

PageManager.RegisterPage(new PageMail('mail', undefined, undefined, 'View and manage your mail.'), '2', 'Mail');