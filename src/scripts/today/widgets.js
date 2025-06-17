const defaultWidgetOrder = ['digitalclock', 'grades', 'activities', 'messages', 'logs', 'homework', 'assignments'];

class Widget {
    element;
    header;
    progressBar;

    constructor() {
        if (this.constructor == Widget) {
            throw new Error("Abstract classes can't be instantiated.");
        }
    }

    drawWidget(parentElement) {
        this.element = createElement('div', parentElement, {
            id: `st-widget-${this.constructor.id}`,
            dataset: { key: this.constructor.id },
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

    optionsUpdated() { }

    static id = '';
    static disclaimer = 'widgetDisclaimer';
    static requiredPermissions = [];
    static displayByDefault = true;
    static possibleOptions = {};

    static get options() {
        const options = {};
        for (const key in this.possibleOptions) {
            options[key] = syncedStorage[`widget-${this.id}-${key}`]
                || this.possibleOptions[key].choices.find(choice => choice.default)?.value
                || this.possibleOptions[key].choices[0].value;
        }
        return new Proxy(options, {
            get: (target, key) => target[key],
            set: (target, key, value) => {
                if (key in this.possibleOptions) {
                    target[key] = value;
                    syncedStorage[`widget-${this.id}-${key}`] = value;
                    return true;
                }
                return false;
            }
        });
    }

    static get hasRequiredPermissions() {
        return this.requiredPermissions.every(permission => magisterApi.permissions.includes(permission));
    }

    static get isEnabled() {
        return parseBoolean(localStorage[`widget-${this.id}-display`]) ?? this.displayByDefault;
    }
    static set isEnabled(value) {
        localStorage[`widget-${this.id}-display`] = value;
        // saveToStorage(`widget-${this.id}-display`, value, 'local');
    }
}

class ListWidget extends Widget {
    #listElement;
    listItems = [];

    async initialise() {
        this.#listElement = this.element.createChildElement('ul', {
            id: `st-widget-${this.constructor.id}-list`,
            class: 'st-widget-list',
            style: this.constructor.options.view === 'compact' ? 'display: none;' : '',
        });

        this.#drawList();
    }

    async #drawList() {
        this.#listElement.innerText = '';

        for (const item of this.listItems) {
            await this.drawListItem(item);
        }

        this.header.dataset.amount = this.listItems.length;
        if (this.listItems.length < 1) this.element.classList.add('empty');;

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
            this.element.dataset.unread = this.listItems[newValue]?.unread;
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
        this.#slideshowElement.innerText = '';

        for (const [index, item] of this.listItems.entries()) {
            await this.drawSlideItem(item, index);
        }

        this.header.dataset.amount = this.listItems.length;
        if (this.listItems.length < 1) this.element.classList.add('empty');;
        this.element.dataset.unread = this.listItems[0]?.unread;

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
            if (this.constructor.options.filter == 'incomplete')
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

    optionsUpdated() {
        this.initialise();
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
        },
        view: {
            title: "Weergave",
            type: 'select',
            choices: [
                {
                    title: "Lijst",
                    value: 'regular',
                    default: true
                },
                {
                    title: "Alleen aantal",
                    value: 'compact'
                }
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
    static possibleOptions = {
        view: {
            title: "Weergave",
            type: 'select',
            choices: [
                {
                    title: "Lijst",
                    value: 'regular',
                    default: true
                },
                {
                    title: "Alleen aantal",
                    value: 'compact'
                }
            ]
        }
    }
}

class AssignmentsWidget extends ListWidget {
    async initialise() {
        this.listItems = (await magisterApi.assignmentsTop()).filter(assignment => {
            switch (this.constructor.options.pastDue) {
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

    optionsUpdated() {
        this.initialise();
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
        },
        view: {
            title: "Weergave",
            type: 'select',
            choices: [
                {
                    title: "Lijst",
                    value: 'regular',
                    default: true
                },
                {
                    title: "Alleen aantal",
                    value: 'compact'
                }
            ]
        }
    };
}

class LogsWidget extends Widget {
    async initialise() {
        let logs = await magisterApi.logs();

        this.header.dataset.amount = logs.length;
        if (logs.length < 1) this.element.classList.add('empty');;

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
        if (logs.length < 1) this.element.classList.add('empty');;

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
                const id = item.Id || item.kolomId;
                const date = new Date(item.ingevoerdOp || item.BeoordeeldOp);
                const unread = date > dates.now - (1000 * 60 * 60 * 24 * 7);
                const result = item.waarde || item.Beoordeling || '?';
                const value = isNaN(Number(result.replace(',', '.'))) ? null : Number(result.replace(',', '.'));
                const isSufficient = item.isVoldoende ?? (value && value >= Number(syncedStorage['suf-threshold']) && value <= 10);
                return {
                    ...item, id, date, unread, result, value, isSufficient,
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

        if (this.constructor.options.rotate == 'true' && this.listItems?.length > 1) {
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
                    hidden: this.#hiddenItems.has(grade.id) || this.constructor.options.filter == 'never' || (this.constructor.options.filter == 'sufficient' && !grade.isSufficient),
                    isAssignment: grade.isAssignment,
                }
            });

            itemElement.createChildElement('span', {
                class: 'st-widget-grades-item-rslt',
                innerText: grade.result,
                dataset: {
                    great: this.constructor.options.rotate == 'true' && grade.value > 8.9 && grade.value <= 10,
                    insuf: syncedStorage['insuf-red'] && !grade.isSufficient && grade?.weegfactor > 0,
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
                dataset: { icon: this.#hiddenItems.has(grade.id) ? '' : '' },
                title: this.#hiddenItems.has(grade.id) ? i18n('show') : i18n('hide')
            });

            itemHide.addEventListener('click', (event) => {
                event.preventDefault();
                event.stopPropagation();
                event.stopImmediatePropagation();
                if (this.#hiddenItems.has(grade.id)) {
                    this.#hiddenItems.delete(grade.id);
                    localStorage['hiddenGrades'] = [...this.#hiddenItems];
                    // saveToStorage('hiddenGrades', [...this.#hiddenItems], 'local');
                    itemHide.setAttributes({
                        dataset: { icon: this.#hiddenItems.has(grade.id) ? '' : '' },
                        title: this.#hiddenItems.has(grade.id) ? i18n('show') : i18n('hide')
                    });
                    itemElement.dataset.hidden = this.#hiddenItems.has(grade.id);
                } else {
                    this.#hiddenItems.add(grade.id);
                    localStorage['hiddenGrades'] = [...this.#hiddenItems];
                    // saveToStorage('hiddenGrades', [...this.#hiddenItems], 'local');
                    itemHide.setAttributes({
                        dataset: { icon: this.#hiddenItems.has(grade.id) ? '' : '' },
                        title: this.#hiddenItems.has(grade.id) ? i18n('show') : i18n('hide')
                    });
                    itemElement.dataset.hidden = this.#hiddenItems.has(grade.id);
                }
                return false;
            });

            resolve(itemElement);
        });
    }

    optionsUpdated() {
        this.initialise();
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
    #interval;
    #lessonPeriods;
    #lessonPeriodsContainer;

    async initialise() {
        this.header.remove();

        this.timeElement = this.element.createChildElement('p', {
            id: 'st-widget-digitalclock-time',
        });
        for (let i = 0; i < 8; i++) {
            this.timeElement.createChildElement('span');
        }

        this.#updateClock();
        setTimeout(() => {
            this.#interval = setIntervalImmediately(() => {
                this.#updateClock();
            }, 1000);
        }, 1000 - (new Date().getTime() % 1000));

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

        this.#lessonPeriods = [];

        for (let i = 0; i < rawLessonPeriods.length; i++) {
            const current = rawLessonPeriods[i];
            this.#lessonPeriods.push(current);

            if (i < rawLessonPeriods.length - 1) {
                const next = rawLessonPeriods[i + 1];
                const currentEnd = new Date(current.end);
                const nextStart = new Date(next.start);

                // Insert break if there's a gap
                if (currentEnd < nextStart) {
                    this.#lessonPeriods.push({
                        start: current.end,
                        end: next.start,
                        break: true
                    });
                }
            }
        }

        this.#displayEvents();

        this.progressBar.dataset.visible = false;
    }

    async #displayEvents() {
        if (!this.#lessonPeriods?.length > 0) return;
        this.#lessonPeriodsContainer = this.element.createChildElement('div', {
            id: 'st-widget-digitalclock-lesson-periods',
            innerText: '',
        });

        for (const period of this.#lessonPeriods) {
            this.#lessonPeriodsContainer.createChildElement('div', {
                style: {
                    flexGrow: Math.max((new Date(period.end) - new Date(period.start)) / 60000, 1),
                    opacity: period.break ? 0.5 : 1
                }
            })
        }

        this.#updateClock();
    }

    #updateClock() {
        if (!this.element) return clearInterval(this.#interval);

        let timeString = document.fullscreenElement || this.constructor.options.showSeconds == 'show'
            ? dates.now.toLocaleTimeString('nl-NL', { timeZone: 'Europe/Amsterdam', hour: '2-digit', minute: '2-digit', second: '2-digit' })
            : dates.now.toLocaleTimeString('nl-NL', { timeZone: 'Europe/Amsterdam', hour: '2-digit', minute: '2-digit' });

        for (let i = 0; i < this.element.children[1].children.length; i++) {
            const child = this.element.children[1].children[i];
            child.innerText = timeString[i] || '';
        }

        // logic to update the progress bars
        const now = new Date();
        if (this.#lessonPeriodsContainer) {
            for (const periodElement of this.#lessonPeriodsContainer.children) {
                const period = this.#lessonPeriods[Array.from(this.#lessonPeriodsContainer.children).indexOf(periodElement)];
                const start = new Date(period.start);
                const end = new Date(period.end);
                const progress = (now - start) / (end - start);
                periodElement.style.setProperty('--progress', Math.min(Math.max(progress, 0), 1));
                periodElement.dataset.done = now >= end;
            }
        }
    }

    optionsUpdated() {
        this.#updateClock();
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
