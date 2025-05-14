import { DebugLog } from "../debuglog.js";
import { RequestBatch, RequestBatchRequest, SharePoint } from "../remotedata/sharepoint.js";
import { UserAccountInfo, UserAccountManager } from "../useraccount.js";
import { UserAccountProvider } from "./user_account_provider_base.js";


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