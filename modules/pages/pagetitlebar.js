import { addElement, setSiblingIndex } from "../domutils.js";
import { PageManager } from "../pagemanager.js";
import { PageDescriptor, PageInstance } from "./pagebase.js";

export class PageTitleBarButton
{
	static Nothing = new PageTitleBarButton();
	constructor(parent, icon = '', action = () => { }, tooltip = '')
	{
		this.parent = parent;
		this.tooltip = tooltip;
		this.icon = icon;
		this.action = action;
		this.e_root = addElement(
			this.parent, 'div', 'page-title-button', '',
			_ =>
			{
				_.title = this.tooltip;
				_.addEventListener('click', _ => { this.InvokeAction(); });
			}
		);
		this.e_icon = addElement(this.e_root, 'i', 'material-symbols icon', '', _ => { _.innerText = this.icon; });
	}

	SetColor(color = '')
	{
		this.e_root.style.setProperty('--theme-color', color);
	}

	SetAction(action = () => { })
	{
		this.action = action;
	}

	InvokeAction()
	{
		this.action();
	}
}

export class PageTitleBar
{
	static Default = new PageTitleBar();

	created = false;
	page = {};
	icon = '';

	e_root = {};
	e_title = {};

	buttons = [];
	e_buttons = {};
	e_buttons_left = {};
	e_buttons_right = {};

	constructor(page = {}, create = true)
	{
		this.page = page;
		if (create === true) this.CreateElements();
	}

	AddButton(parent, icon = '', action = () => { }, color = '', tooltip = '')
	{
		let b = new PageTitleBarButton(parent, icon, action, tooltip);
		if (color && color.length > 0) b.e_root.style.setProperty('--theme-color', color);
		this.buttons.push(b);
		return b;
	}

	CreateElements()
	{
		if (this.created === true) return;
		if (!this.page) return;

		this.e_root = addElement(this.page.e_body, 'div', 'page-title-bar');

		this.e_title = addElement(this.e_root, 'div', 'page-title');

		this.e_buttons = addElement(this.e_root, 'div', 'page-title-buttons');
		const style_buttons_shared = 'flex-grow:1.0; gap:2px; padding:0 2px 0 2px;';
		this.e_buttons_left = addElement(this.e_buttons, 'div', 'page-title-buttons', style_buttons_shared);
		this.e_buttons_right = addElement(this.e_buttons, 'div', 'page-title-buttons', style_buttons_shared + 'justify-content:end; flex-direction:row-reverse;');

		if (this.icon)
		{
			addElement(this.e_root, 'i', 'material-symbols icon', '', i => { i.innerText = this.icon; });
			this.e_buttons.style.marginLeft = '2rem';
		}
		this.created = true;

		if (this.page.page_descriptor && this.page.page_descriptor.title)
			this.SetTitle(this.page.page_descriptor.title.toUpperCase());
	}

	RemoveNavigationButtons(left = true, right = true)
	{
		if (left === true && this.b_moveL)
		{
			this.b_moveL.e_root.remove();
			this.b_moveL = null;
		}
		if (right === true && this.b_moveR)
		{
			this.b_moveR.e_root.remove();
			this.b_moveR = null;
		}
	}

	AddNavigationButtons(left = true, right = true)
	{
		if (left === true && !this.b_moveL)
		{
			this.b_moveL = this.AddButton(this.e_buttons_left, 'chevron_left', () => { this.page.MoveLeft(); }, undefined, 'Move this page to the left');
			setSiblingIndex(this.b_moveL.e_root, 0);
		}
		if (right === true && !this.b_moveR)
		{
			this.b_moveR = this.AddButton(this.e_buttons_right, 'chevron_right', () => { this.page.MoveRight(); }, undefined, 'Move this page to the right');
			setSiblingIndex(this.b_moveR.e_root, 0);
			if (this.b_close) setSiblingIndex(this.b_close.e_root, -1);
		}
	}

	RemoveCloseButton()
	{
		if (this.b_close)
		{
			this.b_close.e_root.remove();
			this.b_close = null;
		}
	}
	AddCloseButton()
	{
		if (this.b_close) return;
		this.b_close = this.AddButton(
			this.e_buttons_right, 'close',
			() =>
			{
				this.page.page_descriptor.CloseInstance(this.page);
			},
			'#f00', 'Close this page'
		);
		setSiblingIndex(this.b_close.e_root, 0);
	}

	RemoveResizeButton()
	{
		if (this.b_resize)
		{
			this.b_resize.e_root.remove();
			this.b_resize = null;
		}
	}
	AddResizeButton()
	{
		if (this.b_resize) return;

		let expanded = this.page.state_data.expanding === true;

		this.b_resize = this.AddButton(this.e_buttons_right, 'resize', undefined, undefined, expanded ? 'Collapse this page' : 'Allow this page to expand');
		if (this.b_close) setSiblingIndex(this.b_close.e_root, -1);
		setSiblingIndex(this.b_resize.e_root, 2);
		//DebugLog.Log(`resize added: ${getSiblingIndex(this.b_resize)}`);
		//window.setTimeout(() => { setSiblingIndex(this.b_resize, 2); }, 150);

		const update_color = _ => { _.b_resize.SetColor((_.page.state_data.expanding) ? '#0ff' : '#fff'); };
		update_color(this);
		this.b_resize.SetAction(
			() =>
			{
				if (this.page.page_descriptor.Resize)
				{
					this.page.page_descriptor.Resize(this.page);
					update_color(this);
					PageManager.onLayoutChange.Invoke();
				}
			}
		);
	}

	RemoveElements()
	{
		if (this.created !== true) return;
		this.e_root.remove();
		this.e_root = null;
		this.created = false;
	}

	SetTitle(title)
	{
		if (this.created !== true) return;
		this.e_title.innerText = title;
	}
}