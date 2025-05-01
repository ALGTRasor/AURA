import { DebugLog } from "../../debuglog.js";
import { DevMode } from "../../devmode.js";
import { PageManager } from "../../pagemanager.js";
import { QuickMenu } from "../../ui/quickmenu.js";
import { UserAccountInfo } from "../../useraccount.js";
import { PageDescriptor } from "../pagebase.js";

export class PageHome extends PageDescriptor
{
	GetTitle() { return 'nav menu'; }

	OnCreateElements(instance)
	{
		if (!instance) return;

		instance.e_frame.style.minWidth = '20rem';
		instance.e_frame.style.flexGrow = '1.0';

		//this.e_content.className = 'page-content-root menu-root';

		instance.menu = new QuickMenu();

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
		TryAddButton(buttons, 'task hub');
		TryAddButton(buttons, 'contact logs');
		TryAddButton(buttons, 'internal users');
		TryAddButton(buttons, 'external contacts');
		TryAddButton(buttons, 'reports');
		TryAddButton(buttons, 'timekeep');
		TryAddButton(buttons, 'my data');
		TryAddButton(buttons, 'hr');
		//TryAddButton(buttons, 'settings');
		TryAddButton(buttons, 'external links');
		TryAddButton(buttons, 'map');

		if (DevMode.active)
		{
			TryAddButton(buttons, 'database probe');
			TryAddButton(buttons, 'demo panel');
		}

		instance.menu.CreateElements(instance.e_content, buttons);

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
		if (instance.state_data.expanding === true) instance.e_frame.style.maxWidth = 'unset';
		else instance.e_frame.style.maxWidth = '20rem';
		instance.UpdateBodyTransform();
	}
}

PageManager.RegisterPage(new PageHome('nav menu', 'aura.access'));