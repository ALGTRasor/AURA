import { DebugLog } from "./debuglog.js";
import { Modules } from "./modules.js";
import { EventSource, EventSourceSubscription } from "./eventsource.js";
import { SharedData } from "./datashared.js";

const id_mo_tenant = 'af0df1fe-2a14-4718-8660-84733b9b72bc';
const url_mo = 'https://login.microsoftonline.com/' + id_mo_tenant + '/';
const url_mo_oauth = url_mo + 'oauth2/v2.0/authorize';
const url_mo_token = url_mo + 'oauth2/v2.0/token';

const rgx_access_token = /[\#\&\?]access_token\=([^\&]+)/;
const rgx_id_token = /[\#\&\?]id_token\=([^\&]+)/;

const lskey_id_token = 'o365_id_token_latest';
const lskey_access_token = 'o365_access_token_latest';

const lskey_user_data = 'o365_user_data';
const lskey_login_attempts = 'account_login_attempts';
const lskey_login_forced = 'account_login_forced';

const CLIENT_ID = "ea723209-ebaa-402a-8ff0-ffe4a49b3282";
const CLIENT_SCOPES = [
	'openid',
	'user.read',
	'AllSites.FullControl'
].join(' ');

export class UserAccountProvider
{
	static Microsoft = new UserAccountProvider();

	constructor()
	{
		this.logging_in = false;
		this.logged_in = false;

		this.onLoginSuccess = new EventSource();
		this.onLoginFail = new EventSource();

		this.has_id_token = false;
		this.id_token = '';

		this.has_access_token = false;
		this.access_token = '';

		this.account_profile_picture_url = '';
	}

	GatherLocationTokens() { return false; } // checks the window location for query or hash provided auth tokens

	LoadCachedData() { } // loads cached auth tokens and account data
	async AttemptAutoLogin() { } // attempts to login using cached  credentials
	AttemptReauthorize() { } // automatically initiates the login flow until out of tries, triggered by api call auth errors

	GetAuthorizationURL() { return ''; } // gets the url used to send the user to authorization
	InitiateLogin() { } // sends the user to the auth page

	async DownloadAccountData() { } // uses account credentials to fetch authorized account details
	async DownloadAccountProfilePicture() { } // uses account credentials to fetch authorized account profile picture

	async InitiateAccountSelection() { } // forces a logout and sends the user to authorization 

	ClearCachedData() { } // clears cached account info, usually to prepare for logout
}

export class MSAccountProvider extends UserAccountProvider
{
	constructor() { super(); }

	UpdateAccessToken(new_value, update_store = false)
	{
		if (new_value && UserAccountManager.IsValidString(new_value))
		{
			this.access_token = new_value;
			this.has_access_token = true;
			if (update_store) localStorage.setItem(lskey_access_token, this.access_token);
		}
	}

	UpdateIdToken(new_value, update_store = false)
	{
		if (new_value && UserAccountManager.IsValidString(new_value))
		{
			this.id_token = new_value;
			this.has_id_token = true;
			if (update_store) localStorage.setItem(lskey_id_token, this.id_token);
		}
	}

	LoadCachedData()
	{
		let success = true;
		DebugLog.StartGroup('loading account data');

		let tmp_access = localStorage.getItem(lskey_access_token);
		if (tmp_access) this.UpdateAccessToken(tmp_access);
		else success = false;

		let tmp_id = localStorage.getItem(lskey_id_token);
		if (tmp_id) this.UpdateIdToken(tmp_id);
		else success = false;

		let tmp_account_info = localStorage.getItem(lskey_user_data);
		if (tmp_account_info)
		{
			let tmp_account_info_parsed = JSON.parse(tmp_account_info);
			if (tmp_account_info_parsed) UserAccountInfo.account_info = tmp_account_info_parsed;
			else success = false;
		}
		else success = false;

		if (success)
		{
			DebugLog.Log('...loaded from cache');
			DebugLog.SubmitGroup('#0f04');
		}
		else
		{
			DebugLog.Log('...not found in cache');
			DebugLog.SubmitGroup('#ff04');
		}
	}

	async AttemptAutoLogin()
	{
		UserAccountManager.account_provider.logging_in = true;

		DebugLog.StartGroup('autologin');
		this.LoadCachedData();

		if (this.has_access_token)
		{
			DebugLog.Log('downloading account data...');
			await this.DownloadAccountData();
			DebugLog.Log('downloading account profile picture...');
			await this.DownloadAccountProfilePicture();

			localStorage.removeItem(lskey_login_attempts);
			localStorage.removeItem(lskey_login_forced);

			document.getElementById('action-bar-btn-login').style.display = 'none';
			//document.getElementById('action-bar-btn-login-label').innerText = 'Renew Login';
			document.getElementById('action-bar-btn-logout').style.display = 'block';

			DebugLog.SubmitGroup('#0f04');
			UserAccountManager.account_provider.logged_in = true;
		}
		else
		{
			DebugLog.Log('! authorization required');
			document.getElementById('action-bar-btn-login').style.display = 'block';
			//document.getElementById('action-bar-btn-login-label').innerText = 'Login To O365';
			document.getElementById('action-bar-btn-logout').style.display = 'none';
			DebugLog.SubmitGroup('#f004');
			UserAccountManager.account_provider.logged_in = false;
		}
		UserAccountManager.account_provider.logging_in = false;
	}


	AttemptReauthorize(reason = '')
	{
		const max_login_attempts = 1;

		let login_attempts = localStorage.getItem(lskey_login_attempts);
		if (!login_attempts) login_attempts = 0;

		if (login_attempts < max_login_attempts)
		{
			login_attempts += 1;
			localStorage.setItem(lskey_login_attempts, login_attempts);
			DebugLog.Log('reauthorize attempt ' + login_attempts + ' :: ' + (reason ? reason : 'no reason given'));
			this.InitiateLogin();
		}
	}

	GetAuthorizationURL()
	{
		let force = localStorage.getItem(lskey_login_forced);
		let url = url_mo_oauth;
		url += "?response_type=id_token+token";
		url += "&response_mode=fragment";
		url += "&client_id=" + CLIENT_ID;
		if (force && force == 1) url += "&prompt=select_account";
		url += "&redirect_uri=" + UserAccountManager.GetRedirectUri();
		url += "&scope=" + CLIENT_SCOPES;
		url += "&nonce=" + UserAccountManager.GetNonce();
		return url;
	}

	InitiateLogin()
	{
		var auth_url = this.GetAuthorizationURL();
		window.open(auth_url, "_self");
	}

	ClearCachedData()
	{
		this.access_token = '';
		this.has_access_token = false;
		this.id_token = '';
		this.has_id_token = false;
		localStorage.removeItem(lskey_user_data);
		localStorage.removeItem(lskey_id_token);
		localStorage.removeItem(lskey_access_token);
	}

	InitiateAccountSelection()
	{
		DebugLog.Log('Forced account selection');
		this.ClearCachedData();
		localStorage.setItem(lskey_login_forced, 1);

		this.InitiateLogin(); // immediately sends the user to login
		//window.open(UserAccountManager.GetRedirectUri(), "_self"); // reloads AURA logged out
	}

	GatherLocationTokens()
	{
		let dirty_location = false;

		let id_token_match = window.location.toString().match(rgx_id_token);
		if (id_token_match != null)
		{
			this.UpdateIdToken(id_token_match[1], true);
			dirty_location = true;
		}

		let access_token_match = window.location.toString().match(rgx_access_token);
		if (access_token_match != null)
		{
			this.UpdateAccessToken(access_token_match[1], true);
			dirty_location = true;
		}

		return dirty_location;
	}

	async DownloadAccountData()
	{
		DebugLog.StartGroup('downloading account data');
		var resp = await fetch(
			"https://graph.microsoft.com/v1.0/me",
			{
				method: 'get',
				headers:
				{
					'Authorization': 'Bearer ' + this.access_token,
					'Accept': 'application/json'
				}
			}
		);

		if (resp.status == 200)
		{
			this.UpdateAccountInfo(JSON.parse(await resp.text()));
			DebugLog.SubmitGroup('#0f04');
		}
		else
		{
			DebugLog.SubmitGroup('#f004');
		}
	}

	UpdateAccountInfo(info_obj = {})
	{
		let id_at = info_obj.mail.indexOf("@");

		UserAccountInfo.account_info.user_id = id_at > -1 ? info_obj.mail.substring(0, id_at) : info_obj.mail;
		UserAccountInfo.account_info.display_name = info_obj.displayName;
		UserAccountInfo.account_info.email = info_obj.mail;

		localStorage.setItem(lskey_user_data, JSON.stringify(UserAccountInfo.account_info));

		DebugLog.Log("...account: " + UserAccountInfo.account_info.user_id);
	}

	async DownloadAccountProfilePicture()
	{
		try
		{
			var resp = await fetch(
				"https://graph.microsoft.com/v1.0/me/photos/240x240/$value",
				{
					method: 'get',
					headers: { 'Authorization': 'Bearer ' + this.access_token }
				}
			);

			if (resp.status === 401) this.AttemptReauthorize('unauthorized');

			this.account_profile_picture_url = window.URL.createObjectURL(await resp.blob());
			document.getElementById('action-bar-profile-picture').src = this.account_profile_picture_url;
		}
		catch (e)
		{
			this.AttemptReauthorize(e);
		}
	}
}

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

	static GetRedirectUri(force_secure_protocol = false)
	{
		let n = window.location.toString();
		n = n.replace(window.location.search, "");
		n = n.replace('?', '');
		n = n.replace(window.location.hash, "");
		n = n.replace('#', '');
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
		return;
		UserAccountManager.account_provider.AttemptReauthorize(reason);
	}

	static ForceLogOut()
	{
		UserAccountManager.account_provider.InitiateAccountSelection();
	}

	static async CheckWindowLocationForCodes()
	{
		if (UserAccountManager.account_provider.GatherLocationTokens())
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
	static user_permissions = []; // internal user aura permissions

	static hr_info = {}; // internal user hr data

	static UpdateUserInfo()
	{
		if (!SharedData.users || SharedData.users.length < 1)
		{
			DebugLog.Log('SharedData.users invalid');
			return;
		}
		if (!UserAccountInfo.account_info) 
		{
			DebugLog.Log('UserAccountInfo.account_info invalid');
			return;
		}

		let got = SharedData.GetUserData(UserAccountInfo.account_info.user_id);
		if (got && got.display_name_full)
		{
			DebugLog.Log('internal user data match: ' + got.display_name_full);
			UserAccountInfo.user_info = got;
			UserAccountInfo.user_permissions = SharedData.GetPermDatum(UserAccountInfo.user_info.user_permissions.split(';'));
		}
		else
		{
			DebugLog.Log('no internal user data match', "#f00");
		}

		UserAccountInfo.hr_info.requests = SharedData.GetHrRequestDatum(UserAccountInfo.account_info.user_id);
		DebugLog.Log("Collected " + UserAccountInfo.hr_info.requests.length + " hr requests");
	}
}

SharedData.onLoaded.RequestSubscription(() => { UserAccountInfo.UpdateUserInfo(); });

Modules.Report("User Account");
if (!window.fxn) window.fxn = {};
window.fxn.AttemptLogin = UserAccountManager.RequestLogin;
window.fxn.ForceLogOut = UserAccountManager.ForceLogOut;