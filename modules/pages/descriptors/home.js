import { DebugLog } from "../../debuglog.js";
import { DevMode } from "../../devmode.js";
import { PageManager } from "../../pagemanager.js";
import { QuickMenu } from "../../ui/quickmenu.js";
import { UserAccountInfo, UserAccountManager } from "../../useraccount.js";
import { PageDescriptor } from "../pagebase.js";

export class PageHome extends PageDescriptor
{
	GetTitle() { return 'nav menu'; }

	OnCreateElements(instance)
	{
		if (!instance) return;

		instance.e_frame.style.minWidth = '20rem';

		instance.menu_main = new QuickMenu();

		let TryAddButton = (buttons = [], id, label) => 
		{
			if (PageManager.IsPageAvailable(id))
			{
				buttons.push(
					{
						label: (label ? label : id).toUpperCase(),
						on_click: _ =>
						{
							DebugLog.Log('nav attempt -> ' + id);
							if (_.shiftKey === true) 
							{
								let desc_id = PageManager.GetDescriptorIndex(id);
								let desc = PageManager.page_descriptors[desc_id];
								PageManager.OpenPageFromDescriptor(desc, undefined, true);
							}
							else
							{
								PageManager.TogglePageByTitle(id);
							}
						}
					}
				);
			}

		};

		let buttons = [];

		TryAddButton(buttons, 'project hub');
		TryAddButton(buttons, 'task tracker');
		TryAddButton(buttons, 'contact logs');
		TryAddButton(buttons, 'field notes');
		TryAddButton(buttons, 'time keeper');
		TryAddButton(buttons, 'directory');
		TryAddButton(buttons, 'user dashboard');
		TryAddButton(buttons, 'reports');
		TryAddButton(buttons, 'hr');
		TryAddButton(buttons, 'external links');
		TryAddButton(buttons, 'help');

		instance.menu_main.CreateElements(instance.e_content, buttons);
		instance.menu_main.e_root.style.flexGrow = buttons.length;

		let has_data_access = UserAccountInfo.HasPermission('app.events.access');
		if (has_data_access || DevMode.active === true)
		{
			let buttons_extra = [];
			TryAddButton(buttons_extra, 'database probe');
			if (DevMode.active === true) TryAddButton(buttons_extra, 'demo panel');
			instance.menu_extra = new QuickMenu();
			instance.menu_extra.CreateElements(instance.e_content, buttons_extra);
			instance.menu_extra.e_root.style.flexGrow = buttons_extra.length;
		}

		instance.e_content.style.justifyContent = 'center';
	}

	AddMenuButton(text = '', onclick = () => { }, permissions_required = [])
	{
		if (permissions_required && permissions_required.length > 0)
		{
			for (let perm_id in permissions_required)
			{
				let perm_id_granted = UserAccountInfo.user_permissions.findIndex(x => x === perm_id);
				if (perm_id_granted < 0) return;
			}
		}

		let e_btn_menu = document.createElement('div');
		e_btn_menu.className = 'menu-button';
		e_btn_menu.innerText = text ? text : '???';
		e_btn_menu.title = text;
		e_btn_menu.addEventListener('click', onclick);
		this.e_content.appendChild(e_btn_menu);
	}

	UpdateSize(instance)
	{
		instance.UpdateBodyTransform();
		this.OnLayoutChange(instance);
	}

	OnLayoutChange(instance)
	{
		if (instance.state_data.docked === true && instance.state_data.expanding === false)
			instance.e_frame.style.maxWidth = '20rem';
		else instance.e_frame.style.maxWidth = 'unset';
	}
}

PageManager.RegisterPage(new PageHome('nav menu', 'aura.access'));