import { addElement, getTransitionStyle } from "../utils/domutils.js";


class DOMElementHighlight
{
	constructor(rect, border_radius = 'var(--gap-025)')
	{
		this.rect = rect;
		this.e_root = addElement(
			document.body, 'div', '',
			'pointer-events:none;'
			+ 'position:absolute; box-sizing:border-box; z-index:150000; margin:0px; padding:0px; opacity:0%;'
			+ 'outline:solid 3px orange; outline-offset:5px; border-radius:' + border_radius + ';'
			+ getTransitionStyle('opacity', '--trans-dur-off-fast', 'ease-in-out', 0)
		);
		this.SetPosition(rect.x, rect.y);
		this.SetSize(rect.width, rect.height);
		this.Initiate();
	}

	Initiate()
	{
		let flashes = 0;
		let opacity = 0;
		let duration = 50;
		while (flashes < 5)
		{
			window.setTimeout(() => { this.e_root.style.opacity = opacity + '%'; opacity = 100 - opacity; }, duration);
			duration += 150;
			flashes++;
		}
		window.setTimeout(() => { this.e_root.remove(); }, duration);
	}

	SetPosition(x, y)
	{
		if (x)
		{
			this.x = x;
			this.e_root.style.left = this.x + 'px';
		}
		if (y)
		{
			this.y = y;
			this.e_root.style.top = this.y + 'px';
		}
	}

	SetSize(w, h)
	{
		if (w)
		{
			this.w = w;
			this.e_root.style.width = this.w + 'px';
		}
		if (h)
		{
			this.h = h;
			this.e_root.style.height = this.h + 'px';
		}
	}
}

export class DOMHighlight
{
	static GetRelativeRect(element)
	{
		let rect = element.getBoundingClientRect();
		let body_rect = document.body.getBoundingClientRect();
		rect.x -= body_rect.x;
		rect.y -= body_rect.y;
		return rect;
	}

	static Element(element, delay = 250)
	{
		if (delay > 0) window.setTimeout(() => { DOMHighlight.Element(element, -1); }, delay);
		else new DOMElementHighlight(DOMHighlight.GetRelativeRect(element), window.getComputedStyle(element).borderRadius ?? 0);
	}

	static Elements(elements = [], border_radius = 'var(--gap-025)', delay = 250)
	{
		if (delay > 0)
		{
			window.setTimeout(() => { DOMHighlight.Elements(elements, border_radius, -1); }, delay);
			return;
		}

		let minX = 999999;
		let maxX = -999999;
		let minY = 999999;
		let maxY = -999999;

		for (let eid in elements)
		{
			let er = DOMHighlight.GetRelativeRect(elements[eid]);
			minX = Math.min(minX, er.x, er.x + er.width);
			minY = Math.min(minY, er.y, er.y + er.height);
			maxX = Math.max(maxX, er.x, er.x + er.width);
			maxY = Math.max(maxY, er.y, er.y + er.height);
		}
		let rect = new DOMRect(minX, minY, (maxX - minX), (maxY - minY));
		if (rect.width < 1 || rect.height < 1) return;
		new DOMElementHighlight(rect, border_radius);
	}
}