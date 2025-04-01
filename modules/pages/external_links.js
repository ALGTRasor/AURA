import { CreatePagePanel } from "../domutils.js";
import { PageManager } from "../pagemanager.js";
import { PageBase } from "./pagebase.js";

export class PageExternalLinks extends PageBase
{
	GetTitle() { return 'external links'; }
	CreateElements(parent)
	{
		if (!parent) return;
		this.CreateBody();
		this.e_body.style.maxWidth = '20rem';
		let e_body_root = CreatePagePanel(this.e_content, true, false);
		let style_button = 'text-align:center;padding:1rem;font-weight:bold;';
		let AddButton = (label = '', link = '') =>
		{
			let e_btn = CreatePagePanel(e_body_root, false, false, style_button, x => { x.className += ' panel-button'; x.innerText = label });
			e_btn.addEventListener('click', e => { window.open(link, '_blank') });
		};
		AddButton('AURA GITHUB', 'https://github.com/ALGTRasor/AURA');
		AddButton('ARROW LAND GROUP', 'https://www.arrowlandgroup.com/');
		AddButton('AURA POWERAPP (DEPRECATED)', 'https://apps.powerapps.com/play/e/default-af0df1fe-2a14-4718-8660-84733b9b72bc/a/01db799c-da90-49c5-a69e-c4d12d8375f0');
		AddButton('GOOGLE MAPS', 'https://www.google.com/maps');
		this.FinalizeBody(parent);
	}
}

PageManager.RegisterPage(new PageExternalLinks('external links'));