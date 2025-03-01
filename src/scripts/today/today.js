let schedule,
    events = [],
    teacherNamesSetting = syncedStorage['start-teacher-names'] || {},
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
        hourHeightSetting = await getFromStorage('start-hour-height', 'local') || 115,
        widgetsOrderSetting = Object.values(syncedStorage['widgets-order'] || []) || [],
        mainView = await awaitElement('div.view.ng-scope'),
        container = element('div', 'st-start', mainView, { 'data-widgets-collapsed': widgetsCollapsed }),
        // header = element('div', 'st-start-header', container),
        widgets = element('div', 'st-start-widgets', container),
        widgetsList = element('div', 'st-start-widgets-list', widgets),
        widgetControlsWrapper = element('div', 'st-widget-controls-wrapper', container, { class: 'st-visible' }),
        widgetControls = element('div', 'st-widget-controls', widgetControlsWrapper)

    teacherNamesSetting = syncedStorage['start-teacher-names'] || {}
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

    // Zoom buttons
    let zoomOut = element('button', 'st-start-edit-zoom-out', widgetControls, { class: 'st-button icon', 'data-icon': '', title: i18n('scaleDown') })
    let zoomIn = element('button', 'st-start-edit-zoom-in', widgetControls, { class: 'st-button icon', 'data-icon': '', title: i18n('scaleUp') })
    zoomOut.addEventListener('click', () => {
        schedule.hourHeight -= 5
    })
    zoomIn.addEventListener('click', () => {
        schedule.hourHeight += 5
    })

    const invokeEditWidgets = element('button', 'st-start-edit-widgets', widgetControls, { class: 'st-button icon', 'data-icon': '', title: i18n('editWidgets') })
    invokeEditWidgets.addEventListener('click', () => {
        invokeWidgetEditor()
    })

    const stopEditWidgets = element('button', 'st-start-editor-done', widgetControls, { class: 'st-button tertiary', 'data-icon': '', innerText: i18n('editFinish') })
    stopEditWidgets.addEventListener('click', () => {
        closeWidgetEditor()
        todayWidgets()
    })

    if (!widgetsCollapsed && Math.random() < 0.1 && !(await getFromStorage('start-widgets-edit-known', 'local') ?? false)) {
        setTimeout(() => {
            const rect = invokeEditWidgets.getBoundingClientRect()
            const tooltip = element('div', 'st-start-widgets-edit-tooltip', document.body, { class: 'st-hidden', innerText: "Onder deze knop kun je het widgetpaneel compleet aanpassen.", style: `bottom: ${window.innerHeight - rect.top}px; right: ${window.innerWidth - rect.right}px; translate: 8px -16px;` })
            setTimeout(() => tooltip.classList.remove('st-hidden'), 200)
            invokeEditWidgets.addEventListener('click', () => {
                tooltip.classList.add('st-hidden')
                saveToStorage('start-widgets-edit-known', true, 'local')
            })
            setTimeout(() => {
                tooltip.classList.add('st-hidden')
            }, 20000)
        }, 2000)
    }

    let editTeachers
    (async () => {
        editTeachers = element('dialog', 'st-start-edit-teachers', document.body, { class: 'st-overlay' })
        let editTeachersHeading = element('div', 'st-start-edit-teachers-heading', editTeachers),
            editTeachersTitle = element('span', 'st-start-edit-teachers-title', editTeachersHeading, { class: 'st-title', innerText: i18n('teacherNicknames') }),
            editTeachersClose = element('button', 'st-start-edit-teachers-close', editTeachersHeading, { class: 'st-button', 'data-icon': '', innerText: i18n('close') }),
            editTeachersWrapper = element('div', 'st-start-edit-teachers-wrapper', editTeachers, { class: 'st-list st-tile' }),
            editTeachersList = element('div', 'st-start-edit-teachers-list', editTeachersWrapper)
        editTeachersClose.addEventListener('click', () => {
            editTeachers.close()
            todayWidgets()
        })

        const events = await magisterApi.events()

        if (!events) return

        const eventsTeachers = events?.flatMap(item => item.Docenten).filter((value, index, self) =>
            index === self.findIndex((t) => (
                t.Docentcode === value.Docentcode
            ))
        )

        const allTeacherNames = {
            ...teacherNamesSetting,
            ...eventsTeachers.reduce((obj, item) => (obj[item.Docentcode] = teacherNamesSetting[item.Docentcode] || null, obj), {})
        }

        for (const key in allTeacherNames) {
            if (Object.hasOwnProperty.call(allTeacherNames, key)) {
                const value = allTeacherNames[key],
                    teacherName = eventsTeachers.find(item => item.Docentcode === key)?.Naam
                let wrapper = element('div', `st-start-edit-teachers-list-${key}`, editTeachersList)
                let label = element('label', `st-start-edit-teachers-list-${key}-label`, wrapper, { innerText: key, style: `text-decoration: ${teacherName ? 'underline' : 'none'}`, title: teacherName ? (value ? `Je hebt ${key} (${teacherName}) een bijnaam gegeven en\ndeze docent komt ook voor in je rooster van de komende 6 weken.` : `Je hebt ${key} (${teacherName}) geen bijnaam gegeven, maar\ndeze docent komt wel voor in je rooster van de komende 6 weken.`) : `Je hebt ${key} eerder een bijnaam gegeven, maar\ndeze docent komt niet voor in je rooster van de komende 6 weken.` })
                let input = element('input', `st-start-edit-teachers-list-${key}-input`, wrapper, { class: 'st-input', value: value || '', placeholder: teacherName || '' })
                input.addEventListener('change', async () => {
                    teacherNamesSetting[key] = input.value
                    teacherNamesSetting = Object.fromEntries(Object.entries(teacherNamesSetting).filter(([_, v]) => v != null && v.length > 0))
                    await saveToStorage('start-teacher-names', teacherNamesSetting)
                })
            }
        }
    })()

    // Editor invoke button
    let invokeEditTeachers = element('button', 'st-start-invoke-editor', widgetControls, { class: 'st-button icon', 'data-icon': '', title: i18n('editTeachers') })
    invokeEditTeachers.addEventListener('click', async () => {
        editTeachers.showModal()
    })

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
            const tooltip = element('div', 'st-start-widgets-collapsed-tooltip', document.body, { class: 'st-hidden', innerText: "Het widgetpaneel is ingeklapt. Gebruik de knop met de pijltjes om hem weer uit te klappen.", style: `bottom: ${window.innerHeight - rect.top}px; right: ${window.innerWidth - rect.right}px; translate: 8px -16px;` })
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
        if (event.key === 'ArrowLeft' && !todayDecreaseOffset.disabled) todayDecreaseOffset.click()
        else if (event.key === 'ArrowRight' && !todayIncreaseOffset.disabled) todayIncreaseOffset.click()
    })

    async function todayWidgets() {
        widgetsList.innerText = ''


        await magisterApi.updateApiPermissions()

        // Ensure the user permission flags are up-to-date
        await magisterApi.accountInfo()

        // Draw the selected widgets in the specified order
        for (const key of widgetsOrderSetting) {
            const widgetClass = widgetClasses[key];

            const displaySetting = parseBoolean(await getFromStorage(`widget-${key}-display`)) ?? widgetClass.displayByDefault;
            const options = {};
            for (const [optKey, opt] of Object.entries(widgetClass.possibleOptions)) {
                options[optKey] =
                    await getFromStorage(`widget-${key}-${optKey}`)
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
        magisterApi.useSampleData = false; // TODO: THIS WON'T ALWAYS RUN!

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

            const displaySetting = parseBoolean(await getFromStorage(`widget-${key}-display`)) ?? widgetClass.displayByDefault;
            const options = {};
            for (const [optKey, opt] of Object.entries(widgetClass.possibleOptions)) {
                options[optKey] =
                    await getFromStorage(`widget-${key}-${optKey}`)
                    || opt.choices.find(option => option.default)?.value
                    || opt.choices[0].value;
            }

            if (!displaySetting) {
                const widgetAddButton = editorHiddenList.createChildElement('button', {
                    class: 'st-start-editor-add',
                    innerText: i18n(`widgets.${widgetClass.id}`),
                    title: i18n('add')
                })
                widgetAddButton.addEventListener('click', async () => {
                    await saveToStorage(`widget-${key}-display`, 'true')
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

                editorWidgetTitle.innerText = `${i18n('widget')}: ${i18n(`widgets.${widgetClass.id}`)}`

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
                    saveToStorage(`widget-${key}-display`, 'false')
                    invokeWidgetEditor()
                })

                // Widget options
                if (widgetClass.possibleOptions) {
                    for (const [optKey, opt] of Object.entries(widgetClass.possibleOptions)) {
                        let optionWrapper = element('div', `st-start-edit-${opt.key}`, editorOptions, { class: 'st-option' })
                        let optionTitle = element('label', `st-start-edit-${opt.key}-title`, optionWrapper, { for: `st-start-edit-${opt.key}-input`, innerText: opt.title })
                        switch (opt.type) {
                            case 'select':
                            default:
                                let choices = opt.choices.reduce((obj, item) => ({ ...obj, [item.value]: item.title }), ({}))
                                let selectedChoice = await getFromStorage(`widget-${key}-${optKey}`) || opt.choices.find(item => item.default)?.value || opt.choices[0].value
                                element('div', `st-start-edit-${opt.key}-input`, optionWrapper, { name: opt.title })
                                    .createDropdown(choices, selectedChoice, async (newValue) => {
                                        await saveToStorage(`widget-${key}-${optKey}`, newValue)
                                        widgetsList.innerText = ''
                                        widgets.classList.remove('editing')
                                        widgetControls.classList.remove('editing')
                                        invokeWidgetEditor(widgetElement.id)
                                    })
                                break

                            // Implement other option types as necessary
                        }
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
        let chip = infoTypes[event.InfoType] || { name: `Infotype ${event.InfoType}`, type: 'info' }
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
        return (teacherNamesSetting?.[docent.Docentcode] || docent.Naam) + ` (${docent.Docentcode})`;
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
