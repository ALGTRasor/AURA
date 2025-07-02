import { Get12HourTimeString, Get24HourTimeString } from "./timeutils.js";

const url_maps = 'https://www.google.com/maps/search/?api=1&basemap=satellite&t=k&query=';
const non_nan = (x, scale = 1.0, round = false) =>
{
    if (typeof x !== 'number') x = Number.parseFloat(x);
    x = Number.isNaN(x) ? 0 : (x ?? 0);
    if (scale) x = x * scale;
    if (round === true) x = Math.round(x);
    return x;
};

export class FieldValidation
{
    static registered = [
        { format_code: 'blank', validator: _ => '- - -' },

        { format_code: 'dollars', validator: _ => '$' + _ },
        { format_code: 'phone-ext', validator: _ => '(555) 123-4567 - ' + _ },

        { format_code: 'billable_days', validator: _ => non_nan(_, 0.125, false) },
        { format_code: 'billable_hours', validator: _ => non_nan(_, 4.0, true) * 0.25 },
        {
            format_code: 'billable_time', validator: _ => 
            {
                let prefix = '<span style="display:inline-block;position:relative; box-sizing:border-box; flex-basis:0.0;flex-grow:1.0;'
                    + 'flex-shrink:1.0; padding-left:var(--gap-025); border-left:solid 2px hsl(0deg 0% var(--theme-l090) / 0.1);">';
                let suffix = '</span>';
                return `${prefix}${non_nan(_, 4.0, true) * 0.25}${suffix}${prefix}${non_nan(_, 0.125, false)}${suffix}`;
            }
        },

        { format_code: 'percentage', validator: _ => non_nan(_, 100, true) + '%' },
        { format_code: 'percentage1', validator: _ => non_nan(_, 1000, true) + '%' },
        { format_code: 'percentage2', validator: _ => non_nan(_, 10000, true) + '%' },

        { format_code: 'timestamp', validator: _ => { let d = new Date(_); return d.toShortDateString() + ' ' + Get12HourTimeString(d) } },
        { format_code: 'timestamp24', validator: _ => { let d = new Date(_); return d.toShortDateString() + ' ' + Get24HourTimeString(d) } },

        { format_code: 'upper', validator: _ => _.toUpperCase() },
        { format_code: 'uppercase', validator: _ => _.toUpperCase() },
        { format_code: 'lower', validator: _ => _.toLowerCase() },
        { format_code: 'lowercase', validator: _ => _.toLowerCase() },

        { format_code: 'url', validator: FieldValidation.CheckUrl },
        { format_code: 'phone', validator: FieldValidation.CheckPhone },
        { format_code: 'email', validator: FieldValidation.CheckEmail },
        { format_code: 'date', validator: FieldValidation.CheckDate },
        { format_code: 'address', validator: FieldValidation.CheckAddress },
        { format_code: 'object', validator: FieldValidation.CheckObject },
        { format_code: 'list', validator: FieldValidation.CheckList },
    ];

    static RegisterValidator(format_code = '', validator = _ => _)
    {
        FieldValidation.registered.push(
            {
                format_code: format_code,
                validator: validator
            }
        );
    }

    static GetValidator(format = '', default_validator = _ => _)
    {
        for (let vid in FieldValidation.registered)
        {
            let v = FieldValidation.registered[vid];
            if (v.format_code !== format) continue;
            return v.validator;
        }
        return default_validator;
    }

    static CheckList(value)
    {
        //if (typeof value === 'string') value = JSON.parse(value);

        let prop_count = 0;
        for (let propid in value) prop_count++;
        return `List with ${prop_count} items`;
    }

    static CheckAddress(value)
    {
        if (value && value.length > 0) value = `<a href='${url_maps}${encodeURI(value)}' target='_blank'>${value}</a>`;
        return value;
    }

    static CheckUrl(value)
    {
        if (value && value.length > 0) value = `<a href='${value}' target='_blank'>${value}</a>`;
        return value;
    }

    static CheckObject(value)
    {
        if (typeof value === 'string') value = JSON.parse(value);

        let prop_count = 0;
        for (let propid in value) prop_count++;
        return `Object with ${prop_count} properties`;
    }

    static CheckPhone(raw = '')
    {
        raw = raw.trim();
        if (raw.length < 7) return raw;

        let nums = raw.replace(/[^\d]+/g, '');
        if (nums.length < 10) return raw;

        let firstN = nums.substring(0, nums.length - 10);
        let last10 = nums.substring(nums.length - 10, nums.length);
        let areaCode = last10.substring(0, 3);
        let partA = last10.substring(3, 6);
        let partB = last10.substring(6, 10);
        if (firstN.length > 0) return `+${firstN} (${areaCode}) ${partA}-${partB}`;
        else return `(${areaCode}) ${partA}-${partB}`;
    }

    static CheckEmail(raw = '')
    {
        const rgx_email = /(.+)\@(?:(.+)?\.(\w+))/;
        if (rgx_email.test(raw))
        {
            let match = raw.match(rgx_email);
            let username = match[1];
            let domain = match[2];
            let extension = match[3];
            if (domain === 'alg' && extension === 'com') domain = 'arrowlandgroup';
            return `${username}@${domain}.${extension}`;
        }
        return raw;
    }

    static GetMonthFromName(month_name = 'January')
    {
        const months = ['jan', 'feb', 'mar', 'apr', 'may', 'jun', 'jul', 'aug', 'sep', 'oct', 'nov', 'dec',];
        month_name = month_name.trim().toLowerCase();
        month_name = month_name.substring(0, 3);
        return months.indexOf(month_name) + 1;
    }

    static CheckDate(raw = '')
    {
        let valid_date = false;
        let y = '0';
        let m = '0';
        let d = '0';

        const rgx_date_yyyymmdd = /([\d]{4})[^\d\n]+([\d]{1,2})[^\d\n]+([\d]{1,})/; // yyy-mm-dd
        const rgx_date_mmddyyyy = /([\d]{1,2})[^\d\n]+([\d]{1,2})[^\d\n]+([\d]{4})/; // mm-dd-yyy
        const rgx_date_mmmddyyyy = /([\w]{3,})[^\d\n]+([\d]{1,2})[^\d\n]+([\d]{4})/; // mmm dd yyyy
        const rgx_date_ddmmmyyyy = /([\d]{1,2})[^\d\n]+([\w]{3,})[^\d\n]+([\d]{4})/; // dd mmm yyyy

        if (rgx_date_yyyymmdd.test(raw) === true)
        {
            let match = raw.match(rgx_date_yyyymmdd);
            y = match[1];
            m = match[2];
            d = match[3];
            valid_date = true;
        }
        else if (rgx_date_mmddyyyy.test(raw) === true)
        {
            let match = raw.match(rgx_date_mmddyyyy);
            m = match[1];
            d = match[2];
            y = match[3];
            valid_date = true;
        }
        else if (rgx_date_mmmddyyyy.test(raw) === true)
        {
            let match = raw.match(rgx_date_mmmddyyyy);
            m = FieldValidation.GetMonthFromName(match[1]).toString();
            d = match[2];
            y = match[3];
            valid_date = true;
        }
        else if (rgx_date_ddmmmyyyy.test(raw) === true)
        {
            let match = raw.match(rgx_date_ddmmmyyyy);
            d = match[1];
            m = FieldValidation.GetMonthFromName(match[2]).toString();
            y = match[3];
            valid_date = true;
        }

        d = parseInt(d).toString();
        m = parseInt(m).toString();
        y = parseInt(y).toString();

        if (valid_date !== true) return raw;

        if (parseInt(m) < 1) valid_date = false;
        if (parseInt(d) < 1) valid_date = false;
        if (parseInt(m) > 12) m = '12';
        if (parseInt(d) > 31) d = '31';

        if (valid_date !== true) return raw;

        m = m.padStart(2, '0');
        d = d.padStart(2, '0');
        y = y.padStart(4, '19');

        return `${y}-${m}-${d}`;
    }
}