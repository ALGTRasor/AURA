import { Autosave } from "../autosave.js";
import { DebugLog } from "../debuglog.js";
import { PageManager } from "../pagemanager.js";
import { UserSettings } from "../usersettings.js";
import { clamp } from "../utils/mathutils.js";

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
    static SetRootStyleProperty(property, value) { document.documentElement.style.setProperty(property, value); }

    static aspects = [];

    static Load() { GlobalStyling.aspects.forEach(_ => _.Load()); }
    static Save() { GlobalStyling.aspects.forEach(_ => _.Save()); }
    static Apply(save = false)
    {
        for (let aid in GlobalStyling.aspects) GlobalStyling.aspects[aid].Apply();
        if (save === true) GlobalStyling.Save();
    }

    static TriggerChangeEvents(doLayoutChange = false, doAutosave = true)
    {
        if (doLayoutChange) PageManager.NotifyLayoutChange();
        if (doAutosave) Autosave.InvokeSoon();
    }

    static RegisterAspect(load = _ => { }, save = _ => { }, apply = _ => { })
    {
        let aspect = new GlobalStylingAspect(load, save, apply);
        GlobalStyling.aspects.push(aspect);
        return aspect;
    }

    static ColorText(text)
    {
        if (typeof text !== 'string') return text;
        text = text.replaceAll('(((', '<span class="megatip-field">');
        text = text.replaceAll(')))', '</span>');
        text = text.replaceAll('{{{', '<span class="megatip-value">');
        text = text.replaceAll('}}}', '</span>');
        text = text.replaceAll('[[[', '<span class="megatip-warning">');
        text = text.replaceAll(']]]', '</span>');
        return text;
    }
}






const lskey_theme_hue = 'theme-hue';
const lskey_theme_sat = 'theme-saturation';
const lskey_theme_contrast = 'theme-contrast';
const lskey_theme_brightness = 'theme-brightness';
const lskey_theme_light_mode = 'light-mode';
const lskey_spotlight = 'spotlight';
const lskey_ripples = 'ripples';
const lskey_hide_sensitive = 'hide-sensitive-info';
const lskey_limit_width = 'limit-content-width';
const lskey_spacing = 'spacing';
const lskey_roundness = 'roundness';
const lskey_show_debug_log = 'show-debug-log';
const lskey_anim_speed = 'anim-speed';

GlobalStyling.animationSpeed = GlobalStyling.RegisterAspect(
    _ => { _.value = UserSettings.GetOptionValue(lskey_anim_speed, 0.5); },
    _ => { UserSettings.SetOptionValue(lskey_anim_speed, _.value); },
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

GlobalStyling.themeColor = GlobalStyling.RegisterAspect(
    _ =>
    {
        _.hue = UserSettings.GetOptionValue(lskey_theme_hue, 0.5);
        _.saturation = UserSettings.GetOptionValue(lskey_theme_sat, 0.5);
    },
    _ =>
    {
        UserSettings.SetOptionValue(lskey_theme_hue, _.hue);
        UserSettings.SetOptionValue(lskey_theme_sat, _.saturation);
    },
    _ =>
    {
        let h = Math.round(_.hue * 360);
        let s = Math.round(_.saturation * 100);
        GlobalStyling.SetRootStyleProperty('--theme-hue', `${h}deg`);
        GlobalStyling.SetRootStyleProperty('--theme-saturation', `${s}%`);
        GlobalStyling.TriggerChangeEvents(false);
    },
);

GlobalStyling.themeContrast = GlobalStyling.RegisterAspect(
    _ => { _.value = UserSettings.GetOptionValue(lskey_theme_contrast, 0.5); },
    _ => { UserSettings.SetOptionValue(lskey_theme_contrast, _.value); },
    _ =>
    {
        GlobalStyling.SetRootStyleProperty('--theme-contrast', _.value);
        GlobalStyling.TriggerChangeEvents(false);
    },
);

GlobalStyling.themeBrightness = GlobalStyling.RegisterAspect(
    _ => { _.value = UserSettings.GetOptionValue(lskey_theme_brightness, 0.5); },
    _ => { UserSettings.SetOptionValue(lskey_theme_brightness, _.value); },
    _ =>
    {
        GlobalStyling.SetRootStyleProperty('--theme-brightness', _.value);
        GlobalStyling.TriggerChangeEvents(false);
    },
);

GlobalStyling.spacing = GlobalStyling.RegisterAspect(
    _ => { _.value = UserSettings.GetOptionValue(lskey_spacing, 0.5); },
    _ => { UserSettings.SetOptionValue(lskey_spacing, _.value); },
    _ =>
    {
        GlobalStyling.SetRootStyleProperty('--spacing-multiplier', _.value);
        GlobalStyling.TriggerChangeEvents(true);
    },
);

GlobalStyling.roundness = GlobalStyling.RegisterAspect(
    _ => { _.value = UserSettings.GetOptionValue(lskey_roundness, 0.5); },
    _ => { UserSettings.SetOptionValue(lskey_roundness, _.value); },
    _ =>
    {
        GlobalStyling.SetRootStyleProperty('--roundness-multiplier', _.value);
        GlobalStyling.TriggerChangeEvents(false);
    },
);

GlobalStyling.lightMode = GlobalStyling.RegisterAspect(
    _ => { _.enabled = UserSettings.GetOptionValue(lskey_theme_light_mode, false); },
    _ => { UserSettings.SetOptionValue(lskey_theme_light_mode, _.enabled); },
    _ =>
    {
        GlobalStyling.SetRootStyleProperty('--theme-invert', _.enabled ? 1.0 : 0.0);
        GlobalStyling.TriggerChangeEvents(false);
    },
);

GlobalStyling.spotlight = GlobalStyling.RegisterAspect(
    _ => { _.enabled = UserSettings.GetOptionValue(lskey_spotlight, false); },
    _ => { UserSettings.SetOptionValue(lskey_spotlight, _.enabled); },
    _ =>
    {
        let e_spotlight = document.getElementById('spotlight');
        if (e_spotlight) e_spotlight.style.display = _.enabled ? 'block' : 'none';
        GlobalStyling.TriggerChangeEvents(false);
    },
);

GlobalStyling.ripples = GlobalStyling.RegisterAspect(
    _ => { _.enabled = UserSettings.GetOptionValue(lskey_ripples, false); },
    _ => { UserSettings.SetOptionValue(lskey_ripples, _.enabled); },
    _ =>
    {
        GlobalStyling.TriggerChangeEvents(false);
    },
);

GlobalStyling.hideSensitiveInfo = GlobalStyling.RegisterAspect(
    _ => { _.enabled = UserSettings.GetOptionValue(lskey_hide_sensitive, true); },
    _ => { UserSettings.SetOptionValue(lskey_hide_sensitive, _.enabled); },
    _ =>
    {
        GlobalStyling.SetRootStyleProperty('--sensitive-info-cover', _.enabled ? 1.0 : 0.0);
        GlobalStyling.TriggerChangeEvents(false);
    },
);

GlobalStyling.showDebugLog = GlobalStyling.RegisterAspect(
    _ => { _.enabled = UserSettings.GetOptionValue(lskey_show_debug_log, false); },
    _ => { UserSettings.SetOptionValue(lskey_show_debug_log, _.enabled); },
    _ =>
    {
        DebugLog.RefreshVisibility();
        GlobalStyling.TriggerChangeEvents(false);
    },
);

GlobalStyling.limitContentWidth = GlobalStyling.RegisterAspect(
    _ => { _.enabled = UserSettings.GetOptionValue(lskey_limit_width, false); },
    _ => { UserSettings.SetOptionValue(lskey_limit_width, _.enabled); },
    _ =>
    {
        GlobalStyling.SetRootStyleProperty('--limit-content-width', _.enabled ? 1.0 : 0.0);
        GlobalStyling.TriggerChangeEvents(true);
    },
);