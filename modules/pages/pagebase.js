import { Modules } from "../modules.js";
import { PageManager } from "../pagemanager.js";

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
		PageManager.onLayoutChange.RemoveSubscription(this.sub_LayoutChange);
		this.OnClose();
		PageManager.RemoveFromCurrent(this);
		this.e_body.style.pointerEvents = 'none';
		this.e_body.style.opacity = 0.0;
		this.e_body.style.scale = 0.7;
		if (immediate) this.e_body.remove();
		else window.setTimeout(() => { this.e_body.remove(); }, 250);
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
	}



	OnOpen() { }
	OnClose() { }
}

Modules.Report("Pages");