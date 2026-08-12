const registrationsSelector = 'att-lesson-registrations';
const handledRegistrationLists = new WeakSet();

// Run at start and when the URL changes
popstate()
window.addEventListener('popstate', popstate)
async function popstate() {
    if (document.location.href.split('?')[0].includes('/att-absence')) {
        if (!syncedStorage['abs-enabled']) return;

        if (await leaveStudentSelector()) return;

        // Quiet: this route also covers the dashboard, which has no registrations on it.
        const registrations = await awaitDeepElement(registrationsSelector, false, 8000, true);
        if (!registrations || handledRegistrationLists.has(registrations)) return;
        handledRegistrationLists.add(registrations);

        new AbsenceRegistrations(/** @type {HTMLElement} */(registrations));
    }
}

/**
 * The student selector is where a guardian picks which child to look at. A student has
 * nobody to pick from, so Magister routes there and leaves the page empty. Only the view
 * that says it is a student is sent on, which leaves that choice alone for guardians.
 *
 * The entry is replaced rather than added, so going back doesn't land here again.
 * @returns {Promise<boolean>} Whether the page is being left.
 */
async function leaveStudentSelector() {
    if (!document.location.hash.includes('/att-absence/student-selector')) return false;

    // Quiet, and shorter than the usual wait: a guardian has a selector to use, and there
    // is nothing to wait for once the page they asked for is on screen.
    const root = await awaitDeepElement('att-absence-root[view-as-student]', false, 3000, true);
    if (!root) return false;

    window.location.replace('#/att-absence');
    return true;
}

/**
 * Magister only ever requests the current school year and offers no way to look back, so
 * earlier registrations are unreachable. The list itself renders whatever it is given.
 */
class AbsenceRegistrations {
    element;
    years = [];
    #overviewRoot;
    #toolbar;
    #yearsWrapper;
    #summary;
    #summarySignature;
    #selectedYearId;

    constructor(element) {
        this.element = element;
        this.#build();
    }

    async #build() {
        // The toolbar sits in the page header rather than above the list, so it doesn't
        // take a band out of the content. It lives in the overview's tree, not the list's.
        this.#overviewRoot = /** @type {ShadowRoot} */ (this.element.getRootNode());
        await adoptStudyToolsStyles(this.#overviewRoot);

        this.#toolbar = createElement('div', null, { id: 'st-abs-toolbar' });

        this.#yearsWrapper = this.#toolbar.createChildElement('div', { class: 'st-segmented-control' });
        this.#summary = this.#toolbar.createChildElement('div', { id: 'st-abs-summary' });

        this.#place();
        // Switching tabs only flips an attribute on the panels, which childList misses.
        observeComponent(this.#overviewRoot, () => this.#place(), {
            childList: true, subtree: true, attributes: true, attributeFilter: ['selected']
        });

        this.years = [...await magisterApi.years()]
            .sort((a, b) => new Date(a.begin).getTime() - new Date(b.begin).getTime());

        this.years.forEach((year, index) => {
            const isCurrent = index === this.years.length - 1;
            const start = new Date(year.begin).getFullYear();

            const button = this.#yearsWrapper.createChildElement('button', {
                class: `st-button segment${isCurrent ? ' active' : ''}`,
                innerText: `${start}/${String((start + 1) % 100).padStart(2, '0')}`,
                title: `${year.groep?.omschrijving || year.groep?.code || ''} (${year.studie?.code || ''})`.trim()
            });
            button.addEventListener('click', () => this.selectYear(year));

            if (isCurrent) this.#selectedYearId = year.id;
        });

        this.#summariseCurrentYear();
    }

    /**
     * Share the tab bar's row, so the years and totals line up with the tabs rather than
     * adding a band of their own. The tabs stick to an offset hard-coded to Magister's
     * own header height, so the header has to keep the height it started with.
     */
    #place() {
        const bar = this.#overviewRoot.querySelector('dna-tab-bar');
        if (!bar) return;

        if (!bar.contains(this.#toolbar)) bar.append(this.#toolbar);

        // Read from the panel rather than from layout, which hasn't caught up yet when
        // this runs. Only written when it changes, so observing attributes can't loop.
        const display = this.element.closest('dna-tab')?.hasAttribute('selected') ? '' : 'none';
        if (this.#toolbar.style.display !== display) this.#toolbar.style.display = display;
    }

    /** Summarise what the page loaded for the current year by itself. */
    async #summariseCurrentYear() {
        for (const delay of [0, 1500]) {
            await new Promise(resolve => setTimeout(resolve, delay));
            if (this.#selectedYearId !== this.years.at(-1)?.id) return;

            const { result } = await componentBridge(registrationsSelector, { get: ['registrations'] });
            this.#updateSummary(result.registrations || []);
        }
    }

    async selectYear(year) {
        if (this.#selectedYearId === year.id) return;
        this.#selectedYearId = year.id;

        this.#yearsWrapper.querySelectorAll('.st-button.segment').forEach((button, index) => {
            button.classList.toggle('active', this.years[index]?.id === year.id);
        });

        const registrations = await magisterApi.absencesForYear(year) || [];

        await componentBridge(registrationsSelector, {
            set: {
                registrations,
                // Grouped one level up from the list, so setting registrations on its own
                // renders nothing. Keyed by month index, the way Magister does it.
                groupedRegistrations: Object.groupBy(registrations, item => new Date(item.Start).getMonth())
            },
            call: ['requestUpdate']
        });

        this.#updateSummary(registrations);
    }

    #updateSummary(registrations) {
        const authorised = registrations.filter(item => item.Geoorloofd).length;

        const signature = `${registrations.length}/${authorised}`;
        if (signature === this.#summarySignature) return;
        this.#summarySignature = signature;

        this.#summary.innerText = '';

        const metrics = [
            { description: i18n('abs.registrations'), value: registrations.length },
            { description: i18n('abs.authorised'), value: authorised },
            { description: i18n('abs.unauthorised'), value: registrations.length - authorised },
        ];

        metrics.forEach(metric => {
            this.#summary.createChildElement('div', {
                class: 'st-metric secondary',
                'data-description': metric.description,
                innerText: metric.value
            });
        });
    }
}
