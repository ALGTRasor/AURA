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
                x.addEventListener('click', on_click);
                x.addEventListener('auxclick', on_click);
                //x.tabIndex = '0';
                //x.title = text;

                const def_tip = () =>
                {
                    let tips = [];
                    if (tooltip) tips.push(tooltip);
                    if (button_data.extra_tips) tips = tips.concat(button_data.extra_tips);
                    if (tips.length > 0)
                    {
                        MegaTips.RegisterSimple(x, tips.join('<br>'));
                    }
                };

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

                            }
                        );

                        MegaTips.Register(
                            x,
                            _ =>
                            {
                                _.innerHTML = '';
                                _.style.padding = 'var(--gap-05)';
                                _.style.borderRadius = 'var(--corner-05)';

                                _.appendElement(
                                    'div',
                                    _ =>
                                    {
                                        _.innerText = button_data.label.toUpperCase() + ' NOTIFICATIONS';

                                        _.style.display = 'flex';
                                        _.style.flexDirection = 'column';
                                        _.style.gap = 'var(--gap-025)';
                                        _.style.padding = 'var(--gap-05)';
                                        _.style.margin = 'var(--gap-05)';
                                        _.style.borderRadius = 'var(--corner-05)';
                                        _.style.border = 'solid 2px hsl(from orange h s var(--theme-l050))';
                                        _.style.backgroundColor = 'rgb(from hsl(from orange h s var(--theme-l050)) r g b / 0.1)';
                                        _.style.textAlign = 'left';
                                        _.style.color = 'hsl(from orange h s var(--theme-l050))';

                                        button_data.alerts.forEach(
                                            alert =>
                                            {
                                                _.appendElement(
                                                    'div',
                                                    _ =>
                                                    {
                                                        _.style.color = 'white';
                                                        _.style.textAlign = 'left';
                                                        _.style.flexDirection = 'column';
                                                        _.style.background = '#0004';
                                                        _.style.padding = 'var(--gap-05)';
                                                        _.style.gap = 'var(--gap-05)';
                                                        _.style.borderRadius = 'var(--corner-05)';

                                                        _.appendElement(
                                                            'div',
                                                            _ =>
                                                            {
                                                                _.style.display = 'flex';
                                                                _.style.flexDirection = 'row';
                                                                _.style.gap = '0';

                                                                _.appendElement(
                                                                    'div',
                                                                    _ =>
                                                                    {
                                                                        _.style.flexBasis = '100%';
                                                                        _.style.overflow = 'hidden';
                                                                        _.style.textWrap = 'nowrap';
                                                                        _.style.textOverflow = 'ellipsis';
                                                                        _.innerText = alert.notification_title;
                                                                    }
                                                                );
                                                                _.appendElement(
                                                                    'div',
                                                                    _ =>
                                                                    {
                                                                        _.style.flexGrow = '0.0';
                                                                        _.style.flexShrink = '0.0';
                                                                        _.style.width = 'fit-content';
                                                                        _.style.textWrap = 'nowrap';
                                                                        _.style.color = 'hsl(from var(--theme-color) h s 50%)';
                                                                        _.innerText = new Date(alert.datetime_arrival).toLocaleDateString();
                                                                    }
                                                                );
                                                            }
                                                        );

                                                        _.appendElement(
                                                            'div',
                                                            _ =>
                                                            {
                                                                _.style.color = 'hsl(from var(--theme-color) h s 70%)';
                                                                _.style.flexBasis = '100%';
                                                                _.style.overflow = 'hidden';
                                                                _.style.textOverflow = 'ellipsis';
                                                                _.style.paddingLeft = 'var(--gap-1)';
                                                                _.innerText = alert.notification_body;
                                                            }
                                                        );
                                                    }
                                                );
                                            }
                                        );
                                    }
                                );

                                if (tooltip)
                                {
                                    _.appendElement(
                                        'div',
                                        _ =>
                                        {
                                            _.innerText = tooltip;
                                        }
                                    );
                                }

                                for (let extra_tip_id in button_data.extra_tips)
                                {
                                    _.appendElement(
                                        'div',
                                        _ =>
                                        {
                                            _.innerHTML = MegaTips.FormatHTML(button_data.extra_tips[extra_tip_id]);
                                        }
                                    );
                                }
                            }
                        );
                    }
                    else
                    {
                        def_tip();
                    }
                }
                else
                {
                    def_tip();
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