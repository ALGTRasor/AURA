export function clamp(x = 0, a = 0, b = 1) { return Math.min(Math.max(x, a), b); }
export function lerp(x = 0, y = 1, t = 0.5, clamped = true)
{
    if (clamped === true) t = clamp(t, 0, 1);
    return (y - x) * t + x;
}


export function get_random_id(length = 5)
{
    let result = '';
    const characters = '0123456789abcdefghijklmnopqrstuvwxyz0123456789';
    const charactersLength = characters.length;
    for (let i = 0; i < length; i++)
    {
        let letterPos = parseInt(crypto.getRandomValues(new Uint8Array(1))[0] / 255 * (charactersLength - 1), 10);
        result += characters[letterPos];
    }
    return result;
}

export function get_guid(segments = [8, 4, 4, 4, 12])
{
    let ids = [];
    let segment_index = 0;
    while (segment_index < segments.length)
    {
        ids.push(get_random_id(segments[segment_index]));
        segment_index++;
    }
    return ids.join('-');

    return Math.random().toString(36).substring(2) + Date.now().toString(36);
    let id0 = Math.random().toString(16) + "0".repeat(16) + Date.now().toString(16);
    let id1 = id0.substring(16, 28);
    let id2 = id0.substring(8, 12);
    let id3 = id0.substring(0, 8);
    let id4 = id0.substring(13, 16);
    return `${id1}-${id2}-${id3}-4000-8${id4}`;
}

export function makeId(length)
{
    let result = '';
    const characters = 'ABCDEFGHIJKLMNOPQRSTUVWXYZabcdefghijklmnopqrstuvwxyz0123456789';
    const charactersLength = characters.length;

    for (let i = 0; i < length; i++)
    {
        let letterPos = parseInt(crypto.getRandomValues(new Uint8Array(1))[0] / 255 * charactersLength - 1, 10)
        result += characters[letterPos]
    }
    return result;
}