

export class Notification
{
	static Nothing = new Notification('nothing', 'nothing');

	constructor(title = '', body = '', stacks = true, color_text = 'var(--theme-color-text)', color_body = 'var(--theme-color-background)')
	{
		this.title = title.trim();
		this.body = body.trim();
		this.color_text = color_text;
		this.color_body = color_body;
		this.stacks = stacks;
		this.stackCount = 1;

		this.e_root = {};
	}

	CreateElements()
	{
		this.e_root = document.createElement('div');
		this.e_root.className = 'debug-log-item';
		this.e_root.innerHTML = this.body;
		this.e_root.title = this.title;
		this.e_root.style.marginLeft = "6px";
	}

	UpdateElements()
	{
		if (this.stackCount > 1)
		{
			this.e_root.innerHTML = `${this.body}<div class='debug-log-item-count'> x${this.stackCount}</div>`;
		}
		else
		{
			this.e_root.innerHTML = this.body;
		}
	}

	ShouldStackWith(other = Notification.Nothing)
	{
		if (!this.stacks || !other.stacks) return false;
		if (other.title !== this.title) return false;
		if (other.body !== this.body) return false;
		return true;
	}
}

export class NotificationLog
{
	static entries = [];
	static ui = {};

	static Create()
	{
		if (NotificationLog.ui.e_root) return;

		let ui = NotificationLog.ui;

		ui.e_root = document.createElement('div');
		ui.e_root.id = 'debug-log-root';
		ui.e_root.className = 'debug-log-root';
		ui.e_root.style.bottom = 'unset';
		ui.e_root.style.justifyContent = 'start';
		ui.e_root.style.transformOrigin = '0% 0%';
		ui.e_root.style.top = 'calc(1rem + var(--action-bar-height))';

		document.body.appendChild(ui.e_root);
	}

	static Hide() { if (NotificationLog.ui.e_root) NotificationLog.ui.e_root.style.display = 'none'; }
	static Show() { if (NotificationLog.ui.e_root) NotificationLog.ui.e_root.style.display = 'flex'; }

	static Log(notification = Notification.Nothing)
	{
		let latestIndex = NotificationLog.entries.length - 1;
		let latest = NotificationLog.entries[latestIndex];
		if (latest && notification.ShouldStackWith(latest))
		{
			NotificationLog.entries[latestIndex].stackCount++;
			NotificationLog.entries[latestIndex].UpdateElements();
		}
		else
		{
			NotificationLog.Push(notification);
		}
	}

	static Push(notification = Notification.Nothing)
	{
		NotificationLog.entries.push(notification);
		notification.CreateElements();
		NotificationLog.ui.e_root.appendChild(notification.e_root);
	}

	static Clear()
	{
		NotificationLog.ui.e_root.innerHTML = '';
		for (let e in NotificationLog.entries) e.e_root.remove();
		NotificationLog.entries = [];
	}
}

if (!window.fxn) window.fxn = {};
window.fxn.LogNotification = NotificationLog.Log;

NotificationLog.Create();