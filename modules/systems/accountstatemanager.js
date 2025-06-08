//import { AccountState } from "../remotedata/accountstate.js";
import { TenantAccountState } from "../remotedata/accountstates/tenantaccountstate.js";

export class AccountStateManager
{
    // AccountState for tenant login, which grants primary access and provides logged in user details
    static tenant = new TenantAccountState();

    // Additional 3rd party example:
    // AccountState for openai login, which grants access to openai api features
    // static openai = new AccountState();
}