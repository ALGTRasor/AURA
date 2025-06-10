import { MegaTips } from "../../systems/megatips.js";
import { CreatePagePanel } from "../../utils/domutils.js";
import { OverlayDescriptor, OverlayManager } from "../overlays.js";

export class ChoiceOverlay extends OverlayDescriptor
{
    static host = new ChoiceOverlay();
    static ShowNew(data = {})
    {
        let overlay = ChoiceOverlay.host.GetNewInstance(data);
        OverlayManager.Show(overlay);
        return overlay;
    }

    kind = 'choice-overlay';

    onCreateElements = overlay =>
    {
        overlay.prompt = overlay.prompt.replaceAll('((', '<span style="color:white;">');
        overlay.prompt = overlay.prompt.replaceAll('))', '</span>');

        overlay.e_root.innerHTML = '';

        const style_overlay_root = 'position:absolute; top:50%; left:50%; transform:translate(-50%,-50%);'
            + 'min-height:3rem; min-width:28rem; max-width:calc(100% - 1rem);'
            + 'display:flex; flex-direction:column; flex-wrap:nowrap;';
        const style_parts = 'flex-grow:1.0; flex-shrink:0.0; align-content:center; text-align:center; font-size:0.85rem; letter-spacing:2px; padding:var(--gap-1);';

        let e_body = CreatePagePanel(overlay.e_root, false, false, style_overlay_root, _ => { });
        e_body.tabIndex = 0;
        e_body.title = '';
        e_body.focus();
        e_body.addEventListener('mousedown', e => { e.stopPropagation(); e_body.focus(); });

        CreatePagePanel(e_body, true, false, style_parts + 'flex-grow:0.0; color:orange; letter-spacing:0px;', _ => { _.innerHTML = overlay.prompt; });

        let e_choices = CreatePagePanel(e_body, true, false, 'flex-grow:1.0; display:flex; flex-direction:column; flex-wrap:nowrap; gap:2px;');
        overlay.choices.forEach(
            (choice, i, a) =>
            {
                if (!choice) return;

                if (!('color' in choice) || choice.color.length < 1) choice.color = '#fff';
                if (!('hotkey' in choice))
                {
                    const rgx_choice_hotkey = /(?:\[(.{1})\])/;
                    let hotkey_match = choice.label.match(rgx_choice_hotkey);
                    if (hotkey_match) choice.hotkey = hotkey_match[1].toLowerCase();
                }

                let e_choice = CreatePagePanel(
                    e_choices, false, false,
                    style_parts + '--theme-color:' + choice.color + '; padding:var(--gap-05);',
                    _ =>
                    {
                        if (i < 1)
                        {
                            _.style.borderBottomLeftRadius = '0';
                            _.style.borderBottomRightRadius = '0';
                        }
                        else if (i >= (a.length - 1))
                        {
                            _.style.borderTopLeftRadius = '0';
                            _.style.borderTopRightRadius = '0';
                        }
                        else
                        {
                            _.style.borderRadius = '0';
                        }
                        _.innerHTML = choice.label;
                        _.classList.add('panel-button');
                        _.addEventListener('mousedown', e => { e.preventDefault(); e.stopPropagation(); _.focus(); });
                        if (choice.on_click)
                        {
                            _.addEventListener(
                                'click',
                                e =>
                                {
                                    overlay.submitted = true;
                                    choice.on_click(overlay);
                                }
                            );
                        }
                    }
                );
                if ('hotkey' in choice) 
                {
                    let label_clean = choice.label.replaceAll('[', '').replaceAll(']', '');
                    MegaTips.RegisterSimple(e_choice, `${label_clean}<br>Hotkey: [[[${choice.hotkey.toUpperCase()}]]]`);
                }
                else MegaTips.RegisterSimple(e_choice, `${choice.label}`);
            }
        );
    };

    onRemoveElements = overlay => { };

    onHandleHotkeys = (overlay, e) =>
    {
        if (e.key === 'Escape') { overlay.Dismiss(); return; }

        for (let cid in overlay.choices)
        {
            let choice = overlay.choices[cid];
            if ('hotkey' in choice && e.key === choice.hotkey)
            {
                choice.on_click(overlay);
                break;
            }
        }
    };
}