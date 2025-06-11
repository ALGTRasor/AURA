export class AppNotifications
{
    static Count(topic = '')
    {
        return AppNotifications.GetAll(topic).length;
    }

    static GetAll(topic = '')
    {
        topic = topic.trim().toLowerCase();
        if (topic.length < 1) return [];

        const has_topic = _ => { return _.select_action_code.indexOf(topic) > -1; };
        return window.SharedData['app notifications'].instance.data.filter(has_topic);
    }
}