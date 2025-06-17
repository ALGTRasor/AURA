import { addElement, CreatePagePanel } from "../utils/domutils.js";
import { PanelContent } from "./panel_content.js";
import { MegaTips } from "../systems/megatips.js";

const style_panel_title = 'text-align:center; height:1.25rem; line-height:1.25rem; font-size:0.9rem; flex-grow:0.0; flex-shrink:0.0;';
const max_calendar_entries = 7 * 6;

export class Calendar extends PanelContent
{
    constructor(e_parent, date_focus = new Date())
    {
        super(e_parent);
        this.focus_ready = true;
        this.SetFocusDate(date_focus);
        this.CreateDayContent = (date = new Date(), element = new HTMLElement()) => { };
    }

    SetFocusDate(date_focus = new Date())
    {
        if (this.focus_ready !== true) return;
        this.focus_ready = false;
        window.setTimeout(() => { this.focus_ready = true; }, 250);

        this.date_focus = date_focus;
        this.RefreshElements();
    }

    UpdateDateRange()
    {
        const ms_per_day = 24 * 60 * 60 * 1000;
        this.date_focus = this.date_focus.getDateStart();
        this.date_focus_string = this.date_focus.toDateString();
        this.date_focus_weekday = this.date_focus.getDay();

        let week_delta = (this.date_focus_weekday + 8) * ms_per_day;
        let week_start = new Date(this.date_focus.getTime() - week_delta);

        this.dates = [];
        let date_next = week_start;
        while (this.dates.length < max_calendar_entries)
        {
            this.dates.push(date_next);
            date_next = new Date(date_next.setTime(date_next.getTime() + ms_per_day));
        }
    }

    OnCreateElements()
    {
        this.e_view_name = addElement(this.e_parent, 'div', '', style_panel_title);
        this.e_view_name.addEventListener(
            'wheel',
            e => { this.ShiftView(Math.sign(e.deltaY)); },
            { passive: true }
        );
        this.e_entry_root = CreatePagePanel(this.e_parent, true, false, '', _ => { _.classList.add('calendar-root'); });
        this.OnRefreshElements();
    }

    OnRefreshElements()
    {
        this.ClearDays();
        this.UpdateDateRange();
        this.e_view_name.innerText = this.date_focus.getMonthName();
        for (let date_id in this.dates) this.CreateDayElements(this.dates[date_id]);
    }

    OnRemoveElements()
    {
        this.e_entry_root.remove();
    }

    ShiftView(direction = 1)
    {
        const focus_delta = 1000 * 60 * 60 * 24 * 7; // one week ms
        this.SetFocusDate(new Date(this.date_focus.setTime(this.date_focus.getTime() + direction * focus_delta)));
    }

    ClearDays()
    {
        this.e_entry_root.innerHTML = '';
    }

    CreateDayElements(date = new Date())
    {
        let datestring = date.toDateString();
        let is_focus = this.date_focus_string == datestring;
        let is_same_month = date.getMonth() === this.date_focus.getMonth();

        let e_day = addElement(
            this.e_entry_root, 'div', 'calendar-day', '',
            _ =>
            {
                addElement(_, 'div', '', 'opacity:50%; font-size:70%;', _ => { _.innerHTML = date.getDayName().slice(0, 2); });
                addElement(_, 'div', '', 'font-size:100%;', _ => { _.innerHTML = date.getDate(); });

                if (this.CreateDayContent)
                {
                    let e_day_content = addElement(_, 'div', '', 'font-size:80%;');
                    this.CreateDayContent(date, e_day_content);
                }

                if (is_focus) _.setAttribute('calendar-today', '');
                if (is_same_month) _.setAttribute('calendar-this-month', '');
            }
        );
        MegaTips.RegisterSimple(e_day, datestring);
    };
}