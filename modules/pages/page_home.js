import { PageManager } from "../pagemanager.js";
import { PageMyData } from "./page_my_data.js";
import { PageBase } from "./pagebase.js";

export class PageHome extends PageBase
{
	GetTitle() { return 'home' }
	CreateElements(parent)
	{
		if (!parent) return;
		this.CreateBody();
		this.e_body.style.width = '500px';
		this.e_body.style.flexShrink = 0.0;
		this.e_body.style.flexGrow = 0.0;

		this.AddMenuButton('PROJECT HUB', () => { PageManager.OpenPageDirectly(new PageMyData()); });
		this.AddMenuButton('TASK HUB', () => { PageManager.OpenPageDirectly(new PageMyData()); });
		this.AddMenuButton('CONTACT LOGS', () => { PageManager.OpenPageDirectly(new PageMyData()); });
		this.AddMenuButton('INTERNAL USERS', () => { PageManager.OpenPageDirectly(new PageMyData()); });
		this.AddMenuButton('EXTERNAL CONTACTS', () => { PageManager.OpenPageDirectly(new PageMyData()); });
		this.AddMenuButton('REPORTS', () => { PageManager.OpenPageDirectly(new PageMyData()); });
		this.AddMenuButton('TIME LOG', () => { PageManager.OpenPageDirectly(new PageMyData()); });
		this.AddMenuButton('MY DATA', () => { PageManager.OpenPageDirectly(new PageMyData()); });
		this.AddMenuButton('HR', () => { PageManager.OpenPageDirectly(new PageMyData()); });
		this.AddMenuButton('APP EVENTS', () => { PageManager.OpenPageDirectly(new PageMyData()); });

		this.e_content.style.justifyContent = 'center';

		this.FinalizeBody(parent);
	}

	AddMenuButton(text = '', onclick = () => { })
	{
		let e_btn_menu = document.createElement('div');
		e_btn_menu.className = 'aura-button';
		e_btn_menu.innerText = text ? text : '???';
		e_btn_menu.title = text;
		e_btn_menu.addEventListener('click', onclick);
		this.e_content.appendChild(e_btn_menu);
	}
}

PageManager.RegisterPage(new PageHome());