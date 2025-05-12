import { DebugLog } from "../debuglog.js";
import { secondsDelta } from "../utils/domutils.js";
import { UserAccountInfo } from "../useraccount.js";
import { OverlayManager } from "./overlays.js";
import { AppInfo } from "../app_info.js";

export class Welcome
{
    static min_delta_minutes = 15;
    static lskey_timestamp_last = 'ts-welcome-latest';

    static GetTimestamp()
    {
        return localStorage.getItem(Welcome.lskey_timestamp_last);
    }

    static ResetTimer()
    {
        localStorage.setItem(Welcome.lskey_timestamp_last, new Date());
    }

    static GetWelcomeInfo()
    {
        let info = {};
        info.ts = Welcome.GetTimestamp();
        info.delta_min = 0;
        info.recent = false;
        if (info.ts)
        {
            info.ts = new Date(info.ts);
            info.delta_min = secondsDelta(info.ts) / 60.0;
            info.recent = info.delta_min < Welcome.min_delta_minutes;
        }
        return info;
    }

    static ShowWelcomeMessage()
    {
        let welcomed_now = false;
        let info = Welcome.GetWelcomeInfo();

        const showWelcome = (msg = '') =>
        {
            OverlayManager.ShowChoiceDialog(msg, [OverlayManager.OkayChoice()]);
            Welcome.ResetTimer();
        };
        const queueWelcome = msg =>
        {
            if (welcomed_now === true) return;
            window.setTimeout(_ => { showWelcome(msg); }, 200);
            welcomed_now = true;
        }

        let user_name_full = UserAccountInfo.account_info ? (UserAccountInfo.account_info.display_name ?? 'user') : 'user';
        let user_name_short = user_name_full.split(' ')[0];
        const welcome_default = () => queueWelcome(`Welcome back, ${user_name_short}!`);

        if (window.found_tokens === true)
        {
            // existing user
            if (UserAccountInfo.HasAppAccess()) welcome_default();
            // onboarding user
            else if (UserAccountInfo.is_alg_account) queueWelcome(`Hello, ${user_name_full}!`);
            //external user
            else queueWelcome(AppInfo.name + ' doesn\'t recognize you!');
        }
        else // did not find tokens
        {
            if (info.recent)
            {
                DebugLog.Log(`welcomed ${Math.round(info.delta_min)} / ${Welcome.min_delta_minutes} minutes ago`);
            }
            else
            {
                if (UserAccountInfo.app_access) welcome_default();
                else if (UserAccountInfo.is_alg_account) welcome_default(); // onboarding user
            }
        }

        Welcome.ResetTimer();
    }
}