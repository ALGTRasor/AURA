import { DebugLog } from "../debuglog.js";
import { minutesDelta } from "../utils/timeutils.js";
import { UserAccountInfo } from "../useraccount.js";
import { AppInfo } from "../app_info.js";
import { OverlayManager } from "../ui/overlay_manager.js";
import { ChoiceOverlay } from "../ui/overlays/overlay_choice.js";
import { AppStats } from "./appstats.js";

export class Welcome
{
    static min_delta_minutes = 15;
    static lskey_timestamp_last = 'ts-welcome-latest';
    static info = {};

    static GetTimestamp() { return localStorage.getItem(Welcome.lskey_timestamp_last); }
    static ResetTimer() { localStorage.setItem(Welcome.lskey_timestamp_last, new Date()); }

    static GetWelcomeInfo()
    {
        Welcome.info = {
            ts: Welcome.GetTimestamp(),
            delta_min: 0,
            welcomed: false,
            recent: false,
            user_name_full: UserAccountInfo.account_info ? (UserAccountInfo.account_info.display_name ?? 'user') : 'user'
        };

        if (Welcome.info.ts)
        {
            Welcome.info.ts = new Date(Welcome.info.ts);
            Welcome.info.delta_min = minutesDelta(Welcome.info.ts);
            Welcome.info.recent = Welcome.info.delta_min < Welcome.min_delta_minutes;
        }
        Welcome.info.user_name_short = Welcome.info.user_name_full.split(' ')[0];
    }

    static showWelcome(msg = '') 
    {
        let overlay_data = { prompt: msg, choices: [{ label: 'OKAY', color: '#0f0', on_click: overlay => { overlay.Dismiss(); } }] };
        OverlayManager.Show(ChoiceOverlay.host.GetNewInstance(overlay_data));
        Welcome.ResetTimer();
        AppStats.Count('welcomed');
    };

    static queueWelcome(msg)
    {
        if (Welcome.info.welcomed === true) return;
        window.setTimeout(_ => { Welcome.showWelcome(msg); }, 200);
        Welcome.info.welcomed = true;
    }

    static welcome_default() { Welcome.queueWelcome(`Welcome back, ${Welcome.info.user_name_short}!`); }

    static ShowWelcomeMessage()
    {
        if (UserAccountInfo.HasAppAccess() !== true) return;
        Welcome.GetWelcomeInfo();
        if (window.found_tokens === true) Welcome.OnFoundTokens();
        else Welcome.OnNoTokens();
        Welcome.ResetTimer();
    }

    static OnFoundTokens()
    {
        // existing user
        if (UserAccountInfo.HasAppAccess()) Welcome.welcome_default();
        // onboarding user
        else if (UserAccountInfo.is_alg_account) Welcome.queueWelcome(`Hello, ${Welcome.info.user_name_full}!`);
        //external user
        else Welcome.queueWelcome(AppInfo.name + ' doesn\'t recognize you!');
    }

    static OnNoTokens()
    {
        if (Welcome.info.recent) 
        {
            DebugLog.Log(`welcomed ${Math.round(Welcome.info.delta_min)} / ${Welcome.min_delta_minutes} minutes ago`);
            return;
        }
        else
        {
            if (UserAccountInfo.HasAppAccess()) Welcome.welcome_default();
            else if (UserAccountInfo.is_alg_account) Welcome.welcome_default(); // onboarding user
        }
    }
}