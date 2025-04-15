import { InternalUserSummary } from "./panel_internal_user_summary.js";
import { RecordListPanelBase } from "./panel_record_list_base.js";

export class InternalUserList extends RecordListPanelBase
{
	GetPanelTitle() { return 'Internal User List'; }
	GetListLabel() { return 'Internal Users'; }
	GetRecordTitleField() { return 'Title'; }
	GetRecordTitleLabel() { return 'User ID'; }

	CreateRecordSummary(record = {})
	{
		let summary = new InternalUserSummary();
		summary.record = record;
		summary.Create(this.e_root);
		this.PushChild(summary);
	}

	GetSpoofRecord()
	{
		let spoof = {};
		spoof.Title = 'user.id.' + (Math.round(Math.random() * 899999) + 100000);
		spoof.display_name_full = 'User Name ' + (Math.round(Math.random() * 899999) + 100000);
		spoof.user_team = '';
		spoof.user_role = '';
		spoof.user_manager_id = '';
		spoof.email_work = '';
		spoof.email_home = '';
		spoof.address_work = '';
		spoof.address_home = '';
		spoof.phone_work = '';
		spoof.phone_home = '';
		spoof.user_birthdate = '';
		spoof.date_start = '';
		spoof.date_end = '';
		return spoof;
	}
}