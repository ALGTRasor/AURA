import { SelectionInstance } from "../../utils/selections.js";
import { SelectionOverlay } from "./overlay_selection.js";
import { OverlayManager } from "../overlay_manager.js";
import { addElement, CreatePagePanel } from "../../utils/domutils.js";
import { bytes_mb, get_file_size_group } from "../../utils/filesizes.js";
import { GlobalStyling } from "../global_styling.js";

export class FileSelectionOverlay extends SelectionOverlay
{
    static host = new FileSelectionOverlay();
    static ShowNew(data = {})
    {
        let overlay = FileSelectionOverlay.host.GetNewInstance(data);
        OverlayManager.Show(overlay);
        return overlay;
    }

    kind = 'file-selection-overlay';

    onCreateElements = overlay =>
    {
        overlay.selection = new SelectionInstance();
        overlay.selection.get_item_identifier = _ => _.id;
        overlay.e_root.innerHTML = '';

        overlay.prompt = GlobalStyling.ColorText(overlay.prompt);
        /*
        overlay.prompt = overlay.prompt.replaceAll('((', '<span style="color:white;">');
        overlay.prompt = overlay.prompt.replaceAll('))', '</span>');
        */

        const style_overlay_root = 'position:absolute; top:50%; left:50%; transform:translate(-50%,-50%);'
            + 'min-height:3rem; min-width:min(100% - 5 * var(--gap-1), 28rem); max-width:calc(100% - 5 * var(--gap-1));'
            + 'display:flex; flex-direction:column; flex-wrap:nowrap;';
        const style_parts = 'flex-grow:1.0; align-content:center; text-align:center; font-size:0.85rem; letter-spacing:2px; padding:var(--gap-1); line-height:1.5rem;';

        let e_body = CreatePagePanel(overlay.e_root, false, false, style_overlay_root, _ => { });
        e_body.addEventListener('mousedown', e => { e.stopPropagation(); e_body.focus(); });
        e_body.title = '';
        e_body.tabIndex = 0;
        e_body.focus();

        overlay.e_prompt = CreatePagePanel(e_body, true, false, style_parts + 'flex-grow:0.0; letter-spacing:0px;', _ => { _.innerHTML = overlay.prompt; });
        CreatePagePanel(
            e_body, true, false, 'flex-grow:1.0; display:flex; flex-direction:column; flex-wrap:nowrap;',
            _ =>
            {
                addElement(
                    _, 'form', null, 'display:none; flex-direction:row; flex-wrap:nowrap;',
                    _ =>
                    {
                        _.action = '';
                        overlay.input_file = addElement(
                            _, 'input', null, 'pointer-events:all; flex-grow:1.0; flex-shrink:1.0;',
                            _ =>
                            {
                                _.id = 'input-file-upload';
                                _.type = 'file';
                                _.multiple = true;
                            }
                        );
                        overlay.input_file.addEventListener(
                            'change',
                            e =>
                            {
                                overlay.e_btn_submit.classList.remove('panel-button-disabled');
                                if (overlay.input_file.files.length < 1)
                                {
                                    overlay.e_btn_submit.classList.add('panel-button-disabled');
                                    overlay.e_selected.innerHTML = 'NO FILE SELECTED';
                                    overlay.e_btn_submit.innerText = 'SUBMIT';
                                }
                                else
                                {
                                    overlay.e_selected.innerHTML = '';
                                    overlay.valid_count = 0;
                                    let fid = 0;
                                    while (fid < overlay.input_file.files.length)
                                    {
                                        let file = overlay.input_file.files.item(fid);
                                        fid++;
                                        if (!file) continue;

                                        if ('name' in file)
                                        {
                                            let too_big = file.size > (150 * bytes_mb);
                                            let size_group = get_file_size_group(file.size);
                                            CreatePagePanel(
                                                overlay.e_selected, false, false, 'display:flex; flex-direction:row; text-align:left; flex-shrink:0.0; align-content:center;',
                                                _ =>
                                                {
                                                    if (too_big === true) 
                                                    {
                                                        _.style.backgroundColor = 'hsl(from var(--theme-color) 0deg 100% 12%)';
                                                        addElement(
                                                            _, 'div', 'material-symbols', 'font-size:1rem; align-content:center; text-align:center; color:#f00; flex-shrink:0.0;',
                                                            _ => { _.innerText = 'priority_high'; }
                                                        );
                                                        addElement(
                                                            _, 'div', null, 'align-content:center; flex-basis:100%;',
                                                            _ => { _.innerText = file.name; }
                                                        );
                                                        addElement(
                                                            _, 'div', null,
                                                            'font-weight:bold; font-size:0.6rem; align-content:center; text-align:center; background-color:#f003; padding:var(--gap-025);'
                                                            + 'border-radius:var(--corner-025); border:solid 2px red; flex-shrink:0.0;',
                                                            _ => { _.innerText = 'TOO BIG'; }
                                                        );
                                                        addElement(
                                                            _, 'div', null, 'color:hsl(from orange h s var(--theme-l050)); font-size:0.75rem; align-content:center; flex-shrink:0.0;',
                                                            _ => { _.innerText = `(${size_group.bytes_label})`; }
                                                        );
                                                    }
                                                    else
                                                    {
                                                        overlay.valid_count++;
                                                        addElement(
                                                            _, 'div', 'material-symbols', 'font-size:1rem; align-content:center; text-align:center; color:#0ff; flex-shrink:0.0;',
                                                            _ => { _.innerText = 'task_alt'; }
                                                        );
                                                        addElement(
                                                            _, 'div', null, 'align-content:center; flex-basis:100%;',
                                                            _ => { _.innerText = file.name; }
                                                        );
                                                        addElement(
                                                            _, 'div', null, 'color:white; font-size:0.75rem; align-content:center; opacity:50%; flex-shrink:0.0;',
                                                            _ => { _.innerText = `(${size_group.bytes_label})`; }
                                                        );
                                                    }

                                                    _.title = file.name;
                                                }
                                            );
                                        }
                                    }
                                    overlay.e_btn_submit.innerText = `SUBMIT ${overlay.valid_count} FILES`;

                                    if (overlay.valid_count < 1)
                                    {
                                        overlay.e_btn_submit.classList.add('panel-button-disabled');
                                        overlay.e_btn_submit.innerText = 'SUBMIT';
                                    }
                                }
                            }
                        );
                    }
                );

                overlay.e_selected = addElement(_, 'div', 'scroll-y', 'display:flex; flex-direction:column; text-align:center; align-content:center; padding:var(--gap-05); max-height:50vh; gap:var(--gap-025);', 'NO FILE SELECTED');

                overlay.e_btn_attach = CreatePagePanel(
                    _, false, false, style_parts + '--theme-color:#0ff; padding:var(--gap-05);',
                    _ =>
                    {
                        _.title = 'SELECT FILES';
                        _.innerText = 'SELECT FILES';
                        _.style.flexBasis = '1.5rem';
                        _.classList.add('panel-button');
                        _.addEventListener('mousedown', e => { e.preventDefault(); e.stopPropagation(); _.focus(); });
                        _.addEventListener(
                            'click',
                            e =>
                            {
                                overlay.input_file.click();
                            }
                        );
                    }
                );

                overlay.e_btn_submit = CreatePagePanel(
                    _, false, false, style_parts + '--theme-color:#4f4; padding:var(--gap-05);',
                    _ =>
                    {
                        _.classList.add('panel-button-disabled');
                        _.title = 'SUBMIT';
                        _.innerText = 'SUBMIT';
                        _.style.flexBasis = '1.5rem';
                        _.classList.add('panel-button');
                        _.addEventListener('mousedown', e => { e.preventDefault(); e.stopPropagation(); _.focus(); });
                        _.addEventListener(
                            'click',
                            e =>
                            {
                                overlay.submitted = true;
                                overlay.with_files(overlay.input_file.files);
                                OverlayManager.DismissOne();
                            }
                        );
                    }
                );

                if (overlay.default_value)
                {
                    overlay.input_file.files = overlay.default_value;
                    overlay.input_file.dispatchEvent(new CustomEvent('change', { bubbles: true }));
                }
            }
        );
    };
    onRemoveElements = overlay => { };
}