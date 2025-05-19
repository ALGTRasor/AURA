export async function sleep(ms) { return new Promise(_ => window.setTimeout(_, ms)); }
export async function import_js_module(path) { return await import(path); }