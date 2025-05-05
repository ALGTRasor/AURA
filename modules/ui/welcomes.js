import { DebugLog } from "../debuglog.js";
import { secondsDelta } from "../domutils.js";
import { UserAccountInfo } from "../useraccount.js";
import { OverlayManager } from "./overlays.js";

export class Welcome
{
    static ShowWelcomeMessage()
    {

        const lskey_welcome_last = 'ts-welcome-latest';
        const min_welcome_delta_minutes = 15;

        let welcome_ts = localStorage.getItem(lskey_welcome_last);
        let welcomed_delta_min = 0;
        let welcomed_recently = false;
        let welcomed_now = false;
        if (welcome_ts)
        {
            welcome_ts = new Date(welcome_ts);
            welcomed_delta_min = secondsDelta(welcome_ts) / 60.0;
            welcomed_recently = welcomed_delta_min < min_welcome_delta_minutes;
        }

        const showWelcome = (msg = '') =>
        {
            OverlayManager.ShowChoiceDialog(msg, [OverlayManager.OkayChoice()]);
            localStorage.setItem(lskey_welcome_last, new Date());
        };
        const queueWelcome = msg =>
        {
            if (welcomed_now === true) return;
            window.setTimeout(_ => { showWelcome(msg); }, 200);
            welcomed_now = true;
        }

        let user_name_full = UserAccountInfo.account_info.display_name;
        let user_name_short = user_name_full.split(' ')[0];
        const welcome_default = () => queueWelcome(`Welcome back, ${user_name_short}!`);

        if (window.found_tokens === true)
        {
            // existing user
            if (UserAccountInfo.aura_access) welcome_default();
            // onboarding user
            else if (UserAccountInfo.is_alg_account) queueWelcome(`Hello, ${user_name_full}!`);
            //external user
            else queueWelcome(AppInfo.name + ' doesn\'t recognize you!');
        }
        else
        {
            if (welcomed_recently)
            {
                let delta_str = Math.round(welcomed_delta_min);
                DebugLog.Log(`welcomed ${delta_str} / ${min_welcome_delta_minutes} minutes ago`);
            }
            else
            {
                // existing user
                if (UserAccountInfo.aura_access) welcome_default();
                // onboarding user
                else if (UserAccountInfo.is_alg_account) welcome_default();
            }
        }

    }
}