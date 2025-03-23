import { DebugLog } from "./debuglog.js";
import { Modules } from "./modules.js";
import { EventSource } from "./eventsource.js";

const id_mo_tenant = 'af0df1fe-2a14-4718-8660-84733b9b72bc';
const url_mo = 'https://login.microsoftonline.com/' + id_mo_tenant + '/';
const url_mo_oauth = url_mo + 'oauth2/v2.0/authorize';
const url_mo_token = url_mo + 'oauth2/v2.0/token';

const rgx_access_token = /[\#\&\?]access_token\=([^\&]+)/;
const rgx_id_token = /[\#\&\?]id_token\=([^\&]+)/;
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

export class UserAccountManager
{
	// id token - used to obtain tenant account info
	static id_token = '';
	static id_token_found = false;

	// access token - used for authorizing api calls
	static access_token = '';
	static access_token_found = false;

	static IsValidString(str)
	{
		return str !== undefined && str !== null && typeof str === 'string' && str !== 'undefined' && str !== 'null';
	}

	static KeyString(str)
	{
		return str.substring(0, 32).split('').map(x => (Math.random() > 0.42) ? x : '*').join('') + '...';
	}

	static UpdateIdToken(new_value)
	{
		if (UserAccountManager.IsValidString(new_value))
		{
			UserAccountManager.id_token = new_value;
			UserAccountManager.id_token_found = true;
		}
		else console.warn("Invalid ID Token!");
	}

	static LoadExistingAccessToken()
	{
		DebugLog.StartGroup('loading cached access token');
		let tmp = localStorage.getItem(lskey_access_token);
		if (tmp)
		{
			DebugLog.Log('...found token');
			UserAccountManager.UpdateAccessToken(tmp);
			DebugLog.SubmitGroup('#0f04');
		}
		else
		{
			DebugLog.Log('...token not found');
			DebugLog.SubmitGroup('#ff04');
		}
	}

	static UpdateAccessToken(new_value, update_store = false)
	{
		if (new_value && UserAccountManager.IsValidString(new_value))
		{
			UserAccountManager.access_token = new_value;
			UserAccountManager.access_token_found = true;
			if (update_store) localStorage.setItem(lskey_access_token, UserAccountManager.access_token);
		}
	}

	static GetNonce() { return Math.floor(Math.random() * 8999999) + 1000000; }

	static GetAuthURL()
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
		DebugLog.StartGroup('autologin');
		UserAccountInfo.LoadCachedUserData();
		UserAccountManager.LoadExistingAccessToken();

		if (UserAccountManager.access_token_found)
		{
			if (!UserAccountInfo.user_info.user_id)
				await UserAccountInfo.GetCurrentUserInfo();

			await UserAccountInfo.RefreshCurrentUserProfilePhoto();

			localStorage.removeItem(lskey_login_attempts);
			localStorage.removeItem(lskey_login_forced);

			document.getElementById('action-bar-btn-login').innerText = 'Renew Login';
			document.getElementById('action-bar-btn-logout').style.display = 'block';
			DebugLog.SubmitGroup('#0f04');
		}
		else
		{
			DebugLog.Log('! authorization required');
			document.getElementById('action-bar-btn-login').innerText = 'Login To O365';
			document.getElementById('action-bar-btn-logout').style.display = 'none';
			DebugLog.SubmitGroup('#f004');
		}
	}

	static RequestLogin()
	{
		var auth_url = UserAccountManager.GetAuthURL();
		console.warn('redirect: ' + UserAccountManager.GetRedirectUri());
		window.open(auth_url, "_self");
	}

	static MaybeAttemptReauthorize(reason = '')
	{
		const max_login_attempts = 1;

		let login_attempts = localStorage.getItem(lskey_login_attempts);
		if (!login_attempts) login_attempts = 0;

		if (login_attempts < max_login_attempts)
		{
			let login_attempts_new = login_attempts ? (login_attempts + 1) : 1;
			localStorage.setItem(lskey_login_attempts, login_attempts_new);
			DebugLog.Log('reauthorize attempt ' + login_attempts_new + ' :: ' + (reason ? reason : 'no reason given'));
			UserAccountManager.RequestLogin();
		}
	}

	static ForceLogOut()
	{
		DebugLog.Log('Forced logout');
		UserAccountManager.access_token = '';
		UserAccountManager.access_token_found = false;
		localStorage.setItem(lskey_login_forced, 1);
		localStorage.removeItem(lskey_user_data);
		localStorage.removeItem(lskey_access_token);
		window.open(UserAccountManager.GetRedirectUri(), "_self");
	}

	static async RequestAccessToken()
	{
		DebugLog.StartGroup('requesting access token');
		try
		{
			let resp = await fetch(
				url_mo_token,
				{
					method: 'post',
					body: new URLSearchParams(
						{
							client_id: CLIENT_ID,
							grant_type: 'authorization_code',
							code: UserAccountManager.oauth_code,
							scope: CLIENT_SCOPES,
							redirect_uri: UserAccountManager.GetRedirectUri()
						}
					),
					headers:
					{
						'Content-Type': 'application/x-www-form-urlencoded'
					}
				}
			);

			let resp_obj = await resp.json();
			UserAccountManager.UpdateAccessToken(resp_obj.access_token);
			DebugLog.SubmitGroup('green');
		}
		catch (e)
		{
			console.error(e);
			DebugLog.SubmitGroup('red');
		}
	}

	static async CheckWindowLocationForCodes()
	{
		let dirty_location = false;

		let id_token_match = window.location.toString().match(rgx_id_token);
		if (id_token_match != null)
		{
			UserAccountManager.UpdateIdToken(id_token_match[1]);
			dirty_location = true;
		}

		let access_token_match = window.location.toString().match(rgx_access_token);
		if (access_token_match != null)
		{
			UserAccountManager.UpdateAccessToken(access_token_match[1], true);
			dirty_location = true;
		}

		if (dirty_location)
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
	static user_info = {};

	static async GetCurrentUserInfo()
	{
		DebugLog.StartGroup('downloading account info');
		var resp = await fetch(
			"https://graph.microsoft.com/v1.0/me",
			{
				method: 'get',
				headers:
				{
					'Authorization': 'Bearer ' + UserAccountManager.access_token,
					'Accept': 'application/json'
				}
			}
		);
		var resp_obj = await resp.json();

		UserAccountInfo.user_info.display_name = resp_obj.displayName;
		UserAccountInfo.user_info.email = resp_obj.mail;

		let id_at = resp_obj.mail.indexOf("@");
		UserAccountInfo.user_info.user_id = id_at > -1 ? resp_obj.mail.substring(0, id_at) : resp_obj.mail;

		DebugLog.Log("...user: " + UserAccountInfo.user_info.user_id);

		localStorage.setItem(lskey_user_data, JSON.stringify(UserAccountInfo.user_info));
		DebugLog.SubmitGroup('#0f04');
	}

	static LoadCachedUserData()
	{
		DebugLog.StartGroup('loading cached account info');
		let tmp = JSON.parse(localStorage.getItem(lskey_user_data));
		if (tmp)
		{
			UserAccountInfo.user_info = tmp;
			DebugLog.Log('...found info');
			DebugLog.SubmitGroup('#0f04');
		}
		else 
		{
			UserAccountInfo.user_info = {};
			DebugLog.Log('...info not found');
			DebugLog.SubmitGroup('#ff04');
		}
	}

	static async RefreshCurrentUserProfilePhoto()
	{
		try
		{
			var resp = await fetch(
				"https://graph.microsoft.com/v1.0/me/photos/432x432/$value",
				{
					method: 'get',
					headers: { 'Authorization': 'Bearer ' + UserAccountManager.access_token }
				}
			);

			if (resp.status === 401) UserAccountManager.MaybeAttemptReauthorize();

			let imgUrl = window.URL.createObjectURL(await resp.blob());
			document.getElementById('action-bar-profile-picture').src = imgUrl;
		}
		catch (e)
		{
			UserAccountManager.MaybeAttemptReauthorize();
		}
	}

}

Modules.Report("User Account");
if (!window.fxn) window.fxn = {};
window.fxn.AttemptLogin = UserAccountManager.RequestLogin;
window.fxn.ForceLogOut = UserAccountManager.ForceLogOut;