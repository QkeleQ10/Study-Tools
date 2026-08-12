// Runs in the page's own context, unlike the rest of Study Tools, so that it can reach
// what a content script can't: the properties of Magister's web components, the inside of
// their shadow roots, and the custom element registry they share.
//
// Messages are passed as JSON strings, because handing objects between the two contexts
// needs browser-specific unwrapping.
(() => {
    if (window.__studyToolsBridge) return;
    window.__studyToolsBridge = true;

    const guarded = Symbol.for('study-tools-guarded');

    /**
     * Magister's newer pages are separate bundles that each ship a copy of the Sanoma
     * design system. Whichever loads second re-registers names the first already claimed,
     * define throws, and the whole module fails to evaluate, leaving the page blank.
     *
     * The property is redefined rather than the method wrapped because Magister loads a
     * custom elements polyfill that replaces define partway through startup.
     */
    function guardRegistrations() {
        const descriptor = Object.getOwnPropertyDescriptor(CustomElementRegistry.prototype, 'define');
        const current = descriptor?.get
            ? descriptor.get.call(CustomElementRegistry.prototype)
            : descriptor?.value;

        if (typeof current !== 'function' || current[guarded]) return;

        let define = wrapDefine(current);
        Object.defineProperty(CustomElementRegistry.prototype, 'define', {
            configurable: true,
            get() { return define },
            set(value) { define = wrapDefine(value) }
        });
    }

    function wrapDefine(define) {
        const wrapped = function (name, constructor, options) {
            if (this.get?.(name)) {
                console.debug(`Skipped a duplicate registration of <${name}>`);
                return;
            }
            return define.call(this, name, constructor, options);
        };
        wrapped[guarded] = true;
        return wrapped;
    }

    /**
     * Style Magister's components from the inside, from the moment they exist: hunting
     * them down from script always loses the race. The assignment is wrapped because Lit
     * replaces adoptedStyleSheets wholesale when it first renders.
     */
    function adoptIntoEveryShadowRoot() {
        const sheet = new CSSStyleSheet();

        const keep = (root) => {
            try {
                if (!root.adoptedStyleSheets.includes(sheet)) {
                    root.adoptedStyleSheets = [...root.adoptedStyleSheets, sheet];
                }
            } catch (error) {
                // A root that refuses the sheet is not worth breaking the page over.
            }
        };

        const descriptor = Object.getOwnPropertyDescriptor(ShadowRoot.prototype, 'adoptedStyleSheets');
        if (descriptor?.set) {
            Object.defineProperty(ShadowRoot.prototype, 'adoptedStyleSheets', {
                configurable: true,
                enumerable: descriptor.enumerable,
                get() { return descriptor.get.call(this) },
                set(sheets) {
                    descriptor.set.call(this, [...sheets].includes(sheet) ? sheets : [...sheets, sheet]);
                }
            });
        }

        const attachShadow = Element.prototype.attachShadow;
        Element.prototype.attachShadow = function (...args) {
            const root = attachShadow.apply(this, args);
            keep(root);
            return root;
        };

        const walk = (root) => {
            for (const element of root.querySelectorAll?.('*') || []) {
                if (!element.shadowRoot) continue;
                keep(element.shadowRoot);
                walk(element.shadowRoot);
            }
        };
        walk(document);

        return sheet;
    }

    function deepQuerySelector(querySelector, root = document) {
        const direct = root.querySelector?.(querySelector);
        if (direct) return direct;

        for (const element of root.querySelectorAll?.('*') || []) {
            if (!element.shadowRoot) continue;
            const match = deepQuerySelector(querySelector, element.shadowRoot);
            if (match) return match;
        }
    }

    try {
        guardRegistrations();
        // A plain assignment goes through the setter above, but a polyfill could install
        // its own with defineProperty, which replaces the accessor outright.
        const reassert = setInterval(guardRegistrations, 200);
        setTimeout(() => clearInterval(reassert), 20000);
        window.addEventListener('hashchange', guardRegistrations);
    } catch (error) {
        console.warn('Could not guard custom element registration.', error);
    }

    // Adopted empty and filled in once the stylesheet arrives, so that it is already in
    // place everywhere and nothing renders unstyled while waiting for it.
    const sheet = adoptIntoEveryShadowRoot();

    function loadStylesheet() {
        const url = document.documentElement.dataset.studyToolsShadowCss;
        if (!url) return false;

        fetch(url)
            .then(response => response.text())
            .then(css => sheet.replaceSync(css))
            .catch(error => console.warn('Could not load the Magister stylesheet: ', error));
        return true;
    }

    // The extension hands over the URL from its own context, at the same moment as this.
    if (!loadStylesheet()) {
        const observer = new MutationObserver(() => {
            if (loadStylesheet()) observer.disconnect();
        });
        observer.observe(document.documentElement, { attributes: true, attributeFilter: ['data-study-tools-shadow-css'] });
    }

    document.addEventListener('st-bridge', event => {
        let request;
        try {
            request = JSON.parse(event.detail);
        } catch (error) {
            return;
        }

        let found = false;
        let result = {};

        // Always answer, even on failure: the caller has no other way to tell a broken
        // request from a component that never turned up, and would sit out its timeout.
        try {
            const element = deepQuerySelector(request.selector);
            found = !!element;

            if (element) {
                for (const [property, value] of Object.entries(request.set || {})) element[property] = value;
                for (const method of request.call || []) element[method]?.();
                for (const property of request.get || []) result[property] = element[property];
            }
        } catch (error) {
            console.warn('Bridge request failed: ', request.selector, error);
        }

        let detail;
        try {
            detail = JSON.stringify({ id: request.id, found, result });
        } catch (error) {
            // A property that won't survive JSON, such as anything holding a DOM node.
            detail = JSON.stringify({ id: request.id, found, result: {} });
        }

        document.dispatchEvent(new CustomEvent('st-bridge-result', { detail }));
    });
})()
