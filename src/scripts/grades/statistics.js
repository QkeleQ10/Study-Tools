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

        this.element.createChildElement('p', { innerText: 'not implemented' });

        await this.#updateStats();
        this.#initialised = true;
    }

    async #updateStats() {
        this.progressBar.dataset.visible = 'true';

        // update stats here

        this.progressBar.dataset.visible = 'false';
    }
}