import { addElement } from "../../domutils.js";
import { PageManager } from "../../pagemanager.js";
import { PageDescriptor } from "../pagebase.js";

const style_panel_title = 'text-align:center; height:1rem; line-height:1rem; font-size:1rem; flex-grow:0.0; flex-shrink:0.0;';
const style_panel_label = 'text-align:center; align-content:center; position:absolute; inset:0;';

export class PageTimekeep extends PageDescriptor
{
	GetTitle() { return 'timekeep'; }
	OnCreateElements(instance)
	{
		if (!instance) return;

		instance.CreatePanel(
			instance.e_content, true, true, 'overflow:hidden;',
			e =>
			{
				instance.e_root_list = instance.CreatePanel(
					e, false, true, 'flex-direction:column; align-content:stretch;',
					e =>
					{
						addElement(e, 'div', '', style_panel_title, e => { e.innerText = "All Items" });
						instance.CreatePanel(
							e, true, false, 'flex-grow:1.0; overflow-y:auto; padding:0.5rem 0.25rem 0.5rem 0.25rem;',
							e =>
							{
								for (let ii = 0; ii < 29; ii++)
									instance.CreatePanel(
										e, false, false, 'border-radius:0.3333rem;',
										e =>
										{
											addElement(e, 'div', '', style_panel_label, e => { e.innerText = "Item " + ii });
										}
									);
							}
						);
						addElement(e, 'div', '', style_panel_title, e => { e.innerText = "The end" });
					}
				);
			}
		);
	}
}

PageManager.RegisterPage(new PageTimekeep('timekeep', 'time.keep'));