import { Autosave } from "../autosave.js";
import { DebugLog } from "../debuglog.js";
import { EventSource } from "../eventsource.js";
import { PageManager } from "../pagemanager.js";
import { UserSettings } from "../usersettings.js";
import { clamp } from "../mathutils.js";

export class GlobalStylingAspect
{
    constructor(load = _ => { }, save = _ => { }, apply = _ => { })
    {
        this.loaded = false;
        this.load = load;
        this.save = save;
        this.apply = apply;
    }

    Load()
    {
        if (this.load) this.load(this);
        this.loaded = true;
    }

    Save()
    {
        if (this.save) this.save(this);
    }

    Apply(trigger_save = false)
    {
        if (this.apply) this.apply(this);
        if (trigger_save === true) this.Save();
    }
}

export class GlobalStyling
{
    static lskey_theme_hue = 'theme-hue';
    static lskey_theme_sat = 'theme-saturation';
    static lskey_theme_light_mode = 'light-mode';
    static lskey_spotlight = 'spotlight';
    static lskey_hide_sensitive = 'hide-sensitive-info';
    static lskey_limit_width = 'limit-content-width';
    static lskey_show_debug_log = 'show-debug-log';
    static lskey_anim_speed = 'anim-speed';

    static themeColor = new GlobalStylingAspect(
        _ =>
        {
            _.hue = UserSettings.GetOptionValue(GlobalStyling.lskey_theme_hue, 0.5);
            _.saturation = UserSettings.GetOptionValue(GlobalStyling.lskey_theme_sat, 0.5);
        },
        _ =>
        {
            UserSettings.SetOptionValue(GlobalStyling.lskey_theme_hue, _.hue);
            UserSettings.SetOptionValue(GlobalStyling.lskey_theme_sat, _.saturation);
        },
        _ =>
        {
            GlobalStyling.SetRootStyleProperty('--theme-color', `hsl( ${Math.round(_.hue * 360.0)}deg, ${Math.round(_.saturation * 100.0)}%, 100%)`);
            GlobalStyling.TriggerChangeEvents(false);
        },
    );

    static lightMode = new GlobalStylingAspect(
        _ => { _.enabled = UserSettings.GetOptionValue(GlobalStyling.lskey_theme_light_mode, false); },
        _ => { UserSettings.SetOptionValue(GlobalStyling.lskey_theme_light_mode, _.enabled); },
        _ =>
        {
            const pid_light_mode = '--theme-invert';
            GlobalStyling.SetRootStyleProperty(pid_light_mode, _.enabled ? 1.0 : 0.0);
            GlobalStyling.TriggerChangeEvents(false);
        },
    );

    static spotlight = new GlobalStylingAspect(
        _ => { _.enabled = UserSettings.GetOptionValue(GlobalStyling.lskey_spotlight, false); },
        _ => { UserSettings.SetOptionValue(GlobalStyling.lskey_spotlight, _.enabled); },
        _ =>
        {
            let e_spotlight = document.getElementById('spotlight');
            if (e_spotlight) e_spotlight.style.display = _.enabled ? 'block' : 'none';
            GlobalStyling.TriggerChangeEvents(false);
        },
    );

    static hideSensitiveInfo = new GlobalStylingAspect(
        _ => { _.enabled = UserSettings.GetOptionValue(GlobalStyling.lskey_hide_sensitive, true); },
        _ => { UserSettings.SetOptionValue(GlobalStyling.lskey_hide_sensitive, _.enabled); },
        _ =>
        {
            const pid_hide_sensitive = '--sensitive-info-cover';
            GlobalStyling.SetRootStyleProperty(pid_hide_sensitive, _.enabled ? 1.0 : 0.0);
            GlobalStyling.TriggerChangeEvents(false);
        },
    );

    static showDebugLog = new GlobalStylingAspect(
        _ => { _.enabled = UserSettings.GetOptionValue(GlobalStyling.lskey_show_debug_log, false); },
        _ => { UserSettings.SetOptionValue(GlobalStyling.lskey_show_debug_log, _.enabled); },
        _ =>
        {
            DebugLog.ui.e_root.style.display = _.enabled ? 'block' : 'none';
            GlobalStyling.TriggerChangeEvents(false);
        },
    );

    static limitContentWidth = new GlobalStylingAspect(
        _ => { _.enabled = UserSettings.GetOptionValue(GlobalStyling.lskey_limit_width, false); },
        _ => { UserSettings.SetOptionValue(GlobalStyling.lskey_limit_width, _.enabled); },
        _ =>
        {
            const pid_limit_width = '--limit-content-width';
            GlobalStyling.SetRootStyleProperty(pid_limit_width, _.enabled ? 1.0 : 0.0);
            GlobalStyling.TriggerChangeEvents(true);
        },
    );

    static animationSpeed = new GlobalStylingAspect(
        _ => { _.value = UserSettings.GetOptionValue(GlobalStyling.lskey_anim_speed, 0.5); },
        _ => { UserSettings.SetOptionValue(GlobalStyling.lskey_anim_speed, _.value); },
        _ =>
        {
            const classname_no_transitions = 'notransitions';
            const pid_anim_speed = '--trans-dur-mult';

            _.value = clamp(_.value, 0.0, 1.0);

            if (_.value < 1.0) // 1.0 = instant transitions
            {
                document.body.classList.remove(classname_no_transitions);
                GlobalStyling.SetRootStyleProperty(pid_anim_speed, 1.5 * (1.0 - _.value));
            }
            else document.body.classList.add(classname_no_transitions);
            GlobalStyling.TriggerChangeEvents(false);
        },
    );





    static SetRootStyleProperty(property, value) { document.documentElement.style.setProperty(property, value); }

    static aspects = [
        GlobalStyling.themeColor,
        GlobalStyling.lightMode,
        GlobalStyling.spotlight,
        GlobalStyling.hideSensitiveInfo,
        GlobalStyling.showDebugLog,
        GlobalStyling.limitContentWidth,
        GlobalStyling.animationSpeed,
    ];

    static Load() { for (let aid in GlobalStyling.aspects) GlobalStyling.aspects[aid].Load(); }
    static Save() { for (let aid in GlobalStyling.aspects) GlobalStyling.aspects[aid].Save(); }
    static Apply(save = false)
    {
        for (let aid in GlobalStyling.aspects) GlobalStyling.aspects[aid].Apply();
        if (save === true) GlobalStyling.Save();
    }

    static onStylingChange = new EventSource();
    static TriggerChangeEvents(doLayoutChange = false, doAutosave = true)
    {
        GlobalStyling.onStylingChange.Invoke();
        if (doLayoutChange) PageManager.onLayoutChange.Invoke();
        if (doAutosave) Autosave.InvokeSoon();
    }
}

GlobalStyling.Load();