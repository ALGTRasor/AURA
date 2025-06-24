import { DBLayer } from '../remotedata/dblayer.js';


export class TaskData
{
    guid = ''; // the generated Task ID for the task
    title = ''; // the title for the task
    description = ''; // the description for the task
    to_do_items = []; // an array of To-Do items and their status
    comments = []; // an array of comments and their details

    date_assigned = null; // the date this task was first assigned
    date_due = null; // the date this task is due
    date_completed = null; // the date this task was completed

    owner_id = ''; // the User ID of the current owner
    participant_ids = []; // an array of relevant User IDs

    project_ids = []; // an array of relevant Project IDs
    subtask_ids = []; // an array of relevant Tasks IDs

    static Nothing = new TaskData();
    static Default = new TaskData(
        {
            title: 'New Task',
            description: 'A new task.',
            to_do_items:
                [
                    { title: 'Objective A', desc: '', status: 'complete' },
                    { title: 'Objective B', desc: '', status: 'incomplete' },
                    { title: 'Objective C', desc: '', status: 'incomplete' },
                    { title: 'Objective D', desc: '', status: 'incomplete' },
                ],
            owner_id: '',
            participant_ids: [],
        }
    );

    constructor(data)
    {
        for (let prop_key in data) this[prop_key] = data[prop_key];
    }

    GetCompact()
    {
        return {
            Title: this.guid,
            task_title: this.title,
            task_data: JSON.stringify(this)
        };
    }

    SetOwner(user_id = '')
    {
        this.owner_id = user_id;
        this.AddParticipant(user_id);
    }

    AddParticipant(user_id = '')
    {
        let existing_index = this.participant_ids.indexOf(user_id);
        if (existing_index < 0) this.participant_ids.push(user_id);
    }

    IsDue() { return this.date_due != null; }
    ClearDue() { this.date_due = null; }
    MarkDue(date = new Date()) { this.date_due = date; }

    IsAssigned() { return this.date_assigned != null; }
    ClearAssigned() { this.date_assigned = null; }
    MarkAssigned(overwrite = false)
    {
        if (overwrite !== true && this.IsAssigned()) return;
        this.date_assigned = new Date();
    }

    IsCompleted() { return this.date_completed != null; }
    ClearCompleted() { this.date_completed = null; }
    MarkCompleted(overwrite = true)
    {
        if (overwrite !== true && this.IsCompleted()) return;
        this.date_completed = new Date();
    }
}

export class Tasks
{
    static async CreateNew(task_data = TaskData.Nothing)
    {
        return await DBLayer.CreateRecord(
            window.SharedData['tasks'].instance.descriptor,
            { fields: task_data.GetCompact() }
        );
    }
}