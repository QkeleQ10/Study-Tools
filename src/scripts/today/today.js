let events = [],
    teacherNamesSetting = syncedStorage['start-teacher-names'] || {},
    listViewEnabledSetting = syncedStorage['start-schedule-view'] === 'list',
    listViewEnabled = listViewEnabledSetting,
    showNextDaySetting = syncedStorage['start-schedule-extra-day'] ?? true,
    schedulePersistenceEnabled = syncedStorage['start-schedule-persist'] ?? true
// TODO: persist forever setting
let persistedScheduleView = 'day';
let persistedScheduleDate = dates.today;

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
        header = element('div', 'st-start-header', container),
        widgets = element('div', 'st-start-widgets', container, { 'data-working': true }),
        widgetsList = element('div', 'st-start-widgets-list', widgets),
        widgetControlsWrapper = element('div', 'st-start-widget-controls-wrapper', container, { class: 'st-visible' }),
        widgetControls = element('div', 'st-start-widget-controls', widgetControlsWrapper)

    teacherNamesSetting = syncedStorage['start-teacher-names'] || {}
    listViewEnabledSetting = syncedStorage['start-schedule-view'] === 'list'
    listViewEnabled = listViewEnabledSetting
    showNextDaySetting = syncedStorage['start-schedule-extra-day'] ?? true

    const widgetsOrderDefault = ['digitalClock', 'grades', 'activities', 'messages', 'logs', 'homework', 'assignments']
    if (!widgetsOrderSetting || widgetsOrderSetting.length < 1 || !widgetsOrderDefault.every(key => widgetsOrderSetting.includes(key))) {
        console.info(`Changing widgets-order`, widgetsOrderSetting, widgetsOrderDefault)
        widgetsOrderSetting = widgetsOrderDefault
        syncedStorage['widgets-order'] = widgetsOrderSetting
        saveToStorage('widgets-order', widgetsOrderSetting)
    }

    let todayCollapseWidgets
    let widgetFunctions
    let updateHeader

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


    const schedule = new Schedule(container, hourHeightSetting);
    schedule.element.addEventListener('rangechange', () => {
        updateHeader();
        persistedScheduleDate = schedule.scheduleDate;
    });
    schedule.element.addEventListener('contentloaded', () => {
        if (showNextDaySetting) {
            let nextDayWithEvents = Object.values(schedule.days).find(day => day.hasFutureEvents);
            if (nextDayWithEvents) {
                schedule.scheduleDate = nextDayWithEvents.date;
                notify('snackbar', i18n('toasts.jumpedToDate', { date: schedule.scheduleDate.toLocaleDateString(locale, { weekday: 'long', day: 'numeric', month: 'long' }) }));
            }
            greetUser()
        }
    });

    todayWidgets();

    const headerTextWrapper = element('div', 'st-start-header-text-wrapper', header)
    let headerText = element('span', 'st-start-header-text', headerTextWrapper, { class: 'st-title', 'data-state': 'hidden' }),
        headerGreeting = element('span', 'st-start-header-greeting', headerTextWrapper, { class: 'st-title', 'data-state': 'visible' }),
        headerButtons = element('div', 'st-start-header-buttons', header),
        formattedWeekday = dates.now.toLocaleString(locale, { timeZone: 'Europe/Amsterdam', weekday: 'long' })

    // Greeting system
    headerTextWrapper.addEventListener('click', () => {
        const dialog = new Dialog({ closeText: i18n('done'), closeIcon: '' });
        dialog.body.createChildElement('h3', { class: 'st-section-heading', innerText: i18n('selectDate') });
        const input = dialog.body.createChildElement('input', {
            class: 'st-input',
            type: 'date',
            value: `${schedule.scheduleDate.getFullYear()}-${String(schedule.scheduleDate.getMonth() + 1).padStart(2, '0')}-${String(schedule.scheduleDate.getDate()).padStart(2, '0')}`,
        });
        dialog.on('close', () => schedule.scheduleDate = new Date(input.value));
        dialog.show();
        input.focus();
        input.showPicker();
    });

    async function greetUser() {
        headerGreeting.dataset.state = 'visible'
        headerText.dataset.state = 'hidden'
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
            .replace('#', Math.random() < 0.8 ? '.' : '!').replace('%s', formattedWeekday)
            .replace('%n', (await magisterApi.accountInfo())?.Persoon?.Roepnaam || '')
        if (locale === 'fr-FR') greeting.replace(/\s*(!|\?)+/, ' $1')
        headerGreeting.innerText = greeting.slice(0, -1)
        headerGreeting.dataset.lastLetter = greeting.slice(-1)

        setTimeout(() => {
            updateHeader();
        }, 2000)
    }

    updateHeader = () => {
        document.querySelector('#st-start-today-offset-zero').disabled = schedule.isInRange(dates.today)

        // Update the header text accordingly

        const dateOptions = { timeZone: 'Europe/Amsterdam' };
        if (isYearNotCurrent(schedule.scheduleRange.start.getFullYear()) || isYearNotCurrent(schedule.scheduleRange.end.getFullYear())) dateOptions.year = 'numeric';

        if (schedule.snapToMonday) {
            if (schedule.scheduleRange.start.getMonth() === schedule.scheduleRange.end.getMonth()) {
                headerText.innerText = `${i18n(schedule.scheduleSize === 7 ? 'dates.week' : 'dates.workweek')} ${schedule.scheduleRange.start.getWeek()} (${schedule.scheduleRange.start.toLocaleDateString(locale, { ...dateOptions, month: 'long' })})`;
            } else {
                headerText.innerText = `${i18n(schedule.scheduleSize === 7 ? 'dates.week' : 'dates.workweek')} ${schedule.scheduleRange.start.getWeek()} (${schedule.scheduleRange.start.toLocaleDateString(locale, { ...dateOptions, month: 'short' })}–${schedule.scheduleRange.end.toLocaleDateString(locale, { ...dateOptions, month: 'short' })})`;
            }
        } else if (schedule.scheduleSize > 1) {
            if (schedule.scheduleRange.start.getMonth() === schedule.scheduleRange.end.getMonth()) {
                headerText.innerText = `${schedule.scheduleRange.start.toLocaleDateString(locale, { timeZone: 'Europe/Amsterdam', weekday: 'short', day: 'numeric' })}–${schedule.scheduleRange.end.toLocaleDateString(locale, { ...dateOptions, weekday: 'short', day: 'numeric', month: 'long' })}`;
            } else {
                headerText.innerText = `${schedule.scheduleRange.start.toLocaleDateString(locale, { timeZone: 'Europe/Amsterdam', weekday: 'short', day: 'numeric', month: 'short' })}–${schedule.scheduleRange.end.toLocaleDateString(locale, { ...dateOptions, weekday: 'short', day: 'numeric', month: 'short' })}`;
            }
        } else {
            headerText.innerText = schedule.scheduleRange.start.toLocaleDateString(locale, { ...dateOptions, weekday: 'long', month: 'long', day: 'numeric' });
        }

        if (schedule.scheduleDate.getTime() === dates.today.getTime()) {
            headerText.classList.remove('de-emphasis')
        } else {
            headerText.classList.add('de-emphasis')
        }

        headerText.dataset.lastLetter = '.'
        headerGreeting.dataset.state = 'hidden'
        headerText.dataset.state = 'visible'
    }

    // Buttons for moving one day backwards, moving to today's date, and moving one day forwards.
    let todayResetOffset = element('button', 'st-start-today-offset-zero', headerButtons, { class: 'st-button icon', 'data-icon': '', title: i18n('Vandaag'), disabled: true })
    todayResetOffset.addEventListener('click', () => {
        schedule.scheduleDate = dates.today;
    })
    let todayDecreaseOffset = element('button', 'st-start-today-offset-minus', headerButtons, { class: 'st-button icon', 'data-icon': '', title: i18n('Achteruit') })
    todayDecreaseOffset.addEventListener('click', () => {
        schedule.scheduleDate = schedule.scheduleDate.addDays(schedule.snapToMonday ? -7 : (-1 * schedule.scheduleSize));
    })
    let todayIncreaseOffset = element('button', 'st-start-today-offset-plus', headerButtons, { class: 'st-button icon', 'data-icon': '', title: i18n('Vooruit') })
    todayIncreaseOffset.addEventListener('click', () => {
        schedule.scheduleDate = schedule.scheduleDate.addDays(schedule.snapToMonday ? 7 : schedule.scheduleSize);
    })

    let todayViewModeDropdown = element('button', 'st-start-today-view', headerButtons, { class: 'st-segmented-control' })
        .createDropdown(
            {
                'day': i18n('dates.day'), // 1 day
                ...Object.fromEntries([2, 3, 4, 5].map(num => [`${num}day`, i18n('dates.nDays', { num })])), // 2, 3, 4, 5 days
                'workweek': i18n('dates.workweek'), // workweek
                'week': i18n('dates.week') // week
            },
            persistedScheduleView,
            selectedCallback,
            clickCallback
        )

    function clickCallback(currentValue) {
        if (currentValue === 'day') todayViewModeDropdown.changeValue('workweek')
        else todayViewModeDropdown.changeValue('day')
    }

    function selectedCallback(newValue) {
        schedule.scheduleView = newValue;
        persistedScheduleView = newValue;
    }

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
        editWidgets()
    })

    const stopEditWidgets = element('button', 'st-start-editor-done', widgetControls, { class: 'st-button tertiary', 'data-icon': '', innerText: i18n('editFinish') })
    stopEditWidgets.addEventListener('click', () => {
        widgetsList.innerText = ''
        widgets.classList.remove('editing')
        widgetControls.classList.remove('editing')
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
    todayCollapseWidgets = element('button', 'st-start-schedule-collapse-widgets', widgetControls, { class: 'st-button icon', 'data-icon': '', title: i18n('collapseWidgets') })
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
        widgets.dataset.working = true
        widgetsList.innerText = ''

        editor.classList.add('st-hidden')

        let widgetsProgress = element('div', 'st-start-widget-progress', widgets, { class: 'st-progress-bar' })
        let widgetsProgressValue = element('div', 'st-start-widget-progress-value', widgetsProgress, { class: 'st-progress-bar-value indeterminate' })
        let widgetsProgressText = element('span', 'st-start-widget-progress-text', widgets, { class: 'st-subtitle', innerText: i18n('loadingWidgets') })

        await magisterApi.updateApiPermissions()

        widgetFunctions = {
            logs: {
                title: i18n('widgets.logs'),
                disclaimer: i18n('widgetDisclaimer'),
                types: ['Tegel', 'Lijst'],
                requiredPermissions: ['Logboeken'],
                render: async (type, placeholder) => {
                    return new Promise(async resolve => {
                        if (placeholder) magisterApi.useSampleData = true

                        let logs = await magisterApi.logs()
                            .catch(() => { return reject() })

                        if (placeholder) magisterApi.useSampleData = false

                        if (logs.length < 1) return resolve()
                        let widgetElement = element('div', 'st-start-widget-logs', null, { class: 'st-widget', href: '#/lvs-logboeken' })
                        let widgetTitle = element('h3', 'st-start-widget-logs-title', widgetElement, { class: 'st-widget-title', innerText: i18n('widgets.logs'), 'data-amount': logs.length })

                        if (type === 'Lijst') {
                            return resolve(widgetElement)
                        }

                        resolve(widgetElement)
                    })
                }
            },

            activities: {
                title: i18n('widgets.activities'),
                disclaimer: i18n('widgetDisclaimer'),
                requiredPermissions: ['Activiteiten'],
                render: async (type, placeholder) => {
                    return new Promise(async resolve => {
                        if (placeholder) magisterApi.useSampleData = true

                        let activities = await magisterApi.activities()
                            .catch(() => { return reject() })

                        if (placeholder) magisterApi.useSampleData = false

                        if (activities.length < 1) return resolve()
                        let widgetElement = element('a', 'st-start-widget-activities', null, { class: 'st-widget', href: '#/elo/activiteiten' })
                        let widgetTitle = element('h3', 'st-start-widget-activities-title', widgetElement, { class: 'st-widget-title', innerText: i18n('widgets.activities'), 'data-amount': activities.length })

                        if (type === 'Lijst') {
                            return resolve(widgetElement)
                        }

                        resolve(widgetElement)
                    })
                }
            },

            grades: {
                title: i18n('widgets.grades'),
                requiredPermissions: ['Cijfers'],
                options: [
                    {
                        title: "Automatisch rouleren",
                        key: 'start-widget-cf-rotate',
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
                    {
                        title: "Beoordeling weergeven",
                        key: 'start-widget-cf-result',
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
                ],
                render: async (type, placeholder) => {
                    return new Promise(async resolve => {
                        let viewResult = await getFromStorage('start-widget-cf-result', 'local') || 'always'
                        let autoRotate = await getFromStorage('start-widget-cf-rotate', 'local') || 'true'

                        if (placeholder) magisterApi.useSampleData = true

                        let grades = await magisterApi.gradesRecent()
                            .catch(() => { return reject() })
                        let assignments = magisterApi.permissions.includes('EloOpdracht')
                            ? await magisterApi.assignmentsTop()
                                .catch(() => { return reject() })
                            : []

                        if (placeholder) magisterApi.useSampleData = false

                        let hiddenItems = new Set(Object.values((await getFromStorage('hiddenGrades', 'local') || [])))

                        const relevantAssignments = assignments.filter(item => item.Beoordeling?.length > 0).map(item => (
                            {
                                ...item,
                                omschrijving: item.Titel,
                                ingevoerdOp: item.BeoordeeldOp,
                                vak: {
                                    code: item.Vak ? item.Vak + " (opdr.)" : "opdr.",
                                    omschrijving: item.Vak ? item.Vak + " (beoordeelde opdracht)" : "Beoordeelde opdracht"
                                },
                                waarde: item.Beoordeling || '?',
                                isVoldoende: !isNaN(Number(item.Beoordeling.replace(',', '.'))) || Number(item.Beoordeling.replace(',', '.')) >= Number(syncedStorage['suf-threshold']),
                                weegfactor: 0,
                                kolomId: item.Id,
                                assignment: true
                            }
                        ))
                        const recentGrades = [...grades, ...relevantAssignments].map(item => (
                            {
                                ...item,
                                date: new Date(item.ingevoerdOp),
                                unread: new Date(item.ingevoerdOp) > dates.now - (1000 * 60 * 60 * 24 * 7),
                                hidden: (hiddenItems.has(item.kolomId)) || (viewResult === 'sufficient' && !item.isVoldoende) || (viewResult === 'never') // Hide if hidden manually, or if insufficient and user has set widget to sufficient only, or if user has set widget to hide result.
                            }
                        )).sort((a, b) => b.date - a.date)

                        if (recentGrades.length < 1) return resolve() // Stop if no grades.

                        let widgetElement = element('a', 'st-start-widget-grades', null, { class: 'st-widget', title: "Laatste cijfers bekijken", href: '#/cijfers' })
                        let widgetTitle = element('h3', 'st-start-widget-grades-title', widgetElement, { class: 'st-widget-title', innerText: i18n('widgets.latestGrade') })
                        let widgetItemsContainer = element('div', 'st-start-widget-grades-items', widgetElement)

                        let children = []

                        if (type === 'Lijst') widgetTitle.dataset.amount = recentGrades.filter(item => item.unread).length

                        recentGrades.forEach((item, i) => {
                            const gradeElement = element('div', `st-start-widget-grades-${i}`, widgetItemsContainer, {
                                class: 'st-start-widget-grades-item',
                                'data-unread': item.unread,
                                'data-hidden': item.hidden,
                                'data-assignment': item.assignment,
                                style: i == 0 ? '' : 'display: none;'
                            })
                            children.push(gradeElement)
                            if (i === 0) widgetElement.dataset.unread = item.unread

                            let itemRslt = element('span', `st-start-widget-grades-${i}-rslt`, gradeElement, { class: 'st-start-widget-grades-item-rslt', innerText: item.waarde, 'data-great': autoRotate == 'true' && Number(item.waarde.replace(',', '.')) > 8.9 && Number(item.waarde.replace(',', '.')) <= 10, 'data-insuf': syncedStorage['insuf-red'] === true && Number(item.waarde.replace(',', '.')) >= 1 && Number(item.waarde.replace(',', '.')) < Number(syncedStorage['suf-threshold']) })
                            let itemSubj = element('span', `st-start-widget-grades-${i}-subj`, gradeElement, { class: 'st-start-widget-grades-item-subj', innerText: item.vak.omschrijving.charAt(0).toUpperCase() + item.vak.omschrijving.slice(1) })
                            let itemInfo = element('span', `st-start-widget-grades-${i}-info`, gradeElement, { class: 'st-start-widget-grades-item-info', innerText: item.assignment ? item.omschrijving : `${item.omschrijving} (${item.weegfactor || 0}×)` })
                            let itemDate = element('span', `st-start-widget-grades-${i}-date`, gradeElement, { class: 'st-start-widget-grades-item-date', innerText: makeTimestamp(item.date) })
                            let itemHide = element('button', `st-start-widget-grades-${i}-hide`, gradeElement, { class: 'st-start-widget-grades-item-hide st-button icon tertiary', 'data-icon': item.hidden ? '' : '', title: "Dit specifieke cijfer verbergen/weergeven" })
                            itemHide.addEventListener('click', (event) => {
                                event.preventDefault()
                                event.stopPropagation()
                                event.stopImmediatePropagation()
                                if (gradeElement.dataset.hidden == 'true') {
                                    itemHide.dataset.icon = ''
                                    gradeElement.dataset.hidden = false
                                    hiddenItems.delete(item.kolomId)
                                    saveToStorage('hiddenGrades', [...hiddenItems], 'local')
                                } else {
                                    itemHide.dataset.icon = ''
                                    gradeElement.dataset.hidden = true
                                    hiddenItems.add(item.kolomId)
                                    saveToStorage('hiddenGrades', [...hiddenItems], 'local')
                                }
                                return false
                            })
                        })

                        visibleChildIndex = 0

                        const scrollBack = element('button', 'st-start-widget-grades-scroll-back', widgetElement, { class: 'st-button icon tertiary', 'data-icon': '', title: i18n('Nieuwer') })
                        scrollBack.addEventListener('click', (event) => {
                            event.preventDefault()
                            event.stopPropagation()
                            event.stopImmediatePropagation()
                            scrollWidget('backwards')
                        })
                        const scrollForw = element('button', 'st-start-widget-grades-scroll-forw', widgetElement, { class: 'st-button icon tertiary', 'data-icon': '', title: i18n('Ouder') })
                        scrollForw.addEventListener('click', (event) => {
                            event.preventDefault()
                            event.stopPropagation()
                            event.stopImmediatePropagation()
                            scrollWidget('forwards')
                        })

                        const scrollPagn = element('div', 'st-start-widget-grades-scroll-pagn', widgetElement)
                        scrollPagn.inenrText = ''
                        children.forEach((child, i) => {
                            const scrollPagnNode = element('div', undefined, scrollPagn, { 'data-current': i === 0 })
                            scrollPagnNode.addEventListener('click', (event) => {
                                event.preventDefault()
                                event.stopPropagation()
                                event.stopImmediatePropagation()
                                scrollWidget('index', i)
                            })
                        })

                        if (autoRotate == 'true') {
                            let interval = setInterval(() => {
                                if (!widgetItemsContainer?.children?.length > 1) clearInterval(interval)
                                if (widgetElement.matches(':hover')) return
                                scrollWidget('forwards')
                            }, 20000)
                        }

                        function scrollWidget(direction = 'forwards', targetIndex = 0) {
                            widgetElement.dataset.unread = children[visibleChildIndex]?.dataset.unread || false
                            if (direction === 'forwards') {
                                if (children[visibleChildIndex + 1])
                                    targetIndex = visibleChildIndex + 1
                                else
                                    targetIndex = 0
                            }
                            if (direction === 'backwards') {
                                if (children[visibleChildIndex - 1])
                                    targetIndex = visibleChildIndex - 1
                                else
                                    targetIndex = children.length - 1
                            }

                            widgetItemsContainer.dataset.navigate = 'still'
                            setTimeout(() => {
                                widgetItemsContainer.dataset.navigate = targetIndex > visibleChildIndex ? 'forwards' : targetIndex < visibleChildIndex ? 'backwards' : 'still'
                                visibleChildIndex = targetIndex
                                setTimeout(() => {
                                    children.forEach((child, index) => child.style.display = index === targetIndex ? 'flex' : 'none');
                                    document.querySelectorAll('#st-start-widget-grades-scroll-pagn>div').forEach((d, index) => d.dataset.current = index === targetIndex);
                                    widgetElement.dataset.unread = children[targetIndex]?.dataset.unread || false
                                }, 60);
                            }, 10);
                        }

                        if (recentGrades.length < 2) {
                            scrollBack.remove()
                            scrollForw.remove()
                            scrollPagn.remove()
                        }

                        if (type === 'Lijst') {
                            widgetTitle.innerText = recentGrades.filter(item => item.unread).length > 0 ? i18n('widgets.newGrades') : i18n('widgets.latestGrade')
                            return resolve(widgetElement)
                        }

                        resolve(widgetElement)
                    })
                }
            },

            messages: {
                title: i18n('widgets.messages'),
                disclaimer: i18n('widgetDisclaimer'),
                requiredPermissions: ['Berichten'],
                render: async (type, placeholder) => {
                    return new Promise(async resolve => {
                        const widget = new MessagesWidget(null) // pass default option

                        resolve(widget.element)
                    })
                }
            },

            homework: {
                title: i18n('widgets.homework'),
                disclaimer: i18n('widgetDisclaimer'),
                requiredPermissions: ['Afspraken'],
                options: [
                    {
                        title: "Afgeronde items tonen",
                        key: 'start-widget-hw-filter',
                        type: 'select',
                        choices: [
                            {
                                title: "Alleen onvoltooid",
                                value: 'incomplete'
                            },
                            {
                                title: "Alles",
                                value: 'all'
                            }
                        ]
                    }
                ],
                render: async (type, placeholder) => {
                    return new Promise(async resolve => {
                        const options = { filter: await getFromStorage('start-widget-hw-filter', 'local') || 'incomplete' }

                        const widget = new HomeworkWidget(null, options) // pass default option

                        resolve(widget.element)
                    })
                }
            },

            assignments: {
                title: i18n('widgets.assignments'),
                disclaimer: i18n('widgetDisclaimer'),
                requiredPermissions: ['EloOpdracht'],
                options: [
                    {
                        title: "Niet-ingeleverde opdrachten na deadline",
                        key: 'start-widget-hw-filter',
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
                ],
                render: async (type, placeholder) => {
                    return new Promise(async (resolve) => {
                        const options = { filter: await getFromStorage('start-widget-as-filter', 'local') || 'week' }

                        const widget = new AssignmentsWidget(null, options) // pass default option

                        resolve(widget.element)
                    })
                }
            },

            digitalClock: {
                title: i18n('widgets.digitalClock'),
                disclaimer: i18n('widgetClockDisclaimer'),
                requiredPermissions: [],
                options: [
                    {
                        title: "Seconden tonen",
                        key: 'start-widget-digitalClock-seconds',
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
                ],
                render: (type, placeholder) => {
                    return new Promise(async resolve => {
                        const secondsOption = await getFromStorage('start-widget-digitalClock-seconds', 'local') || 'show'

                        const widgetElement = element(placeholder ? 'div' : 'button', 'st-start-widget-digital-clock', null, { class: 'st-widget', title: "Klok in volledig scherm" })
                        const timeText = element('p', 'st-start-widget-digital-clock-time', widgetElement, {
                            'data-temporal-type': secondsOption === 'show'
                                ? 'current-time-long'
                                : 'current-time-short'
                        })

                        if (!placeholder) widgetElement.addEventListener('click', () => {
                            if (!document.fullscreenElement) {
                                widgetElement.requestFullscreen()
                                widgetElement.removeAttribute('title')
                                timeText.dataset.temporalType = 'current-time-long'
                                updateTemporalBindings()
                            } else {
                                if (document.exitFullscreen) document.exitFullscreen()
                                widgetElement.title = "Klok in volledig scherm"
                                timeText.dataset.temporalType = secondsOption === 'show' ? 'current-time-long' : 'current-time-short'
                                updateTemporalBindings()
                            }
                        })

                        resolve(widgetElement)

                        // Aditionally, show the progress of the day. Widget will be rendered even before this is available!

                        let events
                        if (placeholder) {
                            events = []
                        } else {
                            events = await magisterApi.events()
                                .catch(() => { return reject() })
                        }

                        const todaysEvents = events?.filter(item => new Date(item.Start).isToday() && item.Omschrijving != 'amablok_bb') || []
                        if (!todaysEvents?.length > 0) return
                        const progressWrapper = element('div', 'st-start-widget-digital-clock-wrapper', widgetElement)

                        let schoolHours = {}
                        todaysEvents.forEach(item => {
                            if (item.LesuurVan) {
                                schoolHours[item.LesuurVan] ??= { hour: item.LesuurVan }
                                schoolHours[item.LesuurVan].start = item.Start
                            }
                            if (item.LesuurTotMet) {
                                schoolHours[item.LesuurTotMet] ??= { hour: item.LesuurTotMet }
                                schoolHours[item.LesuurVan].end = item.Einde
                            }
                        })

                        function findGaps(schoolHours) {
                            const hours = Object.keys(schoolHours);

                            for (let i = 0; i < hours.length - 1; i++) {
                                const currentHour = hours[i];
                                const nextHour = hours[i + 1];

                                const currentEnd = new Date(schoolHours[currentHour].end);
                                const nextStart = new Date(schoolHours[nextHour].start);

                                if (currentEnd < nextStart) {
                                    const gapStart = currentEnd.toISOString();
                                    const gapEnd = nextStart.toISOString();

                                    schoolHours[`gap${i}`] = {
                                        start: gapStart,
                                        end: gapEnd,
                                        gap: true
                                    };
                                }
                            }

                            return schoolHours
                        }

                        Object.values(findGaps(schoolHours)).sort((a, b) => new Date(a.start) - new Date(b.start)).forEach((item, i) => {
                            element('div', `st-start-widget-digital-clock-${i}`, progressWrapper, { 'data-temporal-type': 'style-progress', 'data-temporal-start': item.start, 'data-temporal-end': item.end, title: `${item.gap ? "Tijd tussen lesuren" : item.hour + "e lesuur"}\n${new Date(item.start).getFormattedTime()}–${new Date(item.end).getFormattedTime()}`, style: `flex-grow: ${(new Date(item.end) - new Date(item.start))}; opacity: ${item.gap ? 0.5 : 1}` })
                        })
                    })
                }
            }
        }

        // Ensure the user permission flags are up-to-date
        await magisterApi.accountInfo()

        // Draw the selected widgets in the specified order
        for (const key of widgetsOrderSetting) {
            if (!widgetFunctions?.[key] || !widgetFunctions[key].requiredPermissions?.every(p => magisterApi.permissions?.includes(p))) continue

            // if (!syncedStorage[`widget-${key}-type`] || ![...widgetFunctions[key].types, 'Verborgen'].includes(syncedStorage[`widget-${key}-type`])) {
            //     syncedStorage[`widget-${key}-type`] = widgetFunctions[key].types[0]
            //     saveToStorage(`widget-${key}-type`, syncedStorage[`widget-${key}-type`], 'local')
            // }
            // if (syncedStorage[`widget-${key}-type`] === 'Verborgen') continue

            widgetsProgressText.innerText = i18n('loadingWidget', { title: widgetFunctions[key].title })
            let widgetElement = await widgetFunctions[key].render(syncedStorage[`widget-${key}-type`])
            if (widgetElement) {
                widgetsList.append(widgetElement)
            }
            updateTemporalBindings()
        }

        widgets.dataset.working = false
        widgetsProgress.remove()
        widgetsProgressText.remove()

    }

    async function editWidgets(keepSelection) {
        widgetsList.innerText = ''
        function emptySelection() {
            editorWidgetTitle.innerText = i18n('editWidgets')
            editorActionRow.innerText = ''
            editorDisclaimer.classList.add('st-hidden')
            editorOptions.innerText = ''
            editorHiddenList.innerText = ''
        }
        if (!keepSelection) emptySelection()

        editor.classList.remove('st-hidden')

        if (widgets.classList.contains('editing')) {
            todayWidgets()
            widgets.classList.remove('editing')
            widgetControls.classList.remove('editing')
            return
        }

        widgets.classList.add('editing')
        widgetControls.classList.add('editing')
        if (widgetsCollapsed) todayCollapseWidgets.click()

        for (const key of widgetsOrderSetting) {
            if (!widgetFunctions?.[key] || !widgetFunctions[key].requiredPermissions?.every(p => magisterApi.permissions?.includes(p))) continue

            // if (syncedStorage[`widget-${key}-type`] === 'Verborgen' || (!syncedStorage[`widget-${key}-type`] && widgetFunctions[key].types[0] === 'Verborgen')) {
            //     const widgetAddButton = element('button', `st-start-edit-${key}-add`, editorHiddenList, { class: 'st-start-editor-add', innerText: widgetFunctions[key].title, title: i18n('add') })

            //     let widgetElement = await widgetFunctions[key].render(syncedStorage[`widget-${key}-type`], true)
            //     widgetElement.setAttribute('disabled', true)
            //     widgetElement.querySelectorAll('*').forEach(c => c.setAttribute('inert', true))
            //     widgetAddButton.append(widgetElement)

            //     widgetAddButton.addEventListener('click', () => {
            //         syncedStorage[`widget-${key}-type`] = widgetFunctions[key].types.filter(e => e !== 'Verborgen')[0]
            //         saveToStorage(`widget-${key}-type`, syncedStorage[`widget-${key}-type`])
            //         widgetsList.innerText = ''
            //         widgets.classList.remove('editing')
            //         widgetControls.classList.remove('editing')
            //         editWidgets()
            //     })
            //     continue
            // }

            let widgetElement = await widgetFunctions[key].render(syncedStorage[`widget-${key}-type`], true)
            if (widgetElement) {
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
                widgetElement.addEventListener('click', () => {
                    if (widgetElement.classList.contains('focused')) {
                        widgetsList.querySelectorAll('.st-widget.focused').forEach(e => e.classList.remove('focused'))
                        emptySelection()
                        return
                    }

                    // Focus only the correct widget
                    widgetsList.querySelectorAll('.st-widget.focused').forEach(e => e.classList.remove('focused'))
                    widgetElement.classList.add('focused')

                    editorWidgetTitle.innerText = `${i18n('widget')}: ${widgetFunctions[key].title}`

                    // Widget disclaimer
                    if (widgetFunctions[key]?.disclaimer) {
                        editorDisclaimer.innerText = widgetFunctions[key].disclaimer
                        editorDisclaimer.classList.remove('st-hidden')
                    } else {
                        editorDisclaimer.classList.add('st-hidden')
                    }

                    editorOptions.innerText = ''

                    // Widget display types
                    editorActionRow.innerText = ''
                    // const widgetTypeSelector = element('div', `st-start-edit-${key}-type`, editorActionRow, { class: 'st-segmented-control' })
                    // if (!syncedStorage[`widget-${key}-type`] || ![...widgetFunctions[key].types, 'Verborgen'].includes(syncedStorage[`widget-${key}-type`])) {
                    //     syncedStorage[`widget-${key}-type`] = widgetFunctions[key].types[0]
                    //     saveToStorage(`widget-${key}-type`, syncedStorage[`widget-${key}-type`])
                    // }
                    // ([...widgetFunctions[key].types.filter(e => e !== 'Verborgen')]).forEach(type => {
                    //     const widgetTypeButton = element('button', `st-start-edit-${key}-type-${type}`, widgetTypeSelector, { class: 'st-button segment', innerText: i18n(type) })
                    //     if (syncedStorage[`widget-${key}-type`] === type) widgetTypeButton.classList.add('active')
                    //     widgetTypeButton.addEventListener('click', () => {
                    //         syncedStorage[`widget-${key}-type`] = type
                    //         saveToStorage(`widget-${key}-type`, syncedStorage[`widget-${key}-type`])
                    //         widgetTypeSelector.querySelectorAll('.st-button.segment').forEach(b => b.classList.remove('active'))
                    //         widgetTypeButton.classList.add('active')
                    //         widgetsList.innerText = ''
                    //         widgets.classList.remove('editing')
                    //         widgetControls.classList.remove('editing')
                    //         editWidgets(widgetElement.id)
                    //     })
                    // })
                    // const widgetHideButton = element('button', `st-start-edit-${key}-hide`, editorActionRow, { class: 'st-button tertiary', 'data-icon': '', innerText: i18n('remove'), title: i18n('removeWidget') })
                    // widgetHideButton.addEventListener('click', () => {
                    //     syncedStorage[`widget-${key}-type`] = 'Verborgen'
                    //     saveToStorage(`widget-${key}-type`, syncedStorage[`widget-${key}-type`])
                    //     widgetsList.innerText = ''
                    //     widgets.classList.remove('editing')
                    //     widgetControls.classList.remove('editing')
                    //     editWidgets()
                    // })

                    // Widget options
                    if (widgetFunctions[key].options) {
                        widgetFunctions[key].options.forEach(async option => {
                            let optionWrapper = element('div', `st-start-edit-${option.key}`, editorOptions, { class: 'st-option' })
                            let optionTitle = element('label', `st-start-edit-${option.key}-title`, optionWrapper, { for: `st-start-edit-${option.key}-input`, innerText: option.title })
                            switch (option.type) {
                                case 'select':
                                    let choices = option.choices.reduce((obj, item) => ({ ...obj, [item.value]: item.title }), ({}))
                                    let selectedChoice = await getFromStorage(option.key, 'local') || Object.keys(choices)[0]
                                    element('div', `st-start-edit-${option.key}-input`, optionWrapper, { name: option.title }).createDropdown(choices, selectedChoice, (newValue) => {
                                        saveToStorage(option.key, newValue, 'local')
                                        widgetsList.innerText = ''
                                        widgets.classList.remove('editing')
                                        widgetControls.classList.remove('editing')
                                        editWidgets(widgetElement.id)
                                    })
                                    break

                                default:
                                    // Implement other option types as necessary
                                    break
                            }
                        })
                    }
                })

                if (keepSelection === widgetElement.id) {
                    widgetElement.classList.add('focused')
                }
            }
            updateTemporalBindings()
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
