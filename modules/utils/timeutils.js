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