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
        if (this.logged_in !== true) NotificationLog.Log('TENANT LOGIN FAILED', '#fa0');

        if (this.logged_in === true) AppEvents.Dispatch('account-login');
        else AppEvents.Dispatch('account-login-failed');
    }

    async OnVerifyAccess()
    {
        NotificationLog.Log('ACCOUNT VERIFY NOT IMPLEMENTED');
        return this.logged_in === true;
    }

    async OnTryLogOut()
    {
        this.logged_in = false;
        UserAccountManager.ForceLogOut();
    }
}