let token,
    userId,
    date

chrome.tabs.query({ url: '*://*.magister.net/magister/#/vandaag*', lastFocusedWindow: true }, function (tabs) {
    console.log(tabs)
});


chrome.webRequest.onSendHeaders.addListener(async e => {
    if (date - new Date() < 10000) return
    Object.values(e.requestHeaders).forEach(async obj => {
        if (obj.name === 'Authorization' && token !== obj.value) token = obj.value
    })
    if (e.url.split('/api/personen/')[1]?.split('/')[0].length > 2) userId = e.url.split('/api/personen/')[1].split('/')[0]
    date = new Date()
    const currentGradesRes = await fetch(`${e.url.split('/api/personen/')[0]}/api/personen/${userId}/cijfers/laatste?top=200`, {
        headers: {
            Authorization: token
        }
    })
    const currentGrades = (await currentGradesRes.json()).items
    let points = calculatePoints(currentGrades)
    chrome.storage.sync.set({ points })
}, { urls: ['*://*.magister.net/api/personen/*'] }, ['requestHeaders', 'extraHeaders'])

function calculatePoints(currentGrades) {
    // currentGrades: The sum of this year's grades (with an offset depending on the grade achieved) are added to the points count.
    // TODO: Should resits be penalised or rewarded? Or should they be treated as separate grades?
    // TODO: absences, assignments, past years
    // TODO: Are points allowed to decrease (when the grade average falls, when absences are added, when assignments are handed in late)

    let array = []

    currentGrades.forEach((e, i, a) => {
        let result = Number(e.waarde.replace(',', '.')),
            previousResult
        if (Number.isNaN(result)) return
        currentGrades.forEach(g => {
            if (new Date(e.ingevoerdOp) <= new Date(g.ingevoerdOp)) return
            if (e.omschrijving === g.omschrijving) previousResult = Number(g.waarde.replace(',', '.'))
        })
        array.push({ result, previousResult })
    })

    let points = {
        g1: { n: 0, v: 0 },
        g2: { n: 0, v: 0 },
        g3: { n: 0, v: 0 },
        g4: { n: 0, v: 0 },
        g5: { n: 0, v: 0 }
    }

    array.forEach(grade => {
        if (grade.result >= 9.5) {
            points.g1.n++
            points.g1.v += grade.result + 6
        } else if (grade.result >= 8.5) {
            points.g2.n++
            points.g2.v += grade.result + 4
        } else if (grade.result >= 7.5) {
            points.g3.n++
            points.g3.v += grade.result + 2
        } else if (grade.result >= 6.5) {
            points.g4.n++
            points.g4.v += grade.result
        } else if (grade.result >= 5.5) {
            points.g5.n++
            points.g5.v += grade.result - 2
        }
    })

    let total = 0

    Object.values(points).forEach(val => {
        total += val.v
    })

    return { ...points, total }
}