let schedule,
    events = [],
    listViewEnabledSetting = syncedStorage['start-schedule-view'] === 'list',
    listViewEnabled = listViewEnabledSetting,
    showNextDaySetting = syncedStorage['start-schedule-extra-day'] ?? true

// Run at start and when the URL changes 
today()
addEventListener('hashchange', today)

// Page 'Vandaag'
async function today() {
    if (!window.location.hash.startsWith('#/vandaag') || !syncedStorage['start-enabled']) return

    let widgetsCollapsedSetting = await getFromStorage('start-widgets-collapsed', 'local') ?? false,
        widgetsCollapsed = widgetsCollapsedSetting ?? false,
        hourHeightSetting = await getFromStorage('start-hour-height', 'local') || 110,
        widgetsOrderSetting = Object.values(syncedStorage['widgets-order'] || []) || [],
        mainView = await awaitElement('div.view.ng-scope'),
        container = element('div', 'st-start', mainView, { 'data-widgets-collapsed': widgetsCollapsed }),
        // header = element('div', 'st-start-header', container),
        widgets = element('div', 'st-start-widgets', container),
        widgetsList = element('div', 'st-start-widgets-list', widgets),
        widgetControlsWrapper = element('div', 'st-widget-controls-wrapper', container, { class: 'st-visible' }),
        widgetControls = element('div', 'st-widget-controls', widgetControlsWrapper)

    listViewEnabledSetting = syncedStorage['start-schedule-view'] === 'list'
    listViewEnabled = listViewEnabledSetting
    showNextDaySetting = syncedStorage['start-schedule-extra-day'] ?? true

    const widgetsOrderDefault = ['digitalclock', 'grades', 'activities', 'messages', 'logs', 'homework', 'assignments']
    if (!widgetsOrderSetting || widgetsOrderSetting.length < 1 || widgetsOrderDefault.some(key => !widgetsOrderSetting.includes(key))) {
        console.info(`Changing widgets-order`, widgetsOrderSetting, widgetsOrderDefault)
        widgetsOrderSetting = widgetsOrderDefault
        syncedStorage['widgets-order'] = widgetsOrderSetting
        saveToStorage('widgets-order', widgetsOrderSetting)
    }

    let todayCollapseWidgets
    const widgetClasses = {
        logs: LogsWidget,
        activities: ActivitiesWidget,
        grades: GradesWidget,
        messages: MessagesWidget,
        homework: HomeworkWidget,
        assignments: AssignmentsWidget,
        digitalclock: DigitalClockWidget
    }

    // Automagically collapse the widgets panel when it's necessary
    widgetsCollapsed = widgetsCollapsed || window.innerWidth < 1100
    container.scrollLeft = 0
    verifyDisplayMode()
    window.addEventListener('resize', () => {
        widgetsCollapsed = widgetsCollapsed || window.innerWidth < 1100
        if (widgets.classList.contains('editing')) widgetsCollapsed = false
        verifyDisplayMode()
    })

    const editor = element('div', 'st-start-editor', container, { class: 'st-hidden' })
    const editorView = element('div', 'st-start-editor-view', editor)
    const editorWidgetTitle = element('span', 'st-start-editor-title', editorView, { innerText: i18n('editWidgets') })
    const editorActionRow = element('div', 'st-start-editor-action-row', editorView, { 'data-empty-text': i18n('editWidgetsEmpty') })
    const editorDisclaimer = element('div', 'st-start-editor-disclaimer', editorView, { class: 'st-disclaimer st-hidden' })
    const editorOptions = element('div', 'st-start-editor-options', editorView)
    const editorHidden = element('div', 'st-start-editor-hidden-view', editor)
    const editorHiddenTitle = element('span', 'st-start-editor-hidden-view-title', editorHidden, { innerText: i18n('addWidgets') })
    const editorHiddenList = element('div', 'st-start-editor-hidden-view-list', editorHidden, { 'data-empty-text': i18n('addWidgetsEmpty') })


    schedule = new Schedule(container, hourHeightSetting);

    todayWidgets();

    // Controls (bottom right of page)
    setTimeout(() => widgetControlsWrapper.classList.remove('st-visible'), 2000)

    const zoomWrapper = widgetControls.createChildElement('div', {
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

    const editWrapper = widgetControls.createChildElement('div', {
        id: 'st-start-edit',
        class: 'st-widget-controls-button-group'
    })

    // Widget editor invoke button
    const invokeEditWidgets = editWrapper.createChildElement('button', {
        id: 'st-start-edit-widgets',
        class: 'st-button icon',
        dataset: { icon: '' },
        title: i18n('editWidgets')
    });
    invokeEditWidgets.addEventListener('click', () => invokeWidgetEditor());

    // Teacher names editor button
    editWrapper.createChildElement('button', {
        id: 'st-start-edit-teachers',
        class: 'st-button icon',
        dataset: { icon: '' },
        title: i18n('editTeachers')
    })
        .addEventListener('click', () => new TeacherNamesDialog().show());

    // Widget editor close button
    widgetControls.createChildElement('button', {
        id: 'st-start-editor-done',
        class: 'st-button tertiary',
        dataset: { icon: '' },
        innerText: i18n('editFinish')
    })
        .addEventListener('click', () => closeWidgetEditor());

    // Tooltip for the widget editor button
    if (!widgetsCollapsed && Math.random() < 0.1 && !(await getFromStorage('tooltipdismiss-start-widgets-new', 'local') ?? false)) {
        setTimeout(() => {
            const rect = invokeEditWidgets.getBoundingClientRect()
            const tooltip = document.body.createChildElement('div', {
                id: 'st-start-widgets-edit-tooltip',
                innerText: i18n('tooltips.startWidgetsNew'),
                style: {
                    bottom: `${window.innerHeight - rect.top}px`,
                    right: `${window.innerWidth - rect.right}px`,
                    translate: '8px -16px'
                }
            })
            invokeEditWidgets.addEventListener('click', () => {
                tooltip.classList.add('st-hidden')
                saveToStorage('tooltipdismiss-start-widgets-new', true, 'local')
            })
            setTimeout(() => tooltip.classList.add('st-hidden'), 20000)
        }, 2000)
    }

    // Side panel collapse/expand button
    todayCollapseWidgets = element('button', 'st-sch-collapse-widgets', widgetControls, { class: 'st-button icon', 'data-icon': '', title: i18n('collapseWidgets') })
    todayCollapseWidgets.addEventListener('click', () => {
        widgetsCollapsed = !widgetsCollapsed
        if (widgets.classList.contains('editing')) widgetsCollapsed = false
        widgetsCollapsedSetting = widgetsCollapsed
        saveToStorage('start-widgets-collapsed', widgetsCollapsedSetting, 'local')
        verifyDisplayMode()
    })

    if (widgetsCollapsed && (!(await getFromStorage('start-widgets-collapsed-known', 'local') ?? false) || Math.random() < 0.01)) {
        setTimeout(() => {
            const rect = todayCollapseWidgets.getBoundingClientRect()
            const tooltip = element('div', 'st-start-widgets-collapsed-tooltip', document.body, { class: 'st-hidden', innerText: "Het widgetpaneel is ingeklapt. Gebruik de knop met de pijltjes om hem weer uit te klappen.", style: `bottom: ${window.innerHeight - rect.top} px; right: ${window.innerWidth - rect.right} px; translate: 8px - 16px; ` })
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
    document.addEventListener('keydown', event => {
        if (document.activeElement.tagName === 'INPUT' || document.activeElement.tagName === 'TEXTAREA') return;
        if (event.key === 'ArrowLeft') schedule?.headerControls.moveBackward.click();
        else if (event.key === 'ArrowRight') schedule?.headerControls.moveForward.click();
    })

    async function todayWidgets() {
        widgetsList.innerText = ''

        await magisterApi.updateApiPermissions()

        // Ensure the user permission flags are up-to-date
        await magisterApi.accountInfo()

        // Draw the selected widgets in the specified order
        for (const key of widgetsOrderSetting) {
            const widgetClass = widgetClasses[key];

            const displaySetting = parseBoolean(await getFromStorage(`widget - ${key} -display`)) ?? widgetClass.displayByDefault;
            const options = {};
            for (const [optKey, opt] of Object.entries(widgetClass.possibleOptions)) {
                options[optKey] =
                    await getFromStorage(`widget - ${key} -${optKey} `)
                    || opt.choices.find(option => option.default)?.value
                    || opt.choices[0].value;
            }

            if (
                !displaySetting
                || !widgetClass.requiredPermissions?.every(p => magisterApi.permissions?.includes(p))
            ) continue;

            const widgetInstance = new widgetClass(options);
            const widgetElement = widgetInstance.drawWidget(widgetsList);
        }
    }

    async function closeWidgetEditor() {
        magisterApi.useSampleData = false; // TODO: this will not run if the editor is not closed manually!

        editor.classList.add('st-hidden')
        widgets.classList.remove('editing')
        widgetControls.classList.remove('editing')
        todayWidgets()
    }

    async function invokeWidgetEditor(keepSelection) {
        magisterApi.useSampleData = true;

        widgetsList.innerText = '';
        function emptySelection() {
            editorWidgetTitle.innerText = i18n('editWidgets')
            editorActionRow.innerText = ''
            editorDisclaimer.classList.add('st-hidden')
            editorOptions.innerText = ''
            editorHiddenList.innerText = ''
        }
        if (!keepSelection) emptySelection()

        editor.classList.remove('st-hidden')
        widgets.classList.add('editing')
        widgetControls.classList.add('editing')
        if (widgetsCollapsed) todayCollapseWidgets.click()

        for (const key of widgetsOrderSetting) {
            const widgetClass = widgetClasses[key];

            const displaySetting = parseBoolean(await getFromStorage(`widget - ${key} -display`)) ?? widgetClass.displayByDefault;
            const options = {};
            for (const [optKey, opt] of Object.entries(widgetClass.possibleOptions)) {
                options[optKey] =
                    await getFromStorage(`widget - ${key} -${optKey} `)
                    || opt.choices.find(option => option.default)?.value
                    || opt.choices[0].value;
            }

            if (!displaySetting) {
                const widgetAddButton = editorHiddenList.createChildElement('button', {
                    class: 'st-start-editor-add',
                    innerText: i18n(`widgets.${widgetClass.id} `),
                    title: i18n('add')
                })
                widgetAddButton.addEventListener('click', async () => {
                    await saveToStorage(`widget - ${key} -display`, 'true')
                    invokeWidgetEditor()
                })

                const widgetInstance = new widgetClass(options);
                const widgetElement = widgetInstance.drawWidget(widgetAddButton);
                widgetElement.setAttribute('disabled', true)

                continue
            }

            if (!widgetClass.requiredPermissions?.every(p => magisterApi.permissions?.includes(p))) continue;


            const widgetInstance = new widgetClass(options);
            const widgetElement = widgetInstance.drawWidget(widgetsList);

            if (!widgetElement) continue

            widgetElement.setAttribute('disabled', true)
            widgetElement.querySelectorAll('*').forEach(c => c.setAttribute('inert', true))
            widgetElement.setAttribute('draggable', true)
            widgetElement.dataset.value = key
            widgetsList.append(widgetElement)

            if (!widgetElement.dataset.hasListeners) {
                widgetElement.addEventListener('dragstart', event => {
                    event.dataTransfer.effectAllowed = 'all'
                    event.dataTransfer.setDragImage(element('img', null, null, { src: 'data:image/gif;base64,R0lGODlhAQABAIAAAAAAAP///yH5BAEAAAAALAAAAAABAAEAAAIBRAA7' }), 0, 0)
                    widgetsList.querySelectorAll('.st-widget.focused').forEach(e => e.classList.remove('focused'))
                    setTimeout(() => {
                        widgetElement.dataset.dragging = true
                    }, 0)
                })
                widgetElement.addEventListener('dragend', () => {
                    widgetElement.dataset.dragging = false

                    widgetsOrderSetting = [...widgetsList.children].map(element => element.dataset.value)
                    syncedStorage['widgets-order'] = widgetsOrderSetting
                    saveToStorage('widgets-order', widgetsOrderSetting)
                })
                widgetElement.dataset.hasListeners = true
            }

            // Widget clicked
            widgetElement.addEventListener('click', async () => {
                if (widgetElement.classList.contains('focused')) {
                    widgetsList.querySelectorAll('.st-widget.focused').forEach(e => e.classList.remove('focused'))
                    emptySelection()
                    return
                }

                // Focus only the correct widget
                widgetsList.querySelectorAll('.st-widget.focused').forEach(e => e.classList.remove('focused'))
                widgetElement.classList.add('focused')

                editorWidgetTitle.innerText = `${i18n('widget')}: ${i18n(`widgets.${widgetClass.id}`)} `

                // Widget disclaimer
                editorDisclaimer.innerText = i18n(widgetClass.disclaimer || editorDisclaimer.innerText)
                editorDisclaimer.classList.toggle('st-hidden', !widgetClass.disclaimer)

                editorOptions.innerText = ''

                // Widget display types
                editorActionRow.innerText = ''
                const widgetHideButton = editorActionRow.createChildElement('button', {
                    class: 'st-button tertiary st-start-editor-remove',
                    dataset: { icon: '' },
                    innerText: i18n('remove'),
                    title: i18n('removeWidget')
                })
                widgetHideButton.addEventListener('click', () => {
                    saveToStorage(`widget - ${key} -display`, 'false')
                    invokeWidgetEditor()
                })

                // Widget options
                for (const [optKey, opt] of Object.entries(widgetClass.possibleOptions)) {
                    let optionWrapper = element('div', `st - start - edit - ${key} -${optKey} `, editorOptions, { class: 'st-option' })
                    let optionTitle = element('label', `st - start - edit - ${key} -${optKey} -title`, optionWrapper, { for: `st - start - edit - ${key} -${optKey} -input`, innerText: opt.title })
                    switch (opt.type) {
                        case 'select':
                        default:
                            let choices = opt.choices.reduce((obj, item) => ({ ...obj, [item.value]: item.title }), ({}))
                            let selectedChoice = await getFromStorage(`widget - ${key} -${optKey} `) || opt.choices.find(item => item.default)?.value || opt.choices[0].value
                            element('div', `st - start - edit - ${key} -${optKey} -input`, optionWrapper, { name: opt.title })
                                .createDropdown(choices, selectedChoice, async (newValue) => {
                                    await saveToStorage(`widget - ${key} -${optKey} `, newValue)
                                    widgetsList.innerText = ''
                                    widgets.classList.remove('editing')
                                    widgetControls.classList.remove('editing')
                                    invokeWidgetEditor(widgetElement.id)
                                })
                            break

                        // Implement other option types as necessary
                    }
                }
            })

            if (keepSelection === widgetElement.id) {
                widgetElement.classList.add('focused')
            }
        }

        if (!widgetsList.dataset.hasListeners) {
            widgetsList.addEventListener('dragenter', (event) => {
                event.preventDefault()
                event.dataTransfer.dropEffect = 'move'

                const draggedItem = widgetsList.querySelector('.st-widget[data-dragging=true]')
                if (!draggedItem) return

                let nextSibling = [...widgetsList.children].find(sibling => (
                    sibling !== draggedItem &&
                    event.clientY <= (sibling.getBoundingClientRect().y + sibling.getBoundingClientRect().height / 2)
                ))

                widgetsList.insertBefore(draggedItem, nextSibling)
            })
            widgetsList.dataset.hasListeners = true
        }
        // widgetsList.addEventListener('dragenter', e => e.preventDefault())
    }

    function verifyDisplayMode() {
        container.setAttribute('data-widgets-collapsed', widgetsCollapsed)
        container.scrollLeft = 0
    }
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
    if (!subjectsF?.length > 0) return null;
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
        return i18n('dates.weekdayAtTime', { weekday: i18n('dates.weekdays')[d.getDay()], time: d.toLocaleString(locale, { ...dateFormat }) })
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
        if (dates.now.getHours() >= e[0]) {
            e.shift()
            possibleGreetings.push(...e, ...e, ...e) // hour-bound greetings have 3x more chance than generic ones
            break
        }
    }
    possibleGreetings.push(...greetingsGeneric)
    const greeting = possibleGreetings.random()
        .replace('#', Math.random() < 0.8 ? '.' : '!').replace('%s', i18n('dates.weekdays')[dates.now.getDay()])
        .replace('%n', (await magisterApi.accountInfo())?.Persoon?.Roepnaam || '')
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
        await saveToStorage('start-teacher-names', this.#newTeacherNames);
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
            ...eventsTeachers.reduce((obj, item) => (obj[item.Docentcode] = syncedStorage['start-teacher-names']?.[item.Docentcode] || null, obj), {})
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