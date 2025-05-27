import { addElement, FadeElement } from "./utils/domutils.js";

export class Notification
{
	static Nothing = new Notification('nothing', 'nothing');

	constructor(title = '', body = '', stacks = true, color = 'var(--theme-color-text)')
	{
		this.title = title.trim();
		this.body = body.trim();
		this.color = color;
		this.stacks = stacks;
		this.stackCount = 1;

		this.e_root = {};
	}

	CreateElements(e_parent)
	{
		this.e_root = document.createElement('div');
		this.e_root.className = 'notification-log-item';
		this.e_root.innerHTML = `<span style='color:${this.color};'>${this.body}</span>`;
		window.setTimeout(() => { this.e_root.style.maxHeight = `1rem`; }, 50);
		this.e_root.title = this.title;

		this.e_parent = e_parent;

		e_parent.appendChild(this.e_root);
	}

	UpdateElements()
	{
		if (this.stackCount > 1) this.e_root.innerHTML = `<span style='color:${this.color};'>${this.body}</span><div class='notification-log-item-count'> x${this.stackCount}</div>`;
		else this.e_root.innerHTML = `<span style='color:${this.color};'>${this.body}</span>`;
	}

	ShouldStackWith(other = Notification.Nothing)
	{
		if (typeof this !== typeof other) return false;
		if (!this.stacks || !other.stacks) return false;
		if (other.title !== this.title) return false;
		if (other.body !== this.body) return false;
		return true;
	}

	StartFadeRemove(delay = 2500, extra = () => { })
	{
		if (this.fade_timeout && this.fade_timeout > -1) window.clearTimeout(this.fade_timeout);
		this.fade_timeout = window.setTimeout(
			_ =>
			{
				FadeElement(this.e_root, 100, 0, 0.333).then(_ => this.e_root.remove()).then(extra);
			},
			delay
		);
	}
}

export class NotificationLog
{
	static entries = [];

	static Create()
	{
		if (NotificationLog.e_root) return;

		NotificationLog.e_root = addElement(document.body, 'div', 'notification-log-root', null, _ => { _.id = 'notification-log-root'; });
	}

	static Hide()
	{
		if (NotificationLog.e_root)
		{
			NotificationLog.e_root.style.opacity = '0%';
		}
	}
	static Show()
	{
		if (NotificationLog.e_root)
		{
			NotificationLog.e_root.style.removeProperty('opacity');
		}
	}

	static StartFadeEntry(entry)
	{
		entry.StartFadeRemove(
			5000,
			() =>
			{
				let id = NotificationLog.entries.indexOf(entry);
				NotificationLog.entries.splice(id, 1);
			}
		);
	}

	static Log(notification = Notification.Nothing, color = '')
	{
		if (typeof notification === 'string') notification = new Notification('', notification, true);

		if (typeof color === 'string' && color.length > 0) notification.color = color;

		let latestIndex = NotificationLog.entries.length - 1;
		let latest = NotificationLog.entries[latestIndex];
		if (latest && notification.ShouldStackWith(latest))
		{
			NotificationLog.entries[latestIndex].stackCount++;
			NotificationLog.entries[latestIndex].UpdateElements();
			NotificationLog.StartFadeEntry(NotificationLog.entries[latestIndex]);
		}
		else
		{
			NotificationLog.Push(notification);
		}
		NotificationLog.Show();
	}

	static push_queue = [];
	static pushing = false;

	static Push(notification = Notification.Nothing)
	{
		NotificationLog.push_queue.push(notification);
		if (NotificationLog.pushing === false)
		{
			NotificationLog.pushing = true;
			NotificationLog.PushNext();
		}
	}

	static PushNext()
	{
		if (NotificationLog.push_queue.length < 1)
		{
			NotificationLog.pushing = false;
			return;
		}

		let notification = NotificationLog.push_queue.splice(0, 1)[0];
		NotificationLog.entries.push(notification);
		notification.CreateElements(NotificationLog.e_root);
		FadeElement(notification.e_root, 0, 100, 0.25);
		NotificationLog.StartFadeEntry(notification);

		window.setTimeout(_ => NotificationLog.PushNext(), 50);
	}

	static Clear()
	{
		NotificationLog.e_root.innerHTML = '';
		for (let e in NotificationLog.entries) e.e_root.remove();
		NotificationLog.entries = [];
	}
}