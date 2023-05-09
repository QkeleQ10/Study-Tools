let token,
    userId,
    date

chrome.webRequest.onSendHeaders.addListener(async e => {
    if (date - new Date() < 10000) return
    Object.values(e.requestHeaders).forEach(async obj => {
        if (obj.name === 'Authorization' && token !== obj.value) token = obj.value
    })
    if (e.url.split('/api/personen/')[1]?.split('/')[0].length > 2) userId = e.url.split('/api/personen/')[1].split('/')[0]
    date = new Date()
    const currentGradesRes = await fetch(`https://amadeuslyceum.magister.net/api/personen/${userId}/cijfers/laatste?top=200`, {
        headers: {
            Authorization: token
        }
    })
    const currentGrades = (await currentGradesRes.json()).items
    let points = calculatePoints(currentGrades)
    chrome.storage.sync.set({points: points})
}, { urls: ['*://*.magister.net/api/personen/*'] }, ['requestHeaders', 'extraHeaders'])

function calculatePoints(currentGrades) {
    // currentGrades: This year's grades are a factor for the amount of points. The most recent grades have a heavy weight, whereas older grades have less of an impact
    // TODO: Should resits be penalised or rewarded?
    // TODO: absences, assignments, past years

    let array = []

    currentGrades.forEach((e, i, a) => {
        let result = Number(e.waarde.replace(',', '.')),
            previousResult,
            importance = 15 / (1 + 0.02 * Math.E ** (0.3 * i))
        if (importance < 0) importance = 0
        if (Number.isNaN(result)) return
        currentGrades.forEach(g => {
            if (new Date(e.ingevoerdOp) <= new Date(g.ingevoerdOp)) return
            if (e.omschrijving === g.omschrijving) previousResult = Number(g.waarde.replace(',', '.'))
        })
        array.push({ result, importance, previousResult })
    })

    // const currentGradesPts = array.reduce((total, next) => total + next.result * next.importance, 0) / 25
    const currentGradesPts = array.reduce((total, next) => total + next.result, 0)

    return currentGradesPts
}