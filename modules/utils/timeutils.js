const time_units = [
    { unit: 'ms', size: 1 },
    { unit: 's', size: 1000 },
    { unit: 'm', size: 60 },
    { unit: 'hr', size: 60 },
    { unit: 'days', size: 24 },
    { unit: 'weeks', size: 7 },
    { unit: 'months', size: 4 },
    { unit: 'years', size: 12 },
];

const week_days = ['Sunday', 'Monday', 'Tuesday', 'Wednesday', 'Thursday', 'Friday', 'Saturday'];
const month_names = ['January', 'February', 'March', 'April', 'May', 'June', 'July', 'August', 'September', 'October', 'November', 'December'];

export function getDurationString(duration_ms = 1000)
{
    if (duration_ms < 1000) return Math.ceil(duration_ms) + 'ms';

    let unit_index = 0;
    let duration_unit = time_units[unit_index];
    let duration_unit_next = time_units[unit_index + 1];
    let duration_val = duration_ms;
    while (unit_index < (time_units.length - 1) && duration_val >= duration_unit_next.size)
    {
        unit_index++;
        duration_unit = time_units[unit_index];
        duration_unit_next = time_units[unit_index + 1];
        duration_val /= duration_unit.size;
    }
    return Math.ceil(duration_val * 10) / 10 + duration_unit.unit;
}


Date.prototype.to12HourTime = (d = new Date()) =>
{
    const fmt_str = s => s.toString().padStart(2, '0');

    let hr = d.getHours();
    let min = d.getMinutes();
    let suffix = hr >= 12.0 ? 'PM' : 'AM';
    return fmt_str(hr % 12) + ':' + fmt_str(min) + suffix;
};

export function Get12HourTimeString(d = new Date())
{
    const fmt_str = s => s.toString().padStart(2, '0');

    let hr = d.getHours();
    let min = d.getMinutes();
    let suffix = hr >= 12.0 ? 'PM' : 'AM';
    return fmt_str(hr % 12) + ':' + fmt_str(min) + suffix;
}


const seconds_per_minute = 60.0;
const inv_seconds_per_minute = 1.0 / seconds_per_minute;

const seconds_per_hour = 3600.0;
const inv_seconds_per_hour = 1.0 / seconds_per_hour;

export function secondsDelta(x = new Date(), y = new Date())
{
    let delta = 0;
    if (x > y) delta = x - y;
    else delta = y - x;
    return delta * 0.001;
}

export function minutesDelta(timestamp = new Date()) { return secondsDelta(timestamp, new Date()) * inv_seconds_per_minute; }
export function hoursDelta(timestamp = new Date()) { return secondsDelta(timestamp, new Date()) * inv_seconds_per_hour; }




Date.prototype.getDateStart = function ()
{
    this.setHours(0, 0, 0, 0);
    return this;
};

Date.prototype.getDayName = function () { return week_days[this.getDay()] };
Date.prototype.getMonthName = function () { return month_names[this.getMonth()] };


Date.prototype.toShortDateString = function (pad = true)
{
    const fmtnum = n => n.toString().padStart(2, '0');
    let day = this.getDate();
    let month = this.getMonth() + 1;
    let year = this.getFullYear();
    if (pad === true) return `${year}-${month.toString().padStart(2, '0')}-${day.toString().padStart(2, '0')}`;
    else return `${year}-${month}-${day}`;
};

Date.prototype.toFancyDateString = function ()
{
    let dayName = this.getDayName();
    let monthName = this.getMonthName();

    let day = this.getDate();
    let year = this.getFullYear();
    return `${monthName} ${day}, ${year}`;
};