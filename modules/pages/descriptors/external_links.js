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

		instance.e_frame.style.maxWidth = '30rem';
		instance.e_frame.style.minWidth = '24rem';

		let e_body_root = CreatePagePanel(
			instance.e_content, true, true, null,
			_ =>
			{
				_.style.flexDirection = 'column';
				_.style.flexWrap = 'nowrap';
			}
		);

		const sort_alpha = (x, y) =>
		{
			if (x > y) return 1;
			if (x < y) return -1;
			return 0;
		};

		const style_button = 'flex-grow:0.0; flex-shrink:0.0; flex-basis:2rem; text-align:right; align-content:center; font-weight:bold; position:relative; padding-right:3rem;';
		const style_icon = 'position:absolute; top:50%; right:0.5rem; aspect-ratio:1.0; align-content:center; height:70%; object-fit:contain; transform:translate(0%,-50%); border-radius:6px;';
		const style_icon_full = 'position:absolute; inset:0.5rem; aspect-ratio:1.0; align-content:center; object-fit:contain;';

		let AddButton = (parent = {}, label = '', link = '', icon = '') =>
		{
			let has_icon = icon && icon.length > 0;
			let h = has_icon ? '2rem' : 'fit-content';
			let e_btn = CreatePagePanel(parent, false, false, style_button + `flex-basis:${h};`, _ => { _.className += ' panel-button'; _.innerText = label });
			e_btn.title = link;
			e_btn.addEventListener('click', _ => { window.open(link, '_blank') });
			if (has_icon) addElement(e_btn, 'img', '', (!label || label == '') ? style_icon_full : style_icon, _ => { _.src = icon });
		};

		SharedData.auraLinks.instance.data.sort((x, y) => sort_alpha(x.link_service_type, y.link_service_type));
		const get_link_service = l => { if (typeof l.link_service_type === 'string' && l.link_service_type.length > 0) return l.link_service_type; return 'General'; };
		let link_groups = Object.groupBy(SharedData.auraLinks.instance.data, get_link_service);
		let group_index = -1;
		for (let link_group_id in link_groups)
		{
			group_index++;
			let link_group = link_groups[link_group_id];

			link_group.sort(sort_alpha);

			let e_group = CreatePagePanel(e_body_root, false, false, 'display:flex; flex-direction:column; position:relative; flex-grow:0.0; flex-shrink:0.0; gap:var(--gap-025); max-height:1rem;');
			e_group.classList.add('smooth-max-height');
			e_group.classList.add('no-max-height-hover');
			e_group.style.setProperty('--theme-color', 'hsl(' + ((group_index * 0.1 - 0.1) * 360) + 'deg 30% 50%)');
			addElement(e_group, 'div', null, 'text-align:center; height:1.25rem; align-content:center;', _ => _.innerText = link_group_id);
			let e_group_buttons = CreatePagePanel(e_group, true, false, 'pointer-events:none; position:relative; display:flex; flex-direction:column; flex-grow:0.0; flex-shrink:0.0; gap:var(--gap-025);');

			for (let link_id in link_group)
			{
				let link_record = link_group[link_id];
				const relative_img_path_prefix = 'resources/images/';
				const is_relative_img_path = (p) => typeof p === 'string' && p.length > 0 && !p.startsWith('http') && !p.startsWith(relative_img_path_prefix);
				if (is_relative_img_path(link_record.link_image_path)) link_record.link_image_path = relative_img_path_prefix + link_record.link_image_path;
				AddButton(e_group_buttons, link_record.link_label, link_record.link_url, link_record.link_image_path);
			}
		}

		instance.e_cookie_warning = CreatePagePanel(
			instance.e_content, true, false, 'pointer-events:none;position:relative;font-size:0.75rem;text-align:center;opacity:50%;line-height:0.75rem;flex-grow:0.0;flex-shrink:0.0;',
			_ =>
			{
				_.style.padding = 'var(--gap-1)';
				_.innerText = 'Warning: Following a link allows the owner of that site to read & write "cookies" on your device.'
				_.innerText += ' "Cookies" can provide information that might allow the site owners to de-anonymize you.'
				_.innerText += ' Make sure you always know where a link will take you and that the owner of that site is trustworthy!'
				_.innerText += ' You can also avoid this by using a private or "incognito" browser mode, which typically disables "cookies".'
			}
		);
	}

	OnLayoutChange(instance)
	{
		if (instance.state_data.docked === true) instance.e_frame.style.maxWidth = '32rem';
		else instance.e_frame.style.maxWidth = 'unset';

		let frame_rect = instance.e_frame.getBoundingClientRect();
		if (frame_rect.height > 400) instance.e_cookie_warning.style.display = 'block';
		else instance.e_cookie_warning.style.display = 'none';
	}
}

PageManager.RegisterPage(new PageExternalLinks('external links', 'aura.access'));