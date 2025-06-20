import { AppNotifications } from "../../systems/app_notifications.js";
import { UserAccountInfo } from "../../useraccount.js";
import { DevMode } from "../../systems/devmode.js";
import { PageManager } from "../../pagemanager.js";
import { QuickMenu } from "../../ui/quickmenu.js";
import { PageDescriptor } from "../pagebase.js";
import { until } from "../../utils/until.js";
import { Help } from "./help.js";

/*
EXPECTED PAGE ORDER
----
project hub
task tracker
contact logs
field notes
time keeper
directory
files
user dashboard
----
hr
reports
external links
help
----
*/

export class PageNavMenu extends PageDescriptor
{
	hidden_page = true;

	title = 'nav menu';

	OnCreateElements(instance)
	{
		if (!instance) return;

		instance.e_frame.style.minWidth = '20rem';
		instance.e_content.style.justifyContent = 'center';
		instance.e_content.style.gap = 'var(--gap-05)';

		instance.menu_main = new QuickMenu();
		instance.menu_extra = new QuickMenu();

		this.Populate(instance);

		instance.repopulate = _ =>
		{
			(
				async () =>
				{
					instance.menu_extra.FadeOutButtons();
					await instance.menu_main.FadeOutButtons();
				}
			)().then(
				_ => this.Populate(instance)
			).then(
				async () =>
				{
					instance.menu_extra.FadeInButtons();
					await instance.menu_main.FadeInButtons();
				}
			);
		};
		DevMode.AddActivateAction(instance.repopulate);
		DevMode.AddDeactivateAction(instance.repopulate);
	}

	OnRemoveElements(instance)
	{
		DevMode.RemoveActivateAction(instance.repopulate);
		DevMode.RemoveDeactivateAction(instance.repopulate);
	}

	Populate(instance)
	{
		const TryAddButton = (button_list = [], desc = {}) => 
		{
			let id = desc.title;
			if (PageManager.IsPageAvailable(id) === false) return;

			const button_label = id.toUpperCase();
			const button_order_id = ('order_index' in desc) ? desc.order_index : 0;
			const button_action = e =>
			{
				if (e.button === 2) return; // right click / context menu
				if (e.button === 1) // middle click
				{
					PageManager.CloseAll();
					until(
						() => { return PageManager.closingAll !== true; }
					).then(
						() => { PageManager.TogglePageByTitle(id); }
					);
				}
				if (e.button === 0) // left click
				{
					if (e.shiftKey === true) PageManager.OpenPageFromDescriptor(desc, undefined, true);
					else PageManager.TogglePageByTitle(id);
				}
			};

			let button_data = {
				label: button_label,
				order_index: button_order_id,
				on_click: button_action,
				description: desc.description
			};
			if ('coming_soon' in desc && DevMode.active !== true) button_data.coming_soon = desc.coming_soon;
			button_data.alerts = AppNotifications.GetAll(desc.title);

			button_data.extra_tips = [
				'((([[[CLICK]]] to show / hide this page)))',
				'((([[[SHIFT CLICK]]] to force a new copy of the page)))',
				'((([[[MIDDLE CLICK]]] to close all other pages)))',
			];

			button_list.push(button_data);
		};

		instance.menu_main.RemoveElements();
		instance.menu_extra.RemoveElements();

		let buttons = [];
		let buttons_extra = [];

		for (let page_desc_id in PageManager.page_descriptors)
		{
			let page_desc = PageManager.page_descriptors[page_desc_id];
			if (page_desc.hidden_page === true || page_desc.extra_page === true) continue;
			TryAddButton(buttons, page_desc);
		}

		for (let page_desc_id in PageManager.page_descriptors)
		{
			let page_desc = PageManager.page_descriptors[page_desc_id];
			if (page_desc.hidden_page === true || page_desc.extra_page !== true) continue;
			TryAddButton(buttons_extra, page_desc);
		}

		const sort_alpha = (a, b) =>
		{
			if (a.label < b.label) return -1;
			if (a.label > b.label) return 1;
			return 0;
		};

		const sort_order_index = (a, b) =>
		{
			if (a.order_index < b.order_index) return -1;
			if (a.order_index > b.order_index) return 1;
			return 0;
		};

		buttons.sort(sort_alpha);
		buttons.sort(sort_order_index);

		buttons_extra.sort(sort_alpha);
		buttons_extra.sort(sort_order_index);

		instance.menu_main.CreateElements(instance.e_content, buttons);
		instance.menu_main.e_root.style.flexGrow = buttons.length;

		if (buttons_extra.length > 0)
		{
			instance.menu_extra.CreateElements(instance.e_content, buttons_extra);
			instance.menu_extra.e_root.style.flexGrow = buttons_extra.length;
		}
	}

	AddMenuButton(text = '', onclick = () => { }, permissions_required = [])
	{
		if (permissions_required && permissions_required.length > 0 && UserAccountInfo.HasPermission(perm_id) !== true) return;

		let e_btn_menu = document.createElement('div');
		e_btn_menu.tabIndex = '0';
		e_btn_menu.className = 'menu-button';
		if (text)
		{
			e_btn_menu.innerText = text;
			e_btn_menu.title = text;
		}
		else
		{
			e_btn_menu.innerText = '???';
			e_btn_menu.title = text;
		}
		e_btn_menu.addEventListener('click', onclick);
		this.e_content.appendChild(e_btn_menu);
	}

	UpdateSize(instance)
	{
		instance.UpdateBodyTransform();
		this.OnLayoutChange(instance);
	}

	OnLayoutChange(instance)
	{
		if (instance.state.data.docked === true && instance.state.data.expanding === false) instance.e_frame.style.maxWidth = '20rem';
		else instance.e_frame.style.maxWidth = 'unset';
	}

	OnOpen(instance)
	{
		window.SharedData.Subscribe('permissions', instance.repopulate);
		window.SharedData.Subscribe('app notifications', instance.repopulate);
	}

	OnClose(instance)
	{
		window.SharedData.Unsubscribe('permissions', instance.repopulate);
		window.SharedData.Unsubscribe('app notifications', instance.repopulate);
	}
}

PageManager.RegisterPage(new PageNavMenu('nav menu', UserAccountInfo.app_access_permission, 'home'), 'n', 'Nav Menu');
Help.Register(
	'pages.nav menu', 'The Navigation Menu',
	'The Navigation Menu shows all pages which you have access to.'
	+ '\nClick an item in the list to open that page, or to close it if there is already one open.'
	+ '\nYou can also hold Shift to force a new instance of a page, even if there is already one open.'
);