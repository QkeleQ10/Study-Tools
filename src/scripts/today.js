let events = []

// Run at start and when the URL changes
if (document.location.href.includes('/vandaag') && !document.location.href.includes('to-do')) today()
window.addEventListener('popstate', () => {
    if (document.location.href.includes('/vandaag') && !document.location.href.includes('to-do')) today()
})

// Page 'Vandaag'
async function today() {
    if (!syncedStorage['start-enabled']) return

    let widgetsCollapsedSetting = await getFromStorage('start-widgets-collapsed', 'local') ?? false,
        widgetsCollapsed = widgetsCollapsedSetting ?? false,
        zoomSetting = await getFromStorage('start-zoom', 'local') || 1,
        teacherNamesSetting = syncedStorage['start-teacher-names'] || await getFromStorage('teacher-names', 'local') || {},
        widgetsOrderSetting = Object.values(syncedStorage['widgets-order'] || []) || [],
        mainView = await awaitElement('div.view.ng-scope'),
        container = element('div', 'st-start', mainView, { 'data-widgets-collapsed': widgetsCollapsed }),
        header = element('div', 'st-start-header', container),
        schedule = element('div', 'st-start-schedule', container),
        widgets = element('div', 'st-start-widgets', container, { 'data-working': true }),
        widgetsList = element('div', 'st-start-widgets-list', widgets),
        widgetControlsWrapper = element('div', 'st-start-widget-controls-wrapper', container, { class: 'st-visible' }),
        widgetControls = element('div', 'st-start-widget-controls', widgetControlsWrapper)

    const widgetsOrderDefault = ['digitalClock', 'grades', 'activities', 'messages', 'logs', 'homework', 'assignments']
    if (!widgetsOrderSetting || widgetsOrderSetting.length < 1 || !widgetsOrderDefault.every(key => widgetsOrderSetting.includes(key))) {
        console.info(`Changing widgets-order`, widgetsOrderSetting, widgetsOrderDefault)
        widgetsOrderSetting = widgetsOrderDefault
        syncedStorage['widgets-order'] = widgetsOrderSetting
        saveToStorage('widgets-order', widgetsOrderSetting)
    }

    let todayCollapseWidgets
    let widgetFunctions
    let renderSchedule, updateHeaderButtons, updateHeaderText

    let agendaStartDate, agendaEndDate

    const showNextDaySetting = syncedStorage['start-schedule-extra-day'] ?? true

    const listViewEnabledSetting = syncedStorage['start-schedule-view'] === 'list'
    let listViewEnabled = listViewEnabledSetting

    let agendaView = localStorage['start-schedule-view-stored'] || 'day' // False for day view, true for week view
    let agendaDayOffset = 0 // Six weeks are capable of being shown in the agenda.
    let agendaDayOffsetChanged = false

    now = new Date()

    const todayDate = new Date(new Date().setHours(0, 0, 0, 0))
    firstName = (await awaitElement('#user-menu > figure > img')).alt.split(' ')[0]

    const gatherStart = new Date()
    gatherStart.setDate(now.getDate() - (now.getDay() + 6) % 7)
    gatherStart.setHours(0, 0, 0, 0)

    const gatherEnd = new Date()
    gatherEnd.setDate(now.getDate() + 42)
    gatherEnd.setHours(0, 0, 0, 0)

    // Automagically collapse the widgets panel when it's necessary
    widgetsCollapsed = widgetsCollapsed || window.innerWidth < 1100
    verifyDisplayMode()
    window.addEventListener('resize', () => {
        widgetsCollapsed = widgetsCollapsed || window.innerWidth < 1100
        if (widgets.classList.contains('editing')) widgetsCollapsed = false
        verifyDisplayMode()
    })

    const editor = element('div', 'st-start-editor', document.body, { class: 'st-hidden' })
    const editorView = element('div', 'st-start-editor-view', editor)
    const editorWidgetTitle = element('span', 'st-start-editor-title', editorView, { innerText: i18n('editWidgets') })
    const editorActionRow = element('div', 'st-start-editor-action-row', editorView, { 'data-empty-text': i18n('editWidgetsEmpty') })
    const editorDisclaimer = element('div', 'st-start-editor-disclaimer', editorView, { class: 'st-disclaimer st-hidden' })
    const editorOptions = element('div', 'st-start-editor-options', editorView)
    const editorHidden = element('div', 'st-start-editor-hidden-view', editor)
    const editorHiddenTitle = element('span', 'st-start-editor-hidden-view-title', editorHidden, { innerText: i18n('addWidgets') })
    const editorHiddenList = element('div', 'st-start-editor-hidden-view-list', editorHidden, { 'data-empty-text': i18n('addWidgetsEmpty') })

    todayHeader()
    todaySchedule()
    todayWidgets()

    async function todayHeader() {
        const headerTextWrapper = element('div', 'st-start-header-text-wrapper', header)
        let headerText = element('span', 'st-start-header-text', headerTextWrapper, { class: 'st-title' }),
            headerGreeting = element('span', 'st-start-header-greeting', headerTextWrapper, { class: 'st-title' }),
            headerButtons = element('div', 'st-start-header-buttons', header),
            formattedWeekday = now.toLocaleString(locale, { timeZone: 'Europe/Amsterdam', weekday: 'long' })

        // Greeting system
        greetUser()
        headerText.addEventListener('click', () => {
            greetUser()
            setTimeout(() => {
                headerGreeting.dataset.state = 'hidden'
                headerText.dataset.state = 'visible'
            }, 2000)
        })
        function greetUser() {
            headerGreeting.dataset.state = 'visible'
            headerText.dataset.state = 'hidden'
            const greetingsByHour = [
                [22, ...i18n('greetings.lateNight').split(';'), 'Bonsoir#', 'Buenas noches#', 'Guten Abend#'], // 22:00 - 23:59
                [18, ...i18n('greetings.evening').split(';'), 'Bonsoir#', 'Buenas tardes#', 'Guten Abend#'], // 18:00 - 21:59
                [12, ...i18n('greetings.afternoon').split(';'), 'Bonjour#', 'Buenas tardes!', 'Guten Mittag#'], // 12:00 - 17:59
                [6, ...i18n('greetings.morning').split(';'), 'Bonjour#', 'Buenos días#', 'Guten Morgen#'], // 6:00 - 11:59
                [0, ...i18n('greetings.earlyNight').split(';'), 'Bonjour#', 'Buenos días#', 'Guten Morgen#'] // 0:00 - 5:59
            ],
                greetingsGeneric = [...i18n('greetings.generic').split(';'), 'Yooo!', 'Hello, handsome.', 'Guten Tag#', 'Greetings#', 'Hey#', 'Hoi#', '¡Hola!', 'Ahoy!', 'Bonjour#', 'Buongiorno#', 'Namasté#', 'Howdy!', 'G\'day!', 'Oi mate!', 'Aloha!', 'Ciao!', 'Olá!', 'Salut#', 'Saluton!', 'Hei!', 'Hej!', 'Salve!', 'Bom dia#', 'Zdravo!', 'Shalom!', 'Γεια!', 'Привіт!', 'Здравейте!', '你好！', '今日は!', '안녕하세요!']

            let possibleGreetings = []
            for (let i = 0; i < greetingsByHour.length; i++) {
                const e = greetingsByHour[i]
                if (now.getHours() >= e[0]) {
                    e.shift()
                    possibleGreetings.push(...e, ...e, ...e) // hour-bound greetings have 3x more chance than generic ones
                    break
                }
            }
            possibleGreetings.push(...greetingsGeneric)
            const punctuation = Math.random() < 0.7 ? '.' : '!',
                greeting = possibleGreetings[Math.floor(Math.random() * possibleGreetings.length)].replace('#', punctuation).replace('%s', formattedWeekday).replace('%n', firstName)
            if (locale === 'fr-FR') greeting.replace(/\s*(!|\?)+/, ' $1')
            headerGreeting.innerText = greeting.slice(0, -1)
            headerGreeting.dataset.lastLetter = greeting.slice(-1)
        }

        updateHeaderButtons = () => {
            // Update the week offset buttons accordingly
            let todayResetOffset = document.querySelector('#st-start-today-offset-zero')
            let todayDecreaseOffset = document.querySelector('#st-start-today-offset-minus')
            let todayIncreaseOffset = document.querySelector('#st-start-today-offset-plus')
            if (todayDecreaseOffset && todayIncreaseOffset) {
                todayResetOffset.disabled = (agendaView === 'week' && agendaDayOffset < 7) || agendaDayOffset === (todayDate.getDay() || 7) - 1
                todayDecreaseOffset.disabled = (agendaView === 'week' && Math.floor(agendaDayOffset / 7) * 7 <= 0) || agendaDayOffset <= 0
                todayIncreaseOffset.disabled = (agendaView === 'week' && Math.floor(agendaDayOffset / 7) * 7 >= 35) || agendaDayOffset >= 41
            }
        }

        updateHeaderText = () => {
            // Update the header text accordingly

            switch (agendaView) {
                case 'week':
                    if (agendaStartDate.getMonth() === agendaEndDate.getMonth())
                        headerText.innerText = `${i18n('dates.week')} ${agendaStartDate.getWeek()} (${agendaStartDate.toLocaleDateString(locale, { timeZone: 'Europe/Amsterdam', month: 'long' })})`
                    else
                        headerText.innerText = `${i18n('dates.week')} ${agendaStartDate.getWeek()} (${agendaStartDate.toLocaleDateString(locale, { timeZone: 'Europe/Amsterdam', month: 'short' })}–${agendaEndDate.toLocaleDateString(locale, { timeZone: 'Europe/Amsterdam', month: 'short' })})`
                    break;

                case 'workweek':
                    if (agendaStartDate.getMonth() === agendaEndDate.getMonth())
                        headerText.innerText = `${i18n('dates.workweek')} ${agendaStartDate.getWeek()} (${agendaStartDate.toLocaleDateString(locale, { timeZone: 'Europe/Amsterdam', month: 'long' })})`
                    else
                        headerText.innerText = `${i18n('dates.workweek')} ${agendaStartDate.getWeek()} (${agendaStartDate.toLocaleDateString(locale, { timeZone: 'Europe/Amsterdam', month: 'short' })}–${agendaEndDate.toLocaleDateString(locale, { timeZone: 'Europe/Amsterdam', month: 'short' })})`
                    break;

                default:
                    headerText.innerText = agendaStartDate.toLocaleDateString(locale, { timeZone: 'Europe/Amsterdam', weekday: 'long', month: 'long', day: 'numeric' })
                    break;
            }

            if ((agendaView.slice(-3) !== 'day' && agendaDayOffset < 7) || agendaDayOffset === (todayDate.getDay() || 7) - 1) {
                headerText.classList.remove('de-emphasis')
            } else {
                headerText.classList.add('de-emphasis')
            }

            headerText.dataset.lastLetter = '.'
        }

        // Buttons for moving one day backwards, moving to today's date, and moving one day forwards.
        let todayResetOffset = element('button', 'st-start-today-offset-zero', headerButtons, { class: 'st-button icon', 'data-icon': '', title: i18n('Vandaag'), disabled: true })
        todayResetOffset.addEventListener('click', () => {
            let newOffset = agendaDayOffset
            if ((agendaView.slice(-3) !== 'day' && agendaDayOffset < 7) || agendaDayOffset === (todayDate.getDay() || 7) - 1) return
            newOffset = (todayDate.getDay() || 7) - 1
            moveSchedule(newOffset)
        })
        let todayDecreaseOffset = element('button', 'st-start-today-offset-minus', headerButtons, { class: 'st-button icon', 'data-icon': '', title: i18n('Achteruit') })
        todayDecreaseOffset.addEventListener('click', () => {
            let newOffset = agendaDayOffset
            if (agendaView === 'day') {
                newOffset -= 1 // For one-day view, decrease offset by 1
            } else if (agendaView.includes('day')) {
                newOffset -= Number(agendaView.slice(0, 1)) || 1 // For multi-day view, decrease the offset by the number of days
            } else if (Math.floor(agendaDayOffset / 7) * 7 > 0) {
                newOffset -= 7 // For week view, decrease the offset by 7 only if that would be possible
            }
            moveSchedule(newOffset)
        })
        let todayIncreaseOffset = element('button', 'st-start-today-offset-plus', headerButtons, { class: 'st-button icon', 'data-icon': '', title: i18n('Vooruit') })
        todayIncreaseOffset.addEventListener('click', () => {
            let newOffset = agendaDayOffset
            if (agendaView === 'day') {
                newOffset += 1 // For one-day view, increase offset by 1
            } else if (agendaView.includes('day')) {
                newOffset += Number(agendaView.slice(0, 1)) || 1 // For multi-day view, increase the offset by the number of days
            } else if (Math.floor(agendaDayOffset / 7) * 7 < 35) {
                newOffset += 7 // For week view, increase the offset by 7 only if that would be possible
            }
            moveSchedule(newOffset)
        })

        function moveSchedule(newOffset) {
            const oldOffset = agendaDayOffset
            if (newOffset > 41) newOffset = 41
            if (newOffset < 0) newOffset = 0
            agendaDayOffset = newOffset
            agendaDayOffsetChanged = true

            if (schedule.dataset.navigate !== 'still') {
                schedule.dataset.navigate = 'still'
                renderSchedule()
            } else if (newOffset > oldOffset) {
                schedule.dataset.navigate = 'forw'
                setTimeout(renderSchedule, 70)
                setTimeout(() => schedule.dataset.navigate = 'still', 200)
            } else if (newOffset < oldOffset) {
                schedule.dataset.navigate = 'back'
                setTimeout(renderSchedule, 70)
                setTimeout(() => schedule.dataset.navigate = 'still', 200)
            } else { renderSchedule() }
        }

        let todayViewModeDropdown = element('button', 'st-start-today-view', headerButtons, { class: 'st-segmented-control' })
            .createDropdown(
                {
                    'day': i18n('dates.day'), // 1 day
                    ...Object.fromEntries([2, 3, 4, 5].map(num => [`${num}day`, i18n('dates.nDays', { num })])), // 2, 3, 4, 5 days
                    'workweek': i18n('dates.workweek'), // workweek
                    'week': i18n('dates.week') // week
                },
                agendaView,
                selectedCallback,
                clickCallback
            )

        function clickCallback(currentValue) {
            if (currentValue === 'day') todayViewModeDropdown.changeValue('workweek')
            else todayViewModeDropdown.changeValue('day')
        }

        function selectedCallback(newValue) {
            agendaView = newValue
            saveToStorage('start-schedule-view-stored', newValue, 'local')
            if (newValue === 'day') {
                widgetsCollapsed = window.innerWidth < 1100 || widgetsCollapsedSetting
                if (widgets.classList.contains('editing')) widgetsCollapsed = false
                verifyDisplayMode()
                if (document.querySelector('.menu-host')?.classList.contains('collapsed-menu') && window.innerWidth > 1200) document.querySelector('.menu-footer>a')?.click()
                listViewEnabled = listViewEnabledSetting
            } else {
                widgetsCollapsed = true
                if (widgets.classList.contains('editing')) widgetsCollapsed = false
                verifyDisplayMode()
                if (!document.querySelector('.menu-host')?.classList.contains('collapsed-menu')) document.querySelector('.menu-footer>a')?.click()
                listViewEnabled = false
            }
            renderSchedule()
            updateHeaderButtons()
            updateHeaderText()
        }

        // Controls (bottom right of page)
        setTimeout(() => widgetControlsWrapper.classList.remove('st-visible'), 2000)

        // Zoom buttons
        let zoomOut = element('button', 'st-start-edit-zoom-out', widgetControls, { class: 'st-button icon', 'data-icon': '', title: i18n('scaleDown') })
        let zoomIn = element('button', 'st-start-edit-zoom-in', widgetControls, { class: 'st-button icon', 'data-icon': '', title: i18n('scaleUp') })
        zoomOut.addEventListener('click', () => {
            zoomSetting -= .1
            effectuateZoom(zoomOut)
        })
        zoomIn.addEventListener('click', () => {
            zoomSetting += .1
            effectuateZoom(zoomIn)
        })
        function effectuateZoom(source) {
            zoomSetting = Math.min(Math.max(0.4, zoomSetting), 4)
            saveToStorage('start-zoom', zoomSetting, 'local')
            document.querySelector('#st-start-ticks-wrapper').setAttribute('style', `--hour-zoom: ${zoomSetting}`)
            document.querySelector('#st-start-schedule-wrapper').setAttribute('style', `--hour-zoom: ${zoomSetting}`)
            if (source) {
                let ghost = element('span', null, document.body, { class: 'st-number-ghost', innerText: `${Math.round(zoomSetting * 100)}%`, style: `top: ${source.getBoundingClientRect().top}px; left: ${source.getBoundingClientRect().left}px;` })
                setTimeout(() => ghost.remove(), 1000)
            }
        }

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
            const tooltip = element('div', 'st-start-widgets-edit-tooltip', document.body, { class: 'st-hidden', innerText: "Onder deze knop kun je het widgetpaneel compleet aanpassen." })
            setTimeout(() => tooltip.classList.remove('st-hidden'), 200)
            invokeEditWidgets.addEventListener('click', () => {
                tooltip.classList.add('st-hidden')
                saveToStorage('start-widgets-edit-known', true, 'local')
            })
            setTimeout(() => {
                tooltip.classList.add('st-hidden')
                saveToStorage('start-widgets-edit-known', true, 'local')
            }, 20000)
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
                renderSchedule()
            })

            const events = await MagisterApi.events()

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
        todayCollapseWidgets = element('button', 'st-start-collapse-widgets', widgetControls, { class: 'st-button icon', 'data-icon': '', title: i18n('collapseWidgets') })
        todayCollapseWidgets.addEventListener('click', () => {
            widgetsCollapsed = !widgetsCollapsed
            if (widgets.classList.contains('editing')) widgetsCollapsed = false
            widgetsCollapsedSetting = widgetsCollapsed
            saveToStorage('start-widgets-collapsed', widgetsCollapsedSetting, 'local')
            verifyDisplayMode()
        })

        if (widgetsCollapsed && !(await getFromStorage('start-widgets-collapsed-known', 'local') ?? false)) {
            const tooltip = element('div', 'st-start-widgets-collapsed-tooltip', document.body, { class: 'st-hidden', innerText: "Het widgetpaneel is ingeklapt. Gebruik de knop met de pijltjes om hem weer uit te klappen." })
            setTimeout(() => tooltip.classList.remove('st-hidden'), 200)
            todayCollapseWidgets.addEventListener('click', () => {
                tooltip.classList.add('st-hidden')
                saveToStorage('start-widgets-collapsed-known', true, 'local')
            })
            setTimeout(() => {
                tooltip.classList.add('st-hidden')
                saveToStorage('start-widgets-collapsed-known', true, 'local')
            }, 20000)
        }

        // Allow for keyboard navigation
        document.addEventListener('keydown', event => {
            if (event.key === 'ArrowLeft' && !todayDecreaseOffset.disabled) todayDecreaseOffset.click()
            else if (event.key === 'ArrowRight' && !todayIncreaseOffset.disabled) todayIncreaseOffset.click()
        })
    }

    async function todaySchedule() {
        let interval

        now = new Date()
        agendaDayOffset = Math.floor((todayDate - gatherStart) / 86400000)

        const events = await MagisterApi.events()

        // Display error if the result does not exist or if it is not an array
        if (!events || !Array.isArray(events)) {
            element('i', `st-start-fa`, schedule, { class: 'st-start-icon fa-duotone fa-calendar-circle-exclamation' })
            element('span', `st-start-disclaimer`, schedule, { class: 'st-start-disclaimer', innerText: i18n('error') })
            return
        }

        // Create an array with 42 days (6 weeks) containing events of those days
        let agendaDays = []
        for (let i = 0; i < 42; i++) {
            const date = new Date(new Date(gatherStart.getTime()).setDate(gatherStart.getDate() + i))
            const eventsOfDay =
                events.filter(item => {
                    const startDate = new Date(item.Start)
                    return (startDate - date) < 86400000 && (startDate - date) >= 0 // Add all events that are on this date to this element
                })?.map(item => {
                    const endDate = new Date(item.Einde)
                    if (item.DuurtHeleDag) {
                        item.Einde = new Date(new Date(endDate).setTime(endDate.getTime() + 86399000)).toISOString()
                    }
                    return item
                }) || []

            let eventsOfDayWithCollision = checkCollision(eventsOfDay)

            agendaDays.push({
                date: new Date(date),
                today: (date - todayDate) === 0, // Days have the highest relevancy when they match the current date.
                tomorrow: (date - todayDate) === 86400000, // Days have increased relevancy when they match tomorrow's date.
                irrelevant: eventsOfDayWithCollision.length < 1 || date < todayDate, // Days are irrelevant when they are empty or in the past.
                events: eventsOfDayWithCollision
            })
        }

        // Start rendering
        renderSchedule = async () => {

            switch (agendaView) {
                case 'week':
                    // When in week view, the first day shown should be the Monday of the selected week. The last day shown should be 6 days later.
                    agendaStartDate = new Date(new Date(gatherStart).setDate(gatherStart.getDate() + Math.min(Math.max(0, Math.floor(agendaDayOffset / 7) * 7), 41)))
                    agendaEndDate = new Date(new Date(agendaStartDate).setDate(agendaStartDate.getDate() + 6))
                    schedule.classList.add('week-view')
                    schedule.classList.remove('list-view')
                    break;

                case 'workweek':
                    // When in week view, the first day shown should be the Monday of the selected week. The last day shown should be 6 days later.
                    agendaStartDate = new Date(new Date(gatherStart).setDate(gatherStart.getDate() + Math.min(Math.max(0, Math.floor(agendaDayOffset / 7) * 7), 41)))
                    agendaEndDate = new Date(new Date(agendaStartDate).setDate(agendaStartDate.getDate() + 4))
                    schedule.classList.add('week-view')
                    schedule.classList.remove('list-view')
                    break;

                default:
                    // When in day view, the first day shown should be today. The amount of days set to be shown dictates the last day shown.
                    agendaStartDate = new Date(new Date(gatherStart).setDate(gatherStart.getDate() + agendaDayOffset))
                    if (listViewEnabled) {
                        schedule.classList.add('list-view')
                    }

                    let todayIndex = agendaDays.findIndex(item => item.today)
                    let todayEvents = agendaDays[todayIndex].events
                    let nextRelevantDayIndex = agendaDays.findIndex((item, i) => item.events.length > 0 && i > todayIndex) || todayIndex || 0
                    let nextRelevantDayEvents = agendaDays[nextRelevantDayIndex]?.events
                    let todayEndTime = new Date(Math.max(...todayEvents.filter(item => !(item.Status == 4 || item.Status == 5)).map(item => new Date(item.Einde))))

                    // Jump to the next relevant day if no (more) events will take place today (given the user hasn't opted out)
                    if (nextRelevantDayIndex > todayIndex && !agendaDayOffsetChanged && (new Date() >= todayEndTime || todayEvents.length < 1) && showNextDaySetting && agendaView === 'day' && agendaDayOffset === (todayDate.getDay() || 7) - 1 && nextRelevantDayEvents.length > 0) {
                        agendaDayOffset = nextRelevantDayIndex
                        agendaStartDate = new Date(new Date(gatherStart).setDate(gatherStart.getDate() + agendaDayOffset))
                        notify('snackbar', `${i18n('toasts.jumpedToNextRelevantDay')} (${agendaStartDate.toLocaleDateString(locale, { timeZone: 'Europe/Amsterdam', weekday: 'long', month: 'long', day: 'numeric' })})`)

                        setTimeout(() => { if (document.querySelector('#st-start-today-offset-zero')) document.querySelector('#st-start-today-offset-zero').classList.add('emphasise') }, 200)
                        schedule.dataset.navigate = 'jumpforw'
                        setTimeout(() => schedule.dataset.navigate = 'still', 600)
                    }

                    if (agendaView === 'day') agendaEndDate = agendaStartDate
                    else agendaEndDate = new Date(new Date(agendaStartDate).setDate(agendaStartDate.getDate() + Number(agendaView.slice(0, 1)) - 1))

                    schedule.classList.remove('week-view')
                    break;
            }

            now = new Date()

            clearInterval(interval)

            let ticksWrapper = element('div', 'st-start-ticks-wrapper', schedule, { style: `--hour-zoom: ${zoomSetting || 1}` })
            let scheduleWrapper = element('div', 'st-start-schedule-wrapper', schedule, { style: `--hour-zoom: ${zoomSetting || 1}`, innerText: '' })

            // Create tick marks for schedule view
            if (!listViewEnabled) {
                for (let i = 0; i <= 24; i += 0.5) {
                    let hourTick = element('div', `st-start-tick-${i}h`, ticksWrapper, { class: `st-start-tick ${Number.isInteger(i) ? 'whole' : 'half'}`, style: `--relative-start: ${i}` })
                }
            }

            agendaDays.forEach((day, i, a) => {
                // If the date falls outside the agenda range, don't proceed.
                if (day.date < agendaStartDate || day.date > agendaEndDate) return

                // Create a column for the day
                const column = element('div', `st-start-col-${i}`, scheduleWrapper, {
                    class: 'st-start-col',
                    'data-today': day.today,
                    'data-tomorrow': day.tomorrow,
                    'data-irrelevant': day.irrelevant
                })
                const columnLabel = element('div', `st-start-col-${i}-head`, column, { class: 'st-start-col-label' }),
                    columnLabelSpan = element('span', `st-start-col-${i}-head-span`, columnLabel, { innerText: day.date.toLocaleDateString(locale, { timeZone: 'Europe/Amsterdam', weekday: 'long' }) }),
                    columnLabelDiv = element('div', `st-start-col-${i}-head-div`, columnLabel, { innerText: day.date.toLocaleDateString(locale, { timeZone: 'Europe/Amsterdam', day: 'numeric' }) })
                if (day.date.getDate() === 1) element('span', `st-start-col-${i}-head-span-2`, columnLabel, { innerText: day.date.toLocaleDateString(locale, { timeZone: 'Europe/Amsterdam', month: 'long' }) })
                if (day.date.getDate() === 1 && day.date.getMonth() === 0) element('span', `st-start-col-${i}-head-span-3`, columnLabel, { innerText: day.date.toLocaleDateString(locale, { timeZone: 'Europe/Amsterdam', year: 'numeric' }) })

                // Loop through all events of the day
                day.events.forEach((item, i) => {
                    let ongoing = (new Date(item.Start) < now && new Date(item.Einde) > now)

                    // Render the event element
                    // TODO: BUG: overlap is quite broken!
                    // TODO: BUG: all-day events show up as normal ones, but with a duration of 0.
                    let eventElement = element('button', `st-start-event-${item.Id}`, column, {
                        class: 'st-start-event',
                        'data-2nd': item.Omschrijving,
                        'data-temporal-type': 'ongoing-check',
                        'data-temporal-start': item.Start,
                        'data-temporal-end': item.Einde,
                        'data-start-connecting': day.events.some(el => el.Einde === item.Start),
                        'data-end-connecting': day.events.some(el => el.Start === item.Einde),
                        style: `--relative-start: ${new Date(item.Start).getHoursWithDecimals()}; --duration: ${new Date(item.Einde).getHoursWithDecimals() - new Date(item.Start).getHoursWithDecimals()}; --cols: ${item.cols.length}; --cols-before: ${item.colsBefore.length};`,
                        title: [
                            item.Omschrijving || 'Geen omschrijving',
                            item.Lokatie || item.Lokalen?.map(e => e.Naam).join(', ') || 'Geen locatie',
                            item.DuurtHeleDag ? 'Hele dag' : new Date(item.Start).getFormattedTime() + '–' + new Date(item.Einde).getFormattedTime()
                        ].join('\n')
                    })
                    let egg = eggs.find(egg => egg.location === 'personalEventTitle' && egg.matchRule === 'startsWith' && item.Omschrijving.startsWith(egg.input))
                    if (egg && egg.type === 'dialog') {
                        eventElement.addEventListener('click', () => notify('dialog', egg.output))
                    } else {
                        eventElement.addEventListener('click', () => window.location.hash = `#/agenda/huiswerk/${item.Id}`)
                    }

                    // Parse and array-ify the subjects, the teachers and the locations
                    let subjectNames = item.Vakken?.map((e, i, a) => {
                        if (i === 0) return e.Naam.charAt(0).toUpperCase() + e.Naam.slice(1)
                        return e.Naam
                    }) || [item.Omschrijving]
                    let teacherNames = item.Docenten?.map((e, i, a) => {
                        return (teacherNamesSetting[e.Docentcode] || e.Naam) + ` (${e.Docentcode})`
                    }) || []
                    let locationNames = item.Lokalen?.map(e => e.Naam) || [item.Lokatie]
                    if (subjectNames.length < 1 && item.Omschrijving) subjectNames.push(item.Omschrijving)
                    if (locationNames.length < 1 && item.Lokatie) locationNames.push(item.Lokatie)

                    // Render the school hour label
                    let schoolHours = (item.LesuurVan === item.LesuurTotMet) ? item.LesuurVan : `${item.LesuurVan}-${item.LesuurTotMet}`
                    let eventSchoolHours = element('div', `st-start-event-${item.Id}-school-hours`, eventElement, { class: 'st-start-event-school-hours', innerText: schoolHours })
                    if (item.Type === 1) {
                        eventSchoolHours.classList.add('icon')
                        eventSchoolHours.innerText = '' // Icon: user-lock
                    }
                    if (item.Type === 16) {
                        eventSchoolHours.classList.add('icon')
                        eventSchoolHours.innerText = '' // Icon: user-edit
                    }
                    if (!eventSchoolHours.innerText) {
                        eventSchoolHours.classList.add('icon')
                        eventSchoolHours.innerText = '' // Icon: calendar-day
                    }

                    // Cancelled label
                    if (item.Status == 4 || item.Status == 5) {
                        eventElement.classList.add('cancelled')
                        element('div', `st-start-event-${item.Id}-cancelled`, eventElement, { class: 'st-start-event-cancelled', title: "Dit blok vervalt mogelijk.\nControleer alsjeblieft even je Magister-app of de pagina 'Agenda'!" })
                    }

                    // Render the subject and location label
                    if (listViewEnabled) {
                        let eventSubject = element('span', `st-start-event-${item.Id}-subject`, eventElement, { class: 'st-start-event-subject st-bold', innerText: item.Lokatie ? `${item.Omschrijving} (${item.Lokatie})` : item.Omschrijving })
                    } else {
                        let eventSubjectWrapper = element('span', `st-start-event-${item.Id}-subject-wrapper`, eventElement, { class: 'st-start-event-subject' })
                        let eventSubject = element('b', null, eventSubjectWrapper, { class: 'st-bold', innerText: subjectNames.join(', ') })
                        if (locationNames?.join(', ')?.length > 0) {
                            let eventLocation = document.createTextNode('  (' + locationNames.join(', ') + ')')
                            eventSubjectWrapper.appendChild(eventLocation)
                        }
                    }

                    let row = element('div', `st-start-event-${item.Id}-row1`, eventElement, { class: 'st-list-row' })

                    // Render the teacher label
                    if (!listViewEnabled && item.Docenten[0]) {
                        let eventTeacher = element('span', `st-start-event-${item.Id}-teacher`, row, { class: 'st-start-event-teacher', innerText: teacherNames.join(', ') })
                        if (eventTeacher.innerText.includes('jeb_')) eventTeacher.setAttribute('style', 'animation: rainbow 5s linear 0s infinite; color: var(--st-accent-warn)')
                        if (eventTeacher.innerText.includes('dinnerbone')) eventTeacher.style.scale = '1 -1'
                    }

                    // Render the time label
                    let eventTime = element('span', `st-start-event-${item.Id}-time`, row, { class: 'st-start-event-time', innerText: item.DuurtHeleDag ? 'Hele dag' : new Date(item.Start).getFormattedTime() + '–' + new Date(item.Einde).getFormattedTime() })

                    // Parse and render any chips
                    let chips = getEventChips(item)

                    let eventChipsWrapper = element('div', `st-start-event-${item.Id}-chips`, eventElement, { class: 'st-chips-wrapper' })
                    chips.forEach(chip => {
                        let chipElement = element('span', `st-start-event-${item.Id}-chip-${chip.name}`, eventChipsWrapper, { class: `st-chip ${chip.type || 'info'}`, innerText: chip.name })
                    })
                })

                // Display 'no events' if necessary
                if (day.events?.length < 1 && !listViewEnabled && agendaView === 'day') {
                    let seed = cyrb128(String(day.date.getTime()))
                    element('i', `st-start-col-${i}-fa`, column, {
                        class: `st-start-icon fa-duotone ${['fa-island-tropical', 'fa-snooze', 'fa-alarm-snooze', 'fa-house-day', 'fa-umbrella-beach', 'fa-bed', 'fa-face-smile-wink', 'fa-house-person-return', 'fa-house-chimney-user', 'fa-house-user', 'fa-house-heart', 'fa-calendar-heart', 'fa-skull', 'fa-rocket-launch', 'fa-bath', 'fa-bowling-ball-pin', 'fa-poo-storm', 'fa-block-question', 'fa-crab'].random(seed)}`
                    })
                    element('span', `st-start-col-${i}-disclaimer`, column, {
                        class: 'st-start-disclaimer',
                        innerText: events.length === 0
                            ? i18n('noEventsUntilDate', { date: gatherEnd.toLocaleDateString(locale, { day: 'numeric', month: 'long' }), dateShort: gatherEnd.toLocaleDateString(locale, { day: 'numeric', month: 'short' }) })
                            : day.today
                                ? i18n('noEventsToday')
                                : i18n('noEvents')
                    })
                }

                // Ensure a nice scrolling position if the date shown is not today
                if (schedule.scrollTop === 0 && (agendaView.slice(-3) === 'day' || (listViewEnabledSetting && agendaView.slice(-3) !== 'day')) && !agendaDayOffsetChanged) {
                    schedule.scrollTop = zoomSetting * 115 * 8 // Default scroll to 08:00
                    if (column.querySelector('.st-start-event:last-of-type')) column.querySelector('.st-start-event:last-of-type').scrollIntoView({ block: 'nearest', behavior: 'instant' }) // If there are events today, ensure the last event is visible.
                    if (column.querySelector('.st-start-event')) column.querySelector('.st-start-event').scrollIntoView({ block: 'nearest', behavior: 'instant' }) // If there are events today, ensure the first event is visible.
                    schedule.scrollTop -= 3 // Scroll back a few pixels to ensure the border looks nice.
                }

                if (!listViewEnabled && day.today) {
                    // Add a marker of the current time (if applicable) and scroll to it if the scroll position is 0.
                    const currentTimeMarker = element('div', `st-start-now`, column, { 'data-temporal-type': 'style-hours' }),
                        currentTimeMarkerLabel = element('div', `st-start-now-label`, column, { 'data-temporal-type': 'style-hours', innerText: i18n('dates.nowBrief')?.toUpperCase() })
                    updateTemporalBindings()
                    if (schedule.scrollTop === 0 && (agendaView.slice(-3) === 'day' || (listViewEnabledSetting && agendaView.slice(-3) !== 'day'))) {
                        schedule.scrollTop = zoomSetting * 115 * 8 // Default scroll to 08:00
                        if (column.querySelector('.st-start-event:last-of-type')) column.querySelector('.st-start-event:last-of-type').scrollIntoView({ block: 'nearest', behavior: 'instant' }) // If there are events today, ensure the last event is visible.
                        if (column.querySelector('.st-start-event')) column.querySelector('.st-start-event').scrollIntoView({ block: 'nearest', behavior: 'instant' }) // If there are events today, ensure the first event is visible.
                        currentTimeMarker.scrollIntoView({ block: 'nearest', behavior: 'smooth' }) // Ensure the current time is visible (with a bottom margin set in CSS)
                        schedule.scrollTop -= 3 // Scroll back a few pixels to ensure the border looks nice.
                    }
                }

                if (agendaView.slice(-3) === 'day') {
                    widgetsCollapsed = window.innerWidth < 1100 || widgetsCollapsedSetting
                    if (widgets.classList.contains('editing')) widgetsCollapsed = false
                    verifyDisplayMode()
                    if (document.querySelector('.menu-host')?.classList.contains('collapsed-menu') && window.innerWidth > 1200) document.querySelector('.menu-footer>a')?.click()
                    listViewEnabled = listViewEnabledSetting
                } else {
                    widgetsCollapsed = true
                    if (widgets.classList.contains('editing')) widgetsCollapsed = false
                    verifyDisplayMode()
                    if (!document.querySelector('.menu-host')?.classList.contains('collapsed-menu')) document.querySelector('.menu-footer>a')?.click()
                    listViewEnabled = false
                }
            })

            updateHeaderButtons()
            updateHeaderText()
        }
        renderSchedule()

        updateTemporalBindings()
        updateHeaderButtons()

        setTimeout(() => {
            updateHeaderText()
            if (document.getElementById('st-start-header-greeting')) document.getElementById('st-start-header-greeting').dataset.state = 'hidden'
            if (document.getElementById('st-start-header-text')) document.getElementById('st-start-header-text').dataset.state = 'visible'
        }, 2000)
    }

    async function todayWidgets() {
        widgets.dataset.working = true
        widgetsList.innerText = ''

        editor.classList.add('st-hidden')

        let widgetsProgress = element('div', 'st-start-widget-progress', widgets, { class: 'st-progress-bar' })
        let widgetsProgressValue = element('div', 'st-start-widget-progress-value', widgetsProgress, { class: 'st-progress-bar-value indeterminate' })
        let widgetsProgressText = element('span', 'st-start-widget-progress-text', widgets, { class: 'st-subtitle', innerText: i18n('loadingWidgets') })

        now = new Date()

        widgetFunctions = {
            logs: {
                title: i18n('widgets.logs'),
                disclaimer: i18n('widgetDisclaimer'),
                types: ['Tegel', 'Lijst'],
                render: async (type, placeholder) => {
                    return new Promise(async resolve => {
                        if (placeholder) MagisterApi.useSampleData = true

                        let logs = await MagisterApi.logs()
                            .catch(() => { return reject() })

                        if (placeholder) MagisterApi.useSampleData = false

                        if (logs.length < 1) return resolve()
                        let widgetElement = element('div', 'st-start-widget-logs', null, { class: 'st-tile st-widget' })
                        let widgetTitle = element('a', 'st-start-widget-logs-title', widgetElement, { class: 'st-widget-title', innerText: i18n('widgets.logs'), 'data-amount': logs.length, href: '#/lvs-logboeken' })

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
                types: ['Tegel', 'Lijst'],
                render: async (type, placeholder) => {
                    return new Promise(async resolve => {
                        if (placeholder) MagisterApi.useSampleData = true

                        let activities = await MagisterApi.activities()
                            .catch(() => { return reject() })

                        if (placeholder) MagisterApi.useSampleData = false

                        if (activities.length < 1) return resolve()
                        let widgetElement = element('div', 'st-start-widget-activities', null, { class: 'st-tile st-widget' })
                        let widgetTitle = element('a', 'st-start-widget-activities-title', widgetElement, { class: 'st-widget-title', innerText: i18n('widgets.activities'), 'data-amount': activities.length, href: '#/elo/activiteiten' })

                        if (type === 'Lijst') {
                            return resolve(widgetElement)
                        }

                        resolve(widgetElement)
                    })
                }
            },

            grades: {
                title: i18n('widgets.grades'),
                types: ['Tegel', 'Lijst'],
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

                        if (placeholder) MagisterApi.useSampleData = true

                        let grades = await MagisterApi.grades.recent()
                            .catch(() => { return reject() })
                        let assignments = await MagisterApi.assignments.top()
                            .catch(() => { return reject() })

                        if (placeholder) MagisterApi.useSampleData = false

                        let hiddenItems = new Set((await getFromStorage('hiddenGrades', 'local') || []))

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
                                unread: new Date(item.ingevoerdOp) > Date.now() - (1000 * 60 * 60 * 24 * 7),
                                hidden: (hiddenItems.has(item.kolomId)) || (viewResult === 'sufficient' && !item.isVoldoende) || (viewResult === 'never') // Hide if hidden manually, or if insufficient and user has set widget to sufficient only, or if user has set widget to hide result.
                            }
                        )).sort((a, b) => b.date - a.date)

                        if (recentGrades.length < 1) return resolve() // Stop if no grades.

                        let widgetElement = element(placeholder ? 'div' : 'a', 'st-start-widget-grades', null, { class: 'st-tile st-widget', title: "Laatste cijfers bekijken", href: '#/cijfers' })
                        let widgetTitle = element('div', 'st-start-widget-grades-title', widgetElement, { class: 'st-widget-title', innerText: i18n('widgets.latestGrade') })
                        let widgetItemsContainer = element('div', 'st-start-widget-grades-items', widgetElement)

                        let children = []

                        if (type === 'Lijst') widgetTitle.dataset.amount = recentGrades.filter(item => item.unread).length

                        recentGrades.forEach((item, i) => {
                            const gradeElement = element('div', `st-start-widget-grades-${i}`, widgetItemsContainer, { class: 'st-start-widget-grades-item', 'data-unread': item.unread, 'data-hidden': item.hidden, 'data-assignment': item.assignment })
                            children.push(gradeElement)
                            if (i === 0) widgetElement.dataset.unread = item.unread

                            let itemRslt = element('span', `st-start-widget-grades-${i}-rslt`, gradeElement, { class: 'st-start-widget-grades-item-rslt', innerText: item.waarde, 'data-great': autoRotate == 'true' && Number(item.waarde.replace(',', '.')) > 8.9 && Number(item.waarde.replace(',', '.')) <= 10, 'data-insuf': syncedStorage['insuf-red'] === true && Number(item.waarde.replace(',', '.')) >= 1 && Number(item.waarde.replace(',', '.')) < Number(syncedStorage['suf-threshold']) })
                            let itemSubj = element('span', `st-start-widget-grades-${i}-subj`, gradeElement, { class: 'st-start-widget-grades-item-subj', innerText: item.vak.omschrijving.charAt(0).toUpperCase() + item.vak.omschrijving.slice(1) })
                            let itemInfo = element('span', `st-start-widget-grades-${i}-info`, gradeElement, { class: 'st-start-widget-grades-item-info', innerText: item.assignment ? item.omschrijving : `${item.omschrijving} (${item.weegfactor || 0}×)` })
                            let itemDate = element('span', `st-start-widget-grades-${i}-date`, gradeElement, { class: 'st-start-widget-grades-item-date', 'data-temporal-type': 'timestamp', 'data-temporal-start': item.date })
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

                            widgetItemsContainer.scroll((targetIndex) * children[0].clientWidth, 0)
                            widgetElement.dataset.unread = children[targetIndex]?.dataset.unread || false
                            visibleChildIndex = targetIndex

                            if (!document.querySelector(`#st-start-widget-grades-scroll-pagn>div:nth-child(${targetIndex + 1})`) || !document.querySelector('#st-start-widget-grades-scroll-pagn>div')) return

                            document.querySelectorAll('#st-start-widget-grades-scroll-pagn>div').forEach(d => d.dataset.current = false)
                            document.querySelectorAll(`#st-start-widget-grades-scroll-pagn>div:nth-child(${targetIndex + 1})`).forEach(d => d.dataset.current = true)
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
                types: ['Tegel', 'Lijst'],
                render: async (type, placeholder) => {
                    return new Promise(async resolve => {
                        if (placeholder) MagisterApi.useSampleData = true

                        let unreadMessages = await MagisterApi.messages()
                            .catch(() => { return reject() })

                        if (placeholder) MagisterApi.useSampleData = false

                        if (unreadMessages.length < 1) return resolve()
                        let widgetElement = element('div', 'st-start-widget-messages', null, { class: 'st-tile st-widget' })
                        let widgetTitle = element('a', 'st-start-widget-messages-title', widgetElement, { class: 'st-widget-title', innerText: i18n('widgets.messages'), 'data-amount': unreadMessages.length, href: '#/berichten' })

                        if (type === 'Lijst') {
                            return resolve(widgetElement)
                        }

                        unreadMessages.forEach(item => {
                            let messageElement = element('a', `st-start-widget-messages-${item.id}`, widgetElement, { class: 'st-list-item', href: `#/berichten` })

                            let row1 = element('span', `st-start-widget-messages-${item.id}-row1`, messageElement, { class: 'st-list-row' })
                            let messageSender = element('span', `st-start-widget-messages-${item.id}-title`, row1, { class: 'st-list-title', innerText: item.afzender.naam })
                            let messageDate = element('span', `st-start-widget-messages-${item.id}-date`, row1, {
                                class: 'st-list-timestamp',
                                'data-temporal-type': 'timestamp', 'data-temporal-start': item.verzondenOp
                            })

                            let row2 = element('span', `st-start-widget-messages-${item.id}-row2`, messageElement, { class: 'st-list-row' })
                            let messageSubject = element('div', `st-start-widget-messages-${item.id}-content`, row2, { class: 'st-list-content', innerText: item.onderwerp })

                            let chips = []
                            if (item.heeftPrioriteit) chips.push({ name: i18n('chips.important'), type: 'warn' })
                            if (item.heeftBijlagen) chips.push({ name: i18n('chips.attachments'), type: 'info' })

                            let messageChipsWrapper = element('div', `st-start-widget-messages-${item.id}-chips`, row2, { class: 'st-chips-wrapper' })
                            chips.forEach(chip => {
                                let chipElement = element('span', `st-start-widget-messages-${item.id}-chip-${chip.name}`, messageChipsWrapper, { class: `st-chip ${chip.type || 'info'}`, innerText: chip.name })
                            })
                        })

                        resolve(widgetElement)
                    })
                }
            },

            homework: {
                title: i18n('widgets.homework'),
                disclaimer: i18n('widgetDisclaimer'),
                types: ['Tegel', 'Lijst'],
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
                        const filterOption = await getFromStorage('start-widget-hw-filter', 'local') || 'incomplete'

                        if (placeholder) MagisterApi.useSampleData = true

                        let events = await MagisterApi.events()
                            .catch(() => { return reject() })

                        if (placeholder) MagisterApi.useSampleData = false

                        const homeworkEvents = events.filter(item => {
                            if (filterOption === 'incomplete')
                                return (item.Inhoud?.length > 0 && new Date(item.Einde) > new Date() && !item.Afgerond)
                            else
                                return (item.Inhoud?.length > 0 && new Date(item.Einde) > new Date())
                        })

                        if (homeworkEvents.length < 1) return resolve()
                        let widgetElement = element('div', 'st-start-widget-homework', null, { class: 'st-tile st-widget' })
                        let widgetTitle = element('div', 'st-start-widget-homework-title', widgetElement, { class: 'st-widget-title', innerText: i18n('widgets.homework'), 'data-amount': homeworkEvents.length })

                        if (type === 'Lijst') return resolve(widgetElement)

                        homeworkEvents.forEach(item => {
                            let subjectNames = item.Vakken?.map((e, i, a) => {
                                if (i === 0) return e.Naam.charAt(0).toUpperCase() + e.Naam.slice(1)
                                return e.Naam
                            }) || [item.Omschrijving]
                            if (subjectNames.length < 1 && item.Omschrijving) subjectNames.push(item.Omschrijving)

                            let eventElement = element('a', `st-start-widget-homework-${item.Id}`, widgetElement, { class: 'st-list-item', href: `#/agenda/huiswerk/${item.Id}` })

                            let row1 = element('span', `st-start-widget-homework-${item.Id}-row1`, eventElement, { class: 'st-list-row' })
                            let eventSubject = element('span', `st-start-widget-homework-${item.Id}-title`, row1, { class: 'st-list-title', innerText: subjectNames.join(', ') })
                            let eventDate = element('span', `st-start-widget-homework-${item.Id}-date`, row1, {
                                class: 'st-list-timestamp',
                                'data-temporal-type': 'timestamp', 'data-temporal-start': item.Start, 'data-temporal-end': item.Einde
                            })

                            let row2 = element('span', `st-start-widget-homework-${item.Id}-row2`, eventElement, { class: 'st-list-row' })
                            let eventContent = element('div', `st-start-widget-homework-${item.Id}-content`, row2, { class: 'st-list-content' })
                            eventContent.innerHTML = item.Inhoud.replace(/(<br ?\/?>)/gi, '') // eventContent.setHTML(item.Inhoud)
                            if (eventContent.scrollHeight > eventContent.clientHeight) eventContent.classList.add('overflow')

                            let chips = getEventChips(item)

                            let eventChipsWrapper = element('div', `st-start-widget-homework-${item.Id}-chips`, row2, { class: 'st-chips-wrapper' })
                            chips.forEach(chip => {
                                let chipElement = element('span', `st-start-widget-homework-${item.Id}-chip-${chip.name}`, eventChipsWrapper, { class: `st-chip ${chip.type || 'info'}`, innerText: chip.name })
                            })
                        })

                        resolve(widgetElement)
                    })
                }
            },

            assignments: {
                title: i18n('widgets.assignments'),
                disclaimer: i18n('widgetDisclaimer'),
                types: ['Tegel', 'Lijst'],
                render: async (type, placeholder) => {
                    return new Promise(async (resolve) => {
                        if (placeholder) MagisterApi.useSampleData = true

                        let assignments = await MagisterApi.assignments.top()
                            .catch(() => { return reject() })

                        if (placeholder) MagisterApi.useSampleData = false

                        const relevantAssignments = assignments.filter(item => !item.Afgesloten && !item.IngeleverdOp)

                        if (relevantAssignments.length < 1) return resolve()
                        let widgetElement = element('div', 'st-start-widget-assignments', null, { class: 'st-tile st-widget' })
                        let widgetTitle = element('a', 'st-start-widget-assignments-title', widgetElement, { class: 'st-widget-title', innerText: i18n('widgets.assignments'), 'data-amount': relevantAssignments.length, href: '#/elo/opdrachten' })

                        if (type === 'Lijst') {
                            return resolve(widgetElement)
                        }

                        relevantAssignments.forEach(item => {
                            let assignmentElement = element('a', `st-start-widget-assignments-${item.Id}`, widgetElement, { class: 'st-list-item', href: `#/elo/opdrachten/${item.Id}` })

                            let row1 = element('span', `st-start-widget-assignments-${item.Id}-row1`, assignmentElement, { class: 'st-list-row' })
                            let assignmentTitle = element('span', `st-start-widget-assignments-${item.Id}-title`, row1, { class: 'st-list-title', innerText: item.Vak ? `${item.Titel} (${item.Vak})` : item.Titel })
                            let assignmentDate = element('span', `st-start-widget-assignments-${item.Id}-date`, row1, {
                                class: 'st-list-timestamp',
                                'data-temporal-type': 'timestamp', 'data-temporal-start': item.InleverenVoor
                            })

                            let row2 = element('span', `st-start-widget-assignments-${item.Id}-row2`, assignmentElement, { class: 'st-list-row' })
                            let assignmentContent = element('div', `st-start-widget-assignments-${item.Id}-content`, row2, { class: 'st-list-content' })
                            assignmentContent.innerHTML = item.Omschrijving?.replace(/(<br ?\/?>)/gi, '') || '' //assignmentContent.setHTML(item.Omschrijving)
                            if (assignmentContent.scrollHeight > assignmentContent.clientHeight) assignmentContent.classList.add('overflow')

                            let chips = []
                            if (item.BeoordeeldOp) chips.push({ name: i18n('chips.graded'), type: 'ok' })

                            let assignmentChipsWrapper = element('div', `st-start-widget-assignments-${item.id}-chips`, row2, { class: 'st-chips-wrapper' })
                            chips.forEach(chip => {
                                let chipElement = element('span', `st-start-widget-assignments-${item.id}-chip-${chip.name}`, assignmentChipsWrapper, { class: `st-chip ${chip.type || 'info'}`, innerText: chip.name })
                            })
                        })

                        resolve(widgetElement)
                    })
                }
            },

            digitalClock: {
                title: i18n('widgets.digitalClock'),
                disclaimer: i18n('widgetClockDisclaimer'),
                types: ['Verborgen', 'Tegel', 'Lijst'],
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

                        const widgetElement = element(placeholder ? 'div' : 'button', 'st-start-widget-digital-clock', null, { class: 'st-tile st-widget', title: "Klok in volledig scherm" })
                        const timeDisclaimer = element('p', 'st-start-widget-digital-clock-disclaimer', widgetElement, { 'data-temporal-type': 'current-time-disclaimer' })
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
                            events = await MagisterApi.events()
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

        // Draw the selected widgets in the specified order
        for (const key of widgetsOrderSetting) {
            if (!widgetFunctions?.[key]) continue

            if (!syncedStorage[`widget-${key}-type`] || ![...widgetFunctions[key].types, 'Verborgen'].includes(syncedStorage[`widget-${key}-type`])) {
                syncedStorage[`widget-${key}-type`] = widgetFunctions[key].types[0]
                saveToStorage(`widget-${key}-type`, syncedStorage[`widget-${key}-type`], 'local')
            }
            if (syncedStorage[`widget-${key}-type`] === 'Verborgen') continue

            widgetsProgressText.innerText = i18n('loadingWidget', { title: widgetFunctions[key].title })
            let widgetElement = await widgetFunctions[key].render(syncedStorage[`widget-${key}-type`])
            if (widgetElement) {
                widgetElement.dataset.renderType = syncedStorage[`widget-${key}-type`] || widgetFunctions[key].types[0]
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
            if (!widgetFunctions?.[key]) continue
            if (syncedStorage[`widget-${key}-type`] === 'Verborgen' || (!syncedStorage[`widget-${key}-type`] && widgetFunctions[key].types[0] === 'Verborgen')) {
                const widgetAddButton = element('button', `st-start-edit-${key}-add`, editorHiddenList, { class: 'st-start-editor-add', innerText: widgetFunctions[key].title, title: i18n('add') })

                let widgetElement = await widgetFunctions[key].render(syncedStorage[`widget-${key}-type`], true)
                widgetElement.dataset.renderType = widgetFunctions[key].types.filter(e => e !== 'Verborgen')[0]
                widgetElement.setAttribute('disabled', true)
                widgetElement.querySelectorAll('*').forEach(c => c.setAttribute('inert', true))
                widgetAddButton.append(widgetElement)

                widgetAddButton.addEventListener('click', () => {
                    syncedStorage[`widget-${key}-type`] = widgetFunctions[key].types.filter(e => e !== 'Verborgen')[0]
                    saveToStorage(`widget-${key}-type`, syncedStorage[`widget-${key}-type`])
                    widgetsList.innerText = ''
                    widgets.classList.remove('editing')
                    widgetControls.classList.remove('editing')
                    editWidgets()
                })
                continue
            }

            let widgetElement = await widgetFunctions[key].render(syncedStorage[`widget-${key}-type`], true)
            if (widgetElement) {
                widgetElement.dataset.renderType = syncedStorage[`widget-${key}-type`] || widgetFunctions[key].types[0]
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
                    const widgetTypeSelector = element('div', `st-start-edit-${key}-type`, editorActionRow, { class: 'st-segmented-control' })
                    if (!syncedStorage[`widget-${key}-type`] || ![...widgetFunctions[key].types, 'Verborgen'].includes(syncedStorage[`widget-${key}-type`])) {
                        syncedStorage[`widget-${key}-type`] = widgetFunctions[key].types[0]
                        saveToStorage(`widget-${key}-type`, syncedStorage[`widget-${key}-type`])
                    }
                    ([...widgetFunctions[key].types.filter(e => e !== 'Verborgen')]).forEach(type => {
                        const widgetTypeButton = element('button', `st-start-edit-${key}-type-${type}`, widgetTypeSelector, { class: 'st-button segment', innerText: i18n(type) })
                        if (syncedStorage[`widget-${key}-type`] === type) widgetTypeButton.classList.add('active')
                        widgetTypeButton.addEventListener('click', () => {
                            syncedStorage[`widget-${key}-type`] = type
                            saveToStorage(`widget-${key}-type`, syncedStorage[`widget-${key}-type`])
                            widgetTypeSelector.querySelectorAll('.st-button.segment').forEach(b => b.classList.remove('active'))
                            widgetTypeButton.classList.add('active')
                            widgetsList.innerText = ''
                            widgets.classList.remove('editing')
                            widgetControls.classList.remove('editing')
                            editWidgets(widgetElement.id)
                        })
                    })
                    const widgetHideButton = element('button', `st-start-edit-${key}-hide`, editorActionRow, { class: 'st-button tertiary', 'data-icon': '', innerText: i18n('remove'), title: i18n('removeWidget') })
                    widgetHideButton.addEventListener('click', () => {
                        syncedStorage[`widget-${key}-type`] = 'Verborgen'
                        saveToStorage(`widget-${key}-type`, syncedStorage[`widget-${key}-type`])
                        widgetsList.innerText = ''
                        widgets.classList.remove('editing')
                        widgetControls.classList.remove('editing')
                        editWidgets()
                    })

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
    }
}

function collidesWith(a, b) {
    return new Date(a.Einde) > new Date(b.Start) && new Date(a.Start) < new Date(b.Einde)
}

function checkCollision(eventArr) {
    let eventArrOut = []
    for (var i = 0; i < eventArr.length; i++) {
        eventArrOut[i] = { ...eventArr[i], cols: [], colsBefore: [] }
        for (var j = 0; j < eventArr.length; j++) {
            if (collidesWith(eventArr[i], eventArr[j])) {
                eventArrOut[i].cols.push(j)
                if (i > j) eventArrOut[i].colsBefore.push(j)
            }
        }
    }
    return eventArrOut
}

function getEventChips(event) {
    const infoTypes = {
        1: { name: i18n('chips.hw'), type: 'info' },
        2: { name: i18n('chips.pw'), type: 'important' },
        4: { name: i18n('chips.so'), type: 'important' },
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

    return chips
}