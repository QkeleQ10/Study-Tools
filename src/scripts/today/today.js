let schedule, widgets,
    listViewEnabledSetting = syncedStorage['start-schedule-view'] === 'list',
    listViewEnabled = listViewEnabledSetting,
    showNextDaySetting = syncedStorage['start-schedule-extra-day'] ?? true

// Run at start and when the URL changes 
today()
addEventListener('hashchange', today)

// Page 'Vandaag'
async function today() {
    console.debug('hashchange', document.location.href)

    if (!(document.location.href.includes('#/vandaag') && syncedStorage['start-enabled'])) return

    console.debug("Rendering Start")

    let widgetsCollapsedSetting = await getFromStorage('start-widgets-collapsed', 'local') ?? false,
        widgetsCollapsed = widgetsCollapsedSetting ?? false,
        hourHeightSetting = await getFromStorage('start-hour-height', 'local') || 110,
        mainView = await awaitElement('div.view.ng-scope'),
        container = element('div', 'st-start', mainView, { 'data-widgets-collapsed': widgetsCollapsed }),
        fab = element('div', 'st-start-fab', container, { class: 'st-visible' })

    listViewEnabledSetting = syncedStorage['start-schedule-view'] === 'list'
    listViewEnabled = listViewEnabledSetting
    showNextDaySetting = syncedStorage['start-schedule-extra-day'] ?? true

    let todayCollapseWidgets

    // Automagically collapse the widgets panel when it's necessary
    widgetsCollapsed = widgetsCollapsed || window.innerWidth < 1100
    container.scrollLeft = 0
    verifyDisplayMode()
    window.addEventListener('resize', () => {
        widgetsCollapsed = widgetsCollapsed || window.innerWidth < 1100
        verifyDisplayMode()
    })

    schedule = new Schedule(container, hourHeightSetting);
    widgets = new Widgets(container);

    // Controls (bottom right of page)
    setTimeout(() => fab.classList.remove('st-visible'), 2000)

    const zoomWrapper = fab.createChildElement('div', {
        id: 'st-start-edit-zoom',
        class: 'st-widget-controls-button-group'
    })

    zoomWrapper.createChildElement('button', {
        id: 'st-start-edit-zoom-out',
        class: 'st-button icon',
        dataset: { icon: '' },
        title: i18n('scaleDown')
    }).addEventListener('click', () => modifyZoom(schedule.hourHeight - (0.05 * 110)));

    const zoomReset = zoomWrapper.createChildElement('button', {
        id: 'st-start-edit-zoom-reset',
        class: 'st-button tertiary',
        innerText: (schedule.hourHeight / 110).toLocaleString(locale, { style: 'percent' }),
        title: i18n('scaleReset')
    });
    zoomReset.addEventListener('click', () => modifyZoom(110));

    zoomWrapper.createChildElement('button', {
        id: 'st-start-edit-zoom-in',
        class: 'st-button icon',
        dataset: { icon: '+' },
        title: i18n('scaleUp')
    }).addEventListener('click', () => modifyZoom(schedule.hourHeight + (0.05 * 110)));

    function modifyZoom(newValue) {
        schedule.hourHeight = newValue;
        zoomReset.innerText = (schedule.hourHeight / 110).toLocaleString(locale, { style: 'percent' });
    }

    const editWrapper = fab.createChildElement('div', {
        id: 'st-start-edit',
        class: 'st-widget-controls-button-group'
    })

    // Teacher names editor button
    editWrapper.createChildElement('button', {
        id: 'st-start-edit-teachers',
        class: 'st-button icon',
        dataset: { icon: '' },
        title: i18n('editTeachers')
    })
        .addEventListener('click', () => new TeacherNamesDialog().show());

    editWrapper.createChildElement('button', {
        id: 'st-start-edit-widgets',
        class: 'st-button icon',
        dataset: { icon: '' },
        title: i18n('editWidgets')
    })
        .addEventListener('click', () => new WidgetEditorDialog().show());

    if (!widgetsCollapsed && Math.random() < 0.1 && !(await getFromStorage('tooltipdismiss-start-widgets-new2', 'local') ?? false)) {
        setTimeout(() => {
            const rect = document.getElementById('st-start-edit-widgets').getBoundingClientRect()
            const tooltip = document.body.createChildElement('div', {
                id: 'st-widgets-edit-tooltip',
                innerText: i18n('tooltips.startWidgetsNew'),
                style: {
                    bottom: `${window.innerHeight - rect.top}px`,
                    right: `${window.innerWidth - rect.right}px`,
                    translate: '8px -16px'
                }
            })
            document.getElementById('st-start-edit-widgets').addEventListener('click', () => {
                tooltip.classList.add('st-hidden')
                saveToStorage('tooltipdismiss-start-widgets-new2', true, 'local')
            })
            setTimeout(() => tooltip.classList.add('st-hidden'), 20000)
        }, 2000)
    }

    // Side panel collapse/expand button
    todayCollapseWidgets = element('button', 'st-sch-collapse-widgets', fab, { class: 'st-button icon', 'data-icon': '', title: i18n('collapseWidgets') })
    todayCollapseWidgets.addEventListener('click', () => {
        widgetsCollapsed = !widgetsCollapsed
        widgetsCollapsedSetting = widgetsCollapsed
        saveToStorage('start-widgets-collapsed', widgetsCollapsedSetting, 'local')
        verifyDisplayMode()
    })

    if (widgetsCollapsed && (!(await getFromStorage('start-widgets-collapsed-known', 'local') ?? false) || Math.random() < 0.01)) {
        setTimeout(() => {
            const rect = todayCollapseWidgets.getBoundingClientRect()
            const tooltip = element('div', 'st-widgets-collapsed-tooltip', document.body, { class: 'st-hidden', innerText: "Het widgetpaneel is ingeklapt. Gebruik de knop met de pijltjes om hem weer uit te klappen.", style: `bottom: ${window.innerHeight - rect.top} px; right: ${window.innerWidth - rect.right} px; translate: 8px - 16px; ` })
            setTimeout(() => tooltip.classList.remove('st-hidden'), 200)
            todayCollapseWidgets.addEventListener('click', () => {
                tooltip.classList.add('st-hidden')
                saveToStorage('start-widgets-collapsed-known', true, 'local')
            })
            setTimeout(() => {
                tooltip.classList.add('st-hidden')
            }, 20000)
        }, 2000)
    }

    // Allow for keyboard navigation
    document.removeEventListener('keydown', keydown); // Remove any existing listener
    document.addEventListener('keydown', keydown);

    function verifyDisplayMode() {
        container.setAttribute('data-widgets-collapsed', widgetsCollapsed)
        container.scrollLeft = 0
    }
}

class Widgets {
    element;

    static widgetClasses = {
        logs: LogsWidget,
        activities: ActivitiesWidget,
        grades: GradesWidget,
        messages: MessagesWidget,
        homework: HomeworkWidget,
        assignments: AssignmentsWidget,
        digitalclock: DigitalClockWidget
    }

    static get sortedWidgetClasses() {
        const widgetOrder = Object.values(localStorage['start-widget-order'] || defaultWidgetOrder);
        return Object.fromEntries(Object.entries(this.widgetClasses).sort((a, b) => {
            const indexA = widgetOrder.indexOf(a[0]) ?? 999;
            const indexB = widgetOrder.indexOf(b[0]) ?? 999;
            return indexA - indexB;
        }));
    }

    constructor(parentElement = document.getElementById('st-start')) {
        this.element = parentElement.createChildElement('div', { id: 'st-widgets', innerText: '' });

        this.#drawWidgets();
    }

    async refresh() {
        this.element.innerText = '';
        await this.#drawWidgets();
    }

    async #drawWidgets() {
        await magisterApi.updateApiPermissions();

        for (const [widgetKey, widgetClass] of Object.entries(Widgets.sortedWidgetClasses)) {
            if (widgetClass.isEnabled && widgetClass.hasRequiredPermissions) {
                await new Promise(async (resolve) => {
                    const widgetInstance = new widgetClass();
                    const widgetElement = widgetInstance.drawWidget(this.element);

                    resolve(widgetElement);
                });
            }
        }
    }
}

class WidgetEditorDialog extends Dialog {
    #progressBar;
    #column1;
    #column2;

    constructor() {
        super({ closeIcon: '' });

        this.body.classList.add('st-widget-editor-dialog');

        this.#column1 = createElement('div', this.body, { class: 'st-dialog-column' });
        this.#column1.createChildElement('h3', { class: 'st-section-heading', innerText: i18n('editWidgets') });

        this.#column2 = createElement('div', this.body, { class: 'st-dialog-column', style: { display: 'none' } });
        this.#column2.createChildElement('h3', { class: 'st-section-heading', innerText: i18n('editWidget') });

        this.#progressBar = this.element.createChildElement('div', { class: 'st-progress-bar' });
        this.#progressBar.createChildElement('div', { class: 'st-progress-bar-value indeterminate' });

        this.#drawWidgetEditorDialog();

        this.element.addEventListener('close', () => {
            widgets = new Widgets();
        })
    }

    async #drawWidgetEditorDialog() {
        await magisterApi.updateApiPermissions()


        for (const [widgetKey, widgetClass] of Object.entries(Widgets.sortedWidgetClasses)) {
            const widgetElement = this.#column1.createChildElement('div', {
                class: 'st-widget-list-item',
                style: widgetClass.hasRequiredPermissions ? '' : 'display: none;',
            });

            // Assign a data attribute to identify this widget and make it draggable
            widgetElement.dataset.widgetId = widgetClass.id;
            widgetElement.draggable = true;

            // Drag event listeners
            widgetElement.addEventListener('dragstart', (e) => {
                e.dataTransfer.setData('text/plain', widgetClass.id);
                e.currentTarget.classList.add('dragging');
            });
            widgetElement.addEventListener('dragend', (e) => {
                e.currentTarget.classList.remove('dragging');
                this.#saveNewOrder();
            });
            widgetElement.addEventListener('dragover', (e) => {
                e.preventDefault();
                const dragging = this.#column1.querySelector('.dragging');
                if (dragging && dragging !== widgetElement) {
                    // Insert the dragged element before the current hovered element
                    this.#column1.insertBefore(dragging, widgetElement);
                }
            });

            widgetElement.createChildElement('h4', {
                innerText: i18n(`widgets.${widgetClass.id}`),
            });

            if (Object.keys(widgetClass.possibleOptions).length) {
                widgetElement.createChildElement('button', {
                    class: 'st-button icon',
                    dataset: { icon: '' },
                    title: i18n('editWidget')
                })
                    .addEventListener('click', () => this.#drawWidgetSettings(widgetClass));
            }

            const displayToggleWrapper = widgetElement.createChildElement('div', {
                class: 'st-segmented-control'
            });

            const show = displayToggleWrapper.createChildElement('button', {
                class: 'st-button segment icon',
                dataset: { icon: '' },
                title: i18n('show')
            });
            const hide = displayToggleWrapper.createChildElement('button', {
                class: 'st-button segment icon warn',
                dataset: { icon: '' },
                title: i18n('hide')
            });
            show.addEventListener('click', () => {
                widgetClass.isEnabled = true;
                updateState();
            });
            hide.addEventListener('click', () => {
                widgetClass.isEnabled = false;
                updateState();
            });

            updateState();

            function updateState() {
                widgetElement.classList.toggle('active', widgetClass.isEnabled);
                show.classList.toggle('active', widgetClass.isEnabled);
                hide.classList.toggle('active', !widgetClass.isEnabled);
            }
        }

        this.#progressBar.dataset.visible = false;
    }

    #saveNewOrder() {
        const newOrder = Array.from(this.#column1.querySelectorAll('.st-widget-list-item'))
            .map(el => (el instanceof HTMLElement ? el.dataset.widgetId : undefined));
        localStorage['start-widget-order'] = newOrder;
    }

    #drawWidgetSettings(widgetClass) {
        this.#column2.innerText = '';
        this.#column2.style.display = 'block';

        this.#column2.createChildElement('h3', { class: 'st-section-heading', innerText: i18n('editWidget') + ': ' + i18n(`widgets.${widgetClass.id}`) });

        const optionsContainer = this.#column2.createChildElement('div', { class: 'st-widget-options' });

        for (const [optKey, opt] of Object.entries(widgetClass.possibleOptions)) {
            const label = optionsContainer.createChildElement('label', { innerText: opt.title });

            const select = label.createChildElement('select', { class: 'st-select' });
            for (const choice of opt.choices) {
                select.createChildElement('option', {
                    innerText: choice.title,
                    value: choice.value,
                    selected: widgetClass.options[optKey] === choice.value ? true : undefined
                });
            }
            select.addEventListener('change', () => {
                widgetClass.options[optKey] = select.value;
            });
        }
    }
}

function keydown(event) {
    if (document.activeElement.tagName === 'INPUT' || document.activeElement.tagName === 'TEXTAREA') return;
    if (event.key === 'ArrowLeft') schedule?.headerControls.moveBackward.click();
    else if (event.key === 'ArrowRight') schedule?.headerControls.moveForward.click();
}

function getEventChips(event) {
    const infoTypes = {
        1: { name: i18n('chips.hw'), type: 'info' },
        2: { name: i18n('chips.pw'), type: 'important' },
        3: { name: i18n('chips.prelim'), type: 'important' },
        4: { name: i18n('chips.so'), type: 'important' },
        5: { name: i18n('chips.mo'), type: 'important' },
        6: { name: i18n('chips.info'), type: 'info' },
    }

    let chips = []

    if (event.Status == 4 || event.Status == 5) chips.push({ name: i18n('chips.cancelled'), type: 'warn' })
    if (event.Type === 7 && event.Lokatie?.length > 0) chips.push({ name: i18n('chips.kwtregistered'), type: 'ok' })
    else if (event.Type === 7) chips.push({ name: i18n('chips.kwt'), type: 'info' })
    if (event.Type === 103) chips.push({ name: i18n('chips.exam'), type: 'info' })
    if (event.InfoType) {
        let chip = infoTypes[event.InfoType] || { name: `Infotype ${event.InfoType} `, type: 'info' }
        if (event.Afgerond) chip.type = 'ok'
        chips.push(chip)
    }
    if (event.HeeftBijlagen) chips.push({ name: i18n('chips.attachments'), type: 'info' })
    if (event.Opmerking?.length) chips.push({ name: i18n('chips.remark'), type: 'info' })
    if (event.Aantekening?.length) chips.push({ name: i18n('chips.annotation'), type: 'info' })

    return chips
}

function isYearNotCurrent(fullYear) {
    if (fullYear instanceof Date) fullYear = fullYear.getFullYear();
    return fullYear !== dates.today.getFullYear();
}

function eventSubjects(event) {
    let subjectsF = (event.Vakken?.map((vak, i) => {
        if (i === 0) return vak.Naam.charAt(0).toUpperCase() + vak.Naam.slice(1)
        return vak.Naam
    }) || []).join(', ');
    if (!subjectsF?.length) return null;
    return subjectsF;
}

function eventTeachers(event) {
    let teachersArray = event.Docenten ? event.Docenten : event;
    return (teachersArray?.map((docent) => {
        return (syncedStorage['start-teacher-names']?.[docent.Docentcode] || docent.Naam) + ` (${docent.Docentcode})`;
    }) || []).join(', ');
}

function eventLocations(event) {
    let locationsArray = event.Lokalen ? event.Lokalen : event;
    return event.Lokatie || locationsArray.map(e => e.Naam).join(', ');
}

function makeTimestamp(d) {
    d = d instanceof Date ? d : new Date(d);

    const dateFormat = { timeZone: 'Europe/Amsterdam', hour: '2-digit', minute: '2-digit' };
    if (isYearNotCurrent(d) || isYearNotCurrent(d)) dateFormat.year = 'numeric';

    if (d.isToday())
        return i18n('dates.todayAtTime', { time: d.toLocaleString(locale, { ...dateFormat }) })
    else if (d.isTomorrow())
        return i18n('dates.tomorrowAtTime', { time: d.toLocaleString(locale, { ...dateFormat }) })
    else if (d.isYesterday())
        return i18n('dates.yesterdayAtTime', { time: d.toLocaleString(locale, { ...dateFormat }) })
    else if (d.getTime() - dates.today.getTime() < daysToMs(5) && d.getTime() - dates.today.getTime() > 0)
        return i18n('dates.weekdayAtTime', { weekday: i18nArray('dates.weekdays')[d.getDay()], time: d.toLocaleString(locale, { ...dateFormat }) })
    else
        return d.toLocaleString(locale, { weekday: 'short', day: 'numeric', month: 'short', ...dateFormat })
}

async function createGreetingMessage(element) {
    const greetingsByHour = [
        [22, ...i18n('greetings.lateNight').split(';'), 'Bonsoir#', 'Buenas noches#', 'Guten Abend#'], // 22:00 - 23:59
        [18, ...i18n('greetings.evening').split(';'), 'Bonsoir#', 'Buenas tardes#', 'Guten Abend#'], // 18:00 - 21:59
        [12, ...i18n('greetings.afternoon').split(';'), 'Bonjour#', 'Buenas tardes!', 'Guten Mittag#'], // 12:00 - 17:59
        [6, ...i18n('greetings.morning').split(';'), 'Bonjour#', 'Buenos días#', 'Guten Morgen#'], // 6:00 - 11:59
        [0, ...i18n('greetings.earlyNight').split(';'), 'Bonjour#', 'Buenos días#', 'Guten Morgen#'] // 0:00 - 5:59
    ],
        greetingsGeneric = [...i18n('greetings.generic').split(';'), 'Yooo!', 'Hello, handsome.', 'Guten Tag#', 'Greetings#', 'Hey#', 'Hoi#', '¡Hola!', 'Ahoy!', 'Bonjour#', 'Buongiorno#', 'Namasté#', 'Howdy!', 'G\'day!', 'Oi mate!', 'Aloha!', 'Ciao!', 'Olá!', 'Salut#', 'Saluton!', 'Hei!', 'Hej!', 'Salve!', 'Bom dia#', 'Zdravo!', 'Shalom!', 'Γεια!', 'Привіт!', 'Здравейте!', '你好！', '今日は!', '안녕하세요!', 'Hé buur!']

    let possibleGreetings = []
    for (let i = 0; i < greetingsByHour.length; i++) {
        const e = greetingsByHour[i]
        if (dates.now.getHours() >= Number(e[0])) {
            e.shift()
            possibleGreetings.push(...e, ...e, ...e) // hour-bound greetings have 3x more chance than generic ones
            break
        }
    }
    possibleGreetings.push(...greetingsGeneric)
    const greeting = possibleGreetings.random()
        .replace('#', Math.random() < 0.8 ? '.' : '!')
        .replace('%s', dates.now.getFormattedDay())
        .replace('%n', (await magisterApi.accountInfo())?.Persoon?.Roepnaam || '');
    if (locale === 'fr-FR') greeting.replace(/\s*(!|\?)+/, ' $1')

    element.innerText = greeting.slice(0, -1);
    element.dataset.lastLetter = greeting.slice(-1);
}

class TeacherNamesDialog extends Dialog {
    #progressBar;
    #list;
    #newTeacherNames = {};

    constructor() {
        super({
            buttons: [
                {
                    innerText: i18n('save'),
                    dataset: { icon: '' },
                    callback: () => this.save()
                }
            ],
            closeText: i18n('cancel')
        });
        this.body.classList.add('st-teacher-names-dialog');

        this.body.createChildElement('h3', { class: 'st-section-heading', innerText: i18n('editTeachers') });

        this.#list = this.body.createChildElement('div', { class: 'st-teacher-names-list' });

        this.#progressBar = this.element.createChildElement('div', { class: 'st-progress-bar' });
        this.#progressBar.createChildElement('div', { class: 'st-progress-bar-value indeterminate' });

        this.#loadAdditionalTeachers();
    }

    async save() {
        syncedStorage['start-teacher-names'] = this.#newTeacherNames;
        // await saveToStorage('start-teacher-names', this.#newTeacherNames);
        schedule?.redraw();
        // todayWidgets();

        notify('snackbar', i18n('saved'));

        this.close();
    }

    async #loadAdditionalTeachers() {
        const events = await magisterApi.events();
        if (!events) return;

        const eventsTeachers = events?.flatMap(item => item.Docenten).filter((value, index, self) =>
            index === self.findIndex((t) => (
                t.Docentcode === value.Docentcode
            ))
        );

        const allTeacherNames = {
            ...syncedStorage['start-teacher-names'],
            ...eventsTeachers.reduce((obj, item) => (obj[item.Docentcode] = syncedStorage['start-teacher-names']?.[item.Docentcode] || null, obj), {}),
        };

        this.#newTeacherNames = { ...syncedStorage['start-teacher-names'] };

        for (const [key, value] of Object.entries(allTeacherNames).sort((a, b) => a[0].localeCompare(b[0])) || []) {
            const teacherName = eventsTeachers.find(item => item.Docentcode === key)?.Naam
            this.#list.createChildElement('div')
                .createChildElement('label', {
                    innerText: key,
                    style: { textDecoration: teacherName ? 'underline' : 'none' },
                    title: teacherName
                        ? (value
                            ? `Je hebt ${key} (${teacherName}) een bijnaam gegeven en\ndeze docent komt ook voor in je rooster van de komende 6 weken.`
                            : `Je hebt ${key} (${teacherName}) geen bijnaam gegeven, maar\ndeze docent komt wel voor in je rooster van de komende 6 weken.`)
                        : `Je hebt ${key} eerder een bijnaam gegeven, maar\ndeze docent komt niet voor in je rooster van de komende 6 weken.`
                })
                .createSiblingElement('input', { class: 'st-input', value: value || '', placeholder: teacherName || '' })
                .addEventListener('change', async (event) => {
                    const newValue = event.target.value;

                    if (!newValue || newValue.length === 0) {
                        delete this.#newTeacherNames[key];
                    } else {
                        this.#newTeacherNames[key] = newValue;
                    }
                });

            this.#progressBar.dataset.visible = false;
        }
    }
}