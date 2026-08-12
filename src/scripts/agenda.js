const agendaSelector = 'cal-calendar-event-list-overview';
const handledCalendars = new WeakSet();

// Run at start and when the URL changes
popstate()
window.addEventListener('popstate', popstate)
async function popstate() {
    if (document.location.href.split('?')[0].includes('/agenda-nieuw')) {
        if (!syncedStorage['agenda-enabled']) return;

        const page = await awaitDeepElement('cal-main-page');
        if (!page || handledCalendars.has(page)) return;
        handledCalendars.add(page);

        new AgendaView(/** @type {HTMLElement} */(page));
    }
}

/** The agenda supports these views already; Magister just never exposes them. */
class AgendaView {
    element;

    /** Setting id -> property on the list. */
    #preferences = {
        'agenda-compact': 'isCompactView',
        'agenda-only-lessons': 'onlyShowLessons',
        'agenda-hide-empty-days': 'hideEmptyDays',
        'agenda-scroll-to-now': 'autoScrollToCurrentTime',
    };

    #applied = new WeakSet();

    constructor(element) {
        this.element = element;

        observeComponent(this.element, () => this.apply());
        this.apply();
    }

    async apply() {
        // The list is replaced rather than updated when the date or view changes, so a
        // fresh one is picked up on the next render.
        const overview = deepQuerySelector(agendaSelector, this.element.shadowRoot);
        if (!overview || this.#applied.has(overview)) return;
        this.#applied.add(overview);

        const set = {};
        for (const [setting, property] of Object.entries(this.#preferences)) {
            set[property] = !!syncedStorage[setting];
        }

        await componentBridge(agendaSelector, { set, call: ['requestUpdate'] });
    }
}
