import { addElement, CreatePagePanel, FadeElement } from "../utils/domutils.js";
import { secondsDelta } from "../utils/timeutils.js";
import { PanelContent } from "./panel_content.js";
import { MegaTips } from "../systems/megatips.js";
import { sleep } from "../utils/asyncutils.js";

const style_panel_title = 'text-align:center; height:1.25rem; line-height:1.25rem; font-size:0.9rem; flex-grow:1.0; flex-shrink:0.0;';

const ms_per_hour = 60 * 60 * 1000;
const ms_per_day = 24 * ms_per_hour;

const max_calendar_weeks = 6;
const max_calendar_entries = 7 * max_calendar_weeks;

export class CalendarEntry extends PanelContent
{
    constructor(e_parent, calendar, date = new Date())
    {
        super(e_parent);
        this.calendar = calendar;
        this.date = date;
    }

    SetDate(date = new Date())
    {
        this.date = date;
        this.date_month = date.getMonth();
        this.week_day = date.getDay();
        this.week_day_name = date.getDayName();
        this.week_day_name_short = this.week_day_name.slice(0, 2);
        this.month_day = date.getDate();
        this.date_string = date.toDateString();
        this.is_today = this.calendar.date_today_string === this.date_string;
        this.is_focused = this.calendar.date_focus_string === this.date_string;
        this.is_same_month = this.calendar.date_focus_month === this.date_month;
        if (this.created === true) this.OnRefreshElements();
    }

    OnCreateElements()
    {
        this.e_root = addElement(
            this.e_parent, 'div', 'calendar-day', '',
            _ =>
            {
                this.e_day_name = addElement(_, 'div', '', 'opacity:50%; font-size:70%;', _ => { _.innerHTML = this.week_day_name_short; });
                this.e_day_num = addElement(_, 'div', '', 'font-size:100%;', _ => { _.innerHTML = this.month_day; });
                this.e_content = addElement(_, 'div', '', 'font-size:80%;');

                _.addEventListener(
                    'click',
                    () =>
                    {
                        if (this.is_focused) this.calendar.ShowDetails(this.date);
                        this.calendar.SetFocusDate(this.date);
                    }
                );
            }
        );
        this.megatip = MegaTips.RegisterSimple(this.e_root, this.date_string);
        this.OnRefreshElements();
    }

    OnRefreshElements()
    {
        this.e_day_name.innerHTML = this.week_day_name_short;
        this.e_day_num.innerHTML = this.month_day;
        this.e_content.innerHTML = '';
        if (this.calendar.CreateDayContent) this.calendar.CreateDayContent(this.date, this.e_content);
        this.megatip.prep = _ => { _.innerHTML = this.date_string; };

        if (this.is_today) this.e_root.setAttribute('calendar-today', ''); else this.e_root.removeAttribute('calendar-today');
        if (this.is_focused) this.e_root.setAttribute('calendar-selected', ''); else this.e_root.removeAttribute('calendar-selected');
        if (this.is_same_month) this.e_root.setAttribute('calendar-this-month', ''); else this.e_root.removeAttribute('calendar-this-month');
    }
}




export class Calendar extends PanelContent
{
    constructor(e_parent, date_focus = new Date())
    {
        super(e_parent);
        this.entries = [];
        this.CreateDayContent = (date = new Date(), element = new HTMLElement()) => { };
        this.CreateDayDetailsContent = (date = new Date(), element = new HTMLElement()) => { };
        this.can_change_focus = true;
        this.should_transition = true;
    }

    ShowDetails(date)
    {
        addElement(
            this.e_entry_container, 'div', '', 'z-index:998; position:absolute; inset:0; background:#0005; backdrop-filter:blur(3px);',
            _ =>
            {
                _.style.padding = 'var(--gap-025)';
                _.style.gap = 'var(--gap-025)';
                _.addEventListener('click', e => _.remove());

                CreatePagePanel(
                    _, false, false, 'z-index:999; position:absolute; top:50%; left:50%; translate:-50% -50%;',
                    _ =>
                    {
                        _.addEventListener('click', e => e.stopPropagation());
                        _.style.display = 'flex';
                        _.style.flexDirection = 'column';
                        _.style.minWidth = '6rem';
                        _.style.minHeight = '6rem';
                        _.style.maxWidth = 'calc(100% - var(--gap-1))';
                        _.style.maxHeight = 'calc(100% - var(--gap-1))';
                        _.style.padding = 'var(--gap-025)';
                        _.style.gap = 'var(--gap-025)';

                        addElement(
                            _, 'div', '', '',
                            _ =>
                            {
                                _.style.fontSize = '75%';
                                _.style.textAlign = 'center';
                                _.innerText = date.getDayName();
                            }
                        );

                        addElement(
                            _, 'div', '', '',
                            _ =>
                            {
                                _.style.padding = '0 var(--gap-025) var(--gap-025) var(--gap-025)';
                                _.style.fontSize = '110%';
                                _.style.textAlign = 'center';
                                _.innerText = date.toFancyDateString();
                            }
                        );

                        CreatePagePanel(
                            _, true, false, 'display:flex; flex-direction:column; gap:var(--gap-025); flex-basis: 1.0; flex-grow:1.0;',
                            _ =>
                            {
                                _.style.padding = 'var(--gap-05)';
                                this.CreateDayDetailsContent(date, _);
                            }
                        );

                        FadeElement(_, 0, 100, 0.2);
                    }
                );
            }
        );
    }

    SetFocusDate(date_focus = new Date())
    {
        // if (this.date_focus == date_focus) return;
        if (this.can_change_focus !== true) return;
        this.can_change_focus = false;
        window.setTimeout(() => { this.can_change_focus = true; }, 250);

        this.should_transition = !this.date_focus || (this.date_focus !== date_focus && this.date_focus.getMonth() !== date_focus.getMonth());
        this.date_focus = date_focus;
        this.RefreshElements();
    }

    UpdateDateRange()
    {
        let date_today = new Date();
        date_today = new Date(date_today.setHours(0));
        this.date_focus = new Date(this.date_focus.setHours(0));
        this.date_focus_string = this.date_focus.toDateString();
        this.date_today_string = date_today.toDateString();
        this.date_focus_day = this.date_focus.getDate();
        this.date_focus_month = this.date_focus.getMonth();
        this.date_focus_weekday = this.date_focus.getDay();

        this.date_range_start = new Date(this.date_focus.getTime());
        this.date_range_start = new Date(this.date_range_start.setDate(0));
        this.date_range_start = new Date(this.date_range_start.setHours(0));
        this.date_range_start = new Date(this.date_range_start.getTime() - ms_per_day * (1 + this.date_range_start.getDay()));

        this.dates = [];
        let date_next = this.date_range_start;
        while (this.dates.length < max_calendar_entries)
        {
            this.dates.push(date_next);
            date_next = new Date(date_next.setTime(date_next.getTime() + ms_per_day));
        }
    }

    OnCreateElements()
    {
        this.e_title_row = addElement(this.e_parent, 'div', '', 'display:flex; flex-direction:row; flex-wrap:0.0; justify-items:center;');

        this.e_bt_prev = CreatePagePanel(
            this.e_title_row, true, false, 'flex-grow:0.0; width:1.25rem; height:1.25rem;',
            _ =>
            {
                _.classList.add('panel-button');
                addElement(_, 'i', 'material-symbols icon', 'color:var(--theme-color-text-30);', _ => { _.innerText = 'chevron_left'; });
                _.addEventListener('click', e => { this.ShiftMonths(-1); });
            }
        );
        this.e_view_name = addElement(this.e_title_row, 'div', '', style_panel_title);
        this.e_bt_next = CreatePagePanel(
            this.e_title_row, true, false, 'flex-grow:0.0; width:1.25rem; height:1.25rem;',
            _ =>
            {
                _.classList.add('panel-button');
                addElement(_, 'i', 'material-symbols icon', 'color:var(--theme-color-text-30);', _ => { _.innerText = 'chevron_right'; });
                _.addEventListener('click', e => { this.ShiftMonths(1); });
            }
        );

        MegaTips.RegisterSimple(this.e_bt_prev, 'View Previous Month');
        MegaTips.RegisterSimple(this.e_bt_next, 'View Next Month');

        this.e_view_name.addEventListener(
            'wheel',
            e =>
            {
                let offset = Math.sign(e.deltaY);
                let new_date = new Date(this.date_focus.getTime());
                new_date.setMonth(new_date.getMonth() + offset);
                this.SetFocusDate(new_date);
            },
            { passive: true }
        );

        this.e_entry_container = CreatePagePanel(this.e_parent, true, false);

        this.e_entry_root = addElement(this.e_entry_container, 'div', 'calendar-root');

        this.entries = [];
        while (this.entries.length < max_calendar_entries) 
        {
            let entry = new CalendarEntry(this.e_entry_root, this, undefined);
            entry.CreateElements();
            this.entries.push(entry);
        }
    }

    OnRefreshElements()
    {
        const change = () =>
        {
            //this.ClearDays();
            this.UpdateDateRange();
            this.e_view_name.innerText = this.date_focus.getMonthName() + ' ' + this.date_focus.getFullYear();
            this.entries.forEach((x, i, a) => { x.SetDate(this.dates[i]); });
        };
        const perform = async () =>
        {
            this.transitioning = true;
            if (this.entries_created === true && this.should_transition === true) 
            {
                this.entries.forEach(_ => { window.setTimeout(() => { FadeElement(_.e_root, 100, 0, 0.1); }, Math.random() * 100) });
                await sleep(200);
            }
            change();
            if (this.should_transition === true)
            {
                this.entries.forEach(_ => { window.setTimeout(() => { FadeElement(_.e_root, 0, 100, 0.1); }, Math.random() * 100) });
                await sleep(200);
            }
            this.entries_created = true;
            this.transitioning = false;
        }
        if (this.transitioning !== true) perform();
    }

    OnRemoveElements()
    {
        this.entries.forEach((x, i, a) => { x.remove(); });
        this.entries = [];
        this.e_entry_root.remove();
    }

    ShiftMonths(delta = 1)
    {
        let new_date = new Date(this.date_focus.getTime());
        new_date.setMonth(new_date.getMonth() + delta);
        this.SetFocusDate(new_date);
    }

    ShiftView(delta = 10000)
    {
        let now = new Date();
        if (this.last_shift_ts && secondsDelta(this.last_shift_ts, now) < 0.05) return;
        this.last_shift_ts = now;
        this.SetFocusDate(new Date(this.date_focus.setTime(this.date_focus.getTime() + delta)));
    }

    ClearDays()
    {
        this.e_entry_root.innerHTML = '';
    }
}