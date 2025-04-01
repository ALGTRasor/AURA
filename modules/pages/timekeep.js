import { addElement } from "../domutils.js";
import { PageManager } from "../pagemanager.js";
import { PageBase } from "./pagebase.js";

const style_panel_title = 'text-align:center; height:1rem; line-height:1rem; font-size:1rem; flex-grow:0.0; flex-shrink:0.0;';
const style_panel_label = 'text-align:center; align-content:center; position:absolute; inset:0;';

export class PageTimekeep extends PageBase
{
	GetTitle() { return 'timekeep'; }
	CreateElements(parent)
	{
		if (!parent) return;
		this.CreateBody();

		this.CreatePanel(
			this.e_content, true, true, 'overflow:hidden;',
			e =>
			{
				this.e_root_list = this.CreatePanel(
					e, false, true, 'max-width:16rem; flex-direction:column; align-content:stretch;',
					e =>
					{
						addElement(e, 'div', '', style_panel_title, e => { e.innerText = "All Items" });
						this.CreatePanel(e, true, false, 'flex-grow:0.0; flex-shrink:0.0; min-height:4rem;', e => { });
						this.CreatePanel(
							e, true, false, 'flex-grow:1.0; overflow-y:auto; padding:0.5rem 0.25rem 0.5rem 0.25rem;',
							e =>
							{
								for (let ii = 0; ii < 29; ii++)
									this.CreatePanel(
										e, false, false, 'margin:0rem;border-radius:0.3333rem;',
										e =>
										{
											e.className += ' panel-button';
											addElement(e, 'div', '', style_panel_label, e => { e.innerText = "Item " + ii });
										}
									);
							}
						);
						addElement(e, 'div', '', style_panel_title, e => { e.innerText = "The end" });
					}
				);
				this.e_root_view = this.CreatePanel(
					e, false, true, 'flex-direction:column; align-content:stretch;',
					e =>
					{
						addElement(e, 'div', '', style_panel_title, e => { e.innerText = "All Items" });
						this.CreatePanel(
							e, true, true, 'align-content:stretch;',
							e =>
							{
								for (let ii = 0; ii < 29; ii++)
									this.CreatePanel(
										e, false, false, 'flex-grow:1.0; flex-shrink:1.0;',
										x =>
										{
											x.style.minWidth = (Math.random() * 10 + 10) + 'rem';
											x.style.minHeight = (Math.random() * 3 + 3) + 'rem';
											addElement(x, 'div', '', style_panel_label, e => { e.innerText = "Item " + ii });
										}
									);
							}
						);
						addElement(e, 'div', '', style_panel_title, e => { e.innerText = "The end" });
					}
				);
			}
		);


		this.FinalizeBody(parent);
	}
}

PageManager.RegisterPage(new PageTimekeep('timekeep'));