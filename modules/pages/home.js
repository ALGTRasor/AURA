import { DebugLog } from "../debuglog.js";
import { DevMode } from "../devmode.js";
import { PageManager } from "../pagemanager.js";
import { QuickMenu } from "../ui/quickmenu.js";
import { UserAccountInfo } from "../useraccount.js";
import { PageBase } from "./pagebase.js";

export class PageHome extends PageBase
{
	GetTitle() { return 'nav menu' }

	Resize()
	{
		this.state_data.expanding = !this.state_data.expanding;
		this.UpdateSize();
	}

	UpdateSize()
	{
		if (this.state_data.expanding === true) this.e_body.style.maxWidth = 'unset';
		else this.e_body.style.maxWidth = '20rem';
	}

	CreateElements(parent)
	{
		if (!parent) return;

		this.icon = 'menu';

		this.CreateBody();
		this.UpdateSize();
		this.title_bar.AddResizeButton();

		this.e_body.style.minWidth = '20rem';
		this.e_body.style.flexGrow = '1.0';

		//this.e_content.className = 'page-content-root menu-root';

		this.menu = new QuickMenu();

		let TryAddButton = (buttons = [], id, label) => 
		{
			if (PageManager.IsPageAvailable(id))
			{
				buttons.push({
					label: (label ? label : id).toUpperCase(),
					on_click: () =>
					{
						DebugLog.Log('nav attempt -> ' + id);
						PageManager.TogglePageByTitle(id);
					}
				});
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
		TryAddButton(buttons, 'settings');
		TryAddButton(buttons, 'external links');
		TryAddButton(buttons, 'map');

		if (DevMode.active)
		{
			TryAddButton(buttons, 'database probe');
			TryAddButton(buttons, 'demo panel');
		}

		this.menu.CreateElements(this.e_content, buttons);

		this.e_content.style.justifyContent = 'center';

		this.FinalizeBody(parent);
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
}

PageManager.RegisterPage(new PageHome('nav menu', 'aura.access'));