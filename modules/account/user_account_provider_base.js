export class UserAccountProvider
{
	static Nothing = new UserAccountProvider();

	constructor()
	{
		this.logging_in = false;
		this.logged_in = false;

		this.has_id_token = false;
		this.id_token = '';

		this.has_access_token = false;
		this.access_token = '';

		this.account_profile_picture_url = '';
	}

	GatherLocationTokens() { return false; } // checks the window location for query or hash provided auth tokens

	LoadCachedData() { } // loads cached auth tokens and account data
	async AttemptAutoLogin() { } // attempts to login using cached credentials
	AttemptReauthorize() { } // automatically initiates the login flow until out of tries, triggered by api call auth errors

	GetAuthorizationURL() { return ''; } // gets the url used to send the user to authorization
	InitiateLogin() { } // sends the user to the auth page

	async DownloadAccountData() { } // uses account credentials to fetch authorized account details
	async DownloadAccountProfilePicture() { } // uses account credentials to fetch authorized account profile picture

	async InitiateAccountSelection() { } // forces a logout and sends the user to authorization 

	ClearCachedData() { } // clears cached account info, usually to prepare for logout
}