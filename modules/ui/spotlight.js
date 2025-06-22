import { addElement } from "../utils/domutils.js";

export class Spotlight
{
    static Initialize()
    {
        Spotlight.#CreateWalls();
    }

    static #CreateWalls()
    {
        Spotlight.e_spotlight = document.getElementById('spotlight');

        addElement(
            Spotlight.e_spotlight, 'div', 'spotlight-wall', '',
            _ =>
            {
                _.style.top = '50%';
                _.style.right = '100%';
                _.style.width = '100vw';
                _.style.height = '200vh';
                _.style.transform = 'translate(0%, -50%)';
            }
        );
        addElement(
            Spotlight.e_spotlight, 'div', 'spotlight-wall', '',
            _ =>
            {
                _.style.top = '50%';
                _.style.left = '100%';
                _.style.width = '100vw';
                _.style.height = '200vh';
                _.style.transform = 'translate(0%, -50%)';
            }
        );

        addElement(
            Spotlight.e_spotlight, 'div', 'spotlight-wall', '',
            _ =>
            {
                _.style.top = '100%';
                _.style.left = '50%';
                _.style.width = '200vw';
                _.style.height = '100vh';
                _.style.transform = 'translate(-50%, 0%)';
            }
        );

        addElement(
            Spotlight.e_spotlight, 'div', 'spotlight-wall', '',
            _ =>
            {
                _.style.bottom = '100%';
                _.style.left = '50%';
                _.style.width = '200vw';
                _.style.height = '100vh';
                _.style.transform = 'translate(-50%, 0%)';
            }
        );
    }

    static Element(e_target)
    {
        if (!e_target) return;

        if (window.TryGetGlobalStylingAspect('spotlight')?.enabled !== true) return;
        Spotlight.e_spotlight.style.transitionDelay = '0s';
        Spotlight.e_spotlight.style.opacity = '40%';

        let e_body_rect = document.body.getBoundingClientRect();
        let e_target_rect = e_target.getBoundingClientRect();

        Spotlight.e_spotlight.style.left = ((e_target_rect.x - e_body_rect.x) - 12) + 'px';
        Spotlight.e_spotlight.style.top = ((e_target_rect.y - e_body_rect.y) - 12) + 'px';
        Spotlight.e_spotlight.style.width = (e_target_rect.width + 24) + 'px';
        Spotlight.e_spotlight.style.height = (e_target_rect.height + 24) + 'px';
    }

    static None()
    {
        Spotlight.e_spotlight.style.transitionDelay = '0.5s';
        Spotlight.e_spotlight.style.opacity = '0%';
    }
}