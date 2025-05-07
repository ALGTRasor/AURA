import { addElement, CreatePagePanel } from "../utils/domutils.js";
import { EventSource } from "../eventsource.js";
import { Modules } from "../modules.js";

export class SlideSelector
{
    e_root = {};
    e_items = [];
    disabled = false;
    selected_index = -1;
    afterSelectionChanged = new EventSource();

    constructor()
    {
        this.e_root = {};
        this.e_items = [];
        this.selected_index = -1;
        this.afterSelectionChanged = new EventSource();
    }

    SetDisabled(disabled = true)
    {
        this.disabled = disabled;
        if (disabled === true)
        {
            this.e_root.style.cursor = 'wait';
            this.e_root.style.pointerEvents = 'none';
        }
        else
        {
            this.e_root.style.pointerEvents = 'all';
            this.e_root.style.cursor = 'pointer';
        }
    }

    CreateElements(parent, items = [])
    {
        if (this.created === true) return;

        this.e_root = CreatePagePanel(
            parent, true, false, 'letter-spacing:0.15rem; gap:0; border:none; margin:2px;',
            x =>
            {
                x.classList.add('menu-root');
                x.style.flexBasis = 'max-content';
                x.style.flexDirection = 'row';
                x.style.flexWrap = 'wrap';
                x.style.flexGrow = '0.0';
                x.style.flexShrink = '0.0';
                x.style.padding = 'var(--gap-025)';
            }
        );
        // account for surrounding panels having a 2px border

        this.e_selector = CreatePagePanel(
            this.e_root, false, false,
            'position:absolute; z-index:-99;'
            + 'transition-property:top,left,width,height;'
            + 'transition-duration:var(--trans-dur-off-slow);'
        );
        this.e_selector.style.transitionTimingFunction = 'cubic-bezier(.4,-0.2,.6,1.2)';
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

        this.created = true;
    }

    SelectIndexAfterDelay(index = 0, delay = 333, force_change = false)
    {
        window.setTimeout(() => { this.SelectIndex(index, force_change); }, delay);
    }

    CanSkipSelection(index = 0, forced = false)
    {
        if (this.disabled === true) return true;
        if (this.selected_index < 0) return false;
        if (this.selected_index != index) return false;
        return forced === false;
    }

    SelectIndex(index = 0, force_change = false)
    {
        if (typeof index !== 'number') index = Number.parseInt(index);
        if (this.CanSkipSelection(index, force_change) === true) return;

        this.selected_index = index;
        this.ApplySelection();

        if (this.afterSelectionChanged) this.afterSelectionChanged.Invoke();
    }

    ApplySelection()
    {
        for (let item_id in this.e_items)
        {
            this.e_items[item_id].style.removeProperty('color');
            this.e_items[item_id].style.pointerEvents = 'all';
            this.e_items[item_id].style.cursor = 'pointer';
            this.e_items[item_id].style.opacity = '50%';
        }

        if (this.selected_index < 0)
        {
            this.e_selector.style.left = '0';
            this.e_selector.style.top = '0';
            this.e_selector.style.width = '100%';
            this.e_selector.style.height = '100%';
            return;
        }

        let selected_item = this.e_items[this.selected_index];
        let item_rect = selected_item.getBoundingClientRect();
        selected_item.style.color = 'hsl(from var(--theme-color) h s 50%)';
        selected_item.style.cursor = 'default';
        selected_item.style.pointerEvents = 'none';
        selected_item.style.opacity = '100%';

        const border_width = 0;
        const border_width2 = border_width * 2;
        let parent_rect = this.e_root.getBoundingClientRect();

        let itemL = item_rect.x - parent_rect.x + border_width;
        let itemT = item_rect.y - parent_rect.y + border_width;
        let itemW = item_rect.width - border_width2;
        let itemH = item_rect.height - border_width2;

        this.e_selector.style.left = (100 * itemL / parent_rect.width) + '%';
        this.e_selector.style.top = (100 * itemT / parent_rect.height) + '%';
        this.e_selector.style.width = (100 * itemW / parent_rect.width) + '%';
        this.e_selector.style.height = (100 * itemH / parent_rect.height) + '%';
    }

    RemoveElements()
    {
        if (!this.created) return;
        this.e_root.remove();
        this.created = false;
    }

    AddButton(index = 0, text = '', on_click = e => { })
    {
        const id = index;
        return addElement(
            this.e_root, 'div', 'menu-button', null,
            x =>
            {
                x.innerText = text ? text : '???';
                x.title = text;
                x.style.background = 'none';
                x.style.opacity = '50%';
                x.style.padding = 'calc(var(--gap-025) + 4px)';
                x.style.alignContent = 'center';
                x.style.textAlign = 'center';
                x.style.minWidth = '6rem';
                x.addEventListener('click', _ => { on_click(_); this.SelectIndex(id, false); });
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