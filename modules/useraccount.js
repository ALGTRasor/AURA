import { DebugLog } from "./debuglog.js";
import { Modules } from "./modules.js";
import { EventSource, EventSourceSubscription } from "./eventsource.js";
import { SharedData } from "./datashared.js";
import { RequestBatch, RequestBatchRequest, SharePoint } from "./sharepoint.js";
import { OverlayManager } from "./ui/overlays.js";
import { PageManager } from "./pagemanager.js";
import { InternalUser } from "./datamodels/internal_user.js";

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
	'Sites.ReadWrite.All',
	'Files.Read.All'
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
			if (tmp_account_info_parsed)
			{
				UserAccountInfo.account_info = tmp_account_info_parsed;
				UserAccountInfo.UpdateIdentity();
			}
			else success = false;
		}
		else success = false;

		if (success) DebugLog.Log('...account data found');
		else DebugLog.Log('...account data not found');
	}

	async AttemptAutoLogin()
	{
		UserAccountManager.account_provider.logging_in = true;

		DebugLog.StartGroup('autologin');
		this.LoadCachedData();

		if (this.has_access_token) // may still be invalid or expired
		{
			let reqs = [
				new RequestBatchRequest(
					'get', '/me/',
					_ => { this.UpdateAccountInfo(_.body); },
					_ => { }
				),
				new RequestBatchRequest(
					'get', '/me/photos/240x240/$value',
					_ => { this.UpdateAccountProfilePicture(_); },
					_ =>
					{
						_.headers = SharePoint.GetAuthOnlyHeaders();
						_.headers['Content-Type'] = 'application/json';
					}
				),
			];

			await SharePoint.ProcessBatchRequests(new RequestBatch(reqs));

			localStorage.removeItem(lskey_login_attempts);
			localStorage.removeItem(lskey_login_forced);

			DebugLog.SubmitGroup('#0f04');
			UserAccountManager.account_provider.logged_in = true;
		}
		else
		{
			DebugLog.Log('! authorization required');
			DebugLog.SubmitGroup('#f004');
			UserAccountManager.account_provider.logged_in = false;
		}
		UserAccountManager.account_provider.logging_in = false;
	}

	async AfterAuthenticationError()
	{

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

	/*
	async DownloadAccountData()
	{
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
			await UserAccountInfo.DownloadUserInfo();
		}
	}
	*/

	UpdateAccountInfo(info_obj = {})
	{
		let id_at = info_obj.mail.indexOf("@");

		UserAccountInfo.account_info.user_id = id_at > -1 ? info_obj.mail.substring(0, id_at) : info_obj.mail;
		UserAccountInfo.account_info.display_name = info_obj.displayName;
		UserAccountInfo.account_info.email = info_obj.mail;

		if (window.spoof_data)
		{
			if (window.spoof_data.user_id) UserAccountInfo.account_info.user_id = window.spoof_data.user_id;
			if (window.spoof_data.display_name) UserAccountInfo.account_info.display_name = window.spoof_data.display_name;
			if (window.spoof_data.mail) UserAccountInfo.account_info.email = window.spoof_data.mail;
		}

		localStorage.setItem(lskey_user_data, JSON.stringify(UserAccountInfo.account_info));
		DebugLog.Log("user id: " + UserAccountInfo.account_info.user_id);
		UserAccountInfo.UpdateIdentity();
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

			this.account_profile_picture_url = window.URL.createObjectURL(await resp.blob());
			document.getElementById('action-bar-profile-picture').src = this.account_profile_picture_url;
		}
		catch (e)
		{
			this.AttemptReauthorize(e);
		}
	}

	async UpdateAccountProfilePicture(resp)
	{
		document.getElementById('action-bar-profile-picture').src = 'data:image/jpeg;base64,' + resp.body;
		return;

		let blob = new Blob([resp.body], { type: 'image/png' });
		this.account_profile_picture_url = window.URL.createObjectURL(blob);
		document.getElementById('action-bar-profile-picture').src = this.account_profile_picture_url;
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

	static UpdateIdentity()
	{
		UserAccountInfo.has_ms_account = UserAccountInfo.account_info && 'email' in UserAccountInfo.account_info && typeof UserAccountInfo.account_info.email === 'string';
		UserAccountInfo.is_alg_account = UserAccountInfo.has_ms_account && UserAccountInfo.account_info.email.endsWith('@arrowlandgroup.com');
		UserAccountInfo.app_access = UserAccountInfo.HasAppAccess();
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

	static app_access_permission = 'aura.access';

	static HasAppAccess() { return UserAccountInfo.HasPermission(UserAccountInfo.app_access_permission); }

	static HasPermission(permission_id = '')
	{
		if (typeof permission_id !== 'string' || permission_id.length < 1) return true;
		let existing_id = UserAccountInfo.IndexOfPermission(permission_id);
		return existing_id > -1;
	}

	static async DownloadUserInfo()
	{
		const sp_site = 'ALGInternal';
		let user_record = await SharePoint.DownloadRecord(sp_site, 'ALGUsers', `fields/Title eq '${UserAccountInfo.account_info.user_id}'`, InternalUser.data_model.fields);
		if (user_record)
		{
			let prop_count = 0;
			for (let prop in user_record)
			{
				UserAccountInfo.user_info[prop] = user_record[prop];
				prop_count++;
			}

			UserAccountInfo.UpdateIdentity();

			DebugLog.Log('...downloaded user info');
			DebugLog.Log('display name: ' + UserAccountInfo.user_info.display_name_full);
			DebugLog.Log('user properties: ' + prop_count);
			DebugLog.Log('app access: ' + (UserAccountInfo.app_access === true));
		}
		else
		{
			UserAccountInfo.UpdateIdentity();
			DebugLog.Log('...could not download user info', true, "#f00");
		}

	}

	static UpdateUserSharedData()
	{
		UserAccountInfo.user_permissions = SharedData.GetPermDatum(UserAccountInfo.user_info.user_permissions.split(';'));
		UserAccountInfo.hr_info.requests = SharedData.GetHrRequestDatum(UserAccountInfo.account_info.user_id);
		DebugLog.Log('permission count: ' + UserAccountInfo.user_permissions.length);
		DebugLog.Log('hr request count: ' + UserAccountInfo.hr_info.requests.length);
	}
}

SharedData.onLoaded.RequestSubscription(() => { UserAccountInfo.UpdateUserSharedData(); });

Modules.Report('User Account', 'This module downloads and caches data for your tenant / company account.');
if (!window.fxn) window.fxn = {};
window.fxn.AttemptLogin = UserAccountManager.RequestLogin;
window.fxn.ForceLogOut = UserAccountManager.ForceLogOut;