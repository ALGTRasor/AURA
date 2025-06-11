import { addElement, CreatePagePanel, FadeElement } from "../utils/domutils.js";
import { Modules } from "../modules.js";
import { until } from "../utils/until.js";
import { MegaTips } from "../systems/megatips.js";

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

        this.e_root = CreatePagePanel(
            parent, true, false,
            'letter-spacing:0.15rem; gap:0;',
            x => { x.classList.add('menu-root'); }
        );

        for (let item_id in this.items)
        {
            let item = this.items[item_id];
            this.e_items.push(
                this.AddButton(
                    item
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

    AddButton(button_data = {})
    {
        let text = button_data.label ?? '---';
        let on_click = button_data.on_click ?? (e => { });
        let tooltip = button_data.description;

        return addElement(
            this.e_root, 'div', 'menu-button', null,
            x =>
            {
                if (button_data.coming_soon === true) x.setAttribute('coming-soon', '');
                x.innerText = text ? text : '???';
                x.tabIndex = '0';
                x.addEventListener('click', on_click);
                //x.title = text;
                if (tooltip) MegaTips.RegisterSimple(x, tooltip);

                if ('alerts' in button_data)
                {
                    let alert_count = button_data.alerts.length;
                    if (alert_count > 0)
                    {
                        x.appendElement(
                            'div',
                            _ =>
                            {
                                _.classList.add('menu-button-alert');
                                _.appendElement('span', _ => { _.innerHTML = alert_count; });
                            },
                            _ =>
                            {
                                const get_text = _ => `${_.notification_title} [[[${_.notification_body}]]]<br>(((${new Date(_.datetime_arrival).toLocaleString()})))`;
                                MegaTips.RegisterSimple(_, button_data.alerts.map(get_text).join('<br>'));
                            }
                        );
                    }
                }
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