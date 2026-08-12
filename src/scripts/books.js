const booksSelector = 'lm-edu-x-learning-material-overview';
const handledOverviews = new WeakSet();

// Run at start and when the URL changes
popstate()
window.addEventListener('popstate', popstate)
async function popstate() {
    if (document.location.href.split('?')[0].includes('/leermiddelen')) {
        if (!syncedStorage['books-enabled']) return;

        const overview = await awaitDeepElement(booksSelector);
        if (!overview || handledOverviews.has(overview)) return;
        handledOverviews.add(overview);

        new BooksOverview(/** @type {HTMLElement} */(overview));
    }
}

class BooksOverview {
    element;
    materials = [];
    #names;
    #syncing = false;
    #originalTitles = new Map();

    constructor(element) {
        this.element = element;
        this.#names = syncedStorage['books'] || {};

        adoptStudyToolsStyles(this.element.shadowRoot).then(() => this.decorate());

        observeComponent(this.element, () => this.sync());
        this.sync();
    }

    /** Read what the page is showing, write it back renamed and reordered. */
    async sync() {
        if (this.#syncing) return;
        this.#syncing = true;

        try {
            const { result } = await componentBridge(booksSelector, { get: ['learningMaterials'] });
            const materials = result.learningMaterials || [];
            if (!materials.length) return;

            for (const material of materials) {
                if (!this.#originalTitles.has(material.EAN)) this.#originalTitles.set(material.EAN, material.Titel);
            }

            const arranged = this.arrange(materials);
            this.materials = arranged;

            // Already showing exactly this, so there is nothing to write and no re-render
            // to trigger, which is what keeps this from looping.
            if (this.#signature(materials) === this.#signature(arranged)) return this.decorate();

            await componentBridge(booksSelector, {
                set: { learningMaterials: arranged },
                call: ['requestUpdate']
            });
            this.decorate();
        } finally {
            this.#syncing = false;
        }
    }

    arrange(materials) {
        const groupBySubject = syncedStorage['books-group-by-subject'];

        return materials
            .map(material => ({ ...material, Titel: this.displayTitle(material) }))
            .sort((a, b) => {
                if (groupBySubject) {
                    const subjectA = a.Vak?.Omschrijving || '',
                        subjectB = b.Vak?.Omschrijving || '';
                    if (!subjectA !== !subjectB) return subjectA ? -1 : 1;
                    if (subjectA !== subjectB) return subjectA.localeCompare(subjectB);
                }
                return a.Titel.toLowerCase().localeCompare(b.Titel.toLowerCase());
            });
    }

    #signature(materials) {
        return materials.map(material => `${material.EAN}:${material.Titel}`).join('|');
    }

    displayTitle(material) {
        return this.#names[material.EAN]?.length
            ? this.#names[material.EAN]
            : this.originalTitle(material);
    }

    originalTitle(material) {
        return this.#originalTitles.get(material.EAN) ?? material.Titel;
    }

    decorate() {
        for (const card of this.element.shadowRoot.querySelectorAll('sl-card')) {
            const ean = card.querySelector('.ean')?.innerText.split(':').at(-1).trim();
            const material = this.materials.find(item => item.EAN === ean);
            if (!material || card.querySelector('.st-books-rename')) continue;

            const titleElement = /** @type {HTMLElement} */ (card.querySelector('.title'));
            if (titleElement) titleElement.title = this.originalTitle(material);

            card.createChildElement('button', {
                class: 'st-button icon st-books-rename',
                slot: 'header',
                dataset: { icon: '' },
                title: i18n('renameX', { item: this.originalTitle(material) })
            })
                .addEventListener('click', event => {
                    event.stopPropagation();
                    new BooksRenameDialog(material, this).show();
                });
        }
    }

    async rename(material, name) {
        if (name?.length) this.#names[material.EAN] = name;
        else delete this.#names[material.EAN];

        saveToStorage('books', this.#names);

        await this.sync();
    }
}

class BooksRenameDialog extends Dialog {
    #material;
    #overview;
    #input;

    constructor(material, overview) {
        super({
            buttons: [
                {
                    primary: true,
                    innerText: i18n('save'),
                    dataset: { icon: '' },
                    callback: () => this.save()
                }
            ],
            closeText: i18n('cancel')
        });

        this.#material = material;
        this.#overview = overview;

        const originalTitle = overview.originalTitle(material);

        this.body.createChildElement('h3', {
            class: 'st-section-heading',
            innerText: i18n('renameX', { item: originalTitle })
        });

        this.#input = this.body.createChildElement('input', {
            class: 'st-input',
            type: 'text',
            placeholder: originalTitle,
            style: { width: '100%', boxSizing: 'border-box', marginTop: '8px' }
        });
        this.#input.value = overview.displayTitle(material) === originalTitle
            ? ''
            : overview.displayTitle(material);
        this.#input.addEventListener('keydown', event => {
            if (event.key === 'Enter') this.save();
        });

        this.body.createChildElement('br');
        this.body.createChildElement('small', {
            class: 'st-note',
            innerText: i18n('lm.renameDisclaimer')
        });
    }

    save() {
        this.#overview.rename(this.#material, this.#input.value.trim());
        this.close();
        notify('snackbar', i18n('saved'));
    }
}
