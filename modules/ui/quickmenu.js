import { DebugLog } from "../debuglog.js";
import { addElement, CreatePagePanel } from "../utils/domutils.js";
import { Modules } from "../modules.js";

export class QuickMenu
{
    constructor()
    {
        this.e_root = {};
    }

    CreateElements(parent, items = [])
    {
        if (this.created) return;

        this.e_root = CreatePagePanel(parent, true, false, 'letter-spacing:0.15rem; gap:0;', x => { x.className += ' menu-root'; });

        for (let item_id in items)
        {
            let item = items[item_id];
            this.AddButton(
                item.label ? item.label : '---',
                item.on_click ? item.on_click : e => { }
            );
        };

        this.created = true;
    }

    RemoveElements()
    {
        if (!this.created) return;
        this.e_root.remove();
        this.created = false;
    }

    AddButton(text = '', on_click = e => { })
    {
        addElement(
            this.e_root, 'div', 'menu-button', null,
            x =>
            {
                x.innerText = text ? text : '???';
                x.title = text;
                x.addEventListener('click', on_click);
            }
        );
    }

    ClearButtons()
    {
        if (!this.created) return;
        this.e_root.innerHTML = '';
    }
}

Modules.Report('Quick Menus', 'This module adds a reusable quick menu component, for example on the nav menu page.');