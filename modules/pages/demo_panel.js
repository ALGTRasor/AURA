import { CreatePagePanel } from "../domutils.js";
import { PageManager } from "../pagemanager.js";
import { PageBase } from "./pagebase.js";

const style_button = 'text-align:center;align-content:center;padding:1rem;font-weight:bold;';
const AddButton = (parent, label = '', action = () => { }) =>
{
	let e_btn = CreatePagePanel(parent, false, false, style_button, x => { x.className += ' panel-button'; x.innerText = label; });
	if (action) e_btn.addEventListener('click', e => { action(); });
};

export class PageDemoPanel extends PageBase
{
	GetTitle() { return 'demo panel'; }
	CreateElements(parent)
	{
		if (!parent) return;
		this.CreateBody();
		let e_body_root = CreatePagePanel(this.e_content, true, true, 'align-content:start; min-height:fit-content; flex-grow:1.0; flex-shrink:0.0; overflow:hidden;', x => { });

		AddButton(e_body_root, 'PROJECT SUMMARY', () => { });
		AddButton(e_body_root, 'PROJECT VIEW', () => { });
		AddButton(e_body_root, 'PROJECT TRACT VIEW', () => { });
		AddButton(e_body_root, 'TRACTS', () => { });
		AddButton(e_body_root, 'TRACTS', () => { });
		AddButton(e_body_root, 'TRACTS', () => { });
		AddButton(e_body_root, 'TRACTS', () => { });
		AddButton(e_body_root, 'TRACTS', () => { });
		AddButton(e_body_root, 'TRACTS', () => { });
		AddButton(e_body_root, 'TRACTS', () => { });
		AddButton(e_body_root, 'TRACTS', () => { });
		AddButton(e_body_root, 'TRACTS', () => { });

		this.e_panel = CreatePagePanel(this.e_content, true, false, 'flex-grow:10.0; flex-shrink:1.0;', x => { x.innerText = 'hello'; });

		this.FinalizeBody(parent);
	}
}

PageManager.RegisterPage(new PageDemoPanel('demo panel'));