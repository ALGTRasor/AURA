import { DebugLog } from "../debuglog.js";

export class HotkeyDescriptor
{
    static Nothing = new HotkeyDescriptor();

    constructor(key = '', keyAction = keyModifiers => { }, keyInfo = '', keyActionInfo = '')
    {
        this.key = key;
        this.keyAction = keyAction;
        this.disabled = false;

        this.keyInfo = keyInfo;
        this.keyActionInfo = keyActionInfo;
    }

    SetDisabled(disabled = true)
    {
        this.disabled = disabled === true;
    }

    Evaluate(event, modifiers = {})
    {
        if (this.disabled === true)
        {
            DebugLog.Log(' ! hotkey ignored: specific hotkey disabled');
            return;
        }
        if (!this.key || this.key.length < 1)
        {
            DebugLog.Log(' ! hotkey skipped: hotkey invalid');
            return;
        }
        if (!event.key || event.key.length < 1)
        {
            DebugLog.Log(' ! hotkey skipped: event invalid');
            return;
        }
        if (event.key !== this.key)
        {
            //DebugLog.Log(` ! hotkey skipped: key mismatch : ${event.key} !== ${this.key}`);
            return;
        }
        if (!this.keyAction)
        {
            DebugLog.Log(' ! hotkey skipped: no keyAction');
            return;
        }

        let msg = ` + hotkey executed: ${event.key}`;
        for (let mid in modifiers)
        {
            let fact = modifiers[mid];
            if (fact === true) msg += `+[${mid}]`;
        }
        DebugLog.Log(msg);

        this.keyAction(modifiers);
    }
}

export class Hotkeys
{
    static descriptors = [];
    static disabled = false;

    static Register(descriptor = HotkeyDescriptor.Nothing)
    {
        Hotkeys.descriptors.push(descriptor);
    }
    static SetDisabled(disabled = true) { Hotkeys.disabled = disabled === true; }
    static EvaluateKeyEvent(event)
    {
        if (Hotkeys.disabled === true)
        {
            DebugLog.Log(' ! hotkey ignored: hotkeys disabled');
            return;
        }

        let modifiers = {
            alt: event.altKey,
            ctrl: event.ctrlKey,
            shift: event.shiftKey
        };

        modifiers.any = modifiers.ctrl || modifiers.alt || modifiers.shift;
        modifiers.all = modifiers.ctrl && modifiers.alt && modifiers.shift;
        modifiers.none = !modifiers.any;
        modifiers.some = modifiers.any && !modifiers.all;
        modifiers.ctrlShift = modifiers.some && modifiers.ctrl && modifiers.shift;
        modifiers.ctrlAlt = modifiers.some && modifiers.ctrl && modifiers.alt;
        modifiers.shiftAlt = modifiers.some && modifiers.shift && modifiers.alt;

        for (let hkid in Hotkeys.descriptors) Hotkeys.descriptors[hkid].Evaluate(event, modifiers);
    }
}