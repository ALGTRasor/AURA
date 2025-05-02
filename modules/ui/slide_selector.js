import { addElement, CreatePagePanel } from "../domutils.js";
import { Modules } from "../modules.js";

export class SlideSelector
{
    constructor()
    {
        this.e_root = {};
        this.e_items = [];
    }

    CreateElements(parent, items = [])
    {
        if (this.created === true) return;

        this.e_root = CreatePagePanel(
            parent, true, false, 'letter-spacing:0.15rem; gap:0; border:none;',
            x =>
            {
                x.classList.add('menu-root');
                x.style.flexDirection = 'row';
            }
        );

        this.e_selector = CreatePagePanel(
            this.e_root, false, false,
            'position:absolute; z-index:-99;'
            + 'transition-property:top,left,width,height;'
            + 'transition-duration:var(--trans-dur-off-slow);'
            + 'transition-timing-function:ease-in-out;'
        );
        this.e_selector.style.padding = '0';
        this.e_selector.style.margin = '0';
        this.e_selector.style.minHeight = '0';
        this.e_selector.style.minWidth = '0';
        this.e_selector.style.border = 'none';

        this.e_items = [];
        for (let item_id in items)
        {
            let item = items[item_id];
            let e_item = this.AddButton(
                item_id,
                item.label ? item.label : '---',
                item.on_click ? item.on_click : e => { }
            );
            this.e_items.push(e_item);
        };

        this.SelectIndex();
        this.created = true;
    }

    SelectIndex(index = 0)
    {
        this.selected_index = index;
        let item_rect = this.e_items[index].getBoundingClientRect();
        let parent_rect = this.e_root.getBoundingClientRect();
        this.e_selector.style.left = ((item_rect.x - parent_rect.x) + 4) + 'px';
        this.e_selector.style.top = ((item_rect.y - parent_rect.y) + 4) + 'px';
        this.e_selector.style.width = (item_rect.width - 8) + 'px';
        this.e_selector.style.height = (item_rect.height - 8) + 'px';
    }

    RemoveElements()
    {
        if (!this.created) return;
        this.e_root.remove();
        this.created = false;
    }

    AddButton(index = 0, text = '', on_click = e => { })
    {
        return addElement(
            this.e_root, 'div', 'menu-button', null,
            x =>
            {
                x.innerText = text ? text : '???';
                x.title = text;
                x.style.background = 'none';
                x.addEventListener('click', _ => { on_click(_); this.SelectIndex(index); });
            }
        );
    }

    ClearButtons()
    {
        if (!this.created) return;
        this.e_root.innerHTML = '';
    }
}

Modules.Report('Slide Selectors', 'This module adds a reusable sliding menu / selection component.');