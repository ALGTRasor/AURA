import { ActionBar } from "../actionbar.js";
import { DBLayer } from "../remotedata/dblayer.js";
import { UserAccountInfo } from "../useraccount.js";
import { MegaTips } from "./megatips.js";

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

        const has_topic = _ => { return _.select_action_code?.indexOf(topic) > -1; };
        return window.SharedData['app notifications'].instance.data.filter(has_topic);
    }

    static Send(user_id = '', title = '', body = '', action_code = '')
    {
        let data = {
            Title: user_id,
            notification_title: title,
            notification_body: body,
            select_action_code: action_code,
            datetime_arrival: new Date().toISOString()
        };

        DBLayer.CreateRecord(window.SharedData['app notifications'].instance.descriptor, { fields: data });
    }
}

function create_test_alert_button() 
{
    window.setTimeout(
        () =>
        {
            ActionBar.AddMenuButton(
                'TEST ALERT',
                'notification_add',
                _ =>
                {
                    AppNotifications.Send(
                        UserAccountInfo.account_info.user_id,
                        'test notification',
                        'text in test notification body ' + Math.round(Math.random() * 100000),
                        'goto:my data'
                    );
                    window.setTimeout(() => { window.SharedData['app notifications'].instance.TryLoad(true); }, 500);
                },
                _ =>
                {
                    MegaTips.RegisterSimple(_, 'Send a test notification to yourself.')
                }
            );
        },
        500
    );
}
//create_test_alert_button();
