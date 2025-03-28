import { DebugLog } from "../debuglog.js";
import { addElement } from "../domutils.js";
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

        this.e_root = addElement(
            parent, 'div', 'menu-root', '',
            e =>
            {

            }
        );

        for (let item_id in items)
        {
            let item = items[item_id];
            this.AddButton(
                item.label ? item.label : '',
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

Modules.Report('Record Forms');