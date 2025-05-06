import { DebugLog } from "../debuglog.js";
import { addElement } from "../utils/domutils.js";

export class TitleBarButtonDescriptor
{
	static Nothing = new TitleBarButtonDescriptor();

	static default_icon_name = (instance_data = {}) => 'star';
	static default_click_action = (event_info, instance_data = {}) => { DebugLog.Log('titlebar button clicked: ' + event_info.button); };
	static default_color = (instance_data = {}) => '';
	static default_tooltip = (instance_data = {}) => 'Default Button Tooltip ( you should not see this )';

	static PageClose = new TitleBarButtonDescriptor(
		'close',
		(e, data) => { if ('page' in data) data.page.CloseInstance(); },
		(data) => 'Close this page',
		_ => { _.color = '#f00'; _.sort_order = -10000; }
	);

	static PageMoveL = new TitleBarButtonDescriptor(
		'chevron_left',
		(e, data) => { if ('page' in data) data.page.MoveLeft(e.shiftKey); },
		(data) => 'Move this page to the left (hold shift to move to the end)',
		_ => { _.sort_order = -1000; }
	);

	static PageMoveR = new TitleBarButtonDescriptor(
		'chevron_right',
		(e, data) => { if ('page' in data) data.page.MoveRight(e.shiftKey); },
		(data) => 'Move this page to the right (hold shift to move to the end)',
		_ => { _.sort_order = -1000; }
	);


	static PageToggleDocked = new TitleBarButtonDescriptor(
		(data) =>
		{
			return 'flip_to_front';
			if (!('page' in data)) return 'flip_to_front';
			const is_page_docked = p => 'docked' in p.state_data && p.state_data.docked === true;
			if (is_page_docked(data.page)) return 'flip_to_front';
			return 'team_dashboard';
		},
		(e, data) =>
		{
			if ('page' in data) data.page.TryToggleDocked();
		},
		(data) =>
		{
			const is_page_docked = p => 'docked' in p.state_data && p.state_data.docked === true;
			if ('page' in data)
			{
				if (is_page_docked(data.page)) return 'Undock this page';
				return 'Dock this page';
			}
			return 'Dock or undock this page';
		},
		_ =>
		{
			_.sort_order = 0;
			const is_page_docked = p => 'docked' in p.state_data && p.state_data.docked === true;
			_.get_color = data => is_page_docked(data.page) ? '' : 'cyan';
		}
	);


	static PageToggleExpanding = new TitleBarButtonDescriptor(
		(data) =>
		{
			return data.page.state_data.docked === true ? 'fit_page_width' : 'fit_screen';
		},
		(e, data) =>
		{
			if ('page' in data)
			{
				data.page.ToggleExpanding();
			}
		},
		(data) =>
		{
			const is_page_expanding = p => 'expanding' in p.state_data && p.state_data.expanding === true;
			if ('page' in data)
			{
				if (is_page_expanding(data.page)) return 'Collapse this page';
				return 'Expand this page';
			}
			return 'Toggle this page expanding to fill available space';
		},
		_ =>
		{
			const is_page_expanding = p => 'expanding' in p.state_data && p.state_data.expanding === true;
			_.sort_order = -10;
			_.get_color = data => is_page_expanding(data.page) ? 'cyan' : '';
		}
	);

	icon_name = TitleBarButtonDescriptor.default_icon_name;
	click_action = TitleBarButtonDescriptor.default_click_action;
	tooltip = TitleBarButtonDescriptor.default_tooltip;

	sort_order = 0;
	get_color = TitleBarButtonDescriptor.default_color;
	allowed_mouse_buttons = [0];
	prevent_default_action = true;

	constructor(icon_name = TitleBarButtonDescriptor.default_icon_name, click_action = TitleBarButtonDescriptor.default_click_action, tooltip = TitleBarButtonDescriptor.default_tooltip, setup = _ => { })
	{
		this.icon_name = icon_name;
		this.click_action = click_action;
		this.tooltip = tooltip;

		if (setup) setup(this);
	}

	OnClickEvent(event_info, instance_info = {}) { this.click_action(event_info, instance_info); }
}

export class PageTitleBarButton
{
	static Nothing = new PageTitleBarButton();

	constructor(parent, descriptor = TitleBarButtonDescriptor.Nothing)
	{
		this.parent = parent;
		this.descriptor = descriptor;

		this.e_root = addElement(
			this.parent, 'div', 'page-title-button', '',
			_ =>
			{
				_.style.zIndex = 30;
				if (typeof descriptor.tooltip === 'function') _.title = descriptor.tooltip({});
				else _.title = descriptor.tooltip;
				_.addEventListener(
					'mouseup',
					_ =>
					{
						if (_.button in descriptor.allowed_mouse_buttons)
						{
							if (descriptor.prevent_default_action === true)
							{
								_.stopPropagation();
								_.preventDefault();
							}
							this.InvokeAction(_);
						}
					}
				);

				this.e_icon = addElement(_, 'i', 'material-symbols icon');
			}
		);

		this.SetAction(descriptor.click_action);
	}

	Remove() { this.e_root.remove(); }

	SetColor(color = '') { this.e_root.style.setProperty('--theme-color', color); }
	UnsetColor() { this.e_root.style.removeProperty('--theme-color'); }

	SetAction(action = (e, instance_data) => { }) { this.action = action; }
	SetInstanceData(instance_data = {})
	{
		this.instance_data = instance_data;
		this.RefreshState();
	}
	InvokeAction(e)
	{
		if (this.action) this.action(e, this.instance_data);
		//this.RefreshState();
	}

	RefreshState()
	{
		this.RefreshColor();
		this.RefreshTooltip();
		this.RefreshIcon();
	}

	RefreshColor()
	{
		let color_val = '';
		if (typeof this.descriptor.get_color === 'function') color_val = this.descriptor.get_color(this.instance_data);
		else color_val = this.descriptor.get_color;

		if (typeof color_val === 'string' && color_val.length > 0) this.SetColor(color_val);
		else this.UnsetColor();
	}

	RefreshTooltip()
	{
		if (typeof this.descriptor.tooltip === 'function') this.e_root.title = this.descriptor.tooltip(this.instance_data);
		else this.e_root.title = this.descriptor.tooltip;
	}

	RefreshIcon()
	{
		if (typeof this.descriptor.icon_name === 'function') this.e_icon.innerText = this.descriptor.icon_name(this.instance_data);
		else this.e_icon.innerText = this.descriptor.icon_name;
	}
}