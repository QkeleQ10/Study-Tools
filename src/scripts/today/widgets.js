class Widget {
    element;
    header;
    options = {};
    progressBar;

    constructor(options = {}) {
        this.options = options;

        if (this.constructor == Widget) {
            throw new Error("Abstract classes can't be instantiated.");
        }
    }

    drawWidget(parentElement) {
        this.element = createElement('div', parentElement, {
            id: `st-widget-${this.constructor.id}`,
            class: 'st-widget',
        });

        this.header = createElement('h3', this.element, {
            id: `st-widget-${this.constructor.id}-title`,
            class: 'st-widget-title',
            innerText: i18n(`widgets.${this.constructor.id}`),
            'data-amount': 0,
        });

        this.progressBar = this.element.createChildElement('div', {
            class: 'st-progress-bar'
        });
        createElement('div', this.progressBar, {
            class: 'st-progress-bar-value indeterminate',
        });

        this.initialise();

        return this.element;
    }

    async initialise() { }

    static id = '';
    static disclaimer = 'widgetDisclaimer';
    static requiredPermissions = [];
    static displayByDefault = true;
    static possibleOptions = {};
}

class ListWidget extends Widget {
    #listElement;
    listItems = [];

    async initialise() {
        this.#listElement = this.element.createChildElement('ul', {
            id: `st-widget-${this.constructor.id}-list`,
            class: 'st-widget-list',
        });

        this.#drawList();
    }

    async #drawList() {
        for (const item of this.listItems) {
            await this.drawListItem(item);
        }

        this.header.dataset.amount = this.listItems.length;
        if (this.listItems.length < 1) this.element.style.display = 'none';

        this.progressBar.dataset.visible = false;
    }

    drawListItem() {
        return createElement('li', this.#listElement, {
            class: 'st-widget-subitem'
        })
    }
}

class SlideshowWidget extends Widget {
    #slideshowElement;
    listItems = [];
    #paginationElement;
    #currentSlide = 0;

    get currentSlide() { return this.#currentSlide; }
    set currentSlide(value) {
        let newValue = (this.listItems.length + value) % this.listItems.length;
        let difference = newValue - this.#currentSlide;
        this.#currentSlide = newValue;
        setTimeout(() => {
            this.#slideshowElement.querySelectorAll('div').forEach((node, i) => node.dataset.visible = i === newValue);
            this.element.dataset.unread = this.listItems[newValue].unread;
            this.#paginationElement.querySelectorAll('div').forEach((node, i) => node.dataset.current = i === newValue);
        }, 60);

        this.#slideshowElement.dataset.navigate = 'still';
        setTimeout(() => {
            this.#slideshowElement.dataset.navigate = difference > 0 ? 'forwards' : difference < 0 ? 'backwards' : 'still';
        }, 5);
    }

    async initialise() {
        this.#slideshowElement = this.element.createChildElement('div', {
            id: `st-widget-${this.constructor.id}-slideshow`,
            class: 'st-widget-slideshow',
        });

        this.element.createChildElement('button', {
            class: 'st-button icon tertiary st-widget-slideshow-previous',
            dataset: { icon: '' },
            title: i18n('Nieuwer')
        })
            .addEventListener('click', (event) => {
                event.stopPropagation();
                event.preventDefault();
                this.currentSlide--;
            });

        this.element.createChildElement('button', {
            class: 'st-button icon tertiary st-widget-slideshow-next',
            dataset: { icon: '' },
            title: i18n('Ouder')
        })
            .addEventListener('click', (event) => {
                event.stopPropagation();
                event.preventDefault();
                this.currentSlide++;
            });

        this.#paginationElement = this.element.createChildElement('div', { innerText: '', class: 'st-widget-slideshow-pagination' });

        this.#drawSlideshow();
    }

    async #drawSlideshow() {
        for (const [index, item] of this.listItems.entries()) {
            await this.drawSlideItem(item, index);
        }

        this.header.dataset.amount = this.listItems.length;
        if (this.listItems.length < 1) this.element.style.display = 'none';
        this.element.dataset.unread = this.listItems[0].unread;

        this.progressBar.dataset.visible = false;
    }

    drawSlideItem(item, index) {
        this.#paginationElement.createChildElement('div', {
            dataset: { current: index === this.#currentSlide }
        })
            .addEventListener('click', (event) => {
                event.stopPropagation();
                event.preventDefault();
                this.currentSlide = index;
            });

        return this.#slideshowElement.createChildElement('div', {
            class: 'st-slideshow-item',
            dataset: { visible: index === this.#currentSlide }
        });
    }
}

class HomeworkWidget extends ListWidget {
    async initialise() {
        this.listItems = (await magisterApi.events()).filter(event => {
            if (this.options.filter == 'incomplete')
                return (event.Inhoud?.length > 0 && new Date(event.Einde) > new Date() && !event.Afgerond)
            else
                return (event.Inhoud?.length > 0 && new Date(event.Einde) > new Date())
        });
        super.initialise();
    }

    async drawListItem(event) {
        return new Promise(resolve => {
            let itemElement = super.drawListItem();

            itemElement.tabIndex = 0;
            itemElement.addEventListener('click', () => {
                if (this.element.getAttribute('disabled') == 'true') return;
                new ScheduleEventDialog(event).show();
            });

            itemElement.createChildElement('span', {
                class: 'st-widget-subitem-row'
            })
                .createChildElement('b', {
                    class: 'st-widget-subitem-title',
                    innerText: eventSubjects(event) || event.Omschrijving,
                })
                .createSiblingElement('span', {
                    class: 'st-widget-subitem-timestamp',
                    innerText: makeTimestamp(event.Start),
                });

            itemElement.createChildElement('span', {
                class: 'st-widget-subitem-row',
            })
                .createChildElement('div', {
                    class: 'st-widget-subitem-content',
                    innerHTML: event.Inhoud.replace(/(<br ?\/?>)/gi, ''),
                });

            let chips = getEventChips(event)
            const chipsWrapper = itemElement.createChildElement('div', {
                class: 'st-chips-wrapper',
            });
            chips.forEach(chip => {
                createElement('span', chipsWrapper, {
                    class: `st-chip ${chip.type || 'info'}`,
                    innerText: chip.name,
                });
            });

            resolve(itemElement);
        });
    }

    static id = 'homework';
    static requiredPermissions = ['Afspraken'];
    static possibleOptions = {
        filter: {
            title: "Afgeronde items tonen",
            type: 'select',
            choices: [
                {
                    title: "Alles",
                    value: 'all'
                },
                {
                    title: "Alleen onvoltooid",
                    value: 'incomplete',
                    default: true
                },
            ]
        }
    };

}

class MessagesWidget extends ListWidget {
    async initialise() {
        this.listItems = await magisterApi.messages();
        super.initialise();

        this.element.tabIndex = 0;
        this.element.addEventListener('click', () => {
            if (this.element.getAttribute('disabled') == 'true') return;
            window.location.href = '#/berichten';
        });
    }

    async drawListItem(message) {
        return new Promise(resolve => {
            let itemElement = super.drawListItem();

            itemElement.createChildElement('span', {
                class: 'st-widget-subitem-row'
            })
                .createChildElement('b', {
                    class: 'st-widget-subitem-title',
                    innerText: message.afzender.naam,
                })
                .createSiblingElement('span', {
                    class: 'st-widget-subitem-timestamp',
                    innerText: makeTimestamp(message.verzondenOp),
                });


            itemElement.createChildElement('span', {
                class: 'st-widget-subitem-row',
            })
                .createChildElement('div', {
                    class: 'st-widget-subitem-content',
                    innerText: message.onderwerp,
                });

            let chips = []
            if (message.heeftPrioriteit) chips.push({ name: i18n('chips.important'), type: 'warn' })
            if (message.heeftBijlagen) chips.push({ name: i18n('chips.attachments'), type: 'info' })
            const chipsWrapper = itemElement.createChildElement('div', {
                class: 'st-chips-wrapper',
            });
            chips.forEach(chip => {
                createElement('span', chipsWrapper, {
                    class: `st-chip ${chip.type || 'info'}`,
                    innerText: chip.name,
                });
            });

            resolve(itemElement);
        });
    }

    static id = 'messages';
    static requiredPermissions = ['Berichten'];
}

class AssignmentsWidget extends ListWidget {
    async initialise() {
        this.listItems = (await magisterApi.assignmentsTop()).filter(assignment => {
            switch (this.options.pastDue) {
                case 'all':
                    return (!assignment.Afgesloten && !assignment.IngeleverdOp);
                case 'none':
                    return (!assignment.Afgesloten && !assignment.IngeleverdOp && new Date(assignment.InleverenVoor) >= dates.now);
                case 'week':
                default:
                    return (!assignment.Afgesloten && !assignment.IngeleverdOp && new Date(assignment.InleverenVoor).getTime() - dates.now.getTime() > -604800000);
            }
        });
        super.initialise();

        this.element.tabIndex = 0;
        this.element.addEventListener('click', () => {
            if (this.element.getAttribute('disabled') == 'true') return;
            window.location.href = '#/elo/opdrachten';
        });
    }

    async drawListItem(assignment) {
        return new Promise(resolve => {
            let itemElement = super.drawListItem();

            itemElement.tabIndex = 0;
            itemElement.addEventListener('click', (e) => {
                e.stopPropagation();
                if (this.element.getAttribute('disabled') == 'true') return;
                window.location.href = `#/elo/opdrachten/${assignment.Id}`;
            });

            itemElement.createChildElement('span', {
                class: 'st-widget-subitem-row'
            })
                .createChildElement('b', {
                    class: 'st-widget-subitem-title',
                    innerText: assignment.Vak ? `${assignment.Titel} (${assignment.Vak})` : assignment.Titel,
                })
                .createSiblingElement('span', {
                    class: new Date(assignment.InleverenVoor) < dates.now ? 'st-widget-subitem-timestamp warn' : 'st-widget-subitem-timestamp',
                    innerText: makeTimestamp(assignment.InleverenVoor),
                });

            itemElement.createChildElement('span', {
                class: 'st-widget-subitem-row',
            })
                .createChildElement('div', {
                    class: 'st-widget-subitem-content',
                    innerHTML: assignment.Omschrijving?.replace(/(<br ?\/?>)/gi, '') || '',
                });

            let chips = [];
            if (assignment.BeoordeeldOp) chips.push({ name: i18n('chips.graded'), type: 'ok' });
            const chipsWrapper = itemElement.createChildElement('div', {
                class: 'st-chips-wrapper',
            });
            chips.forEach(chip => {
                createElement('span', chipsWrapper, {
                    class: `st-chip ${chip.type || 'info'}`,
                    innerText: chip.name,
                });
            });

            resolve(itemElement);
        });
    }

    static id = 'assignments';
    static requiredPermissions = ['EloOpdracht'];
    static possibleOptions = {
        pastDue: {
            title: "Niet-ingeleverde opdrachten na deadline",
            type: 'select',
            choices: [
                {
                    title: "Nog een week tonen",
                    value: 'week'
                },
                {
                    title: "Niet tonen",
                    value: 'none'
                },
                {
                    title: "Tonen",
                    value: 'all'
                }
            ]
        }
    };
}

class LogsWidget extends Widget {
    async initialise() {
        let logs = await magisterApi.logs();

        this.header.dataset.amount = logs.length;
        if (logs.length < 1) this.element.style.display = 'none';

        this.element.tabIndex = 0;
        this.element.addEventListener('click', () => {
            if (this.element.getAttribute('disabled') == 'true') return;
            window.location.href = '#/lvs-logboeken';
        });

        this.progressBar.dataset.visible = false;
    }

    static id = 'logs';
    static requiredPermissions = ['Logboeken'];
}

class ActivitiesWidget extends Widget {
    async initialise() {
        let logs = await magisterApi.activities();

        this.header.dataset.amount = logs.length;
        if (logs.length < 1) this.element.style.display = 'none';

        this.element.tabIndex = 0;
        this.element.addEventListener('click', () => {
            if (this.element.getAttribute('disabled') == 'true') return;
            window.location.href = '#/elo/activiteiten';
        });

        this.progressBar.dataset.visible = false;
    }

    static id = 'activities';
    static requiredPermissions = ['Activiteiten'];
}

class GradesWidget extends SlideshowWidget {
    #hiddenItems;

    async initialise() {
        this.#hiddenItems = new Set(Object.values((await getFromStorage('hiddenGrades', 'local') || [])));

        this.listItems = [
            ...(await magisterApi.gradesRecent()),
            ...(magisterApi.permissions.includes('EloOpdracht') ? (await magisterApi.assignmentsTop()).filter(item => item.Beoordeling?.length > 0) : [])
        ]
            .map(item => {
                const date = new Date(item.ingevoerdOp || item.BeoordeeldOp);
                const unread = date > dates.now - (1000 * 60 * 60 * 24 * 7);
                const hidden = this.#hiddenItems.has(item.kolomId || item.Id);
                const result = item.waarde || item.Beoordeling || '?';
                const value = isNaN(Number(result.replace(',', '.'))) ? null : Number(result.replace(',', '.'));
                const isSufficient = item.isVoldoende ?? (value && value >= Number(syncedStorage['suf-threshold']) && value <= 10);
                return {
                    ...item, date, unread, hidden, result, value, isSufficient,
                    omschrijving: item.omschrijving || item.Titel,
                    vak: item.vak || {
                        code: item.Vak ? `${item.Vak} (opdr.)` : "opdr.",
                        omschrijving: item.Vak ? `${item.Vak} (beoordeelde opdracht)` : "Beoordeelde opdracht"
                    },
                    weegfactor: item.weegfactor || 0,
                    kolomId: item.kolomId || item.Id,
                    isAssignment: !!item.Id
                };
            })
            .sort((a, b) => b.date - a.date);

        super.initialise();

        this.header.innerText = this.listItems.some(grade => grade.unread) ? i18n('widgets.newGrades') : i18n('widgets.latestGrade')

        this.element.tabIndex = 0;
        this.element.addEventListener('click', () => {
            if (this.element.getAttribute('disabled') == 'true') return;
            window.location.href = '#/cijfers';
        });

        if (this.options.rotate == 'true') {
            let interval = setInterval(() => {
                if (!this.element || this.listItems?.length <= 1) clearInterval(interval)
                if (this.element.matches(':hover')) return
                this.currentSlide++;
            }, 20000)
        }
    }

    async drawSlideItem(grade, index) {
        return new Promise(resolve => {
            let itemElement = super.drawSlideItem(grade, index);

            itemElement.setAttributes({
                class: 'st-widget-grades-item',
                dataset: {
                    unread: grade.unread,
                    hidden: grade.hidden,
                    isAssignment: grade.isAssignment,
                }
            });

            let resultElement = itemElement.createChildElement('span', {
                class: 'st-widget-grades-item-rslt',
                innerText: grade.waarde,
                dataset: {
                    great: this.options.rotate == 'true' && grade.value > 8.9 && grade.value <= 10,
                    insuf: syncedStorage['insuf-red'] && !grade.isSufficient && grade?.weegfactor > 0,
                    hidden: grade.hidden || this.options.filter == 'never' || (this.options.filter == 'sufficient' && !grade.isSufficient),
                }
            });

            itemElement.createChildElement('span', {
                class: 'st-widget-grades-item-subj',
                innerText: grade.vak.omschrijving.charAt(0).toUpperCase() + grade.vak.omschrijving.slice(1)
            });
            itemElement.createChildElement('span', {
                class: 'st-widget-grades-item-info',
                innerText: grade.isAssignment ? grade.omschrijving : `${grade.omschrijving} (${grade.weegfactor || 0}×)`
            });
            itemElement.createChildElement('span', {
                class: 'st-widget-grades-item-date',
                innerText: makeTimestamp(grade.date)
            });
            let itemHide = itemElement.createChildElement('button', {
                class: 'st-widget-grades-item-hide st-button icon tertiary',
                dataset: { icon: grade.hidden ? '' : '' },
                title: "Dit specifieke cijfer verbergen/weergeven"
            });
            itemHide.addEventListener('click', (event) => {
                event.preventDefault();
                event.stopPropagation();
                event.stopImmediatePropagation();
                if (resultElement.dataset.hidden == 'true') {
                    itemHide.dataset.icon = '';
                    resultElement.dataset.hidden = false;
                    this.#hiddenItems.delete(grade.kolomId);
                    saveToStorage('hiddenGrades', [...this.#hiddenItems], 'local');
                } else {
                    itemHide.dataset.icon = '';
                    resultElement.dataset.hidden = true;
                    this.#hiddenItems.add(grade.kolomId);
                    saveToStorage('hiddenGrades', [...this.#hiddenItems], 'local');
                }
                return false;
            });

            resolve(itemElement);
        });
    }

    static id = 'grades';
    static disclaimer = null;
    static requiredPermissions = ['Cijfers'];
    static possibleOptions = {
        rotate: {
            title: "Automatisch rouleren",
            type: 'select',
            choices: [
                {
                    title: "Elke 20 seconden",
                    value: 'true'
                },
                {
                    title: "Uit",
                    value: 'false'
                }
            ]
        },
        filter: {
            title: "Beoordeling weergeven",
            type: 'select',
            choices: [
                {
                    title: "Altijd",
                    value: 'always'
                },
                {
                    title: "Alleen voldoendes",
                    value: 'sufficient'
                },
                {
                    title: "Nooit",
                    value: 'never'
                }
            ]
        }
    }
}

class DigitalClockWidget extends Widget {
    timeElement;

    async initialise() {
        this.header.remove();

        this.timeElement = this.element.createChildElement('p', {
            id: 'st-widget-digitalclock-time',
        });
        for (let i = 0; i < 8; i++) {
            this.timeElement.createChildElement('span');
        }

        this.updateClock();
        setInterval(() => this.updateClock(), 1000);

        this.element.tabIndex = 0;
        this.element.addEventListener('click', () => {
            if (this.element.getAttribute('disabled') == 'true') return;
            if (!document.fullscreenElement) this.element.requestFullscreen();
            else document.exitFullscreen();
        });

        const rawLessonPeriods = [
            ...new Set(
                (await magisterApi.events())
                    .filter(event => new Date(event.Start).isToday() && event.Lokatie?.length > 0 && event.LesuurVan && event.LesuurTotMet)
                    .map(event => JSON.stringify({ start: event.Start, end: event.Einde }))
            )
        ]
            .map(event => JSON.parse(event))
            .sort((a, b) => new Date(a.start) - new Date(b.start));

        const lessonPeriods = [];

        for (let i = 0; i < rawLessonPeriods.length; i++) {
            const current = rawLessonPeriods[i];
            lessonPeriods.push(current);

            if (i < rawLessonPeriods.length - 1) {
                const next = rawLessonPeriods[i + 1];
                const currentEnd = new Date(current.end);
                const nextStart = new Date(next.start);

                // Insert break if there's a gap
                if (currentEnd < nextStart) {
                    lessonPeriods.push({
                        start: current.end,
                        end: next.start,
                        break: true
                    });
                }
            }
        }

        this.#displayEvents(lessonPeriods);

        this.progressBar.dataset.visible = false;
    }

    async #displayEvents(lessonPeriods) {
        if (!lessonPeriods?.length > 0) return;
        const lessonPeriodsContainer = this.element.createChildElement('div', {
            class: 'st-widget-digitalclock-lesson-periods',
        });

        for (const period of lessonPeriods) {
            lessonPeriodsContainer.createChildElement('div', {
                style: {
                    flexGrow: (new Date(period.end) - new Date(period.start)),
                    opacity: period.break ? 0.5 : 1
                }
            })
        }
    }

    updateClock() {
        let timeString = document.fullscreenElement || this.options.showSeconds == 'show'
            ? dates.now.toLocaleTimeString('nl-NL', { timeZone: 'Europe/Amsterdam', hour: '2-digit', minute: '2-digit', second: '2-digit' })
            : dates.now.toLocaleTimeString('nl-NL', { timeZone: 'Europe/Amsterdam', hour: '2-digit', minute: '2-digit' });

        for (let i = 0; i < this.element.children[1].children.length; i++) {
            const child = this.element.children[1].children[i];
            child.innerText = timeString[i] || '';
        }

        // logic to update the progress bars
    }

    static id = 'digitalclock';
    static disclaimer = 'widgetClockDisclaimer';
    static displayByDefault = false;
    static possibleOptions = {
        showSeconds: {
            title: "Seconden tonen",
            type: 'select',
            choices: [
                {
                    title: "Weergeven",
                    value: 'show'
                },
                {
                    title: "Verbergen",
                    value: 'hide'
                }
            ]
        }
    }
}
