import { Modules } from "../modules.js";
import { NotificationLog } from "../notificationlog.js";

export class AccountState extends EventTarget
{
	constructor()
	{
		super();

		this.logged_in = false;

		this.busy = false;
		this.logging_in = false;
		this.logging_out = false;

		this.log_in_attempts = 0;
		this.log_in_failed = false;
		this.log_in_error = undefined;
	}

	ResetLogInAttemptCount() { this.log_in_attempts = 0; }

	#dispatch(event = '') { this.dispatchEvent(new CustomEvent(event, { detail: this })); }

	async TryLogIn()
	{
		this.#dispatch('beforelogin');

		this.busy = true;
		this.logging_in = true;
		this.log_in_attempts++;
		await this.OnTryLogIn();
		this.log_in_failed = this.logged_in !== true;
		this.logging_in = false;
		this.busy = false;

		if (this.log_in_failed === true) this.#dispatch('afterloginfailed');
		else this.#dispatch('afterlogin');
	}

	async TryLogOut()
	{
		this.busy = true;
		this.logging_out = true;
		await this.OnTryLogOut();
		this.logging_out = false;
		this.busy = false;
		this.#dispatch('afterlogout');
	}

	async VerifyAccess()
	{
		let result = await this.OnVerifyAccess();
		if (result) this.#dispatch('afterverify');
		else this.#dispatch('afterverifyfailed');
		return result;
	}

	async RefreshAccess()
	{
		await this.OnRefreshAccess();
	}

	async OnTryLogIn() { NotificationLog.Log('<< LOGIN >> NOT IMPLEMENTED'); }
	async OnTryLogOut() { NotificationLog.Log('<< LOGOUT >> NOT IMPLEMENTED'); }

	async OnVerifyAccess() { NotificationLog.Log('<< VERIFY >> NOT IMPLEMENTED'); }
	async OnRefreshAccess() { NotificationLog.Log('<< REFRESH >> NOT IMPLEMENTED'); }
}

Modules.Report("Account States", "This module introduces the AccountState, which manages the log-in state of 3rd party accounts.");