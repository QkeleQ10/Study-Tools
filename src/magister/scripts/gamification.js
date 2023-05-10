// Run at start and when the URL changes
popstate()
window.addEventListener('popstate', popstate)
async function popstate() {
    if (document.location.href.split('?')[0].endsWith('/vandaag')) gamification()
}

async function gamification() {
    let scoringTitles = {
        g1: "Tienen gehaald dit jaar",
        g2: "Negens gehaald dit jaar",
        g3: "Achten gehaald dit jaar",
        g4: "Zevens gehaald dit jaar",
        g5: "Zessen gehaald dit jaar",
        gr: "Cijfers verhoogd met herkansingen"
    },
        mainContainer = await awaitElement('section.main'),
        photo = await awaitElement("#user-menu > figure > img"),
        levelElem = element('button', 'st-level', mainContainer),
        progressElem = element('div', 'st-progress', levelElem),
        progressFilled = element('div', 'st-progress-filled', progressElem),
        gmOverlay = element('dialog', 'st-gm', document.body, { class: 'st-overlay' }),
        gmClose = element('button', 'st-gm-close', gmOverlay, { class: 'st-button', innerText: "Sluiten", 'data-icon': '' }),
        gmTitle = element('span', 'st-gm-title', gmOverlay, { class: 'st-title', innerText: "Jouw score" }),
        gmSubtitle = element('span', 'st-gm-subtitle', gmOverlay, { class: 'st-subtitle', innerText: "Verdien punten en verhoog je niveau door voldoendes te halen, opdrachten vroeg in te leveren en zo min mogelijk absenties te hebben." }),
        gmCard = element('div', 'st-gm-card', gmOverlay),
        gmCardTitle = element('span', 'st-gm-card-title', gmCard, { class: 'st-title', innerText: photo.alt }),
        gmCardSubtitle = element('span', 'st-gm-card-subtitle', gmCard, { class: 'st-subtitle', innerText: new Date().toLocaleDateString('nl-NL', { day: 'numeric', month: 'long', year: 'numeric' }) }),
        gmCardLevel = element('div', 'st-gm-card-level', gmCard),
        gmCardProgress = element('div', 'st-gm-card-progress', gmCard),
        gmCardProgressFilled = element('div', 'st-gm-card-progress-filled', gmCardProgress),
        gmCardDivision = element('div', 'st-gm-card-division', gmCard),
        gmBannerAd = element('div', 'st-gm-ad', gmOverlay, {
            class: 'st-banner-ad', innerText: "Gamificatie (het berekenen van scores en niveaus) is onderdeel van Study Tools voor Magister.", onclick: `window.open('https://qkeleq10.github.io/extensions/studytools', '_blank').focus()`
        })

    levelElem.addEventListener('click', () => {
        gmOverlay.showModal()
    })

    gmClose.addEventListener('click', () => {
        gmOverlay.close()
    })

    displayScore()
    setTimeout(() => {
        displayScore()
    }, 1500)

    async function displayScore() {
        let points = await getSetting('points'),
            level = Math.floor(Math.sqrt(points.total + 9) - 3),
            pointsRequired = 2 * level + 7,
            pointsProgress = Math.floor(points.total - (level ** 2 + 6 * level))
        levelElem.dataset.level = level + 1
        gmCardLevel.innerText = level + 1
        progressFilled.style.setProperty('--level-progress', pointsProgress / pointsRequired)
        gmCardProgressFilled.style.setProperty('--level-progress', pointsProgress / pointsRequired)
        gmCardProgress.dataset.pointsProgress = pointsProgress
        gmCardProgress.dataset.pointsRequired = pointsRequired
        gmCardProgress.dataset.pointsRemaining = pointsRequired - pointsProgress
        gmCardProgress.dataset.levelNext = level + 2
        gmCardDivision.innerText = ''

        for (const key in points) {
            if (Object.hasOwnProperty.call(points, key)) {
                const value = points[key].v,
                    count = points[key].n,
                    title = scoringTitles[key]
                if (!value || !count || !title || count < 1) continue
                let element = document.createElement('div')
                gmCardDivision.append(element)
                element.innerText = `${title} (${count}×)`
                element.dataset.value = value.toLocaleString('nl-NL', { maximumFractionDigits: 2 })
            }
        }

        let total = document.createElement('div')
        gmCardDivision.append(total)
        total.innerText = "Totaal"
        total.classList.add('total')
        total.dataset.value = points.total.toLocaleString('nl-NL', { maximumFractionDigits: 2 })
    }
}