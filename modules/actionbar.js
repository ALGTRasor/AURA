import { Modules } from "./modules.js";
import { AppInfo } from "./app_info.js";
import { addElement, CreatePagePanel } from "./utils/domutils.js";
import { OverlayManager } from "./ui/overlays.js";
import { PageManager } from "./pagemanager.js";
import { UserAccountManager } from "./useraccount.js";

export class ActionBar
{
	initialized = false;

	static Initialize()
	{
		ActionBar.e_root = document.getElementById('action-bar');
		ActionBar.e_icons_root = document.getElementById('action-bar-icons-container');
		ActionBar.e_button_root = document.getElementById('action-bar-button-container');

		ActionBar.e_profile_img = addElement(
			ActionBar.e_icons_root, 'img', 'action-bar-profile-picture', '',
			_ =>
			{
				_.id = 'action-bar-profile-picture';
				_.src = 'resources/images/logo_alg.svg';
				_.alt = 'Account profile image';
			}
		);

		ActionBar.e_root.addEventListener('mouseenter', _ => { if (PageManager.pages_being_dragged < 1) window.SetContentFaded(true); });
		ActionBar.e_root.addEventListener('mouseleave', _ => { window.SetContentFaded(false); });

		ActionBar.initialized = true;
	}

	static AddIcon(icon = '', tooltip = '', on_click = e => { })
	{
		let icon_info = {};
		icon_info.e_root = addElement(
			ActionBar.e_icons_root, 'div', '', 'position:relative; aspect-ratio:1.0; width:auto;',
			_ =>
			{
				icon_info.e_btn = CreatePagePanel(
					_, true, false, 'position:absolute; inset:var(--gap-05);',
					_ =>
					{
						_.addEventListener('click', on_click);
						_.title = tooltip;
						_.classList.add('panel-button');
						icon_info.e_icon = addElement(
							_, 'i', 'material-symbols',
							'position:absolute; inset:0; align-content:center; text-align:center; font-size:1.3rem; line-height:0;',
							_ => { _.innerText = icon; }
						);
					}
				);
			}
		);
		return icon_info;
	}

	static AddMenuButton(label = '', icon = '', on_click = _ => { }, post_prep = _ => { })
	{
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
					() => { UserAccountManager.ForceLogOut(); },
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
					OverlayManager.ShowChoiceDialog(prompt_login, [OverlayManager.OkayChoice(_ => UserAccountManager.ForceLogOut())]);
				},
				_ =>
				{
					_.id = 'action-bar-btn-login';
					_.title = 'Log in with your tenant account';
				}
			);
		}
	}

	static SetProfileImageSource(url = 'resources/images/logo_alg.png') { ActionBar.e_profile_img.src = url; }
}

Modules.Report('Action Bar', 'This module provides the action bar interface at the top of the screen and its general functionality.')