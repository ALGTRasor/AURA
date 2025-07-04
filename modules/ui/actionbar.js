import { AccountStateManager } from "../systems/accountstatemanager.js";
import { addElement, CreatePagePanel } from "../utils/domutils.js";
import { ChoiceOverlay } from "./overlays/overlay_choice.js";
import { OverlayManager } from "./overlay_manager.js";
import { MegaTips } from "../systems/megatips.js";
import { PageManager } from "../pagemanager.js";
import { AppInfo } from "../app_info.js";
import { Modules } from "../modules.js";
import { LayoutManager } from "../layoutmanager.js";

export class ActionBar
{
	initialized = false;

	static Initialize()
	{
		ActionBar.e_root = document.getElementById('action-bar');
		ActionBar.e_title = document.getElementById('action-bar-title');
		ActionBar.e_title.innerText = AppInfo.name;
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

		ActionBar.e_root.addEventListener('mouseenter', _ => { if (PageManager.pages_being_dragged < 1 && window.mobile_mode_enabled !== true) window.SetContentFaded(true); });
		ActionBar.e_root.addEventListener('mouseleave', _ => { window.SetContentFaded(false); });

		ActionBar.CreateLayoutMenu();

		ActionBar.initialized = true;
	}

	static CreateLayoutMenu()
	{
		ActionBar.e_icon_layout_menu = addElement(ActionBar.e_root, 'div', 'layout-menu-button');
		addElement(
			ActionBar.e_icon_layout_menu, 'i', 'material-symbols icon',
			'position:absolute; inset:0; color: var(--theme-color-l50);',
			_ => { _.innerText = 'browse'; }
		);
		ActionBar.e_layout_menu = addElement(ActionBar.e_icon_layout_menu, 'div', 'layout-menu');
		ActionBar.RefreshLayoutMenu();
	}

	static RefreshLayoutMenu()
	{
		ActionBar.e_layout_menu.innerHTML = '';
		addElement(ActionBar.e_layout_menu, 'span', '', 'text-wrap:nowrap;', e_ => { e_.innerText = 'SAVED LAYOUTS'; });
		LayoutManager.layouts_loaded.forEach(
			(layout_data, i, a) =>
			{
				addElement(
					ActionBar.e_layout_menu, 'div', 'layout-info', 'display:flex; flex-direction:column; gap:var(--gap-05);',
					e_layout =>
					{
						addElement(e_layout, 'div', '', 'flex-basis:0.0; flex-grow:1.0; align-content:center;', _ => { _.innerText = `${(i + 1)} - ${layout_data.title}`; });
						let e_btns = addElement(e_layout, 'div', '', 'flex-basis:1.5rem; flex-grow:0.0; flex-shrink:0.0; display:flex; flex-direction:row; border-radius:var(--corner-05); clip-path:stroke-box;');
						addElement(
							e_btns, 'div', 'layout-action', '',
							_ =>
							{
								_.innerText = 'LOAD';
								_.style.setProperty('--theme-color', 'skyblue');
								_.addEventListener('click', e => { LayoutManager.SwitchTo(i); });
							}
						);
						addElement(
							e_btns, 'div', 'layout-action', '',
							_ =>
							{
								_.innerText = 'SAVE'; _.style.setProperty('--theme-color', 'lime');
								_.addEventListener('click', e => { LayoutManager.UpdateActiveLayoutPageData(); });
							}
						);
						addElement(
							e_btns, 'div', 'layout-action', '',
							_ =>
							{
								_.setAttribute('coming-soon', '');
								_.innerText = 'RENAME'; _.style.setProperty('--theme-color', 'goldenrod');
								_.addEventListener('click', e => { });
							}
						);
						if (i > 0) addElement(
							e_btns, 'div', 'layout-action', '',
							_ =>
							{
								_.innerText = 'DELETE'; _.style.setProperty('--theme-color', 'red');
								_.addEventListener('click', e => { LayoutManager.DeleteLayout(i); });
							}
						);
					}
				);
			}
		);
		addElement(
			ActionBar.e_layout_menu, 'div', 'layout-add', 'flex-basis:1rem;',
			e_add_new =>
			{
				addElement(
					e_add_new, 'i', 'material-symbols icon',
					'text-align:center; align-content:center; translate:0 0;',
					_ => { _.innerText = 'add_circle'; }
				);
				e_add_new.style.setProperty('--theme-color', 'lime');

				e_add_new.addEventListener('click', e => { LayoutManager.PushActiveLayout('new layout'); });
			}
		);
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

		if (typeof tooltip === 'string') MegaTips.RegisterSimple(icon_info.e_root, tooltip);
		else if (typeof tooltip === 'function') MegaTips.Register(icon_info.e_root, tooltip);
		return icon_info;
	}

	static AddMenuButton(label = '', icon = '', on_click = _ => { }, post_prep = _ => { })
	{
		let e = addElement(
			ActionBar.e_button_root, 'div', 'action-bar-button', null,
			_ =>
			{
				addElement(_, 'span', '', 'position:absolute; inset:0; align-content:center; text-align:center;', _ => { _.innerHTML = label.toUpperCase(); });
				if (icon && icon.length && icon.length > 0) addElement(_, 'i', 'material-symbols icon', '', _ => { _.innerText = icon; });

				if (on_click)
				{
					_.addEventListener('click', e => { if (e.button === 0) on_click(e); });
					_.addEventListener('auxclick', e => { if (e.button === 1) on_click(e); });
				}
				if (post_prep) post_prep(_);
			}
		);

		MegaTips.RegisterSimple(e, label.toUpperCase());

		ActionBar.e_button_root.insertBefore(e, ActionBar.e_button_root.firstChild);

		return e;
	}

	static UpdateAccountButton()
	{
		if (ActionBar.e_button_login && ActionBar.e_button_login.remove) ActionBar.e_button_login.remove();

		if (AccountStateManager.tenant.logged_in === true)
		{
			ActionBar.e_button_login = ActionBar.AddMenuButton(
				'Log Out', 'logout',
				_ => OverlayManager.Show(
					ChoiceOverlay.host.GetNewInstance(
						{
							prompt: 'Are you sure you want to log out?<br><br>'
								+ `<span style="opacity:50%;font-size:0.85rem;">NOTE: ${AppInfo.name} requires an active log in to function.<br>You will be prompted to select another account.</span>`,
							choices: [
								{
									label: '[Y]es, Change Account',
									color: '#0ff',
									on_click: overlay => { AccountStateManager.tenant.OnTryLogOut(); overlay.Dismiss(); }
								},
								{
									label: '[N]o',
									color: '#fff',
									on_click: overlay => { overlay.Dismiss(); }
								}
							]
						}
					)
				),
				_ =>
				{
					_.id = 'action-bar-btn-logout';
				}
			);

			const login_tip = `Disconnect your tenant account from ${AppInfo.name}`
				+ ` <br> [[[This will bring you to account selection.]]]`
				+ ` <br> [[[A valid login is required to use ${AppInfo.name}.]]]`;
			MegaTips.RegisterSimple(ActionBar.e_button_login, login_tip);
		}
		else
		{
			ActionBar.e_button_login = ActionBar.AddMenuButton(
				'Log In', 'login',
				_ => 
				{
					const prompt_login = 'You will be prompted to select an account on the following screen.';
					OverlayManager.Show(
						ChoiceOverlay.host.GetNewInstance(
							{
								prompt: prompt_login,
								choices: [
									{
										label: 'OKAY',
										on_click: overlay => { AccountStateManager.tenant.TryLogOut(); overlay.Dismiss(); }
									}
								]
							}
						)
					);
				},
				_ =>
				{
					_.id = 'action-bar-btn-login';
				}
			);

			MegaTips.RegisterSimple(ActionBar.e_button_login, 'Log in with your tenant account');
		}
	}

	static SetProfileImageSource(url = 'resources/images/logo_alg.png') { ActionBar.e_profile_img.src = url; }
}

Modules.Report('Action Bar', 'This module provides the action bar interface at the top of the screen and its general functionality.')