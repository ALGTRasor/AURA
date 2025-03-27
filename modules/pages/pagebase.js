import { DataFieldDesc } from "../datamodels/datafield_desc.js";
import { SharedData } from "../datashared.js";
import { addElement } from "../domutils.js";
import { Modules } from "../modules.js";
import { PageManager } from "../pagemanager.js";

const rgx_datetime = /(\d{4})\-(\d{2})\-(\d{2})(?:T(\d\d\:\d\d\:\d\d)Z?)?/;

export class PageBase
{
	static Default = new PageBase(null);

	constructor(title = '')
	{
		if (title && title.length > 0) this.title = title;
		else this.title = this.GetTitle();
		this.e_btn_close = {};
		this.e_body = {};
		this.e_title_bar = {};
		this.e_content = {};
	}

	GetTitle() { return '' }

	SetContentBodyLabel(text)
	{
		if (!this.e_content) return;
		this.e_content.innerHTML = "<div style='position:absolute;inset:0;text-align:center;align-content:center;'>" + text + "</div>";
	}

	CreateBody(create_close_button = true)
	{
		this.e_body = document.createElement('div');
		this.e_body.className = 'page-root';
		this.e_body.style.opacity = 0.0;
		this.e_body.style.scale = 0.7;
		window.setTimeout(() => { this.e_body.style.opacity = 0.85; this.e_body.style.scale = 1.0; }, 5);

		this.e_title_bar = document.createElement('div');
		this.e_title_bar.className = 'page-title-bar';

		if (this.icon)
		{
			let e_title_icon = document.createElement('i');
			e_title_icon.className = 'material-symbols icon';
			e_title_icon.innerText = this.icon;
			this.e_title_bar.appendChild(e_title_icon);
			this.e_title_bar.innerHTML += this.GetTitle().toUpperCase();
			this.e_title_bar.appendChild(e_title_icon);
		}
		else this.e_title_bar.innerHTML = this.GetTitle().toUpperCase();

		this.e_content = document.createElement('div');
		this.e_content.className = 'page-content-root';

		if (create_close_button)
		{
			this.e_btn_close = document.createElement('div');
			this.e_btn_close.className = 'page-close-button';
			this.e_btn_close.innerHTML = "<i class='material-symbols icon'>close</i>";
			this.e_btn_close.title = "Close this panel";
			this.e_btn_close.addEventListener('click', () => { this.Close(); });
			this.e_body.appendChild(this.e_btn_close);
		}

		this.e_btn_move_l = document.createElement('div');
		this.e_btn_move_l.className = 'page-move-button';
		this.e_btn_move_l.style.left = "0.2rem";
		this.e_btn_move_l.innerHTML = "<i class='material-symbols icon'>chevron_left</i>";
		this.e_btn_move_l.title = "Move this panel to the left";
		this.e_btn_move_l.addEventListener('click', () => { this.MoveLeft(); });
		this.e_body.appendChild(this.e_btn_move_l);

		this.e_btn_move_r = document.createElement('div');
		this.e_btn_move_r.className = 'page-move-button';
		this.e_btn_move_r.innerHTML = "<i class='material-symbols icon'>chevron_right</i>";
		this.e_btn_move_r.title = "Move this panel to the right";
		this.e_btn_move_r.addEventListener('click', () => { this.MoveRight(); });
		this.e_body.appendChild(this.e_btn_move_r);

		this.e_body.appendChild(this.e_title_bar);
		this.e_body.appendChild(this.e_content);
	}

	MoveLeft()
	{
		if (this.e_body.previousSibling)
		{
			this.e_body.parentElement.insertBefore(this.e_body, this.e_body.previousSibling);
			PageManager.onLayoutChange.Invoke();
		}
	}

	MoveRight()
	{
		if (this.e_body.nextSibling)
		{
			this.e_body.parentElement.insertBefore(this.e_body.nextSibling, this.e_body);
			PageManager.onLayoutChange.Invoke();
		}
	}

	Close(immediate = false)
	{
		this.OnClose();

		this.e_body.style.pointerEvents = 'none';
		this.e_body.style.transitionDelay = '0s';
		this.e_body.style.opacity = 0.0;
		this.e_body.style.scale = 0.7;

		let finalize = () =>
		{
			PageManager.onLayoutChange.RemoveSubscription(this.sub_LayoutChange);
			PageManager.RemoveFromCurrent(this, 30);
			this.e_body.remove();
		};

		if (immediate) finalize();
		else window.setTimeout(() => { finalize(); }, 250);
	}

	FinalizeBody(parent)
	{
		if (!parent) return;
		parent.appendChild(this.e_body);

		this.sub_LayoutChange = PageManager.onLayoutChange.RequestSubscription(() => { this.UpdatePageContext(); });
		this.OnOpen();
	}

	CreateElements(parent)
	{
		if (!parent) return;
		this.CreateBody();
		this.e_content.innerText = 'content :: ' + this.title;
		this.FinalizeBody(parent);
	}

	UpdatePageContext()
	{
		if (PageManager.currentPages.length < 2)
		{
			if (this.e_btn_close) this.e_btn_close.style.display = (this.title == 'nav menu') ? 'none' : 'block';
			this.e_btn_move_l.style.display = 'none';
			this.e_btn_move_r.style.display = 'none';
		}
		else
		{
			if (this.e_btn_close) this.e_btn_close.style.display = 'block';
			this.e_btn_move_l.style.display = this.e_body.previousElementSibling ? 'block' : 'none';
			this.e_btn_move_r.style.display = this.e_body.nextElementSibling ? 'block' : 'none';
		}

		this.OnLayoutChange();
	}



	CreateRecordInfoList(parent = {}, record = {}, descs = [])
	{
		for (let desc_id in descs) 
		{
			//if (desc_id == 'id') continue;
			if (desc_id.startsWith('@')) continue;
			this.CreateRecordInfoListItem(parent, descs, desc_id, record[desc_id]);
		}
	}

	CreateRecordInfoListItem(parent = {}, field_descs = [], desc_id = '', value = '', format = true)
	{
		let row_opts = DataFieldDesc.Lookup(field_descs, desc_id);
		if (row_opts.exclude) return '';

		let sens = row_opts.sensitive === true;
		let sens_txt = sens ? ' [ SENSITIVE ]' : '';
		let sens_ind = sens ? '*' : '';

		let label = field_descs[desc_id].label;
		let labelUpper = label.toUpperCase();

		if (row_opts.format_mode && format) value = PageBase.FormatValueString(value, row_opts.format_mode);

		if (row_opts.multiline)
		{
			value = value.replaceAll('\n', '<br>');
		}

		addElement(
			parent, 'div', 'info-row', row_opts.multiline === true ? 'min-height:3rem; height:-webkit-fill-available; text-wrap:pretty;' : '',
			e =>
			{
				addElement(e, 'span', 'info-label', null, lbl => { lbl.title = `${labelUpper}${sens_txt}`; lbl.innerHTML = `${label}${sens_ind}`; });
				addElement(e, 'span', sens ? 'info-value sensitive-info' : 'info-value', null, lbl => { lbl.title = `${labelUpper}${sens_txt}`; lbl.innerHTML = value; });
			}
		);
	}


	static FormatValueString(valstr, format_mode = '')
	{
		switch (format_mode)
		{
			case 'upper':
				valstr = valstr.toUpperCase();
				break;
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





	OnOpen() { }
	OnClose() { }
	OnLayoutChange() { }
}

Modules.Report("Pages");