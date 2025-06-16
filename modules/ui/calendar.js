import { addElement, CreatePagePanel } from "../utils/domutils.js";
import { PanelContent } from "./panel_content.js";
import { MegaTips } from "../systems/megatips.js";

const style_panel_title = 'text-align:center; height:1.25rem; line-height:1.25rem; font-size:0.9rem; flex-grow:0.0; flex-shrink:0.0;';

export class Calendar extends PanelContent
{
    constructor(e_parent, date_focus = new Date())
    {
        super(e_parent);
        this.SetFocusDate(date_focus);
        this.CreateDayContent = (date, element) => { };
    }

    SetFocusDate(date_focus = new Date())
    {
        this.date_focus = date_focus;
        this.UpdateDateRange();
        if (this.created === true) this.RecreateElements();
    }

    UpdateDateRange()
    {
        this.date_focus = this.date_focus.getDateStart();

        let week_delta = (this.date_focus.getDate() + 7) * 24 * 60 * 60 * 1000;
        let week_start = new Date(this.date_focus.getTime() - week_delta);

        this.dates = [];
        let date_next = week_start;
        const max_days = 7 * 6;
        while (this.dates.length < max_days)
        {
            this.dates.push(date_next);
            date_next = new Date(date_next.setUTCHours(date_next.getUTCHours() + 24));
        }
    }

    OnCreateElements()
    {
        addElement(this.e_parent, 'div', '', style_panel_title, _ => { _.innerText = this.date_focus.getMonthName(); });
        this.e_root = CreatePagePanel(this.e_parent, true, false, '', _ => { _.classList.add('calendar-root'); });

        this.ClearDays();

        for (let date_id in this.dates)
        {
            this.CreateDayElements(this.dates[date_id]);
        }
    }

    OnRemoveElements()
    {
        this.e_root.remove();
    }

    ClearDays()
    {
        this.e_root.innerHTML = '';
    }

    CreateDayElements(date = new Date())
    {
        let this_datestring = date.toDateString();
        let is_focus = this.date_focus.toDateString() == this_datestring;
        let is_same_month = date.getMonth() == this.date_focus.getMonth();

        let e_day = addElement(
            this.e_root, 'div', 'calendar-day', '',
            _ =>
            {
                addElement(_, 'div', '', 'opacity:50%; font-size:0.7rem;', _ => { _.innerHTML = date.getDayName().slice(0, 2); });
                addElement(_, 'div', '', 'font-size:1rem;', _ => { _.innerHTML = date.getDate(); });
                let e_day_content = addElement(_, 'div', '', 'font-size:0.8rem;');
                this.CreateDayContent(date, e_day_content);

                if (is_focus) _.setAttribute('calendar-today', '');
                if (is_same_month) _.setAttribute('calendar-this-month', '');
            }
        );
        MegaTips.RegisterSimple(e_day, date.toDateString());
    };
}