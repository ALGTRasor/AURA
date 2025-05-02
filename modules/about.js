import { DebugLog } from "./debuglog.js";
import { until } from "./until.js";

export class About
{
    static allRead = false;
    static allReading = false;
    static all = [];

    static async Read(force = false)
    {
        if (About.allReading === true) await until(() => About.allReading === false);
        else if (force === true || About.allRead !== true)
        {
            About.allReading = true;
            let resp = await fetch(
                'resources/plain/about.txt',
                {
                    method: 'get',
                    headers: { 'accept': 'text/plain' }
                }
            );
            About.all = (await resp.text()).split('\n').map(x => x.trim()).filter(x => x != '' && !x.startsWith('#'));
            About.allRead = About.all.length > 0;
            About.allReading = false;
            DebugLog.Log("...loaded about");
        }
    }

    static async GetLines()
    {
        await About.Read(false);
        return About.all;
    }
}