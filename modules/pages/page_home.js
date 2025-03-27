import { PageManager } from "../pagemanager.js";
import { UserAccountInfo } from "../useraccount.js";
import { PageExternalContacts } from "./page_external_contacts.js";
import { PageHR } from "./page_hr.js";
import { PageInternalUsers } from "./page_internal_users.js";
import { PageMyData } from "./page_my_data.js";
import { PageProjectHub } from "./page_project_hub.js";
import { PageSettings } from "./page_settings.js";
import { PageTaskHub } from "./page_task_hub.js";
import { PageTimekeep } from "./page_timekeep.js";
import { PageBase } from "./pagebase.js";

export class PageHome extends PageBase
{
	GetTitle() { return 'nav menu' }
	CreateElements(parent)
	{
		if (!parent) return;

		this.icon = 'menu';

		this.CreateBody();

		this.e_body.style.minWidth = '300px';
		this.e_body.style.maxWidth = '500px';

		this.AddMenuButton('PROJECT HUB', () => PageManager.TogglePageByTitle('project hub'));
		this.AddMenuButton('TASK HUB', () => PageManager.TogglePageByTitle('task hub'));
		this.AddMenuButton('CONTACT LOGS', () => PageManager.TogglePageByTitle('contact logs'));
		this.AddMenuButton('INTERNAL USERS', () => PageManager.TogglePageByTitle('internal users'));
		this.AddMenuButton('EXTERNAL CONTACTS', () => PageManager.TogglePageByTitle('external contacts'));
		this.AddMenuButton('REPORTS', () => PageManager.TogglePageByTitle('reports'));
		this.AddMenuButton('TIME LOG', () => PageManager.TogglePageByTitle('timekeep'));
		this.AddMenuButton('MY DATA', () => PageManager.TogglePageByTitle('my data'));
		this.AddMenuButton('HR', () => PageManager.TogglePageByTitle('hr'));
		this.AddMenuButton('SETTINGS', () => PageManager.TogglePageByTitle('settings'));
		this.AddMenuButton('APP EVENTS', () => PageManager.TogglePageByTitle('app events'));

		this.e_content.className = 'page-content-root menu-root';
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