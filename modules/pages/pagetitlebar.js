import { addElement, setSiblingIndex } from "../domutils.js";
import { PageManager } from "../pagemanager.js";
import { PageTitleBarButton, TitleBarButtonDescriptor } from "./titlebarbuttons/titlebarbuttons.js";



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

		this.handle_drag_start = (e) => this.#HandleDragStart(e);
		this.handle_drag = (e) => this.#HandleDrag(e);
		this.handle_drag_end = (e) => this.#HandleDragEnd(e);
	}

	UpdateDraggable()
	{
		let dock_state_changed = this.page.state_data.docked === this.draggable;
		if (dock_state_changed !== true) return;
		if (this.page.state_data.docked === true) this.#MakeNotDraggable(); else this.#MakeDraggable();
	}

	#MakeDraggable()
	{
		this.draggable = true;
		this.e_title.classList.add('draggable');
		this.e_title.style.zIndex = 20;
		this.e_title.addEventListener('mousedown', this.handle_drag_start);
	}

	#MakeNotDraggable()
	{
		this.draggable = false;
		this.e_title.classList.remove('draggable');
		this.e_title.removeEventListener('mousedown', this.handle_drag_start);
		window.removeEventListener('mouseup', this.handle_drag_end);
	}

	#HandleDragStart(e)
	{
		PageManager.FocusPage(this.page);
		e.stopPropagation();
		e.preventDefault();
		let pageRect = this.page.e_frame.getBoundingClientRect();
		//PageManager.BringToFront(this.page);
		this.drag_start_x = e.clientX - pageRect.x;
		this.drag_start_y = e.clientY - pageRect.y;
		window.addEventListener('mousemove', this.handle_drag);
		window.addEventListener('mouseup', this.handle_drag_end);
		this.e_title.classList.add("dragging");
	};

	#HandleDrag(e)
	{
		e.stopPropagation();
		e.preventDefault();
		let pageRect = this.page.e_frame.getBoundingClientRect();
		let pageRootRect = this.page.e_frame.parentElement.getBoundingClientRect();

		this.drag_latest_x = e.clientX;
		this.drag_latest_y = e.clientY;

		let new_x = this.drag_latest_x - this.drag_start_x - pageRootRect.x;
		let new_y = this.drag_latest_y - this.drag_start_y - pageRootRect.y;

		new_x = Math.max(0, new_x);
		new_y = Math.max(0, new_y);
		new_x = Math.min(pageRootRect.width - pageRect.width, new_x);
		new_y = Math.min(pageRootRect.height - 48, new_y);

		this.page.SetLoosePosition(new_x, new_y);
	}

	#HandleDragEnd(e)
	{
		e.stopPropagation();
		e.preventDefault();
		window.removeEventListener('mousemove', this.handle_drag);
		window.removeEventListener('mouseup', this.handle_drag_end);
		this.e_title.classList.remove("dragging");
	};

	AddButton(parent, icon = '', action = e => { }, color = '', tooltip = '', sortOrder = 0)
	{
		let b = new PageTitleBarButton(parent, icon, action, tooltip);
		b.e_root.sortOrder = sortOrder;
		if (color && color.length > 0) b.e_root.style.setProperty('--theme-color', color);
		this.buttons.push(b);
		return b;
	}

	AddButtonFromDescriptor(parent, descriptor = TitleBarButtonDescriptor.Nothing)
	{
		let b = new PageTitleBarButton(parent, descriptor);
		b.SetInstanceData({ button: b, page: this.page });

		b.e_root.sortOrder = descriptor.sort_order;
		if (descriptor.color && descriptor.color.length > 0) b.e_root.style.setProperty('--theme-color', descriptor.color);

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

	SortButtons(parent = document.body)
	{
		const sort_buttons = (x, y) =>
		{
			let xSortOrder = 0;
			let ySortOrder = 0;

			if ('sortOrder' in x) xSortOrder = x.sortOrder;
			if ('sortOrder' in y) ySortOrder = y.sortOrder;

			if (xSortOrder > ySortOrder) return 1;
			if (xSortOrder < ySortOrder) return -1;
			return 0;
		};

		let children = [...parent.children];
		children.sort(sort_buttons);
		children.forEach(c => parent.appendChild(c));
	}

	RemoveAllButtons()
	{
		for (let button_id in this.buttons)
		{
			let button = this.buttons[button_id];
			if (button && button.Remove) button.Remove();
		}
		this.buttons = [];
		this.b_close = null;
		this.b_moveL = null;
		this.b_moveR = null;
		this.b_dock = null;
		this.b_resize = null;
	}

	RefreshAllButtons()
	{
		let hasSiblingL = this.page.e_frame.previousElementSibling != null;
		let hasSiblingR = this.page.e_frame.nextElementSibling != null;

		if (hasSiblingL) this.AddButtonFromDescriptor(this.e_buttons_left, TitleBarButtonDescriptor.PageMoveL);

		if (this.page.page_descriptor.title !== 'nav menu' || PageManager.page_instances.length > 1)
			this.AddButtonFromDescriptor(this.e_buttons_right, TitleBarButtonDescriptor.PageClose);

		this.AddButtonFromDescriptor(this.e_buttons_right, TitleBarButtonDescriptor.PageToggleDocked);
		if (this.page.state_data.docked === true && this.page.page_descriptor.UpdateSize) this.AddButtonFromDescriptor(this.e_buttons_right, TitleBarButtonDescriptor.PageToggleExpanding);
		if (hasSiblingR) this.AddButtonFromDescriptor(this.e_buttons_right, TitleBarButtonDescriptor.PageMoveR);

		this.SortButtons(this.e_buttons_left);
		this.SortButtons(this.e_buttons_right);

		this.UpdateDraggable();
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