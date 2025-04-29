import { SharedData } from "../../datashared.js";
import { addElement, CreatePagePanel } from "../../domutils.js";
import { PageManager } from "../../pagemanager.js";
import { PageDescriptor } from "../pagebase.js";

export class PageExternalLinks extends PageDescriptor
{
	pinnable = true;
	GetTitle() { return 'external links'; }
	OnCreateElements(instance)
	{
		if (!instance) return;

		instance.e_body.style.maxWidth = '22rem';
		instance.e_body.style.minWidth = '16rem';

		let e_body_root = CreatePagePanel(
			instance.e_content, true, true, null,
			_ =>
			{
				_.style.flexDirection = 'column';
				_.style.flexWrap = 'nowrap';
			}
		);

		const style_button = 'flex-grow:0.0; flex-shrink:0.0; flex-basis:2rem; text-align:center; align-content:center; font-weight:bold; position:relative;';
		const style_icon = 'position:absolute;top:50%;right:0.5rem;aspect-ratio:1.0;align-content:center;height:50%;object-fit:contain;transform:translate(0%,-50%);';
		const style_icon_full = 'position:absolute;inset:0.5rem;aspect-ratio:1.0;align-content:center;object-fit:contain;';

		let AddButton = (parent = {}, label = '', link = '', icon = '') =>
		{
			let e_btn = CreatePagePanel(parent, false, false, style_button, _ => { _.className += ' panel-button'; _.innerText = label });
			e_btn.title = link;
			e_btn.addEventListener('click', _ => { window.open(link, '_blank') });
			if (icon && icon.length > 0) addElement(e_btn, 'img', '', (!label || label == '') ? style_icon_full : style_icon, _ => { _.src = icon });
		};

		const get_link_service = l => { if (typeof l.link_service_type === 'string' && l.link_service_type.length > 0) return l.link_service_type; return 'General'; };
		let link_groups = Object.groupBy(SharedData.auraLinks.instance.data, get_link_service);
		for (let link_group_id in link_groups)
		{
			let link_group = link_groups[link_group_id];

			let e_group = CreatePagePanel(e_body_root, false, false, 'display:flex;flex-direction:column;position:relative;flex-grow:0.0;flex-shrink:0.0;gap:var(--gap-05);');
			addElement(e_group, 'div', null, 'text-align:center;height:1.5rem;line-height:1.5rem;', _ => _.innerText = link_group_id);
			let e_group_buttons = CreatePagePanel(e_group, true, false, 'pointer-events:none;display:flex;flex-direction:column;position:relative;flex-grow:0.0;flex-shrink:0.0;gap:var(--gap-05);');

			for (let link_id in link_group)
			{
				let link_record = link_group[link_id];

				if (link_record.link_image_path && link_record.link_image_path.length > 0)
				{
					if (!link_record.link_image_path.startsWith('http'))
						link_record.link_image_path = 'resources/images/' + link_record.link_image_path;
				}
				AddButton(e_group_buttons, link_record.link_label, link_record.link_url, link_record.link_image_path);
			}
		}

		instance.e_cookie_warning = CreatePagePanel(
			instance.e_content, true, false, 'pointer-events:none;position:relative;font-size:0.75rem;text-align:center;opacity:50%;line-height:0.75rem;flex-grow:0.0;flex-shrink:0.0;',
			_ =>
			{
				_.style.padding = 'var(--gap-1)';
				_.innerText = 'Warning: Following any link allows the site to read or write cookies to your browser, so make sure you know and trust where links will take you!'
			}
		);
	}

	OnLayoutChange(instance)
	{
		let body_rect = instance.e_body.getBoundingClientRect();
		if (body_rect.height > 400) instance.e_cookie_warning.style.display = 'block';
		else instance.e_cookie_warning.style.display = 'none';
	}
}

PageManager.RegisterPage(new PageExternalLinks('external links', 'aura.access'));