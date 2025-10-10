class GradeCalculatorPane extends Pane {
    constructor(parentElement) {
        super(parentElement);
        this.element.id = 'st-grade-calculator-pane';

        this.element.createChildElement('h3', { class: 'st-section-heading', innerText: i18n('cc.title') });
    }
}