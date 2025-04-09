export class FieldValidation
{
    static CheckPhone(raw = '')
    {
        raw = raw.trim();
        if (raw.length < 7) return raw;

        let nums = raw.replace(/[^\d]+/g, '');
        if (raw.length < 10) return raw;

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

    static CheckDate(raw = '')
    {
        const rgx_date_yyyymmdd = /([\d]{4})[^\d]+([\d]{2})[^\d]+([\d]{2})/;
        if (rgx_date_yyyymmdd.test(raw))
        {
            let match = raw.match(rgx_date_yyyymmdd);
            let y = match[1];
            let m = match[2];
            let d = match[3];
            y = y.padStart(4, '19');
            m = m.padStart(2, '0');
            d = d.padStart(2, '0');
            return `${y}-${m}-${d}`;
        }

        const rgx_date_mmddyyyy = /([\d]{1,2})[^\d\n]+([\d]{1,2})[^\d\n]+([\d]{4})/;
        if (rgx_date_mmddyyyy.test(raw))
        {
            let match = raw.match(rgx_date_mmddyyyy);
            let m = match[1];
            let d = match[2];
            let y = match[3];
            m = m.padStart(2, '0');
            d = d.padStart(2, '0');
            y = y.padStart(4, '19');
            return `${y}-${m}-${d}`;
        }

        return raw;
    }
}