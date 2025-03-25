import { SharedData } from "../datashared.js";
import { DebugLog } from "../debuglog.js";
import { PageManager } from "../pagemanager.js";
import { UserAccountInfo } from "../useraccount.js";
import { PageBase } from "./pagebase.js";

const rgx_datetime = /(\d{4})\-(\d{2})\-(\d{2})(?:T(\d\d\:\d\d\:\d\d)Z?)?/;

export class PageMyData extends PageBase
{
	GetTitle() { return 'my data'; }
	CreateElements(parent)
	{
		if (!parent) return;

		this.sub_SharedDataRefresh = {};

		this.CreateBody();
		this.e_body.style.minWidth = '300px';

		this.e_content.style.flexWrap = 'wrap';
		this.e_content.style.flexDirection = 'row';

		this.CreateAccountInfoBlock();
		this.CreateUserInfoBlock();

		this.FinalizeBody(parent);
	}

	CreateAccountInfoBlock()
	{
		this.e_account_info = document.createElement('div');
		this.e_account_info.className = 'page-content-root-block';
		this.UpdateAccountInfoBlock();
		this.e_content.appendChild(this.e_account_info);
	}
	UpdateAccountInfoBlock()
	{
		this.e_account_info.innerHTML = `<div style='text-align:center;opacity:60%;'>Account Info</div>`;
		for (let pid in UserAccountInfo.account_info) 
		{
			if (pid.startsWith('@')) continue;
			if (pid == 'id') continue;
			this.e_account_info.innerHTML += PageMyData.GetInfoRow(pid, UserAccountInfo.account_info[pid]);
		}
	}

	CreateUserInfoBlock()
	{
		this.e_user_info = document.createElement('div');
		this.e_user_info.className = 'page-content-root-block';
		this.e_user_info.style.minWidth = '24rem';

		this.UpdateUserInfoBlock();
		this.e_content.appendChild(this.e_user_info);
	}
	UpdateUserInfoBlock()
	{
		if (UserAccountInfo.user_info)
		{
			this.e_user_info.innerHTML = `<div style='text-align:center;opacity:60%;'>User Info</div>`;
			for (let pid in UserAccountInfo.user_info) 
			{
				if (pid.startsWith('@')) continue;
				if (pid == 'id') continue;
				this.e_user_info.innerHTML += PageMyData.GetInfoRow(pid, UserAccountInfo.user_info[pid]);
			}
		}
		else
		{
			let div_title = `<div style='text-align:center;opacity:60%;'>User Info</div>`;
			this.e_user_info.innerHTML = div_title + `<div>? ? ?</div>`;
		}
	}

	static ValueOptionsDefault = { label: '? ? ?', sensitive: false, exclude: false, format_mode: null };
	static ValueOptions =
		{
			'user_id': { label: 'user id', sensitive: false, exclude: false, format_mode: null },
			'display_name': { label: 'full name', sensitive: false, exclude: false, format_mode: null },
			'email': { label: 'tenant email', sensitive: false, exclude: false, format_mode: null },

			'Title': { label: 'user id', sensitive: false, exclude: false, format_mode: null },
			'display_name_full': { label: 'legal name', sensitive: false, exclude: false, format_mode: null },
			'user_role': { label: 'role(s)', sensitive: false, exclude: false, format_mode: 'role' },
			'user_team': { label: 'department', sensitive: false, exclude: false, format_mode: 'team' },
			'user_manager_id': { label: 'manager id', sensitive: false, exclude: false, format_mode: 'user' },
			'date_start': { label: 'tenure start', sensitive: false, exclude: false, format_mode: 'date' },
			'date_end': { label: 'tenure end', sensitive: false, exclude: false, format_mode: 'date' },
			'email_work': { label: 'work email', sensitive: false, exclude: false, format_mode: null },
			'email_home': { label: 'personal email', sensitive: true, exclude: false, format_mode: null },
			'phone_ext': { label: 'office ext', sensitive: false, exclude: false, format_mode: null },
			'phone_work': { label: 'work phone', sensitive: false, exclude: true, format_mode: null },
			'phone_home': { label: 'mobile phone', sensitive: true, exclude: false, format_mode: null },
			'address_work': { label: 'work address', sensitive: false, exclude: false, format_mode: null },
			'address_home': { label: 'home address', sensitive: true, exclude: false, format_mode: null },
			'user_birthdate': { label: 'date of birth', sensitive: false, exclude: false, format_mode: 'date' },
			'user_permissions': { label: 'permissions', sensitive: false, exclude: false, format_mode: 'list' },
			'user_notes': { label: 'notes', sensitive: true, exclude: false, format_mode: null },
			'first_login_ts': { label: 'first login', sensitive: false, exclude: true, format_mode: 'datetime' },
		};

	static GetValueOptions(label_raw = '')
	{
		if (!label_raw || typeof label_raw !== 'string') return PageMyData.ValueOptionsDefault;

		let got_opts = PageMyData.ValueOptions[label_raw];
		return got_opts ? got_opts : PageMyData.ValueOptionsDefault;
	}

	static GetInfoRow(label = '', value = '', format = true)
	{
		let row_opts = PageMyData.GetValueOptions(label);
		if (row_opts.exclude) return '';

		let sensitive_attr = row_opts.sensitive ? "class='sensitive-info'" : '';
		label = row_opts.label;
		let labelUpper = label.toUpperCase();

		if (row_opts.format_mode && format) value = PageMyData.FormatValueString(value, row_opts.format_mode);

		return `<div class='info-row' title='${labelUpper}'><span class='info-label' title='${labelUpper}${row_opts.sensitive ? ' [ SENSITIVE ]' : ''}'>${label}${row_opts.sensitive ? '*' : ''}</span><span ${sensitive_attr} title='${value}'>${value}</span></div>`;
	}

	static FormatValueString(valstr, format_mode = '')
	{
		switch (format_mode)
		{
			case 'team':
				let got_team = SharedData.GetTeamData(valstr);
				if (got_team) valstr = got_team.team_name;
				break;
			case 'role':
				let got_role = SharedData.GetRoleData(valstr);
				if (got_role) valstr = got_role.role_name;
				break;
			case 'user':
				let got_user = SharedData.GetUserData(valstr);
				if (got_user) valstr = got_user.display_name_full;
				break;
			case 'list':
				let parts = valstr.split(';');
				if (parts.length > 3) valstr = parts.length + ' selected';
				break;
			case 'date':
				let dmatch = valstr.match(rgx_datetime);
				if (dmatch) valstr = `${dmatch[1]}-${dmatch[2]}-${dmatch[3]}`;
				break;
			case 'datetime':
				let dtmatch = valstr.match(rgx_datetime);
				if (dtmatch)
				{
					let year = dtmatch[1];
					let month = dtmatch[2];
					let day = dtmatch[3];
					let time = dtmatch[4];

					valstr = `${year}-${month}-${day} @${time}`;
				}
				break;
		}
		return valstr;
	}

	UpdateBlocks()
	{
		DebugLog.StartGroup('updating my data blocks');
		this.UpdateAccountInfoBlock();
		this.UpdateUserInfoBlock();
		DebugLog.SubmitGroup();
	}

	OnOpen()
	{
		this.sub_SharedDataRefresh = SharedData.onLoaded.RequestSubscription(() => { this.UpdateBlocks(); });
	}

	OnClose()
	{
		SharedData.onLoaded.RemoveSubscription(this.sub_SharedDataRefresh);
	}
}

PageManager.RegisterPage(new PageMyData());