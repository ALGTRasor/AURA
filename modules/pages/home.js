import { DebugLog } from "../debuglog.js";
import { DevMode } from "../devmode.js";
import { PageManager } from "../pagemanager.js";
import { QuickMenu } from "../ui/quickmenu.js";
import { UserAccountInfo } from "../useraccount.js";
import { PageBase } from "./pagebase.js";

export class PageHome extends PageBase
{
	GetTitle() { return 'nav menu' }
	CreateElements(parent)
	{
		if (!parent) return;

		this.icon = 'menu';

		this.CreateBody();

		this.e_body.style.minWidth = '24rem';
		this.e_body.style.maxWidth = '400px';
		this.e_body.style.flexGrow = '1.0';

		//this.e_content.className = 'page-content-root menu-root';

		this.menu = new QuickMenu();

		let ButtonOptions = (id, label) => 
		{
			return {
				label: (label ? label : id).toUpperCase(),
				on_click: () =>
				{
					DebugLog.Log('nav attempt -> ' + id);
					PageManager.TogglePageByTitle(id);
				}
			}
		};

		let buttons = [];
		if (DevMode.active || UserAccountInfo.HasPermission('projects.view')) buttons.push(ButtonOptions('project hub'));
		if (DevMode.active || UserAccountInfo.HasPermission('tasks.view')) buttons.push(ButtonOptions('task hub'));
		if (DevMode.active || UserAccountInfo.HasPermission('contact.logs.view')) buttons.push(ButtonOptions('contact logs'));
		if (DevMode.active || UserAccountInfo.HasPermission('users.view')) buttons.push(ButtonOptions('internal users'));
		if (DevMode.active || UserAccountInfo.HasPermission('contacts.view')) buttons.push(ButtonOptions('external contacts'));
		if (DevMode.active || UserAccountInfo.HasPermission('reports.access')) buttons.push(ButtonOptions('reports'));
		if (DevMode.active || UserAccountInfo.HasPermission('time.keep')) buttons.push(ButtonOptions('timekeep'));
		buttons.push(ButtonOptions('my data'));
		if (DevMode.active || UserAccountInfo.HasPermission('hr.access')) buttons.push(ButtonOptions('hr'));
		buttons.push(ButtonOptions('settings'));
		buttons.push(ButtonOptions('external links'));
		if (DevMode.active)
		{
			buttons.push(ButtonOptions('database probe'));
			buttons.push(ButtonOptions('demo panel'));
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

PageManager.RegisterPage(new PageHome('nav menu'));