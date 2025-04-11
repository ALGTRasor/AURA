import { DebugLog } from "../debuglog.js";
import { addElement, setSiblingIndex } from "../domutils.js";
import { PageBase } from "./pagebase.js";

export class PageTitleBarButton
{
	static Nothing = new PageTitleBarButton();
	constructor(parent, icon = '', action = () => { })
	{
		this.parent = parent;
		this.icon = icon;
		this.action = action;
		this.e_root = addElement(this.parent, 'div', 'page-title-button', '', _ => { _.addEventListener('click', _ => { this.InvokeAction(); }) });
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
	page = null;
	icon = '';

	e_root = {};
	e_title = {};

	buttons = [];
	e_buttons = {};
	e_buttons_left = {};
	e_buttons_right = {};

	constructor(page = {}, icon = '', create = true)
	{
		this.page = page;
		this.icon = icon;
		if (create === true) this.CreateElements();
	}

	AddButton(parent, icon = '', action = () => { }, color = '')
	{
		let b = new PageTitleBarButton(parent, icon, action);
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
		this.e_buttons_right = addElement(this.e_buttons, 'div', 'page-title-buttons', style_buttons_shared + 'justify-content:end;');

		if (this.page.icon)
		{
			addElement(this.e_root, 'i', 'material-symbols icon', '', i => { i.innerText = this.page.icon; });
			this.e_buttons.style.marginLeft = '2rem';
		}
		this.created = true;

		if (this.page.title) this.SetTitle(this.page.title.toUpperCase());
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
			this.b_moveL = this.AddButton(this.e_buttons_left, 'chevron_left', () => { this.page.MoveLeft(); });
			setSiblingIndex(this.b_moveL, 0);
		}
		if (right === true && !this.b_moveR)
		{
			this.b_moveR = this.AddButton(this.e_buttons_left, 'chevron_right', () => { this.page.MoveRight(); });
			setSiblingIndex(this.b_moveL, 1);
		}
	}

	RemoveCloseButton()
	{
		if (!this.b_close) return;
		this.b_close.e_root.remove();
		this.b_close = null;
	}
	AddCloseButton()
	{
		if (this.b_close) return;
		this.b_close = this.AddButton(this.e_buttons_right, 'close', () => { this.page.Close(); }, "#f00");
	}

	RemoveResizeButton()
	{
		if (!this.b_resize) return;
		this.b_resize.e_root.remove();
		this.b_resize = null;
	}
	AddResizeButton()
	{
		if (this.b_resize) return;
		this.b_resize = this.AddButton(this.e_buttons_right, 'resize');
		const update_color = _ => { _.b_resize.SetColor((_.page.expanding === true) ? '#0ff' : '#fff'); };
		update_color(this);
		this.b_resize.SetAction(
			() =>
			{
				this.page.Resize();
				update_color(this);
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