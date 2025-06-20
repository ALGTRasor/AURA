import { addElement, fadeAppendChild, fadeRemoveElement, getSiblingIndex, setSiblingIndex } from "../utils/domutils.js";
import { PanelContent } from "../ui/panel_content.js";
import { AppInput } from "../systems/appinput.js";

export class PageResizer extends PanelContent
{
    constructor(e_parent = {}, page = PageInstance.Nothing)
    {
        super(e_parent);
        this.page = page;
    }

    OnCreateElements(data)
    {
        this.e_parent.appendElement(
            'div',
            _ =>
            {
                this.e_root = _;
                _.classList.add('page-resizer');

                _.addEventListener(
                    'mousedown',
                    e =>
                    {
                        if (this.dragging === true) return;
                        this.page.DisableBodyTransitions();
                        this.dragging = true;
                        this.drag_position_start = new DOMPoint(e.clientX, e.clientY);
                        this.drag_start_w = this.page.state.data.width;
                        this.drag_start_h = this.page.state.data.height;
                        const update_drag = e =>
                        {
                            this.drag_position_end = new DOMPoint(e.clientX, e.clientY);
                            this.drag_delta = new DOMPoint(e.clientX - this.drag_position_start.x, e.clientY - this.drag_position_start.y);

                            let new_w = this.drag_start_w + this.drag_delta.x;
                            let new_h = this.drag_start_h + this.drag_delta.y;

                            let doc_rect = document.body.getBoundingClientRect();
                            let doc_res_min = Math.min(doc_rect.width, doc_rect.height);
                            new_w = Math.min(new_w, doc_rect.width - this.page.state.data.position_x);
                            new_h = Math.min(new_h, doc_rect.height - this.page.state.data.position_y);
                            new_w = Math.max(new_w, 360);
                            new_h = Math.max(new_h, 360);

                            if (AppInput.IsPressed('Control') === true || Math.abs(new_w - new_h) < (0.05 * doc_res_min))
                            {
                                let md = Math.min(new_w, new_h);
                                new_w = md;
                                new_h = md;
                            }

                            this.page.state.data.width = new_w;
                            this.page.state.data.height = new_h;
                        };

                        window.addEventListener(
                            'mousemove',
                            e =>
                            {
                                if (this.dragging !== true) return;
                                update_drag(e);
                                this.page.ApplyFrameState(true);
                            }
                        );

                        window.addEventListener(
                            'mouseup',
                            e =>
                            {
                                if (this.dragging !== true) return;
                                this.dragging = false;
                                update_drag(e);
                                this.page.EnableBodyTransitions();
                                this.page.ApplyFrameState();
                            }
                        );
                    }
                );
            }
        );
    }
    OnRemoveElements(data)
    {
        this.e_root.remove();
    }
}