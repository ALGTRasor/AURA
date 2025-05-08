import { addElement, CreatePagePanel, FadeElement } from "../utils/domutils.js";
import { Modules } from "../modules.js";
import { until } from "../utils/until.js";

export class QuickMenu
{
    constructor()
    {
        this.e_root = {};
        this.items = [];
        this.e_items = [];
        this.fading = 0;
    }

    CreateElements(parent, items = [])
    {
        if (this.created) return;

        this.e_parent = parent;
        this.items = items;

        this.e_root = CreatePagePanel(parent, true, false, 'letter-spacing:0.15rem; gap:0;', x => { x.className += ' menu-root'; });

        for (let item_id in this.items)
        {
            let item = this.items[item_id];
            this.e_items.push(
                this.AddButton(
                    item.label ? item.label : '---',
                    item.on_click ? item.on_click : e => { }
                )
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

    async FadeOutButtons()
    {
        const anim = (e_button, delay = 0, duration = 0.125) =>
        {
            window.setTimeout(
                () =>
                {
                    FadeElement(e_button, 100, 0, duration).then(_ => this.fading--);
                }, delay);
        };

        this.fading = this.e_items.length;
        for (let id in this.e_items)
        {
            let e_item = this.e_items[id];
            anim(e_item, id * 20, 0.125);
        }

        await until(() => this.fading < 1);
    }

    async FadeInButtons()
    {
        const anim = (e_button, delay = 0, duration = 0.125) =>
        {
            e_button.style.filter = 'opacity(0%)';
            window.setTimeout(
                () =>
                {
                    FadeElement(e_button, 0, 100, duration).then(_ => this.fading--);
                }, delay);
        };

        this.fading = this.e_items.length;
        for (let id in this.e_items)
        {
            let e_item = this.e_items[id];
            anim(e_item, id * 20, 0.125);
        }

        await until(() => this.fading < 1);
    }

    AddButton(text = '', on_click = e => { })
    {
        return addElement(
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