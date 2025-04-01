import { DebugLog } from "../debuglog.js";
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
		//this.e_body.style.maxWidth = '400px';
		this.e_body.style.flexGrow = '0.25';

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

		let buttons = [
			ButtonOptions('project hub'),
			ButtonOptions('task hub'),
			ButtonOptions('contact logs'),
			ButtonOptions('internal users'),
			ButtonOptions('external contacts'),
			ButtonOptions('reports'),
			ButtonOptions('timekeep'),
			ButtonOptions('my data'),
			ButtonOptions('hr'),
			ButtonOptions('settings'),
			ButtonOptions('external links'),
			ButtonOptions('database probe'),
			ButtonOptions('demo panel'),
		];
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