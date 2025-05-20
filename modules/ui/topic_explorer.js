import { addElement, CreatePagePanel } from "../utils/domutils.js";
import { NotificationLog } from "../notificationlog.js";
import { PanelContent } from "./panel_content.js";

export class TopicEntry
{
    constructor(info = {})
    {
        this.topic = info.topic;
        this.label = info.label;
        this.body = info.body;

        this.topic_segments = this.topic.split('.');
        this.parent_topic = this.topic.split('.').slice(0, this.topic_segments.length - 1).join('.');
    }

    IsSubEntry(other = {})
    {
        if (other.topic.length <= this.topic.length) return false;
        if (this.parent_topic === other.topic) return true;
        return this.topic.startsWith(other.topic + '.');
    }
}

export class TopicExplorerItem extends PanelContent
{
    constructor(e_parent, path = '', label = '', onClick = e => { })
    {
        super(e_parent);
        this.path = path;
        this.label = label;
        this.e_root = null;
        this.onClick = onClick;
    }

    OnCreateElements()
    {
        this.e_root = CreatePagePanel(
            this.e_parent, false, false, 'flex-grow:0.0;',
            _ =>
            {
                _.classList.add('panel-button');
                _.innerText = `${this.label} (${this.path.split('.')})`;
                _.title = _.innerText;
                _.addEventListener('click', this.onClick);
            }
        );
    }

    OnRefreshElements() { this.e_root.innerText = this.label; }

    OnRemoveElements()
    {
        this.e_root?.remove()
        this.e_root = null;
    }
}

export class TopicExplorer extends PanelContent
{
    constructor(e_parent, topics = [{ topic: '', label: '', body: '' }])
    {
        super(e_parent);

        this.currentLevel = 'root';
        this.currentPath = [];
        this.activeEntry = null;
        this.topics = topics;

        this.entries = [];
        for (let tid in this.topics) this.entries.push(new TopicEntry(this.topics[tid]));

        this.e_root = CreatePagePanel(this.e_parent, true, false, 'display:flex; flex-direction:column; gap:var(--gap-025);');
        this.RefreshElements();
    }

    OnCreateElements() { }

    OnRefreshElements()
    {
        if (!this.e_root) return;
        this.e_root.innerHTML = '';

        let level = this.currentLevel;
        let path = this.currentPath.join('.');
        let subtopics = [];

        for (let entry_id in this.entries)
        {
            let entry = this.entries[entry_id];
            let topic = entry.topic;
            if (level === 'root')
            {
                let top_level = topic.indexOf('.') > -1 ? topic.split('.')[0] : topic;
                if (subtopics.indexOf(top_level) < 0) subtopics.push(entry);
            }
            else
            {
                if (!topic.startsWith(path + '.')) continue;
                let parts = topic.split('.');
                let nextPart = parts[this.currentPath.length];
                if (nextPart && subtopics.indexOf(nextPart) < 0) subtopics.push(nextPart);
            }
        }

        this.e_path = addElement(this.e_root, 'div', null, 'text-align:center;', this.currentPath.length < 1 ? 'ROOT' : path);

        const backButton = new TopicExplorerItem(
            this.e_root, '', '< Back',
            () =>
            {
                this.currentPath.pop();
                this.currentLevel = this.currentPath.length < 1 ? 'root' : 'sub';
                this.RefreshElements();
            }
        );
        backButton.CreateElements();
        backButton.e_root.style.display = this.currentPath.length > 0 ? 'block' : 'none';

        for (let topic_id in subtopics)
        {
            let entry = subtopics[topic_id];
            new TopicExplorerItem(
                this.e_root, entry.topic, entry.label,
                e =>
                {
                    this.activeEntry = entry;
                    this.currentPath.push(entry.topic.split('.')[-1]);
                    this.currentLevel = 'sub';
                    this.RefreshElements();
                }
            ).CreateElements();
        }

        let target_topic_id = this.topics.findIndex(_ => _.topic === path);
        if (target_topic_id > -1)
        {
            NotificationLog.Log('target topic id: ' + target_topic_id);
            CreatePagePanel(this.e_root, true, false, '', _ => _.innerText = this.topics[target_topic_id].body);
        }
    }

    OnRemoveElements()
    {
        this.e_root?.remove()
        this.e_root = null;
    }
}