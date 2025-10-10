class Pane {
    parentElement;
    element;
    progressBar;

    constructor(parentElement) {
        this.parentElement = parentElement;

        this.element = this.parentElement.createChildElement('div', { class: 'st-pane st-hidden' });

        this.progressBar = this.element.createChildElement('div', {
            class: 'st-progress-bar', dataset: { visible: 'false' },
        });
        createElement('div', this.progressBar, {
            class: 'st-progress-bar-value indeterminate',
        });
    }

    show() {
        this.element.classList.remove('st-hidden');
    }

    hide() {
        this.element.classList.add('st-hidden');
    }

    toggle(force) {
        if (!force) this.hide();
        else this.show();
    }
}

class GradeStatisticsPane extends Pane {
    #initialised = false;

    constructor(parentElement) {
        super(parentElement);
        this.element.id = 'st-grade-statistics-pane';

        this.element.createChildElement('h3', { class: 'st-section-heading', innerText: i18n('cs.title') });
    }

    show() {
        if (!this.#initialised) this.#initialise();
        super.show();
    }

    async #initialise() {
        this.progressBar.dataset.visible = 'true';

        // initialisation here

        await new Promise((r) => setTimeout(r, 500)); // simulate loading
        this.element.createChildElement('p', { innerText: 'initialised' });

        await this.#updateStats();
        this.#initialised = true;
    }

    async #updateStats() {
        this.progressBar.dataset.visible = 'true';

        // update stats here

        await new Promise((r) => setTimeout(r, 500)); // simulate loading
        this.element.createChildElement('p', { innerText: 'updated' });

        this.progressBar.dataset.visible = 'false';
    }
}