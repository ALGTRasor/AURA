export function clamp(x = 0, a = 0, b = 1) { return Math.min(Math.max(x, a), b); }
export function lerp(x = 0, y = 1, t = 0.5, clamped = true)
{
    if (clamped === true) t = clamp(t, 0, 1);
    return (y - x) * t + x;
}