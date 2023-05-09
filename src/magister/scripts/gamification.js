// Run at start and when the URL changes
popstate()
window.addEventListener('popstate', popstate)
async function popstate() {
    if (document.location.href.split('?')[0].endsWith('/vandaag')) gamification()
}

async function gamification() {
    let mainContainer = await getElement('section.main'),
        levelElem = document.getElementById('st-level') || document.createElement('div'),
        progressElem = document.getElementById('st-progress') || document.createElement('div'),
        points = await getSetting('points'),
        level = Math.floor(Math.sqrt(points + 9) - 3),
        pointsRequired = 2 * level + 7,
        pointsProgress = Math.floor(points - (level ** 2 + 6 * level))
    mainContainer.append(levelElem, progressElem)
    levelElem.id = 'st-level'
    levelElem.dataset.description = 'Level'
    levelElem.innerText = level
    progressElem.id = 'st-progress'
    console.log(points, pointsRequired)
    progressElem.dataset.progress = pointsProgress
    progressElem.dataset.required = pointsRequired
    progressElem.setAttribute('style', `--level-progress: ${pointsProgress / pointsRequired * 100}%;`)
}