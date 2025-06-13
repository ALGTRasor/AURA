import { AppEvents } from "../../appevents.js";
import { AccountState } from "../accountstate.js";
import { NotificationLog } from "../../notificationlog.js";
import { UserAccountInfo, UserAccountManager } from "../../useraccount.js";

export class TenantAccountState extends AccountState
{
    async OnTryLogIn()
    {
        await UserAccountManager.CheckWindowLocationForCodes();
        await UserAccountManager.AttemptAutoLogin();
        this.logged_in = UserAccountManager.account_provider.logged_in === true && UserAccountInfo.is_alg_account === true;

        if (this.logged_in === true) AppEvents.Dispatch('account-login');
        else
        {
            NotificationLog.Log('TENANT LOGIN FAILED', '#fa0');
            AppEvents.Dispatch('account-login-failed');
        }
    }

    async OnTryLogOut()
    {
        this.logged_in = false;
        UserAccountManager.ForceLogOut();
    }

    async OnRefreshAccess()
    {
        UserAccountManager.account_provider.AttemptReauthorize();
        this.logged_in = UserAccountManager.account_provider.logged_in === true && UserAccountInfo.is_alg_account === true;
    }

    async OnVerifyAccess()
    {
        await UserAccountManager.VerifyAccess();
    }
}