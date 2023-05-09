// Run at start and when the URL changes
popstate()
window.addEventListener('popstate', popstate)
async function popstate() {
    if (document.location.href.split('?')[0].endsWith('/vandaag')) gamification()
}

async function gamification() {
    let mainContainer = await getElement('section.main'),
        levels = document.getElementById('st-level') || document.createElement('div'),
        progress = document.getElementById('st-progress') || document.createElement('div')
    points = await getSetting('points')
    mainContainer.append(levels, progress)
    levels.id = 'st-level'
    // levels.classList.add('st-metric')
    levels.dataset.description = 'Level'
    levels.innerText = Math.round(points / 10)
    progress.id = 'st-progress'
    progress.dataset.progress = Math.round(points % 10)
    progress.dataset.required = '10'
    progress.setAttribute('style', `--level-progress: ${(points % 10) * 10}%;`)
}