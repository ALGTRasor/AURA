import { addElement, CreatePagePanel } from "../../utils/domutils.js";
import { OverlayDescriptor, OverlayManager } from "../overlays.js";

export class TextInputOverlay extends OverlayDescriptor
{
    static host = new TextInputOverlay();
    static ShowNew(data = {})
    {
        let overlay = TextInputOverlay.host.GetNewInstance(data);
        OverlayManager.Show(overlay);
        return overlay;
    }

    kind = 'text-input-overlay';

    onCreateElements = overlay =>
    {
        overlay.e_root.innerHTML = '';
        overlay.prompt = overlay.prompt.replaceAll('((', '<span style="color:white;">');
        overlay.prompt = overlay.prompt.replaceAll('))', '</span>');

        const style_overlay_root = 'position:absolute; top:50%; left:50%; transform:translate(-50%,-50%);'
            + 'min-height:3rem; min-width:28rem; max-width:calc(100% - 1rem);'
            + 'display:flex; flex-direction:column; flex-wrap:nowrap;';
        const style_parts = 'flex-grow:1.0; align-content:center; text-align:center; font-size:0.85rem; letter-spacing:2px; padding:var(--gap-1); line-height:1.5rem;';

        let e_body = CreatePagePanel(overlay.e_root, false, false, style_overlay_root, _ => { });
        e_body.addEventListener('mousedown', e => { e.stopPropagation(); e_body.focus(); });
        e_body.tabIndex = 0;
        e_body.focus();

        CreatePagePanel(e_body, true, false, style_parts + 'flex-grow:0.0; color:orange; letter-spacing:0px;', _ => { _.innerHTML = overlay.prompt; });
        CreatePagePanel(
            e_body, true, false, 'flex-grow:1.0; display:flex; flex-direction:column; flex-wrap:nowrap;',
            _ =>
            {
                overlay.e_input_txt = addElement(
                    _, 'input', null, null,
                    _ =>
                    {
                        _.type = 'text';
                        _.value = overlay.default_value ?? '';
                        _.placeholder = 'Enter text...';
                        _.style.flexBasis = '3rem';
                        _.style.padding = 'var(--gap-025)';
                        _.style.paddingLeft = 'calc(var(--gap-1) + 0.5rem)';

                        _.addEventListener('mousedown', e => { e.stopPropagation(); _.focus(); });
                        _.addEventListener(
                            'keyup',
                            e =>
                            {
                                overlay.e_btn_submit.classList.remove('panel-button-disabled');
                                let valtrimmed = _.value.trim();
                                if (valtrimmed.length < 1) overlay.e_btn_submit.classList.add('panel-button-disabled');
                                else if (valtrimmed === overlay.original_value) overlay.e_btn_submit.classList.add('panel-button-disabled');
                            }
                        );
                    }
                );

                overlay.e_btn_submit = CreatePagePanel(
                    _, false, false, style_parts + '--theme-color:#4f4; padding:var(--gap-05);',
                    _ =>
                    {
                        _.classList.add('panel-button-disabled');
                        _.innerText = 'SUBMIT';
                        _.style.flexBasis = '1.5rem';
                        _.classList.add('panel-button');
                        _.addEventListener('mousedown', e => { e.preventDefault(); e.stopPropagation(); _.focus(); });
                        _.addEventListener(
                            'click',
                            e =>
                            {
                                overlay.submitted = true; overlay.with_input(overlay.e_input_txt.value);
                                OverlayManager.DismissOne();
                            }
                        );
                    }
                );
            }
        );


        overlay.e_input_txt.focus();
    };

    onRemoveElements = overlay => { };

    onHandleHotkeys = (overlay, e) =>
    {
        if (e.key === 'Escape') { overlay.Dismiss(); return; }
    };
}