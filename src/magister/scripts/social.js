social()

async function social() {
    let appbarLevel = document.getElementById('st-appbar-level') || document.createElement('div'),
        points = await getSetting('points')
    document.body.append(appbarLevel)
    appbarLevel.id = 'st-level'
    appbarLevel.classList.add('st-metric')
    appbarLevel.dataset.description = 'Level'
    appbarLevel.innerText = Math.round(points / 10)
    appbarLevel.setAttribute('style', `--level-progress: ${(points % 10) * 10}%;`)
}