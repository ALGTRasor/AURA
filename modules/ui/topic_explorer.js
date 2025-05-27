import { addElement, CreatePagePanel } from "../utils/domutils.js";

export class TopicExplorer
{
    constructor(e_parent, data)
    {
        this.root = this.buildTree(data);
        this.e_parent = e_parent;
        this.e_container = CreatePagePanel(this.e_parent, true, true, 'flex-direction:column; flex-wrap:nowrap; gap:var(--gap-025);');
        this.path = [];
        this.render(this.root);
    }

    buildTree(data)
    {
        const root = {};
        for (const item of data)
        {
            const parts = item.topic.split('.');
            let node = root;
            for (let i = 0; i < parts.length; i++)
            {
                const part = parts[i];
                if (!node[part]) node[part] = {};
                if (i === parts.length - 1) node[part].__item = item;
                node = node[part];
            }
        }
        return root;
    }

    getNode(path)
    {
        return path.reduce((n, p) => n && n[p], this.root);
    }

    render(node)
    {
        this.e_container.innerHTML = '';
        if (this.path.length)
        {
            let e_back = document.createElement('button');
            e_back.textContent = '← Back';
            e_back.onclick = () =>
            {
                this.path.pop();
                this.render(this.getNode(this.path));
            };
            this.e_container.appendChild(e_back);
        }
        for (let key in node)
        {
            if (key === '__item') continue;
            let child = node[key];
            let isLeaf = !Object.keys(child).some(k => k !== '__item');
            let item = child.__item;

            let label = (item?.label || key).trim().toUpperCase();

            CreatePagePanel(
                this.e_container, false, false, 'display:flex; flex-direction:column; flex-wrap:nowrap; gap:var(--gap-025); flex-shrink:0.0; flex-grow:0.0;',
                _ =>
                {
                    addElement(_, 'div', undefined, 'flex-shrink:0.0; flex-grow:0.0; font-size:1rem; letter-spacing:2px;', _ => _.innerText = label);
                    _.title = label;
                    if (isLeaf)
                    {
                        if (item?.body)
                        {
                            addElement(
                                _, 'div', undefined,
                                'flex-shrink:0.0; flex-grow:0.0; padding:calc(var(--gap-025) + 0.25rem); background:hsl(from var(--theme-color) h s 15%);'
                                + 'border-radius:var(--gap-025); font-size:0.86rem; line-height:0.86rem; font-weight:normal; letter-spacing:1px;',
                                _ => _.innerText = item.body
                            );
                        }
                    }
                    else
                    {
                        _.classList.add('panel-button');
                        _.addEventListener(
                            'click',
                            _ =>
                            {
                                this.path.push(key);
                                this.render(this.getNode(this.path));
                            }
                        );
                    }
                }
            );
        }
    }
}