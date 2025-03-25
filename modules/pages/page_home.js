import { PageManager } from "../pagemanager.js";
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

		this.AddMenuButton('PROJECT HUB', () => { this.OpenPage(new PageProjectHub()); });
		this.AddMenuButton('TASK HUB', () => { this.OpenPage(new PageTaskHub()); });
		this.AddMenuButton('CONTACT LOGS', () => { this.OpenPage(new PageMyData()); });
		this.AddMenuButton('INTERNAL USERS', () => { this.OpenPage(new PageInternalUsers()); });
		this.AddMenuButton('EXTERNAL CONTACTS', () => { this.OpenPage(new PageExternalContacts()); });
		this.AddMenuButton('REPORTS', () => { this.OpenPage(new PageMyData()); });
		this.AddMenuButton('TIME LOG', () => { this.OpenPage(new PageTimekeep()); });
		this.AddMenuButton('MY DATA', () => { this.OpenPage(new PageMyData()); });
		this.AddMenuButton('HR', () => { this.OpenPage(new PageHR()); });
		this.AddMenuButton('SETTINGS', () => { this.OpenPage(new PageSettings()); });
		this.AddMenuButton('APP EVENTS', () => { this.OpenPage(new PageMyData()); });

		this.e_content.className = 'page-content-root menu-root';
		this.e_content.style.justifyContent = 'center';

		this.FinalizeBody(parent);
	}

	AddMenuButton(text = '', onclick = () => { })
	{
		let e_btn_menu = document.createElement('div');
		e_btn_menu.className = 'menu-button';
		e_btn_menu.innerText = text ? text : '???';
		e_btn_menu.title = text;
		e_btn_menu.addEventListener('click', onclick);
		this.e_content.appendChild(e_btn_menu);
	}

	OpenPage(page)
	{
		let willOpen = PageManager.OpenPageDirectly(page);
		//if (willOpen && PageManager.currentPages && PageManager.currentPages.length > 6) this.Close(true);
	}
}

PageManager.RegisterPage(new PageHome());