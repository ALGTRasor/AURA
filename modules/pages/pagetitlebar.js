import { addElement, setSiblingIndex } from "../domutils.js";
import { PageManager } from "../pagemanager.js";
import { PageDescriptor, PageInstance } from "./pagebase.js";

export class PageTitleBarButton
{
	static Nothing = new PageTitleBarButton();
	constructor(parent, icon = '', action = e => { }, tooltip = '')
	{
		this.parent = parent;
		this.tooltip = tooltip;
		this.icon = icon;
		this.action = action;
		this.e_root = addElement(
			this.parent, 'div', 'page-title-button', '',
			_ =>
			{
				_.style.zIndex = 30;
				_.title = this.tooltip;
				_.addEventListener(
					'click',
					_ =>
					{
						_.stopPropagation();
						_.preventDefault();
						this.InvokeAction(_);
					}
				);
			}
		);
		this.e_icon = addElement(this.e_root, 'i', 'material-symbols icon', '', _ => { _.innerText = this.icon; });
	}

	SetColor(color = '')
	{
		this.e_root.style.setProperty('--theme-color', color);
	}

	SetAction(action = e => { })
	{
		this.action = action;
	}

	InvokeAction(e)
	{
		this.action(e);
	}
}

export class PageTitleBar
{
	static Default = new PageTitleBar();

	created = false;
	draggable = false;
	dragging = false;
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

		this.handle_drag_start = (e) => this._HandleDragStart(e);
		this.handle_drag = (e) => this._HandleDrag(e);
		this.handle_drag_end = (e) => this._HandleDragEnd(e);
	}

	UpdateDraggable()
	{
		if (this.page.docked === false && this.draggable === false) this._MakeDraggable();
		else if (this.page.docked === true && this.draggable === true) this._MakeNotDraggable();
	}

	_MakeDraggable()
	{
		this.draggable = true;
		this.page.e_body.classList.add('page-loose');
		this.page.e_body.style.resize = 'both';
		this.page.e_body.style.width = '16rem';
		this.page.e_body.style.height = '16rem';

		this.e_title.classList.add('draggable');
		this.e_title.style.zIndex = 20;
		this.e_title.addEventListener('mousedown', this.handle_drag_start);
	}

	_MakeNotDraggable()
	{
		this.draggable = false;
		this.page.e_body.classList.remove('page-loose');
		this.page.e_body.style.removeProperty('resize');
		this.page.e_body.style.removeProperty('top');
		this.page.e_body.style.removeProperty('left');
		this.page.e_body.style.removeProperty('width');
		this.page.e_body.style.removeProperty('height');

		this.e_title.classList.remove('draggable');
		this.e_title.removeEventListener('mousedown', this.handle_drag_start);
		window.removeEventListener('mouseup', this.handle_drag_end);
	}

	_HandleDragStart(e)
	{
		e.stopPropagation();
		e.preventDefault();
		let pageRect = this.page.e_body.getBoundingClientRect();
		setSiblingIndex(this.page.e_body, 999);
		this.drag_start_x = e.clientX - pageRect.x;
		this.drag_start_y = e.clientY - pageRect.y;
		window.addEventListener('mousemove', this.handle_drag);
		window.addEventListener('mouseup', this.handle_drag_end);
		this.e_title.classList.add("dragging");
	};

	_HandleDrag(e)
	{
		e.stopPropagation();
		e.preventDefault();
		let pageRect = this.page.e_body.getBoundingClientRect();
		let pageRootRect = this.page.e_body.parentElement.getBoundingClientRect();

		this.drag_latest_x = e.clientX;
		this.drag_latest_y = e.clientY;

		let new_x = this.drag_latest_x - this.drag_start_x - pageRootRect.x;
		let new_y = this.drag_latest_y - this.drag_start_y - pageRootRect.y;

		new_x = Math.max(0, new_x);
		new_y = Math.max(0, new_y);
		new_x = Math.min(pageRootRect.width - pageRect.width, new_x);
		new_y = Math.min(pageRootRect.height - 48, new_y);

		this.page.e_body.style.left = new_x + 'px';
		this.page.e_body.style.top = new_y + 'px';
	}

	_HandleDragEnd(e)
	{
		e.stopPropagation();
		e.preventDefault();
		window.removeEventListener('mousemove', this.handle_drag);
		window.removeEventListener('mouseup', this.handle_drag_end);
		this.e_title.classList.remove("dragging");
	};

	AddButton(parent, icon = '', action = e => { }, color = '', tooltip = '')
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

	RemoveExtraButtons()
	{
		if (this.b_dock)
		{
			this.b_dock.e_root.remove();
			this.b_dock = null;
		}
	}

	RefreshExtraButtons()
	{
		if (this.page.page_descriptor.dockable === true && !this.b_dock)
		{
			this.b_dock = this.AddButton(this.e_buttons_right, 'picture_in_picture', () => { this.page.TryToggleDocked(); }, undefined, 'Dock or undock this page');
			if (this.b_close) setSiblingIndex(this.b_dock.e_root, 1);
			else setSiblingIndex(this.b_dock.e_root, 0);
		}

		this.UpdateDraggable();
	}

	AddNavigationButtons(left = true, right = true)
	{
		if (this.page.docked === false) return;

		if (left === true && !this.b_moveL)
		{
			this.b_moveL = this.AddButton(this.e_buttons_left, 'chevron_left', e => { this.page.MoveLeft(e.shiftKey); }, undefined, 'Move this page to the left');
			setSiblingIndex(this.b_moveL.e_root, 0);
		}

		if (right === true && !this.b_moveR)
		{
			this.b_moveR = this.AddButton(this.e_buttons_right, 'chevron_right', e => { this.page.MoveRight(e.shiftKey); }, undefined, 'Move this page to the right');
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