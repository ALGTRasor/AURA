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

	CreateBody(create_close_button = true)
	{
		this.e_body = document.createElement('div');
		this.e_body.className = 'page-root';
		this.e_body.style.opacity = 0.0;
		window.setTimeout(() => { this.e_body.style.opacity = 1.0; }, 5);

		this.e_title_bar = document.createElement('div');
		this.e_title_bar.className = 'page-title-bar';

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

		this.e_body.appendChild(this.e_title_bar);
		this.e_body.appendChild(this.e_content);
	}

	Close()
	{
		PageManager.RemoveFromCurrent(this);
		this.e_body.style.opacity = 0.0;
		window.setTimeout(() => { this.e_body.remove(); }, 250);
	}

	FinalizeBody(parent)
	{
		if (!parent) return;
		parent.appendChild(this.e_body);
	}

	CreateElements(parent)
	{
		if (!parent) return;
		this.CreateBody();
		this.e_content.innerText = 'content :: ' + this.title;
		this.FinalizeBody(parent);
	}
}

Modules.Report("Pages");