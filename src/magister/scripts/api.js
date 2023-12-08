let magisterApiCache = {},
    magisterApiUserId,
    magisterApiUserToken,
    magisterApiSchoolName = window.location.hostname.split('.')[0]

now = new Date()

const gatherStart = new Date()
gatherStart.setDate(now.getDate() - (now.getDay() + 6) % 7)
gatherStart.setHours(0, 0, 0, 0)

const gatherEnd = new Date()
gatherEnd.setDate(now.getDate() + 42)
gatherEnd.setHours(0, 0, 0, 0)

const MagisterApi = {
    accountInfo: async () => {
        return new Promise(async (resolve, reject) => {
            magisterApiCache.accountInfo ??=
                fetchWrapper(
                    `https://${window.location.hostname.split('.')[0]}.magister.net/api/account?noCache=0`
                )
            resolve(
                (await magisterApiCache.accountInfo)
            )
        })
    },
    events: async () => {
        return new Promise(async (resolve, reject) => {
            magisterApiCache.events ??=
                fetchWrapper(
                    `https://${magisterApiSchoolName}.magister.net/api/personen/$USERID/afspraken?van=${gatherStart.toISOString().substring(0, 10)}&tot=${gatherEnd.toISOString().substring(0, 10)}`
                )
            resolve(
                (await magisterApiCache.events)?.Items || []
            )
        })
    },
    grades: {
        recent: async () => {
            return new Promise(async (resolve, reject) => {
                magisterApiCache.gradesRecent ??=
                    fetchWrapper(
                        `https://${window.location.hostname.split('.')[0]}.magister.net/api/personen/$USERID/cijfers/laatste?top=12&skip=0`
                    )
                resolve(
                    (await magisterApiCache.gradesRecent)?.items || []
                )
            })
        }
    },
    assignments: async () => {
        return new Promise(async (resolve, reject) => {
            magisterApiCache.assignments ??=
                fetchWrapper(
                    `https://${window.location.hostname.split('.')[0]}.magister.net/api/personen/$USERID/opdrachten?top=12&skip=0&startdatum=${gatherStart.toISOString().substring(0, 10)}&einddatum=${gatherEnd.toISOString().substring(0, 10)}`
                )
            resolve(
                (await magisterApiCache.assignments)?.Items || []
            )
        })
    },
    messages: async () => {
        return new Promise(async (resolve, reject) => {
            magisterApiCache.messages ??=
                fetchWrapper(
                    `https://${window.location.hostname.split('.')[0]}.magister.net/api/berichten/postvakin/berichten?top=12&skip=0&gelezenStatus=ongelezen`
                )
            resolve(
                (await magisterApiCache.messages)?.items || []
            )
        })
    },
    activities: async () => {
        return new Promise(async (resolve, reject) => {
            magisterApiCache.activities ??=
                fetchWrapper(
                    `https://${window.location.hostname.split('.')[0]}.magister.net/api/personen/$USERID/activiteiten?status=NogNietAanEisVoldaan`
                )
            resolve(
                (await magisterApiCache.activities)?.Items || []
            )
        })
    },
    logs: async () => {
        return new Promise(async (resolve, reject) => {
            magisterApiCache.logs ??=
                fetchWrapper(
                    `https://${window.location.hostname.split('.')[0]}.magister.net/api/leerlingen/$USERID/logboeken/count`
                )
            resolve(
                Array((await magisterApiCache.logs).count) || []
            )
        })
    },
}

async function getMagisterApiCredentials() {
    const promiseReq = new Promise(async (resolve) => {
        let req = await chrome.runtime.sendMessage({ action: 'getCredentials' })
        magisterApiUserId = req.apiUserId
        magisterApiUserToken = req.apiUserToken
        resolve({ apiUserId: magisterApiUserId, apiUserToken: magisterApiUserToken })
    })
    const promiseCache = new Promise((resolve) => setTimeout(async () => {
        magisterApiUserId = await getFromStorage('user-id', 'local')
        magisterApiUserToken = await getFromStorage('token', 'local')
        resolve({ apiUserId: magisterApiUserId, apiUserToken: magisterApiUserToken })
    }, 2500))
    const promiseTime = new Promise((resolve, reject) => setTimeout(reject, 5000, 'Timeout exceeded!'))

    return Promise.race([promiseReq, promiseCache, promiseTime])
}

// Wrapper for fetch().json()
async function fetchWrapper(url, options) {
    const promiseReq = new Promise(async (resolve, reject) => {

        await getMagisterApiCredentials()

        const res1 = await fetch(url.replace(/(\$USERID)/gi, magisterApiUserId), { headers: { Authorization: magisterApiUserToken }, ...options })

        // Resolve if no errors
        if (res1.ok) {
            const json = await res1.json()
            return resolve(json)
        }

        // Reject when ratelimit is hit
        if (res1.status === 429) {
            notify('snackbar', `Verzoeksquotum overschreden\nWacht even, vernieuw de pagina en probeer het opnieuw`)
            return reject(res1.status)
        }

        // If it's not a ratelimit, retry one more time.
        await getMagisterApiCredentials()

        // Retry with a second request
        const res2 = await fetch(url.replace(/(\$USERID)/gi, magisterApiUserId), { headers: { Authorization: magisterApiUserToken }, ...options })

        // Resolve if no errors
        if (res2.ok) {
            const json = await res2.json()
            return resolve(json)
        }

        // Reject when ratelimit is hit
        if (res2.status === 429) {
            notify('snackbar', `Verzoeksquotum overschreden\nWacht even, vernieuw de pagina en probeer het opnieuw`)
            return reject(res2.status)
        }

        // Handle other errors
        notify(
            'snackbar',
            `Er is iets misgegaan. Druk op Ctrl + Shift + J en stuur me een screenshot!`,
            [
                { innerText: "e-mail", href: `mailto:quinten@althues.nl` },
                { innerText: "Discord", href: `https://discord.gg/RVKXKyaS6y` }
            ],
            120000
        )
        console.log(`Het zou me erg helpen als je een screenshot of kopie van de volgende informatie doorstuurt via e-mail (quinten@althues.nl) of Discord (https://discord.gg/RVKXKyaS6y) 💚`)
        console.error(`Error ${res2.status} occurred while processing a network request. Details:\n\nurl: ${url}\nuserId: ${magisterApiUserId}\nuserToken.length: ${magisterApiUserToken.length}`)
        return reject(res2.status)
    })

    const promiseTime = new Promise((resolve, reject) => setTimeout(reject, 5000, 'Timeout exceeded!'))

    return Promise.race([promiseReq, promiseTime])
}
