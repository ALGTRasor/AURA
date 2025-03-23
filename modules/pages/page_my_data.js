import { PageManager } from "../pagemanager.js";
import { UserAccountInfo } from "../useraccount.js";
import { PageBase } from "./pagebase.js";

export class PageMyData extends PageBase
{
	GetTitle() { return 'my data'; }
	CreateElements(parent)
	{
		if (!parent) return;
		this.CreateBody();

		let e_user_info = document.createElement('div');
		e_user_info.className = 'page-content-root-block';
		let div_title = `<div style='text-align:center;opacity:60%;'>Account Info</div>`;
		let div_id = `<div>${UserAccountInfo.user_info.user_id}</div>`;
		let div_name = `<div>${UserAccountInfo.user_info.display_name}</div>`;
		let div_mail = `<div>${UserAccountInfo.user_info.email}</div>`;
		e_user_info.innerHTML = div_title + div_name + div_id + div_mail;

		this.e_content.appendChild(e_user_info);

		this.FinalizeBody(parent);
	}
}

PageManager.RegisterPage(new PageMyData());