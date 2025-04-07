import { addElement } from "./domutils.js";
import { Modules } from "./modules.js";
import { UserAccountInfo, UserAccountManager, UserAccountProvider } from "./useraccount.js";

export class ActionBar
{
	initialized = false;
	e_button_root = {};
	e_button_login = {};

	static Initialize()
	{
		ActionBar.e_button_root = document.getElementById('action-bar-button-container');
		ActionBar.initialized = true;
	}

	static AddMenuButton(label = '', icon = '', on_click = _ => { }, post_prep = _ => { })
	{
		if (ActionBar.initialized !== true) ActionBar.Initialize();

		let e = addElement(
			ActionBar.e_button_root, 'div', 'action-bar-button', null,
			_ =>
			{
				_.innerHTML = label.toUpperCase();//`<span id='action-bar-btn-login-label'>${label}</span>`;
				if (icon && icon.length && icon.length > 0) _.innerHTML += `<i class='material-icons icon'>${icon}</i>`;
				_.title = label.toUpperCase();

				if (on_click) _.addEventListener('click', on_click);
				if (post_prep) post_prep(_);
			}
		);

		ActionBar.e_button_root.insertBefore(e, ActionBar.e_button_root.firstChild);

		return e;
	}

	static UpdateAccountButton()
	{
		if (ActionBar.e_button_login && ActionBar.e_button_login.remove) ActionBar.e_button_login.remove();
		if (UserAccountManager.account_provider.logged_in) ActionBar.e_button_login = ActionBar.AddMenuButton('Log Out', 'logout', _ => fxn.ForceLogOut(), _ => _.id = 'action-bar-btn-logout');
		else ActionBar.e_button_login = ActionBar.AddMenuButton('Log In', 'login', _ => fxn.AttemptLogin(), _ => _.id = 'action-bar-btn-login');
	}
}

Modules.Report('Action Bar', 'This module provides the action bar interface at the top of the screen and its general functionality.')
ActionBar.Initialize();