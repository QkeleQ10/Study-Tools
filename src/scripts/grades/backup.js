class GradeBackupPane extends Pane {
    id = 'cb';
    icon = '';

    #div1;
    #div2;

    constructor(parentElement) {
        super(parentElement);

        this.element.id = 'st-grade-backup-pane';
        this.#div1 = this.element.createChildElement('div', { class: 'st-div' });
        this.element.createChildElement('hr');
        this.#div2 = this.element.createChildElement('div', { class: 'st-div' });
    }

    show() {
        this.redraw();
        super.show();
    }

    redraw() {
        this.#div1.innerHTML = '';
        this.#div2.innerHTML = '';

        this.#div1.createChildElement('h3', { class: 'st-section-heading', innerText: i18n('cb.export') });
        this.#div2.createChildElement('h3', { class: 'st-section-heading', innerText: i18n('cb.import') });

        const year = currentGradeTable?.identifier?.year;
        const { backupYear, backupDate } = currentGradeTable?.identifier || {};

        if (currentGradeTable?.identifier?.year?.id) {
            this.#div1.createChildElement('p', { innerText: i18n('cb.exportDesc', { study: year.studie.code, period: year.lesperiode.code }) });
            const exportButton = this.#div1.createChildElement('button', { id: 'st-grade-backup-export', class: 'st-button hero', innerText: i18n('cb.backUpThisTable'), 'data-icon': '' });
            exportButton.addEventListener('click', async () => {
                if (!currentGradeTable?.identifier?.year?.id) return;
                await this.#exportGrades(currentGradeTable);
            });
        } else if (backupYear && backupDate) {
            this.#div1.createChildElement('p', { innerText: i18n('cb.importedDesc', { study: backupYear.studie.code, period: backupYear.lesperiode.code, date: new Date(backupDate).toLocaleString(locale) }) });
        }

        this.#div2.createChildElement('p', { innerText: i18n('cb.importDesc') });
        const importButton = this.#div2.createChildElement('button', { id: 'st-grade-backup-import', class: 'st-button hero', innerText: i18n('cb.browse'), 'data-icon': '' });
        const input = this.#div2.createChildElement('input', { type: 'file', accept: '.stgrades', style: 'display:none' });
        importButton.addEventListener('click', () => input.click());
        input.addEventListener('change', async (event) => {
            const file = event.target.files[0];
            if (!file) return;

            const reader = new FileReader();
            reader.onload = async (e) => {
                const json = JSON.parse(typeof e.target.result === 'string' ? e.target.result : new TextDecoder().decode(e.target.result));
                await this.#importBackup(json);
            };
            reader.readAsText(file);
        });

        this.progressBar.dataset.visible = 'false';
    }

    async #exportGrades(gradeTable) {
        return new Promise(async (resolve, reject) => {
            try {
                this.#div1.classList.add('st-disabled');

                const grades = await this.#gatherGrades(gradeTable);
                const year = gradeTable.identifier.year;

                this.progressBar.dataset.visible = 'true';

                let uri = `data:application/json;base64,${window.btoa(unescape(encodeURIComponent(JSON.stringify(
                    {
                        date: new Date(),
                        year: { groep: { omschrijving: year.groep.omschrijving, code: year.groep.code }, studie: { code: year.studie.code }, lesperiode: { code: year.lesperiode.code } },
                        grades
                    }
                ))))}`,
                    a = element('a', 'st-grade-backup-temp', document.body, {
                        download: `Cijferback-up ${year.studie.code} (${year.lesperiode.code}) ${(new Date).toLocaleString()}.stgrades`,
                        href: uri,
                        type: 'application/json'
                    });
                a.click();
                a.remove();

                setTimeout(() => {
                    this.progressBar.dataset.visible = 'false';
                }, 500);

                new Dialog({ innerText: i18n('cb.done') }).show();

                setTimeout(() => {
                    this.#div1.classList.remove('st-disabled');
                    resolve();
                }, 10000)

            } catch (error) {
                reject(error);
                new Dialog({ innerText: i18n('cb.error') }).show();
            }
        });
    }

    async #gatherGrades(gradeTable) {
        return new Promise(async (resolve, reject) => {
            try {
                this.progressBar.firstElementChild.classList.remove('indeterminate');
                this.progressBar.dataset.visible = 'true';

                const grades = gradeTable.grades.filter(grade => grade.CijferKolom?.Id > 0);

                for (let i = 0; i < grades.length; i++) {
                    this.progressBar.firstElementChild.style.width = `${(i / grades.length) * 100}%`;

                    await new Promise((resolve) => {
                        let delay = 5;
                        if (i > 0 && i % 100 === 0) {
                            delay = 8000;
                            const dialog = new Dialog({ innerText: i18n('cb.avoidingRateLimit'), allowClose: false });
                            dialog.show();
                            setTimeout(() => dialog.close(), 8000);
                        } else if (grades.length > 100) {
                            delay = 20;
                        }
                        setTimeout(resolve, delay);
                    });

                    const gradeColumnInfo = await magisterApi.gradesColumnInfo(gradeTable.identifier.year, grades[i].CijferKolom.Id);

                    grades[i] = {
                        ...grades[i],
                        CijferKolom: { ...grades[i].CijferKolom, ...gradeColumnInfo }
                    }
                }

                this.progressBar.firstElementChild.removeAttribute('style');
                this.progressBar.firstElementChild.classList.add('indeterminate');
                this.progressBar.dataset.visible = 'false';

                resolve(grades);
            } catch (error) {
                reject(error);
            }
        });
    }

    async #importBackup(json) {
        const { date, year, grades } = json;

        if (!date || !year || !grades || !Array.isArray(grades)) {
            new Dialog({
                innerText: "Je back-up is ongeldig of in een verouderde indeling.\n\nJe kunt oude back-ups importeren via onderstaande website.",
                buttons: [{ innerText: 'Importeren via website', primary: true, href: 'https://qkeleq10.github.io/studytools/grades#grades' }]
            }).show();
            return;
        }

        // this.close();

        const aside = await awaitElement('aside'), container = await awaitElement('.container[id$=container]'), asideResizer = document.querySelector('#st-aside-resize');
        aside.setAttribute('style', 'display:none;width:0px;');
        container.style.paddingRight = '20px';
        if (asideResizer) asideResizer.setAttribute('style', `display:none`);

        if (gradeTables.find(t => t.date?.getTime() === new Date(date).getTime())) {
            notify('snackbar', "Je hebt deze back-up al geïmporteerd.");
            return;
        }

        const newGradeTable = new GradeTable(grades, { backupDate: new Date(date), backupYear: year });
        gradeTables.push(newGradeTable);

        const label = document.getElementById('st-grades-year-filter')
            .createChildElement('label', {
                class: 'st-checkbox-label icon',
                for: `st-year-filter-yearimport${new Date(date).getTime()}`,
                innerText: '',
                title: `Back-up van ${year.studie.code} (${year.lesperiode.code}) ${new Date(date).toLocaleString()}`
            });
        const input = label.createChildElement('input', { id: `st-year-filter-yearimport${new Date(date).getTime()}`, class: 'st-checkbox-input', name: 'st-year-filter', type: 'radio' });

        input.checked = true;

        input.addEventListener('change', () => {
            if (!input.checked) return;
            currentGradeTable?.destroy();
            currentGradeTable = newGradeTable;
            currentGradeTable.draw();
        });

        currentGradeTable?.destroy();
        currentGradeTable = newGradeTable;
        currentGradeTable.draw();
    }
}