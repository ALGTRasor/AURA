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

		const style_button = 'flex-grow:0.0; flex-shrink:1.0; flex-basis:2rem; text-align:center; align-content:center; font-weight:bold; position:relative;';
		const style_icon = 'position:absolute;top:0.5rem;right:0.5rem;aspect-ratio:1.0;align-content:center;height:calc(100% - 1rem);object-fit:contain;';
		const style_icon_full = 'position:absolute;inset:0.5rem;aspect-ratio:1.0;align-content:center;object-fit:contain;';

		let AddButton = (label = '', link = '', icon = '') =>
		{
			let e_btn = CreatePagePanel(e_body_root, false, false, style_button, _ => { _.className += ' panel-button'; _.innerText = label });
			e_btn.title = link;
			e_btn.addEventListener('click', _ => { window.open(link, '_blank') });
			if (icon && icon.length > 0) addElement(e_btn, 'img', '', (!label || label == '') ? style_icon_full : style_icon, _ => { _.src = icon });
		};

		for (let link_id in SharedData.auraLinks.instance.data)
		{
			let link_record = SharedData.auraLinks.instance.data[link_id];
			AddButton(link_record.link_label, link_record.link_url, 'resources/images/' + link_record.link_image_path);
		}

		instance.e_cookie_warning = addElement(
			e_body_root, 'div', '', 'pointer-events:none;position:absolute;left:0.25rem;right:0.25rem;bottom:0.25rem;height:3.25rem;font-size:0.65rem;text-align:center;opacity:50%;',
			_ => 
			{
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