export class DropMenuItem
{
	constructor(label, onClick = null, submenu = null)
	{
		this.label = label;
		this.onClick = onClick;
		this.submenu = submenu; // other DropMenu
	}

	CreateElements()
	{
		this.e_root = document.createElement('div');
		this.e_root.className = 'drop-menu-item';
		this.e_root.textContent = this.label;

		this.e_root.addEventListener('click', (e) =>
		{
			e.stopPropagation();
			if (this.onClick) this.onClick(e);
			if (this.submenu)
			{
				const rect = this.e_root.getBoundingClientRect();
				const submenuPoint = new DOMPoint(rect.left, rect.top);
				DropMenuManager.showMenu(this.submenu, submenuPoint, this);
			}
			else
			{
				DropMenuManager.hideAll();
			}
		});
		return this.e_root;
	}
}

export class DropMenu
{
	constructor(items = [])
	{
		this.position = new DOMPoint(0, 0); // DOMPoint
		this.items = items; // Array of DropMenuItem
		this.e_parent = null;
	}

	CreateElements()
	{
		this.e_parent = document.createElement('div');
		this.e_parent.className = 'drop-menu';
		this.e_parent.style.zIndex = '500000';
		this.e_parent.style.position = 'absolute';
		this.e_parent.style.left = `${this.position.x}px`;
		this.e_parent.style.top = `${this.position.y}px`;
		this.items.forEach(item => this.e_parent.appendChild(item.CreateElements()));
		document.body.appendChild(this.e_parent);
	}

	RemoveElements()
	{
		if (this.e_parent) this.e_parent.remove();
		this.e_parent = null;
	}
}

export class DropMenuManager
{
	static activeMenus = [];

	static showMenu(menu, position, parentItem = null)
	{
		let depth = parentItem ? DropMenuManager.activeMenus.findIndex(m => m.sourceItem === parentItem) + 1 : 0;
		while (DropMenuManager.activeMenus.length > depth)
		{
			let menuInfo = DropMenuManager.activeMenus.pop();
			menuInfo.menu.RemoveElements();
		}

		menu.position = position;
		menu.CreateElements();
		DropMenuManager.activeMenus.push({ menu, sourceItem: parentItem });
	}

	static hideAll()
	{
		DropMenuManager.activeMenus.forEach(({ menu }) => menu.RemoveElements());
		DropMenuManager.activeMenus = [];
	}
}
