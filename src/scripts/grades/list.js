class GradeListPane extends Pane {
    id = 'cl';
    icon = '';

    #div1;
    #div2;

    sortingOptions = [
        {
            id: 'date_desc', label: i18n('cl.sortByDateDesc'), comparator: (a, b) => {
                const dateA = new Date(a.DatumIngevoerd);
                const dateB = new Date(b.DatumIngevoerd);
                return dateB.getTime() - dateA.getTime();
            }
        },
        {
            id: 'date_asc', label: i18n('cl.sortByDateAsc'), comparator: (a, b) => {
                const dateA = new Date(a.DatumIngevoerd);
                const dateB = new Date(b.DatumIngevoerd);
                return dateA.getTime() - dateB.getTime();
            }
        },
        {
            id: 'result_desc', label: i18n('cl.sortByResultDesc'), comparator: (a, b) => {
                const resultA = Number(a.CijferStr);
                const resultB = Number(b.CijferStr);
                if (isNaN(resultA) && isNaN(resultB)) return a.CijferStr.localeCompare(b.CijferStr);
                if (isNaN(resultA)) return 1;
                if (isNaN(resultB)) return -1;
                return resultB - resultA;
            }
        },
        {
            id: 'result_asc', label: i18n('cl.sortByResultAsc'), comparator: (a, b) => {
                const resultA = Number(a.CijferStr);
                const resultB = Number(b.CijferStr);
                if (isNaN(resultA) && isNaN(resultB)) return a.CijferStr.localeCompare(b.CijferStr);
                if (isNaN(resultA)) return 1;
                if (isNaN(resultB)) return -1;
                return resultA - resultB;
            }
        },
    ];
    sortingOption = this.sortingOptions[0];

    constructor(parentElement) {
        super(parentElement);

        this.element.id = 'st-grade-recents-pane';
        this.#div1 = this.element.createChildElement('div', { class: 'st-div' });
        this.#div1.createChildElement('h3', { class: 'st-section-heading', innerText: i18n('cl.title') });
        const select = this.#div1.createChildElement('select', { class: 'st-select' });
        for (const option of this.sortingOptions) {
            const optionElement = select.createChildElement('option', { value: option.id, innerText: option.label });
            if (option === this.sortingOption) {
                optionElement.selected = true;
            }
        }
        select.addEventListener('change', () => {
            const selectedOption = this.sortingOptions.find(option => option.id === select.value);
            if (selectedOption && selectedOption !== this.sortingOption) {
                this.sortingOption = selectedOption;
                this.redraw();
            }
        });

        this.element.createChildElement('hr');
        this.#div2 = this.element.createChildElement('div', { class: 'st-div' });
    }

    show() {
        this.redraw();
        super.show();
    }

    redraw() {
        this.progressBar.dataset.visible = 'true';

        this.#div2.innerHTML = '';

        const grades = currentGradeTable.grades.filter(grade => grade.CijferStr?.length > 0 && grade.CijferKolom?.KolomSoort !== 2);
        grades.sort(this.sortingOption.comparator);

        // === EMPTY ===

        if (grades.length === 0) {
            this.#div2.createChildElement('p', { innerText: i18n('cl.noGrades') });
            this.progressBar.dataset.visible = 'false';
            return;
        }

        // === LIST ===

        const list = this.#div2.createChildElement('ul', { class: 'st-grade-list' });
        for (const grade of grades) {
            const listItem = list.createChildElement('li', { class: 'st-grade-list-item' });
            listItem.createChildElement('span', { class: 'st-grade-list-item-result', innerText: grade.CijferStr });
            listItem.createChildElement('span', { class: 'st-grade-list-item-course', innerText: grade.VakNaam });
            listItem.createChildElement('span', { class: 'st-grade-list-item-date', innerText: new Date(grade.DatumIngevoerd).toLocaleDateString(locale) });
            listItem.createChildElement('span', { class: 'st-grade-list-item-description', innerText: grade.CijferKolom.WerkInformatieOmschrijving || grade.CijferKolom.KolomOmschrijving || '-' });
        }

        this.progressBar.dataset.visible = 'false';
    }
}