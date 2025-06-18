import { ActionBar } from "../actionbar.js";
import { DebugLog } from "../debuglog.js";
import { NotificationLog } from "../notificationlog.js";
import { RequestBatch, RequestBatchRequest, SharePoint } from "../remotedata/sharepoint.js";
import { UserAccountInfo, UserAccountManager } from "../useraccount.js";
import { addElement } from "../utils/domutils.js";
import { getDurationString } from "../utils/timeutils.js";
import { until } from "../utils/until.js";
import { UserAccountProvider } from "./user_account_provider_base.js";


const id_mo_tenant = 'af0df1fe-2a14-4718-8660-84733b9b72bc';
const url_mo = 'https://login.microsoftonline.com/' + id_mo_tenant + '/';
const url_mo_oauth = url_mo + 'oauth2/v2.0/authorize';
const url_mo_token = url_mo + 'oauth2/v2.0/token';

const rgx_access_token = /[\#\&\?]access_token\=([^\&]+)/;
const rgx_refresh_token = /[\#\&\?]refresh_token\=([^\&]+)/;
const rgx_id_token = /[\#\&\?]id_token\=([^\&]+)/;

const lskey_id_token = 'o365_id_token_latest';
const lskey_access_token = 'o365_access_token_latest';
const lskey_refresh_token = 'o365_refresh_token_latest';
const lskey_auth_datetime = 'ms-auth-last';

const lskey_user_data = 'o365_user_data';
const lskey_login_attempts = 'account_login_attempts';
const lskey_login_forced = 'account_login_forced';

const CLIENT_ID = "ea723209-ebaa-402a-8ff0-ffe4a49b3282";
const CLIENT_SCOPES = [
	'openid',
	'offline_access',
	'user.read',
	'Sites.ReadWrite.All',
	'Files.Read.All'
].join(' ');


export class MSAccountProvider extends UserAccountProvider
{

	constructor() { super(); }

	UpdateAccessToken(new_value, update_store = false)
	{
		if (new_value && UserAccountManager.IsValidString(new_value))
		{
			this.access_token = new_value;
			this.has_access_token = true;
			if (update_store)
			{
				localStorage.setItem(lskey_access_token, this.access_token);
				console.warn('got access token: ' + this.access_token.slice(0, 36) + '...');
			}
		}
	}

	UpdateRefreshToken(new_value, update_store = false)
	{
		if (new_value && UserAccountManager.IsValidString(new_value))
		{
			this.refresh_token = new_value;
			this.has_refresh_token = true;
			if (update_store)
			{
				localStorage.setItem(lskey_refresh_token, this.refresh_token);
				console.warn('got refresh token: ' + this.refresh_token.slice(0, 36) + '...');
			}
		}
	}

	UpdateIdToken(new_value, update_store = false)
	{
		if (new_value && UserAccountManager.IsValidString(new_value))
		{
			this.id_token = new_value;
			this.has_id_token = true;
			if (update_store)
			{
				localStorage.setItem(lskey_id_token, this.id_token);
				console.warn('got id token: ' + this.id_token.slice(0, 36) + '...');
			}
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

		DebugLog.Log('autologin start');
		this.LoadCachedData();

		if (this.has_access_token) // may still be invalid or expired
		{
			await this.VerifyAccess();

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

			DebugLog.Log('autologin done');
			UserAccountManager.account_provider.logged_in = true;
		}
		else
		{
			DebugLog.Log('! authorization required');
			DebugLog.Log('autologin failed');
			UserAccountManager.account_provider.logged_in = false;
		}
		UserAccountManager.account_provider.logging_in = false;
	}

	async AfterAuthenticationError()
	{
		this.InitiateLogin();
	}

	async VerifyAccess()
	{
		await this.TryFetchNewToken();
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

	GetAuthorizationURL(response_mode = 'fragment')
	{
		let force = localStorage.getItem(lskey_login_forced);
		let url = url_mo_oauth;
		url += "?response_type=id_token+token";
		url += "&response_mode=" + response_mode;
		url += "&client_id=" + CLIENT_ID;
		if (force && force == 1) url += "&prompt=select_account";
		url += "&redirect_uri=" + UserAccountManager.GetRedirectUri();
		url += "&scope=" + CLIENT_SCOPES;
		url += "&nonce=" + UserAccountManager.GetNonce();
		return url;
	}

	InitiateLogin() { window.open(this.GetAuthorizationURL(), "_self"); }

	GetTokenTimeRemaining()
	{
		let lsitem = localStorage.getItem(lskey_auth_datetime);
		if (lsitem)
		{
			let expire_datetime = Number.parseInt(lsitem);
			let now_ms = new Date().valueOf();
			const refresh_buffer_ms = 1000 * 60 * 10;
			return expire_datetime - now_ms - refresh_buffer_ms;
		}
		return 0;
	}

	#HookAuthFrame()
	{
		if (this.auth_frame_hooked === true) return;
		this.auth_frame_hooked = true;

		this.e_auth_frame = document.getElementById('auth-frame');
		window.addEventListener(
			'message',
			_ => { this.#OnAuthFrameMessage(_); },
			false
		);
	}

	#OnAuthFrameMessage(e)
	{
		switch (e.data.message)
		{
			case 'AuthFrameInit': this.auth_frame_location = e.data.location_string; break;
			default: console.warn('From AuthFrame: ' + e.data.message); break;
		}
	}

	async TryFetchNewToken(force_new = false)
	{
		return;
		let was_hooked = this.auth_frame_hooked === true;

		if (!this.e_auth_frame) this.e_auth_frame = document.getElementById('auth-frame');
		if (!this.e_auth_frame)
		{
			//<iframe id='auth-frame' class='auth-frame' title='auth-frame'></iframe>
			this.e_auth_frame = addElement(document.body, 'iframe', 'auth-frame', '', _ => { _.title = 'auth-frame'; _.id = 'auth-frame'; });
		}
		this.#HookAuthFrame();

		if (was_hooked === true && force_new !== true)
		{
			let time_left = this.GetTokenTimeRemaining();
			if (time_left > 0)
			{
				console.warn(getDurationString(time_left) + ' until token expires');
				return;
			}
		}

		this.e_auth_frame.contentWindow.postMessage({ message: 'AuthFrameInit' }, '*');

		this.e_auth_frame.setAttribute(
			'src',
			url_mo_oauth + '?' + [
				`client_id=${CLIENT_ID}`, `scope=${CLIENT_SCOPES}`,
				`response_type=token`, `response_mode=fragment`,
				`redirect_uri=${UserAccountManager.GetRedirectUri()}`,
				`nonce=${UserAccountManager.GetNonce()}`,
				`prompt=none`,
			].join('&')
		);

		const valid_content = () =>
		{
			return this.auth_frame_location !== 'about:blank' && this.e_auth_frame.contentWindow.document.readyState === 'complete';
		};
		await until(valid_content);

		let match_access_token = /\/\#access\_token=([^\&]+)/.exec(this.auth_frame_location);
		if (match_access_token) 
		{
			this.UpdateAccessToken(match_access_token[1], true);
			NotificationLog.Log('Access Refreshed', '#0f0');
			console.warn('renewed access token');
		}
		let match_expires_in = /\&expires\_in\=([^\&]+)/.exec(this.auth_frame_location);
		if (match_expires_in)
		{
			//let req_parse = typeof match_expires_in[1] === 'string';
			let expires_minutes = 50;// req_parse ? Number.parseInt(match_expires_in[1]) : match_expires_in[1];
			let duration = getDurationString(expires_minutes * 60 * 1000);
			console.warn('will expire in ' + duration);

			let expire_datetime = new Date();
			expire_datetime = new Date(expire_datetime.setSeconds(expire_datetime.getSeconds() + expires_minutes * 60));
			localStorage.setItem(lskey_auth_datetime, expire_datetime.valueOf());
		}

		//await sleep(250);
		//this.e_auth_frame.setAttribute('src', '');
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
		let locationString = window.location.toString();

		const try_read = (rgx, with_value = _ => { }) =>
		{
			let match = locationString.match(rgx);
			if (match != null)
			{
				with_value(match[1]);
				dirty_location = true;
			}
		};

		try_read(rgx_id_token, _ => this.UpdateIdToken(_, true));
		try_read(rgx_access_token, _ => this.UpdateAccessToken(_, true));
		try_read(rgx_refresh_token, _ => this.UpdateRefreshToken(_, true));

		return dirty_location;
	}

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
			ActionBar.SetProfileImageSource(this.account_profile_picture_url);
		}
		catch (e)
		{
			this.AttemptReauthorize(e);
		}
	}

	async UpdateAccountProfilePicture(resp) { ActionBar.SetProfileImageSource('data:image/jpeg;base64,' + resp.body); }
}