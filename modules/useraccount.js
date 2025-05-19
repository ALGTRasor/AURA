import { DebugLog } from "./debuglog.js";
import { Modules } from "./modules.js";
import { InternalUser } from "./datamodels/internal_user.js";
import { MSAccountProvider } from "./account/ua_provider_ms.js";
import { AppEvents } from "./appevents.js";
import { NotificationLog } from "./notificationlog.js";


export class UserAccountManager
{
	static account_provider = new MSAccountProvider();

	static IsValidString(str)
	{
		return str !== undefined && str !== null && typeof str === 'string' && str !== 'undefined' && str !== 'null';
	}

	static KeyString(str)
	{
		return str.substring(0, 32).split('').map(x => (Math.random() > 0.42) ? x : '*').join('') + '...';
	}

	static GetNonce() { return Math.floor(Math.random() * 8999999) + 1000000; }

	static GetRedirectUri()
	{
		if (window.location.origin.startsWith('http://localhost')) return window.location.origin;
		return 'https://algtrasor.github.io/AURA/';

		let n = window.location.origin;//toString();
		//n = n.replace(window.location.search, "");
		//n = n.replace('?', '');
		//n = n.replace(window.location.hash, "");
		//n = n.replace('#', '');
		if (force_secure_protocol) n = n.replace("http://", "https://");
		return n;
	}

	static async AttemptAutoLogin()
	{
		await UserAccountManager.account_provider.AttemptAutoLogin();
	}

	static RequestLogin()
	{
		UserAccountManager.account_provider.InitiateLogin();
	}

	static MaybeAttemptReauthorize(reason = '')
	{
		UserAccountManager.account_provider.AttemptReauthorize(reason);
	}

	static ForceLogOut()
	{
		UserAccountManager.account_provider.InitiateAccountSelection();
	}

	static async CheckWindowLocationForCodes()
	{
		window.found_tokens = UserAccountManager.account_provider.GatherLocationTokens();
		if (window.found_tokens === true)
		{
			let windowloc = window.location.toString();
			if (windowloc.indexOf('?') > -1) windowloc = windowloc.substring(0, windowloc.indexOf('?'));
			if (windowloc.indexOf('#') > -1) windowloc = windowloc.substring(0, windowloc.indexOf('#'));
			window.history.replaceState(null, '', windowloc);
		}
	}
}

export class UserAccountInfo
{
	static account_info = {}; // auth account info
	static user_info = {}; // internal user / employee info
	static user_permissions = []; // internal user permissions

	static hr_info = {}; // internal user hr data

	static has_ms_account = false;
	static is_alg_account = false;
	static app_access = false;

	static app_access_permission = 'aura.access';

	static UpdateIdentity()
	{
		UserAccountInfo.has_ms_account = UserAccountInfo.account_info && 'email' in UserAccountInfo.account_info && typeof UserAccountInfo.account_info.email === 'string';
		UserAccountInfo.is_alg_account = UserAccountInfo.has_ms_account && UserAccountInfo.account_info.email.endsWith('@arrowlandgroup.com');

		let had_app_access = UserAccountInfo.app_access;
		UserAccountInfo.app_access = 'user_permissions' in UserAccountInfo.user_info && UserAccountInfo.user_info.user_permissions.split(';').indexOf(UserAccountInfo.app_access_permission) > -1;
		if (had_app_access !== true && UserAccountInfo.app_access === true)
		{
			NotificationLog.Log('App Access Confirmed', '#0fa');
			DebugLog.Log('App Access Confirmed');
		}
		else if (had_app_access === true && UserAccountInfo.app_access !== true)
		{
			NotificationLog.Log('App Access Revoked', '#fa0');
			DebugLog.Log('App Access Revoked');
		}
	}

	static IndexOfPermission(permission_id = '')
	{
		if (typeof permission_id !== 'string' || permission_id.length < 1) return -1;
		for (let pid in UserAccountInfo.user_permissions)
		{
			if (UserAccountInfo.user_permissions[pid].Title === permission_id) return pid;
		}
		return -1;
	}

	static HasAppAccess() { return UserAccountInfo.app_access === true; }

	static HasPermission(permission_id = '')
	{
		if (typeof permission_id !== 'string' || permission_id.length < 1) return true;
		let existing_id = UserAccountInfo.IndexOfPermission(permission_id);
		return existing_id > -1;
	}

	static async DownloadUserInfo()
	{
		NotificationLog.Log('Downloading User Info...', '#0ff');

		const sp_site = 'ALGInternal';
		let user_record = await window.SharePoint.DownloadRecord(sp_site, 'ALGUsers', `fields/Title eq '${UserAccountInfo.account_info.user_id}'`, InternalUser.data_model.fields);
		if (user_record)
		{
			let prop_count = 0;
			for (let prop in user_record)
			{
				UserAccountInfo.user_info[prop] = user_record[prop];
				prop_count++;
			}

			DebugLog.Log('...downloaded user info');
			DebugLog.Log('display name: ' + UserAccountInfo.user_info.display_name_full);
			DebugLog.Log('user properties: ' + prop_count);
		}
		else
		{
			DebugLog.Log('...could not download user info', true, "#f00");
		}

		UserAccountInfo.UpdateIdentity();
	}

	static UpdateUserSharedData()
	{
		UserAccountInfo.user_permissions = window.SharedData.GetPermDatum(UserAccountInfo.user_info.user_permissions.split(';'));
		UserAccountInfo.hr_info.requests = window.SharedData.GetHrRequestDatum(UserAccountInfo.account_info.user_id);
		DebugLog.Log('permission count: ' + UserAccountInfo.user_permissions.length);
		DebugLog.Log('hr request count: ' + UserAccountInfo.hr_info.requests.length);
		UserAccountInfo.UpdateIdentity();
	}
}

AppEvents.onDataReloaded.RequestSubscription(() => { UserAccountInfo.UpdateUserSharedData(); });

Modules.Report('User Account', 'This module downloads and caches data for your tenant / company account.');
if (!window.fxn) window.fxn = {};
window.fxn.AttemptLogin = UserAccountManager.RequestLogin;
window.fxn.ForceLogOut = UserAccountManager.ForceLogOut;