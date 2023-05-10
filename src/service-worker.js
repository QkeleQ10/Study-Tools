let token,
    userId,
    date

chrome.webRequest.onSendHeaders.addListener(async e => {
    if (date - new Date() < 10000) return
    Object.values(e.requestHeaders).forEach(async obj => {
        if (obj.name === 'Authorization' && token !== obj.value) token = obj.value
    })
    if (e.url.split('/personen/')[1]?.split('/')[0].length > 2) userId = e.url.split('/personen/')[1].split('/')[0]
    date = new Date()

    const yearsRes = await fetch(`${e.url.split('/api/')[0]}/api/leerlingen/${userId}/aanmeldingen?begin=2013-01-01&einde=${new Date().getFullYear() + 1}-01-01`, { headers: { Authorization: token } }),
        yearsArray = (await yearsRes.json()).items,
        years = {}


    yearsArray.forEach(async year => {
        console.log(year)
        const gradesRes = await fetch(`${e.url.split('/api/')[0]}/api/personen/${userId}/aanmeldingen/${year.id}/cijfers/cijferoverzichtvooraanmelding?actievePerioden=false&alleenBerekendeKolommen=false&alleenPTAKolommen=false&peildatum=${year.einde}`, { headers: { Authorization: token } })
        const gradesJson = (await gradesRes.json()).Items

        const absencesRes = await fetch(`${e.url.split('/api/')[0]}/api/personen/${userId}/absenties?van=${year.begin}&tot=${year.einde}`, { headers: { Authorization: token } }),
            absencesJson = (await absencesRes.json()).Items

        years[year.id] = { grades: gradesJson, absences: absencesJson, name: year.studie.code }
    })

    // TODO: yearsGrades is VERY USEFUL!!! Perhaps allow the content script and service worker to communicate, so that grade statistics can be gathered more accurately and swiftly?

    function checkRequestsDone() {
        if (Object.keys(years).length !== yearsArray.length) {
            setTimeout(checkRequestsDone, 100)
        } else {
            let points = calculatePoints(years)
            console.info(points)
            chrome.storage.sync.set({ points })
        }
    }
    checkRequestsDone()
}, { urls: ['*://*.magister.net/api/m6/personen*instellingen/desktop?filter=VANDAAG_SCHERM*'] }, ['requestHeaders', 'extraHeaders'])

function calculatePoints(years) {
    // TODO: Should resits be penalised or rewarded? Or should they be treated as separate grades?
    // TODO: absences, assignments
    // TODO: Are points allowed to decrease (when the grade average falls, when absences are added, when assignments are handed in late)
    // TODO: Should certain absences (loopbaanbegeleiding, interne activiteit) be rewarded? Or should they be ignored?

    let points = {
        absences: {},
        grades: {}
    }

    Object.keys(years).forEach((yearId, i, a) => {
        let yearName = years[yearId].name,
            gradesN = 0,
            gradesV = 0,
            absencesN = 0,
            absencesV = 0

        // Sufficient grades 
        years[yearId].grades.filter(e => !Number.isNaN(Number(e.CijferStr?.replace(',', '.'))) && e.CijferKolom.KolomSoort === 1).forEach(grade => {
            let result = Number(grade.CijferStr?.replace(',', '.'))
            if (result < 5.5) return // This prevents point deduction if an insufficient grade is added
            gradesN++
            gradesV += (3 * result - 14)
        })
        gradesV = Math.ceil(gradesV * (0.25 * i + .5))
        points.grades[yearId] = { n: gradesN, v: gradesV, g: yearName }

        // Absences deduct points from the user's score
        years[yearId].absences.filter(e => !e.Geoorloofd).forEach(absence => {
            absencesN++
            absencesV -= 15
        })

        points.absences[yearId] = { n: absencesN, v: absencesV, g: yearName }
    })

    // All points are added up and returned
    points.total = 0
    Object.keys(points).forEach(categoryKey => {
        if (categoryKey === 'total') return
        points[categoryKey].sum = 0
        Object.keys(points[categoryKey]).forEach(yearKey => {
            if (yearKey === 'sum') return
            points[categoryKey].sum += points[categoryKey][yearKey].v
        })
        points.total += points[categoryKey].sum
    })

    if (points.total < 0) points.total = 0

    return points
}