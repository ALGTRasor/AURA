import { addElement, CreatePagePanel } from "../domutils.js";
import { PageManager } from "../pagemanager.js";
import { PageBase } from "./pagebase.js";

export class PageExternalLinks extends PageBase
{
	GetTitle() { return 'external links'; }
	CreateElements(parent)
	{
		if (!parent) return;
		this.CreateBody();
		this.e_body.style.maxWidth = '22rem';
		this.e_body.style.minWidth = '16rem';

		let e_body_root = CreatePagePanel(this.e_content, true, true, null, x => { x.style.flexDirection = 'column'; });

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
		AddButton('AURA GITHUB', 'https://github.com/ALGTRasor/AURA', 'resources/images/thirdparty/favicon_github.svg');
		AddButton('ARROW LAND GROUP', 'https://www.arrowlandgroup.com/', 'resources/images/alg-favicon-32x32.png');
		AddButton('AURA POWERAPP', 'https://apps.powerapps.com/play/e/default-af0df1fe-2a14-4718-8660-84733b9b72bc/a/01db799c-da90-49c5-a69e-c4d12d8375f0', 'resources/images/thirdparty/favicon_powerapps.ico');
		AddButton('OUTLOOK', 'https://outlook.office.com/mail/', 'resources/images/thirdparty/favicon_outlook.ico');
		AddButton('TEAMS', 'https://teams.microsoft.com/v2/', 'resources/images/thirdparty/favicon_teams.ico');
		AddButton('GOOGLE MAPS', 'https://www.google.com/maps', 'resources/images/thirdparty/favicon_google_maps.ico');

		this.e_cookie_warning = addElement(
			e_body_root, 'div', '', 'pointer-events:none;position:absolute;left:0.25rem;right:0.25rem;bottom:0.25rem;height:3.25rem;font-size:0.65rem;text-align:center;opacity:50%;',
			_ => 
			{
				_.innerText = 'Warning: Following any link allows the site to read or write cookies to your browser, so make sure you know and trust where links will take you!'
			}
		);
		this.FinalizeBody(parent);
	}

	OnLayoutChange()
	{
		let body_rect = this.e_body.getBoundingClientRect();
		if (body_rect.height > 400) this.e_cookie_warning.style.display = 'block';
		else this.e_cookie_warning.style.display = 'none';
	}
}

PageManager.RegisterPage(new PageExternalLinks('external links'));