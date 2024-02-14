let events = []

// Run at start and when the URL changes
if (document.location.href.split('?')[0].endsWith('/vandaag')) today()
window.addEventListener('popstate', () => {
    if (document.location.href.split('?')[0].endsWith('/vandaag')) today()
})

// Page 'Vandaag'
async function today() {
    if (!syncedStorage['start-enabled']) return

    let widgetsCollapsedSetting = await getFromStorage('start-widgets-collapsed', 'local') ?? false,
        widgetsCollapsed = widgetsCollapsedSetting ?? false,
        zoomSetting = await getFromStorage('start-zoom', 'local') || 1,
        teacherNamesSetting = await getFromStorage('start-teacher-names') || await getFromStorage('teacher-names', 'local') || {},
        mainView = await awaitElement('div.view.ng-scope'),
        container = element('div', 'st-start', mainView, { 'data-widgets-collapsed': widgetsCollapsed }),
        header = element('div', 'st-start-header', container),
        schedule = element('div', 'st-start-schedule', container),
        widgets = element('div', 'st-start-widgets', container, { 'data-working': true }),
        widgetsList = element('div', 'st-start-widgets-list', widgets)

    const defaultOrder = ['digitalClock', 'grades', 'activities', 'messages', 'logs', 'homework', 'assignments']
    if (!(syncedStorage['widgets-order']?.length > 0) || !defaultOrder.every(key => Object.values(syncedStorage['widgets-order']).includes(key))) {
        console.info(`Changing widgets-order`, syncedStorage['widgets-order'], defaultOrder)
        syncedStorage['widgets-order'] = defaultOrder
        saveToStorage('widgets-order', syncedStorage['widgets-order'])
    }

    let todayCollapseWidgets
    let widgetFunctions
    let renderSchedule, updateHeaderButtons, updateHeaderText
    let agendaStartDate, agendaEndDate

    const daysToShowSetting = syncedStorage['start-schedule-days'] || 1
    const showExtraDaySetting = syncedStorage['start-schedule-extra-day'] ?? true
    const listViewEnabledSetting = syncedStorage['start-schedule-view'] === 'list'

    let listViewEnabled = listViewEnabledSetting

    let weekView = false // False for day view, true for week view
    let agendaDayOffset = 0 // Six weeks are capable of being shown in the agenda.

    now = new Date()

    const todayDate = new Date(new Date().setHours(0, 0, 0, 0))
    firstName = (await awaitElement("#user-menu > figure > img")).alt.split(' ')[0]

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

    todayHeader()
    todaySchedule()
    todayWidgets()

    async function todayHeader() {
        let headerText = element('span', 'st-start-header-text', header, { class: 'st-title' }),
            headerButtons = element('div', 'st-start-header-buttons', header),
            formattedWeekday = now.toLocaleString('nl-NL', { timeZone: 'Europe/Amsterdam', weekday: 'long' })

        // Greeting system
        const greetingsByHour = [
            [22, 'Goedenavond#', 'Goedenavond, nachtuil#', `Fijne ${formattedWeekday}avond#`, 'Bonsoir#', 'Buenas noches#', 'Guten Abend#'], // 22:00 - 23:59
            [18, 'Goedenavond#', `Fijne ${formattedWeekday}avond#`, 'Bonsoir#', 'Buenas tardes#', 'Guten Abend#'], // 18:00 - 21:59
            [12, 'Goedemiddag#', `Fijne ${formattedWeekday}middag#`, 'Bonjour#', 'Buenas tardes!', 'Guten Mittag#'], // 12:00 - 17:59
            [6, 'Goedemorgen#', 'Goeiemorgen#', `Fijne ${formattedWeekday}ochtend#`, 'Bonjour#', 'Buenos días#', 'Guten Morgen#'], // 6:00 - 11:59
            [0, 'Goedemorgen#', 'Goeiemorgen#', 'Goedemorgen, nachtuil#', 'Goedemorgen, vroege vogel#', `Fijne ${formattedWeekday}ochtend#`, 'Bonjour#', 'Buenos días#', 'Guten Morgen#'] // 0:00 - 5:59
        ],
            greetingsGeneric = ['Welkom#', 'Hallo!', `Welkom terug, ${firstName}#`, `Hey, ${firstName}#`, 'Welkom terug#', 'Goedendag#', 'Yooo!', 'Hello, handsome.', 'Guten Tag#', 'Greetings#', 'Hey#', 'Hoi#', '¡Hola!', 'Ahoy!', 'Bonjour#', 'Buongiorno#', 'Namasté#', 'Howdy!', 'G\'day!', 'Oi mate!', 'Aloha!', 'Ciao!', 'Olá!', 'Salut#', 'Saluton!', 'Hei!', 'Hej!', 'Salve!', 'Bom dia#', 'Zdravo!', 'Shalom!', 'Γεια!', 'Привіт!', 'Здравейте!', '你好！', '今日は!', '안녕하세요!']

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
            greeting = possibleGreetings[Math.floor(Math.random() * possibleGreetings.length)].replace('#', punctuation)
        headerText.innerText = greeting.slice(0, -1)
        headerText.dataset.lastLetter = greeting.slice(-1)

        updateHeaderButtons = () => {
            // Update the week offset buttons accordingly
            let todayResetOffset = document.querySelector('#st-start-today-offset-zero')
            let todayDecreaseOffset = document.querySelector('#st-start-today-offset-minus')
            let todayIncreaseOffset = document.querySelector('#st-start-today-offset-plus')
            if (todayDecreaseOffset && todayIncreaseOffset) {
                todayResetOffset.disabled = (weekView && agendaDayOffset < 7) || agendaDayOffset === (todayDate.getDay() || 7) - 1
                todayResetOffset.dataset.icon = todayResetOffset.disabled ? '' : ''
                todayDecreaseOffset.disabled = (weekView && Math.floor(agendaDayOffset / 7) * 7 <= 0) || agendaDayOffset <= 0
                todayIncreaseOffset.disabled = (weekView && Math.floor(agendaDayOffset / 7) * 7 >= 35) || agendaDayOffset >= 41
            }
        }

        updateHeaderText = () => {
            // Update the header text accordingly
            if (weekView) {
                if (agendaStartDate.getMonth() === agendaEndDate.getMonth())
                    headerText.innerText = `Week ${agendaStartDate.getWeek()} (${agendaStartDate.toLocaleDateString('nl-NL', { timeZone: 'Europe/Amsterdam', month: 'long' })})`
                else
                    headerText.innerText = `Week ${agendaStartDate.getWeek()} (${agendaStartDate.toLocaleDateString('nl-NL', { timeZone: 'Europe/Amsterdam', month: 'short' })}–${agendaEndDate.toLocaleDateString('nl-NL', { timeZone: 'Europe/Amsterdam', month: 'short' })})`
            }
            else {
                headerText.innerText = agendaStartDate.toLocaleDateString('nl-NL', { timeZone: 'Europe/Amsterdam', weekday: 'long', month: 'long', day: 'numeric' })
            }
            headerText.dataset.lastLetter = '.'
        }

        // Buttons for moving one day backwards, moving to today's date, and moving one day forwards.
        let todayDecreaseOffset = element('button', 'st-start-today-offset-minus', headerButtons, { class: 'st-button icon', 'data-icon': '', title: "Achteruit" })
        todayDecreaseOffset.addEventListener('click', () => {
            if ((weekView && Math.floor(agendaDayOffset / 7) * 7 <= 0) || agendaDayOffset <= 0) return
            if (weekView) agendaDayOffset -= 7
            else agendaDayOffset--
            if (agendaDayOffset < 0) agendaDayOffset = 0
            renderSchedule()
            updateHeaderButtons()
            updateHeaderText()
        })
        let todayResetOffset = element('button', 'st-start-today-offset-zero', headerButtons, { class: 'st-button icon', 'data-icon': '', title: "Vandaag", disabled: true })
        todayResetOffset.addEventListener('click', () => {
            if ((weekView && agendaDayOffset < 7) || agendaDayOffset === (todayDate.getDay() || 7) - 1) return
            agendaDayOffset = (todayDate.getDay() || 7) - 1
            renderSchedule()
            updateHeaderButtons()
            updateHeaderText()
        })
        let todayIncreaseOffset = element('button', 'st-start-today-offset-plus', headerButtons, { class: 'st-button icon', 'data-icon': '', title: "Vooruit" })
        todayIncreaseOffset.addEventListener('click', () => {
            if ((weekView && Math.floor(agendaDayOffset / 7) * 7 >= 35) || agendaDayOffset >= 41) return
            if (weekView) agendaDayOffset += 7
            else agendaDayOffset++
            if (agendaDayOffset > 41) agendaDayOffset = 41
            renderSchedule()
            updateHeaderButtons()
            updateHeaderText()
        })

        let todayViewMode = element('div', 'st-start-today-view', headerButtons, { class: 'st-segmented-control' })
        let todayViewDay = element('button', 'st-start-today-view-day', todayViewMode, { class: 'st-button segment active', innerText: "Dag" })
        let todayViewWeek = element('button', 'st-start-today-view-week', todayViewMode, { class: 'st-button segment', innerText: "Week" })
        todayViewDay.addEventListener('click', () => {
            todayViewDay.classList.add('active')
            todayViewWeek.classList.remove('active')
            widgetsCollapsed = window.innerWidth < 1100 || widgetsCollapsedSetting
            if (widgets.classList.contains('editing')) widgetsCollapsed = false
            verifyDisplayMode()
            if (document.querySelector('.menu-host')?.classList.contains('collapsed-menu') && window.innerWidth > 1200) document.querySelector('.menu-footer>a')?.click()
            weekView = false
            listViewEnabled = listViewEnabledSetting
            renderSchedule()
            updateHeaderButtons()
            updateHeaderText()
        })
        todayViewWeek.addEventListener('click', () => {
            todayViewDay.classList.remove('active')
            todayViewWeek.classList.add('active')
            widgetsCollapsed = true
            if (widgets.classList.contains('editing')) widgetsCollapsed = false
            verifyDisplayMode()
            if (!document.querySelector('.menu-host')?.classList.contains('collapsed-menu')) document.querySelector('.menu-footer>a')?.click()
            weekView = true
            listViewEnabled = false
            renderSchedule()
            updateHeaderButtons()
            updateHeaderText()
        })

        // Controls (bottom right of page)
        let widgetControlsWrapper = element('div', 'st-start-widget-controls-wrapper', container, { class: 'st-visible' })
        let widgetControls = element('div', 'st-start-widget-controls', widgetControlsWrapper)
        setTimeout(() => widgetControlsWrapper.classList.remove('st-visible'), 2000)

        // Zoom buttons
        let zoomOut = element('button', 'st-start-edit-zoom-out', widgetControls, { class: 'st-button icon', 'data-icon': '', title: "uitzoomen" })
        let zoomIn = element('button', 'st-start-edit-zoom-in', widgetControls, { class: 'st-button icon', 'data-icon': '', title: "Inzoomen" })
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

        if (syncedStorage['start-stats']) {
            let stats
            (async () => {

                // stats overlay
                stats = element('dialog', 'st-start-stats', document.body, { class: 'st-overlay' })
                let statsHeading = element('div', 'st-start-stats-heading', stats),
                    statsTitle = element('span', 'st-start-stats-title', statsHeading, { class: 'st-title', innerText: "Statistieken" }),
                    statsSubtitle = element('span', 'st-start-stats-subtitle', statsHeading, { class: 'st-subtitle', innerText: `Voor de periode ${gatherStart.toLocaleDateString('nl-NL', { timeZone: 'Europe/Amsterdam', day: 'numeric', month: 'long' })}–${gatherEnd.toLocaleDateString('nl-NL', { timeZone: 'Europe/Amsterdam', day: 'numeric', month: 'long' })}.\nStatistieken zijn nog in de bètafase. Binnenkort komt er dus meer!` }),
                    statsButtonWrapper = element('div', 'st-start-stats-button-wrapper', statsHeading, { class: 'st-button-wrapper' }),
                    statsViewMode = element('div', 'st-start-stats-view', statsButtonWrapper, { class: 'st-segmented-control' }),
                    statsViewPie = element('button', 'st-start-stats-view-pie', statsViewMode, { class: 'st-button segment active', innerText: "Taart", 'data-icon': '' }),
                    statsViewBar = element('button', 'st-start-stats-view-bar', statsViewMode, { class: 'st-button segment', innerText: "Staaf", 'data-icon': '' }),
                    statsClose = element('button', 'st-start-stats-close', statsButtonWrapper, { class: 'st-button', 'data-icon': '', innerText: "Sluiten" }),
                    statsTeachers = element('div', 'st-start-stats-teachers', stats, { class: 'st-list st-tile' }),
                    statsTeachersTitle = element('span', 'st-start-stats-teachers-title', statsTeachers, { class: 'st-section-title', 'data-icon': '', innerText: "Docenten" }),
                    statsClassrooms = element('div', 'st-start-stats-classrooms', stats, { class: 'st-list st-tile' }),
                    statsClassroomsTitle = element('span', 'st-start-stats-classrooms-title', statsClassrooms, { class: 'st-section-title', 'data-icon': '', innerText: "Lokalen" })
                statsClose.addEventListener('click', () => {
                    stats.close()
                })

                const events = await MagisterApi.events()

                // Teacher stats 
                const eventsTeachers = events.flatMap(item => item.Docenten)
                let teachersFrequencyMap = {}
                eventsTeachers.map(teacher => teacher.Docentcode).forEach(teacherCode => {
                    teachersFrequencyMap[teacherCode] ??= 0
                    teachersFrequencyMap[teacherCode]++
                })
                let teachersChartArea = element('div', 'st-start-stats-teacher-chart', statsTeachers).createPieChart(teachersFrequencyMap, teacherNamesSetting, 3)

                // Classroom stats 
                const eventsClassrooms = events.flatMap(item => item.Lokalen)
                let classroomsFrequencyMap = {}
                eventsClassrooms.map(classroom => classroom.Naam).forEach(classroomName => {
                    classroomsFrequencyMap[classroomName] ??= 0
                    classroomsFrequencyMap[classroomName]++
                })
                let classroomsChartArea = element('div', 'st-start-stats-classroom-chart', statsClassrooms).createPieChart(classroomsFrequencyMap, null, 3)

                // Switch chart type
                statsViewPie.addEventListener('click', () => {
                    statsViewPie.classList.add('active')
                    statsViewBar.classList.remove('active')

                    teachersChartArea.createPieChart(teachersFrequencyMap, teacherNamesSetting, 3)
                    classroomsChartArea.createPieChart(classroomsFrequencyMap, null, 3)
                })
                statsViewBar.addEventListener('click', () => {
                    statsViewBar.classList.add('active')
                    statsViewPie.classList.remove('active')

                    teachersChartArea.createBarChart(teachersFrequencyMap, teacherNamesSetting, 3)
                    classroomsChartArea.createBarChart(classroomsFrequencyMap, null, 3)
                })
            })()

            let invokeStats = element('button', 'st-start-invoke-stats', widgetControls, { class: 'st-button icon', 'data-icon': '', title: "Statistieken\nKrijg meer inzicht in je rooster" })
            invokeStats.addEventListener('click', async () => {
                stats.showModal()
            })
        }

        let invokeEditWidgets = element('button', 'st-start-edit-widgets', widgetControls, { class: 'st-button icon', 'data-icon': '', title: "Widgets bewerken" })
        invokeEditWidgets.addEventListener('click', () => {
            editWidgets()
        })

        if (!widgetsCollapsed && Math.random() < 0.1 && !(await getFromStorage('start-widgets-edit-known', 'local') ?? false)) {
            const tooltip = element('div', 'st-start-widgets-edit-tooltip', document.body, { class: 'st-hidden', innerText: "Onder deze knop kun je het widgetpaneel compleet aanpassen. Probeer de nieuwe lijstweergave-optie voor widgets uit!" })
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
                editTeachersTitle = element('span', 'st-start-edit-teachers-title', editTeachersHeading, { class: 'st-title', innerText: "Bijnamen docenten" }),
                editTeachersClose = element('button', 'st-start-edit-teachers-close', editTeachersHeading, { class: 'st-button', 'data-icon': '', innerText: "Sluiten" }),
                editTeachersWrapper = element('div', 'st-start-edit-teachers-wrapper', editTeachers, { class: 'st-list st-tile' }),
                editTeachersList = element('div', 'st-start-edit-teachers-list', editTeachersWrapper)
            editTeachersClose.addEventListener('click', () => {
                editTeachers.close()
                todayWidgets()
                renderSchedule()
            })

            const events = await MagisterApi.events()

            const eventsTeachers = events.flatMap(item => item.Docenten).filter((value, index, self) =>
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
        let invokeEditTeachers = element('button', 'st-start-invoke-editor', widgetControls, { class: 'st-button icon', 'data-icon': '', title: "Docentennamen aanpassen" })
        invokeEditTeachers.addEventListener('click', async () => {
            editTeachers.showModal()
        })

        // Side panel collapse/expand button
        todayCollapseWidgets = element('button', 'st-start-collapse-widgets', widgetControls, { class: 'st-button icon', 'data-icon': '', title: "Widgetpaneel weergeven of verbergen" })
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

        // Create an array with 42 days (6 weeks) containing events of those days
        let agendaDays = []
        for (let i = 0; i < 42; i++) {
            const date = new Date(new Date(gatherStart.getTime()).setDate(gatherStart.getDate() + i))
            const eventsOfDay =
                events.filter(item => {
                    const startDate = new Date(item.Start)
                    return (startDate - date) < 86400000 && (startDate - date) >= 0 // Add all events that are on this date to this element
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

            // Select which days to show based on view mode
            if (!weekView) {
                // When in day view, the first day shown should be today. The amount of days set to be shown dictates the last day shown.
                agendaStartDate = new Date(new Date(gatherStart).setDate(gatherStart.getDate() + agendaDayOffset))
                if (listViewEnabled) {
                    schedule.classList.add('list-view')
                    agendaEndDate = new Date(new Date(agendaStartDate))
                } else {
                    let daysToShow = daysToShowSetting

                    // Add an extra day to the day view if the last event of the day has passed. (given the user has chosen for this to happen)
                    let todayEvents = agendaDays.find(item => item.today).events
                    let todayEndTime = new Date(Math.max(...todayEvents.filter(item => item.Status !== 5).map(item => new Date(item.Einde))))
                    if ((new Date() >= todayEndTime || todayEvents.length < 1) && showExtraDaySetting && daysToShow === 1 && agendaDayOffset === (todayDate.getDay() || 7) - 1) daysToShow++

                    agendaEndDate = new Date(new Date(agendaStartDate).setDate(agendaStartDate.getDate() + daysToShow - 1))
                }
                schedule.classList.remove('week-view')
            } else {
                // When in week view, the first day shown should be the Monday of the selected week. The last day shown should be 6 days later.
                agendaStartDate = new Date(new Date(gatherStart).setDate(gatherStart.getDate() + Math.min(Math.max(0, Math.floor(agendaDayOffset / 7) * 7), 41)))
                agendaEndDate = new Date(new Date(agendaStartDate).setDate(agendaStartDate.getDate() + 6))
                schedule.classList.add('week-view')
                schedule.classList.remove('list-view')
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
                let column = element('div', `st-start-col-${i}`, scheduleWrapper, {
                    class: 'st-start-col',
                    'data-today': day.today,
                    'data-tomorrow': day.tomorrow,
                    'data-irrelevant': day.irrelevant
                }),
                    columnLabel = element('div', `st-start-col-${i}-head`, column, { class: 'st-start-col-label' }),
                    columnLabelSpan = element('span', `st-start-col-${i}-head-span`, columnLabel, { innerText: day.date.toLocaleDateString('nl-NL', { timeZone: 'Europe/Amsterdam', weekday: 'long' }) }),
                    columnLabelDiv = element('div', `st-start-col-${i}-head-div`, columnLabel, { innerText: day.date.toLocaleDateString('nl-NL', { timeZone: 'Europe/Amsterdam', day: 'numeric' }) })
                if (day.date.getDate() === 1) element('span', `st-start-col-${i}-head-span-2`, columnLabel, { innerText: day.date.toLocaleDateString('nl-NL', { timeZone: 'Europe/Amsterdam', month: 'long' }) })
                if (day.date.getDate() === 1 && day.date.getMonth() === 0) element('span', `st-start-col-${i}-head-span-3`, columnLabel, { innerText: day.date.toLocaleDateString('nl-NL', { timeZone: 'Europe/Amsterdam', year: 'numeric' }) })

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
                        title: `${item.Omschrijving}\n${item.Lokatie}\n${new Date(item.Start).getFormattedTime()}–${new Date(item.Einde).getFormattedTime()}`
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
                    if (item.Status === 5) {
                        eventElement.classList.add('cancelled')
                        element('div', `st-start-event-${item.Id}-cancelled`, eventElement, { class: 'st-start-event-cancelled', title: "Dit blok vervalt mogelijk.\nControleer alsjeblieft even je Magister-app of de pagina 'Agenda'!" })
                    }

                    // Render the subject and location label
                    if (listViewEnabled) {
                        let eventSubject = element('span', `st-start-event-${item.Id}-subject`, eventElement, { class: 'st-start-event-subject', innerText: item.Lokatie ? `${item.Omschrijving} (${item.Lokatie})` : item.Omschrijving })
                    } else {
                        let eventSubjectWrapper = element('span', `st-start-event-${item.Id}-subject-wrapper`, eventElement, { class: 'st-start-event-subject-wrapper' })
                        let eventSubject = element('span', `st-start-event-${item.Id}-subject`, eventSubjectWrapper, { class: 'st-start-event-subject', innerText: subjectNames.join(', ') })
                        let eventLocation = element('span', `st-start-event-${item.Id}-location`, eventSubjectWrapper, { class: 'st-start-event-location', innerText: locationNames.join(', ') })
                    }

                    let row = element('div', `st-start-event-${item.Id}-row1`, eventElement, { class: 'st-list-row' })

                    // Render the teacher label
                    if (!listViewEnabled && item.Docenten[0]) {
                        let eventTeacher = element('span', `st-start-event-${item.Id}-teacher`, row, { class: 'st-start-event-teacher', innerText: teacherNames.join(', ') })
                    }

                    // Render the time label
                    let eventTime = element('span', `st-start-event-${item.Id}-time`, row, { class: 'st-start-event-time', innerText: `${new Date(item.Start).getFormattedTime()}–${new Date(item.Einde).getFormattedTime()}` })

                    // Parse and render any chips
                    let chips = eventChips(item)

                    let eventChipsWrapper = element('div', `st-start-event-${item.Id}-chips`, eventElement, { class: 'st-chips-wrapper' })
                    chips.forEach(chip => {
                        let chipElement = element('span', `st-start-event-${item.Id}-chip-${chip.name}`, eventChipsWrapper, { class: `st-chip ${chip.type || 'info'}`, innerText: chip.name })
                    })
                })

                if (!listViewEnabled && day.today) {
                    // Add a marker of the current time (if applicable) and scroll to it if the scroll position is 0.
                    let currentTimeMarker = element('div', `st-start-now`, column, { 'data-temporal-type': 'style-hours' })
                    updateTemporalBindings()
                    if (schedule.scrollTop === 0 && (!weekView || listViewEnabledSetting && weekView)) {
                        schedule.scrollTop = zoomSetting * 115 * 8 // Default scroll to 08:00
                        if (column.querySelector('.st-start-event:last-of-type')) column.querySelector('.st-start-event:last-of-type').scrollIntoView({ block: 'nearest', behavior: 'instant' }) // If there are events today, ensure the last event is visible.
                        if (column.querySelector('.st-start-event')) column.querySelector('.st-start-event').scrollIntoView({ block: 'nearest', behavior: 'instant' }) // If there are events today, ensure the first event is visible.
                        currentTimeMarker.scrollIntoView({ block: 'nearest', behavior: 'smooth' }) // Ensure the current time is visible (with a bottom margin set in CSS)
                        schedule.scrollTop -= 3 // Scroll back a few pixels to ensure the border looks nice.
                    }
                }
            })
        }
        renderSchedule()

        updateTemporalBindings()
        updateHeaderButtons()

        setTimeout(() => {
            header.dataset.transition = true
            setTimeout(async () => {
                updateHeaderText()
                header.removeAttribute('data-transition')
            }, 300)
        }, 2000)

    }

    async function todayWidgets() {
        widgets.dataset.working = true
        widgetsList.innerText = ''

        if (document.getElementById('st-start-edit-widgets-options')) document.getElementById('st-start-edit-widgets-options').remove()
        if (document.getElementById('st-start-edit-widgets-hidden')) document.getElementById('st-start-edit-widgets-hidden').remove()
        if (document.getElementById('st-start-edit-widgets-prot')) document.getElementById('st-start-edit-widgets-prot').remove()

        let widgetsProgress = element('div', 'st-start-widget-progress', widgets, { class: 'st-progress-bar' })
        let widgetsProgressValue = element('div', 'st-start-widget-progress-value', widgetsProgress, { class: 'st-progress-bar-value indeterminate' })
        let widgetsProgressText = element('span', 'st-start-widget-progress-text', widgets, { class: 'st-subtitle', innerText: "Widgets laden..." })

        now = new Date()

        widgetFunctions = {
            logs: {
                title: "Logboeken",
                types: ['Tegel', 'Lijst'],
                render: async (type, placeholder) => {
                    return new Promise(async resolve => {
                        let logs

                        if (placeholder) {
                            logs = [null]
                        } else {
                            logs = await MagisterApi.logs()
                                .catch(() => { return reject() })
                        }

                        if (logs.length < 1) return resolve()
                        let widgetElement = element('div', 'st-start-widget-logs', null, { class: 'st-tile st-widget' })
                        let widgetTitle = element('a', 'st-start-widget-logs-title', widgetElement, { class: 'st-widget-title', innerText: "Logboeken", 'data-amount': logs.length, href: '#/lvs-logboeken' })

                        if (type === 'Lijst') {
                            return resolve(widgetElement)
                        }

                        resolve(widgetElement)
                    })
                }
            },

            activities: {
                title: "Activiteiten",
                types: ['Tegel', 'Lijst'],
                render: async (type, placeholder) => {
                    return new Promise(async resolve => {
                        let activities

                        if (placeholder) {
                            activities = [null]
                        } else {
                            activities = await MagisterApi.activities()
                                .catch(() => { return reject() })
                        }

                        if (activities.length < 1) return resolve()
                        let widgetElement = element('div', 'st-start-widget-activities', null, { class: 'st-tile st-widget' })
                        let widgetTitle = element('a', 'st-start-widget-activities-title', widgetElement, { class: 'st-widget-title', innerText: "Activiteiten", 'data-amount': activities.length, href: '#/elo/activiteiten' })

                        if (type === 'Lijst') {
                            return resolve(widgetElement)
                        }

                        resolve(widgetElement)
                    })
                }
            },

            grades: {
                title: "Cijfers",
                types: ['Tegel', 'Lijst'],
                options: [
                    {
                        title: "Widget weergeven",
                        key: 'start-widget-cf-widget',
                        type: 'select',
                        choices: [
                            {
                                title: "Altijd",
                                value: 'always'
                            },
                            {
                                title: "Bij ongelezen cijfer",
                                value: 'new'
                            }
                        ]
                    },
                    {
                        title: "Als gelezen beschouwen",
                        key: 'start-widget-cf-new',
                        type: 'select',
                        choices: [
                            {
                                title: "Na openen cijferlijst",
                                value: 'unread'
                            },
                            {
                                title: "Na een week",
                                value: 'week'
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
                        let viewWidget = await getFromStorage('start-widget-cf-widget', 'local') || 'always'
                        let viewResult = await getFromStorage('start-widget-cf-result', 'local') || 'always'
                        let newWhen = await getFromStorage('start-widget-cf-new', 'local') || 'unread'

                        let grades, hiddenItems, lastViewMs
                        if (placeholder) {
                            grades = [
                                {
                                    "omschrijving": "Voorbeeld",
                                    "ingevoerdOp": new Date(now - 172800000),
                                    "vak": {
                                        "code": "netl",
                                        "omschrijving": "Nederlandse taal"
                                    },
                                    "waarde": "6,9",
                                    "weegfactor": 0
                                },
                                {
                                    "omschrijving": "Baguette",
                                    "ingevoerdOp": new Date(now - 691200000),
                                    "vak": {
                                        "code": "fatl",
                                        "omschrijving": "Franse taal"
                                    },
                                    "waarde": "U",
                                    "weegfactor": 0
                                },
                                {
                                    "omschrijving": "Grade mockery",
                                    "ingevoerdOp": new Date(now - 6891200000),
                                    "vak": {
                                        "code": "entl",
                                        "omschrijving": "Engelse taal"
                                    },
                                    "waarde": "5,4",
                                    "weegfactor": 0
                                }
                            ]
                            hiddenItems = []
                            lastViewMs = 0
                        } else {
                            grades = await MagisterApi.grades.recent()
                                .catch(() => { return reject() })
                            hiddenItems = await getFromStorage('hiddenGrades', 'local') || []
                            lastViewMs = await getFromStorage('viewedGrades', 'local') || 0
                        }
                        let lastViewDate = new Date(lastViewMs)
                        if (!lastViewDate || !(lastViewDate instanceof Date) || isNaN(lastViewDate)) lastViewDate = new Date().setDate(now.getDate() - 7)

                        const recentGrades = grades.map(item => {
                            return {
                                ...item,
                                date: new Date(item.ingevoerdOp),
                                unread: new Date(item.ingevoerdOp) > lastViewDate || (newWhen === 'week' && new Date(item.ingevoerdOp) > Date.now() - (1000 * 60 * 60 * 24 * 7)),
                                hidden: (hiddenItems.includes(item.kolomId)) || (viewResult === 'sufficient' && !item.isVoldoende) || (viewResult === 'never') // Hide if hidden manually, or if insufficient and user has set widget to sufficient only, or if user has set widget to hide result.
                            }
                        })

                        if (recentGrades.length < 1 || (viewWidget === 'new' && recentGrades.filter(item => item.unread).length < 1)) return resolve() // Stop if no grades, or if no new grades and user has set widget to new grades only.

                        let widgetElement = element(placeholder ? 'div' : 'a', 'st-start-widget-grades', null, { class: 'st-tile st-widget', title: "Laatste cijfers bekijken", href: '#/cijfers' })
                        let widgetTitle = element('div', 'st-start-widget-grades-title', widgetElement, { class: 'st-widget-title', innerText: "Laatste cijfer" })

                        if (type === 'Lijst') widgetTitle.dataset.amount = recentGrades.filter(item => item.unread).length

                        let mostRecentItem = recentGrades[0]
                        if (mostRecentItem.unread) widgetElement.classList.add('st-unread')

                        let lastGrade = element('span', 'st-start-widget-grades-last', widgetElement, { innerText: mostRecentItem.waarde })
                        if (mostRecentItem.hidden) lastGrade.style.display = 'none'
                        let lastGradeSubj = element('span', 'st-start-widget-grades-last-subj', widgetElement, { innerText: mostRecentItem.vak.omschrijving.charAt(0).toUpperCase() + mostRecentItem.vak.omschrijving.slice(1) })
                        let lastGradeInfo = element('span', 'st-start-widget-grades-last-info', widgetElement, { innerText: `${mostRecentItem.omschrijving} (${mostRecentItem.weegfactor || 0}×)` })
                        let lastGradeDate = element('span', 'st-start-widget-grades-last-date', widgetElement, { 'data-temporal-type': 'timestamp', 'data-temporal-start': mostRecentItem.date })
                        let lastGradeHide = element('button', 'st-start-widget-grades-last-hide', widgetElement, { class: 'st-button icon', 'data-icon': mostRecentItem.hidden ? '' : '', title: "Dit specifieke cijfer verbergen/weergeven" })
                        lastGradeHide.addEventListener('click', (event) => {
                            event.preventDefault()
                            event.stopPropagation()
                            event.stopImmediatePropagation()
                            if (lastGrade.style.display === 'none') {
                                lastGradeHide.dataset.icon = ''
                                lastGrade.style.display = 'block'
                                hiddenItems = hiddenItems.filter(item => item !== mostRecentItem.kolomId)
                                saveToStorage('hiddenGrades', hiddenItems, 'local')
                            } else {
                                lastGradeHide.dataset.icon = ''
                                lastGrade.style.display = 'none'
                                hiddenItems.push(mostRecentItem.kolomId)
                                saveToStorage('hiddenGrades', hiddenItems, 'local')
                            }
                            return false
                        })

                        if (type === 'Lijst') {
                            widgetTitle.innerText = recentGrades.filter(item => item.unread).length > 0 ? "Nieuwe cijfers" : "Laatste cijfer"
                            return resolve(widgetElement)
                        }

                        let moreUnreadItems = recentGrades.filter(item => item.unread)
                        moreUnreadItems.shift()

                        widgetTitle.innerText = moreUnreadItems.length > 0 ? "Nieuwe cijfers" : recentGrades.filter(item => item.unread).length > 0 ? "Nieuw cijfer" : "Laatste cijfer"

                        if (moreUnreadItems.length === 1) {
                            let moreGrades = element('span', 'st-start-widget-grades-more', widgetElement, { innerText: `En een ander cijfer voor ${moreUnreadItems[0].vak.code}` })
                        } else if (moreUnreadItems.length > 10) {
                            element('span', 'st-start-widget-grades-more', widgetElement, { innerText: `En nog meer cijfers voor o.a. ${new Intl.ListFormat('nl-NL').format([...new Set(moreUnreadItems.map(item => item.vak.code))])}` })
                        } else if (moreUnreadItems.length > 1) {
                            element('span', 'st-start-widget-grades-more', widgetElement, { innerText: `En nog ${moreUnreadItems.length} cijfers voor ${new Intl.ListFormat('nl-NL').format([...new Set(moreUnreadItems.map(item => item.vak.code))])}` })
                        }

                        resolve(widgetElement)
                    })
                }
            },

            messages: {
                title: "Berichten",
                types: ['Tegel', 'Lijst'],
                render: async (type, placeholder) => {
                    return new Promise(async resolve => {
                        let unreadMessages

                        if (placeholder) {
                            unreadMessages = [
                                {
                                    "onderwerp": "🔥😂💚🍀😔🐜😝🙏👍🪢💀☠️",
                                    "afzender": {
                                        "naam": "Quinten Althues (V6E)"
                                    },
                                    "heeftBijlagen": true,
                                    "verzondenOp": new Date(now - 3032000000)
                                },
                                {
                                    "onderwerp": "Wie gebruikt Berichten in vredesnaam?",
                                    "afzender": {
                                        "naam": "Quinten Althues (V6E)"
                                    },
                                    "heeftPrioriteit": true,
                                    "verzondenOp": new Date(now - 1000000)
                                }
                            ]
                        } else {
                            unreadMessages = await MagisterApi.messages()
                                .catch(() => { return reject() })
                        }

                        if (unreadMessages.length < 1) return resolve()
                        let widgetElement = element('div', 'st-start-widget-messages', null, { class: 'st-tile st-widget' })
                        let widgetTitle = element('a', 'st-start-widget-messages-title', widgetElement, { class: 'st-widget-title', innerText: "Berichten", 'data-amount': unreadMessages.length, href: '#/berichten' })

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
                            if (item.heeftPrioriteit) chips.push({ name: "Belangrijk", type: 'warn' })
                            if (item.heeftBijlagen) chips.push({ name: "Bijlagen", type: 'info' })

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
                title: "Huiswerk",
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

                        let events
                        if (placeholder) {
                            events = [
                                {
                                    "Start": new Date(new Date().setHours(0, 0, 0, 0) + 122400000),
                                    "Einde": new Date(new Date().setHours(0, 0, 0, 0) + 125100000),
                                    "Inhoud": "<p>Dit is een onvoltooid huiswerkitem.</p>",
                                    "Opmerking": null,
                                    "InfoType": 1,
                                    "Afgerond": false,
                                    "Vakken": [
                                        {
                                            "Naam": "Niet-bestaand vak"
                                        }
                                    ]
                                },
                                {
                                    "Start": new Date(new Date().setHours(0, 0, 0, 0) + 297900000),
                                    "Einde": new Date(new Date().setHours(0, 0, 0, 0) + 300600000),
                                    "Inhoud": "<p>In deze les heb je een schriftelijke overhoring. Neem je oortjes mee.</p>",
                                    "Opmerking": null,
                                    "InfoType": 2,
                                    "Afgerond": false,
                                    "Vakken": [
                                        {
                                            "Naam": "Lichamelijke opvoeding"
                                        }
                                    ]
                                },
                                {
                                    "Start": new Date(new Date().setHours(0, 0, 0, 0) + 297900000),
                                    "Einde": new Date(new Date().setHours(0, 0, 0, 0) + 300600000),
                                    "Inhoud": "<p>Dit item heb je al wel voltooid. Good job.</p>",
                                    "Opmerking": null,
                                    "InfoType": 1,
                                    "Afgerond": true,
                                    "Vakken": [
                                        {
                                            "Naam": "Jouw favoriete vak"
                                        }
                                    ]
                                }
                            ]
                        } else {
                            events = await MagisterApi.events()
                                .catch(() => { return reject() })
                        }
                        const homeworkEvents = events.filter(item => {
                            if (filterOption === 'incomplete')
                                return (item.Inhoud?.length > 0 && new Date(item.Einde) > new Date() && !item.Afgerond)
                            else
                                return (item.Inhoud?.length > 0 && new Date(item.Einde) > new Date())
                        })

                        if (homeworkEvents.length < 1) return resolve()
                        let widgetElement = element('div', 'st-start-widget-homework', null, { class: 'st-tile st-widget' })
                        let widgetTitle = element('div', 'st-start-widget-homework-title', widgetElement, { class: 'st-widget-title', innerText: "Huiswerk", 'data-amount': homeworkEvents.length })

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

                            let chips = eventChips(item)

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
                title: "Opdrachten",
                types: ['Tegel', 'Lijst'],
                render: async (type, placeholder) => {
                    return new Promise(async (resolve) => {
                        let assignments
                        if (placeholder) {
                            assignments = [
                                {
                                    "Titel": "Praktische opdracht",
                                    "Vak": "sk",
                                    "InleverenVoor": new Date(new Date().setHours(0, 0, 0, 0) + 300600000),
                                    "Omschrijving": "Zorg ervoor dat je toestemming hebt van de TOA voordat je begint met je experiment."
                                },
                                {
                                    "Titel": "Boekverslag",
                                    "Vak": "netl",
                                    "InleverenVoor": new Date(new Date().setHours(0, 0, 0, 0) + 400500000)
                                }
                            ]
                        } else {
                            assignments = await MagisterApi.assignments.top()
                                .catch(() => { return reject() })
                        }

                        const relevantAssignments = assignments.filter(item => (!item.Afgesloten && !item.IngeleverdOp) || item.BeoordeeldOp)

                        if (relevantAssignments.length < 1) return resolve()
                        let widgetElement = element('div', 'st-start-widget-assignments', null, { class: 'st-tile st-widget' })
                        let widgetTitle = element('a', 'st-start-widget-assignments-title', widgetElement, { class: 'st-widget-title', innerText: "Opdrachten", 'data-amount': relevantAssignments.length, href: '#/elo/opdrachten' })

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
                            if (item.BeoordeeldOp) chips.push({ name: "Beoordeeld", type: 'ok' })

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
                title: "Digitale klok",
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

                        const todaysEvents = events.filter(item => new Date(item.Start).isToday())
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
        for (const key of Object.values(syncedStorage['widgets-order'])) {
            if (!widgetFunctions?.[key]) continue

            if (!syncedStorage[`widget-${key}-type`] || ![...widgetFunctions[key].types, 'Verborgen'].includes(syncedStorage[`widget-${key}-type`])) {
                syncedStorage[`widget-${key}-type`] = widgetFunctions[key].types[0]
                saveToStorage(`widget-${key}-type`, syncedStorage[`widget-${key}-type`], 'local')
            }
            if (syncedStorage[`widget-${key}-type`] === 'Verborgen') continue

            widgetsProgressText.innerText = `Widget '${widgetFunctions[key].title}' laden...`
            let widgetElement = await widgetFunctions[key].render(syncedStorage[`widget-${key}-type`])
            if (widgetElement) {
                widgetElement.dataset.renderType = syncedStorage[`widget-${key}-type`]
                widgetsList.append(widgetElement)
            }
            updateTemporalBindings()
        }

        widgets.dataset.working = false
        widgetsProgress.remove()
        widgetsProgressText.remove()

    }

    async function editWidgets() {
        widgetsList.innerText = ''

        const editWidgetsOptions = element('div', 'st-start-edit-widgets-options', document.body)
        const editWidgetsHidden = element('div', 'st-start-edit-widgets-hidden', document.body, { innerText: '' })
        const editWidgetsProt = element('div', 'st-start-edit-widgets-prot', document.body)
        const editWidgetsDone = element('button', 'st-start-edit-widgets-done', editWidgetsProt, { class: 'st-button', 'data-icon': '', innerText: "Bewerken voltooien" })
        editWidgetsDone.addEventListener('click', () => {
            widgetsList.innerText = ''
            widgets.classList.remove('editing')
            todayWidgets()
        })

        if (widgets.classList.contains('editing')) {
            todayWidgets()
            widgets.classList.remove('editing')
            return
        }

        widgets.classList.add('editing')
        if (widgetsCollapsed) todayCollapseWidgets.click()

        // Draw the selected widgets in the specified order
        syncedStorage['widgets-order'] = await getFromStorage('widgets-order')

        for (const key of Object.values(syncedStorage['widgets-order'])) {
            if (!widgetFunctions?.[key]) continue
            if (syncedStorage[`widget-${key}-type`] === 'Verborgen') {
                const widgetPlaceholder = element('button', `st-start-edit-${key}-hidden`, editWidgetsHidden, { class: 'st-button secondary', 'data-icon': '', innerText: `Widget '${widgetFunctions[key].title}' weergeven` })
                widgetPlaceholder.addEventListener('click', () => {
                    syncedStorage[`widget-${key}-type`] = widgetFunctions[key].types.filter(e => e !== 'Verborgen')[0]
                    saveToStorage(`widget-${key}-type`, syncedStorage[`widget-${key}-type`])
                    widgetsList.innerText = ''
                    widgets.classList.remove('editing')
                    editWidgets()
                })
                continue
            }

            let widgetElement = await widgetFunctions[key].render(syncedStorage[`widget-${key}-type`], true)
            if (widgetElement) {
                widgetElement.dataset.renderType = syncedStorage[`widget-${key}-type`]
                widgetElement.setAttribute('disabled', true)
                widgetElement.querySelectorAll('*').forEach(c => c.setAttribute('inert', true))
                widgetElement.setAttribute('draggable', true)
                widgetElement.dataset.value = key
                widgetsList.append(widgetElement)

                widgetElement.addEventListener('dragstart', event => {
                    setTimeout(() => {
                        widgetElement.classList.add('dragging')
                    }, 0)
                })
                widgetElement.addEventListener('dragend', () => {
                    widgetElement.classList.remove('dragging')

                    syncedStorage['widgets-order'] = [...widgetsList.children].map(element => element.dataset.value)
                    saveToStorage('widgets-order', syncedStorage['widgets-order'])
                })

                widgetElement.addEventListener('mouseenter', () => {
                    if (widgetsList.querySelector('.dragging')) return

                    editWidgetsOptions.innerText = "Widgetopties: " + widgetFunctions[key].title

                    const widgetTypeSelector = element('div', `st-start-edit-${key}-type`, editWidgetsOptions, { class: 'st-segmented-control' })
                    if (!syncedStorage[`widget-${key}-type`] || ![...widgetFunctions[key].types, 'Verborgen'].includes(syncedStorage[`widget-${key}-type`])) {
                        syncedStorage[`widget-${key}-type`] = widgetFunctions[key].types[0]
                        saveToStorage(`widget-${key}-type`, syncedStorage[`widget-${key}-type`])
                    }

                    ([...widgetFunctions[key].types.filter(e => e !== 'Verborgen'), 'Verborgen']).forEach(type => {
                        const widgetTypeButton = element('button', `st-start-edit-${key}-type-${type}`, widgetTypeSelector, { class: 'st-button segment', innerText: type })
                        if (syncedStorage[`widget-${key}-type`] === type) widgetTypeButton.classList.add('active')
                        widgetTypeButton.addEventListener('click', () => {
                            syncedStorage[`widget-${key}-type`] = type
                            saveToStorage(`widget-${key}-type`, syncedStorage[`widget-${key}-type`])
                            widgetTypeSelector.querySelectorAll('.st-button.segment').forEach(b => b.classList.remove('active'))
                            widgetTypeButton.classList.add('active')
                            widgetsList.innerText = ''
                            widgets.classList.remove('editing')
                            editWidgets()
                        })
                    })

                    if (widgetFunctions[key].options) {
                        widgetFunctions[key].options.forEach(option => {
                            let optionWrapper = element('div', `st-start-edit-${option.key}`, editWidgetsOptions, { class: 'st-option' })
                            let optionTitle = element('label', `st-start-edit-${option.key}-title`, optionWrapper, { for: `st-start-edit-${option.key}-input`, innerText: option.title })
                            switch (option.type) {
                                case 'select':
                                    let optionInput = element('select', `st-start-edit-${option.key}-input`, optionWrapper, { name: option.title })
                                    option.choices.forEach(async choice => {
                                        let optionChoice = element('option', `st-start-edit-${option.key}-${choice.value}`, optionInput, { value: choice.value, innerText: choice.title })
                                        if (await getFromStorage(option.key, 'local') === choice.value) optionChoice.setAttribute('selected', true)
                                    })
                                    optionInput.addEventListener('change', event => {
                                        saveToStorage(option.key, event.target.value, 'local')
                                        widgetsList.innerText = ''
                                        widgets.classList.remove('editing')
                                        editWidgets()
                                    })
                                    break

                                default:
                                    // Implement other option types as necessary
                                    break
                            }
                        })
                    }
                })
            }
            updateTemporalBindings()
        }

        widgetsList.addEventListener('dragover', (event) => {
            event.preventDefault()

            const draggedItem = widgetsList.querySelector('.dragging')
            if (!draggedItem) return

            let nextSibling = [...widgetsList.children].find(sibling => (
                sibling !== draggedItem &&
                event.clientY <= (sibling.getBoundingClientRect().y + sibling.getBoundingClientRect().height / 2)
            ))

            widgetsList.insertBefore(draggedItem, nextSibling)
        })
        widgetsList.addEventListener('dragenter', e => e.preventDefault())
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

function eventChips(item) {
    let chips = []

    if (item.Status === 5) chips.push({ name: "Vervallen", type: 'warn' })
    if (item.InfoType === 1 && item.Afgerond) chips.push({ name: "Huiswerk", type: 'ok' })
    else if (item.InfoType === 1) chips.push({ name: "Huiswerk", type: 'info' })
    if (item.InfoType === 2 && item.Afgerond) chips.push({ name: "Proefwerk", type: 'ok' })
    else if (item.InfoType === 2) chips.push({ name: "Proefwerk", type: 'important' })
    if (item.InfoType === 6 && item.Afgerond) chips.push({ name: "Informatie", type: 'ok' })
    else if (item.InfoType === 6) chips.push({ name: "Informatie", type: 'info' })
    if (item.Type === 7 && item.Lokatie?.length > 0) chips.push({ name: "Ingeschreven", type: 'ok' })
    else if (item.Type === 7) chips.push({ name: "KWT", type: 'info' })

    return chips
}