import { AppInfo } from "./app_info.js";
import { addElement } from "./utils/domutils.js";
import { Modules } from "./modules.js";
import { OverlayManager } from "./ui/overlays.js";
import { UserAccountManager } from "./useraccount.js";

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
				_.innerHTML = label.toUpperCase();
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

		if (UserAccountManager.account_provider.logged_in)
		{
			ActionBar.e_button_login = ActionBar.AddMenuButton(
				'Log Out', 'logout',
				_ => OverlayManager.ShowConfirmDialog(
					() => { fxn.ForceLogOut(); },
					() => { },
					'Are you sure you want to log out?<br><br>'
					+ `<span style="opacity:50%;font-size:0.85rem;">NOTE: ${AppInfo.name} requires an active log in to function. You will be prompted to select another account.</span>`,
					'[Y]es, Change Account',
					'[N]o'
				),
				_ =>
				{
					_.id = 'action-bar-btn-logout';
					_.title = `Disconnect your tenant account from ${AppInfo.name}.\nThis will not log you out of your tenant sites or tools, only ${AppInfo.name}.\nLogging out will bring you back to tenant account selection.\nA valid login is required to use ${AppInfo.name}.`;
				}
			);
		}
		else
		{
			ActionBar.e_button_login = ActionBar.AddMenuButton(
				'Log In', 'login',
				_ => 
				{
					const prompt_login = 'You will be prompted to select an account on the following screen.';
					OverlayManager.ShowChoiceDialog(prompt_login, [OverlayManager.OkayChoice(_ => fxn.AttemptLogin())])
				},
				_ =>
				{
					_.id = 'action-bar-btn-login';
					_.title = 'Log in with your tenant account';
				}
			);
		}
	}
}

Modules.Report('Action Bar', 'This module provides the action bar interface at the top of the screen and its general functionality.')
ActionBar.Initialize();