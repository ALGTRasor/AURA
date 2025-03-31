import { addElement } from "../domutils.js";
import { PageManager } from "../pagemanager.js";
import { PageBase } from "./pagebase.js";

export class PageTimekeep extends PageBase
{
	GetTitle() { return 'timekeep'; }
	CreateElements(parent)
	{
		if (!parent) return;
		this.CreateBody();

		this.CreatePanel(
			this.e_content, true, true, '',
			e =>
			{
				this.e_root_list = this.CreatePanel(e, false, false, '', e => { e.innerText = "item list"; e.style.maxWidth = '16rem'; });
				this.e_root_view = this.CreatePanel(
					e, false, true, 'align-content:flex-start;',
					e =>
					{
						let panel_label_styling = 'min-width:90%; height:1.5rem; line-height:1.5rem; max-height:1.5rem; flex-grow:0.0; flex-shrink:0.0; text-align:center;';
						addElement(e, 'div', '', panel_label_styling, e => { e.innerText = "Panel Title" });
						this.CreatePanel(e, true, false, '', e => { addElement(e, 'div', '', panel_label_styling, e => { e.innerText = "Item A" }); });
						this.CreatePanel(e, true, false, '', e => { addElement(e, 'div', '', panel_label_styling, e => { e.innerText = "Item B" }); });
						this.CreatePanel(e, true, false, '', e => { addElement(e, 'div', '', panel_label_styling, e => { e.innerText = "Item C" }); });
						this.CreatePanel(e, true, false, '', e => { addElement(e, 'div', '', panel_label_styling, e => { e.innerText = "Item D" }); });
						this.CreatePanel(e, true, false, '', e => { addElement(e, 'div', '', panel_label_styling, e => { e.innerText = "Item E" }); });
						this.CreatePanel(e, true, false, '', e => { addElement(e, 'div', '', panel_label_styling, e => { e.innerText = "Item F" }); });
						this.CreatePanel(e, true, false, '', e => { addElement(e, 'div', '', panel_label_styling, e => { e.innerText = "Item G" }); });
						this.CreatePanel(e, true, false, '', e => { addElement(e, 'div', '', panel_label_styling, e => { e.innerText = "Item H" }); });
						this.CreatePanel(e, true, false, '', e => { addElement(e, 'div', '', panel_label_styling, e => { e.innerText = "Item I" }); });
					}
				);
			}
		);


		this.FinalizeBody(parent);
	}
}

PageManager.RegisterPage(new PageTimekeep('timekeep'));