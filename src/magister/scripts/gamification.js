// Run at start and when the URL changes
popstate()
window.addEventListener('popstate', popstate)
async function popstate() {
    if (document.location.href.split('?')[0].endsWith('/vandaag')) gamification()
}

async function gamification() {
    let scoringTitles = {
        grades: "Cijfers van %s",
        absences: "Ongeoorloofde absenties in %s"
    },
        mainContainer = await awaitElement('section.main'),
        photo = await awaitElement("#user-menu > figure > img"),
        notifications = await awaitElement('#st-vd-notifications'),
        levelElem = element('button', 'st-level', mainContainer),
        progressElem = element('div', 'st-progress', levelElem),
        progressFilled = element('div', 'st-progress-filled', progressElem),
        gmOverlay = element('dialog', 'st-gm', document.body, { class: 'st-overlay' }),
        gmClose = element('button', 'st-gm-close', gmOverlay, { class: 'st-button', innerText: "Sluiten", 'data-icon': '' }),
        gmTitle = element('span', 'st-gm-title', gmOverlay, { class: 'st-title', innerText: "Jouw score" }),
        gmSubtitle = element('span', 'st-gm-subtitle', gmOverlay, { class: 'st-subtitle', innerText: "Verdien punten en verhoog je niveau door voldoendes te halen, opdrachten vroeg in te leveren en zo min mogelijk absenties te hebben.\nHogere cijfers leveren meer punten op en latere leerjaren hebben meer impact op je score." }),
        gmCard = element('div', 'st-gm-card', gmOverlay),
        gmCardTitle = element('span', 'st-gm-card-title', gmCard, { class: 'st-title', innerText: photo.alt }),
        gmCardSubtitle = element('span', 'st-gm-card-subtitle', gmCard, { class: 'st-subtitle', innerText: new Date().toLocaleDateString('nl-NL', { day: 'numeric', month: 'long', year: 'numeric' }) }),
        gmCardLevel = element('div', 'st-gm-card-level', gmCard),
        gmCardProgress = element('div', 'st-gm-card-progress', gmCard),
        gmCardProgressFilled = element('div', 'st-gm-card-progress-filled', gmCardProgress),
        gmCardDivision = element('div', 'st-gm-card-division', gmCard)
    // gmBannerAd = element('div', 'st-gm-ad', gmOverlay, {
    //     class: 'st-banner-ad', innerText: "Gamificatie (het berekenen van scores en niveaus) is onderdeel van Study Tools voor Magister.", onclick: `window.open('https://qkeleq10.github.io/extensions/studytools', '_blank').focus()`
    // })

    levelElem.addEventListener('click', () => {
        gmOverlay.showModal()
    })

    gmClose.addEventListener('click', () => {
        gmOverlay.close()
    })

    displayScore()
    setTimeout(() => {
        displayScore()
    }, 500)
    setTimeout(() => {
        displayScore()
    }, 1500)

    async function displayScore() {
        let points = await getSetting('points'),
            pointsBefore = await getSetting('points-before'),
            pointsDiff = points.total - pointsBefore.total,
            level = Math.floor(Math.sqrt(points.total + 9) - 3),
            levelBefore = Math.floor(Math.sqrt(pointsBefore.total + 9) - 3),
            levelDiff = level - levelBefore,
            pointsRequired = 2 * level + 7,
            pointsProgress = Math.floor(points.total - (level ** 2 + 6 * level)),
            notification

        if (typeof points?.total === 'undefined') return

        if (levelDiff > 0) {
            notification = element('li', `st-vd-gamification-notification`, notifications, { innerText: `Niveau gestegen (+${levelDiff} niveau${levelDiff > 1 ? 's' : ''})`, onclick: `document.getElementById('st-gm').showModal()`, 'data-icon': '', 'data-additional-info': '' })
            notifications.prepend(notification)
        } else if (levelDiff < 0) {
            notification = element('li', `st-vd-gamification-notification`, notifications, { innerText: `Niveau gezakt (${levelDiff} niveau${levelDiff < -1 ? 's' : ''})`, onclick: `document.getElementById('st-gm').showModal()`, 'data-icon': '', 'data-additional-info': '' })
            notifications.prepend(notification)
        } else if (pointsDiff > 0) {
            notification = element('li', `st-vd-gamification-notification`, notifications, { innerText: `Punten verdiend (+${pointsDiff} punten)`, onclick: `document.getElementById('st-gm').showModal()`, 'data-icon': '', 'data-additional-info': '' })
            notifications.prepend(notification)
        } else if (pointsDiff < 0) {
            notification = element('li', `st-vd-gamification-notification`, notifications, { innerText: `Punten verloren (${pointsDiff} punten)`, onclick: `document.getElementById('st-gm').showModal()`, 'data-icon': '', 'data-additional-info': '' })
            notifications.prepend(notification)
        }
        if (pointsDiff > 0 || pointsDiff < 0) {
            Object.keys(points).forEach(key => {
                let valueBefore = pointsBefore[key],
                    valueAfter = points[key],
                    title = scoringTitles[key]
                if (!title && points[key].g) title = "Cijfers van " + points[key].g
                if (!title) return
                if (JSON.stringify(valueAfter) !== JSON.stringify(valueBefore)) {
                    if (notification.dataset.additionalInfo.length > 1) notification.dataset.additionalInfo += ', '
                    notification.dataset.additionalInfo += title
                }
            })
        }
        setSetting('points-before', points)

        if (Number.isNaN(level)) level = 0
        levelElem.dataset.level = level + 1
        gmCardLevel.innerText = level + 1
        progressFilled.style.setProperty('--level-progress', pointsProgress / pointsRequired)
        gmCardProgressFilled.style.setProperty('--level-progress', pointsProgress / pointsRequired)
        gmCardProgress.dataset.pointsProgress = pointsProgress
        gmCardProgress.dataset.pointsRequired = pointsRequired
        gmCardProgress.dataset.pointsRemaining = pointsRequired - pointsProgress
        gmCardProgress.dataset.levelNext = level + 2
        gmCardDivision.innerText = ''

        Object.keys(points).forEach(categoryKey => {
            Object.keys(points[categoryKey]).forEach(yearKey => {
                let value = points[categoryKey][yearKey].v,
                    count = points[categoryKey][yearKey].n,
                    title = scoringTitles[categoryKey]?.replace('%s', points[categoryKey][yearKey].g)
                if (!value || !count || !title || count < 1) return
                let element = document.createElement('div')
                gmCardDivision.append(element)
                element.innerText = `${title} (${count}×)`
                element.dataset.value = value.toLocaleString('nl-NL', { maximumFractionDigits: 2 })
            })
        })

        let total = document.createElement('div')
        gmCardDivision.append(total)
        total.innerText = "Totaal"
        total.classList.add('total')
        total.dataset.value = points.total.toLocaleString('nl-NL', { maximumFractionDigits: 2 })
    }
}