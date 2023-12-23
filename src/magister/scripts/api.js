let magisterApiCache = {},
    magisterApiUserId,
    magisterApiUserToken,
    magisterApiUserTokenDate,
    magisterApiSchoolName = window.location.hostname.split('.')[0]

now = new Date()

const gatherStart = new Date()
gatherStart.setDate(now.getDate() - (now.getDay() + 6) % 7)
gatherStart.setHours(0, 0, 0, 0)

const gatherEnd = new Date()
gatherEnd.setDate(now.getDate() + 42)
gatherEnd.setHours(0, 0, 0, 0)

/**
 * Retrieve the latest credentials information from memory.
 * @returns {Promise<Object>} Object containing userId and token
 */
async function updateApiCredentials() {
    const promiseMemory = new Promise(getApiCredentialsMemory)
    const promiseTime = new Promise((resolve, reject) => setTimeout(resolve, 5000, `Couldn't retrieve ID and token from memory within 5 seconds.`))

    return Promise.race([promiseMemory, promiseTime])

    async function getApiCredentialsMemory(resolve, reject) {
        let storageLocation = chrome.storage.session?.get ? 'session' : 'local'
        now = new Date()

        magisterApiUserId ??= await getFromStorage('user-id', 'sync')
        magisterApiUserToken = await getFromStorage('token', storageLocation) || magisterApiUserToken
        magisterApiUserTokenDate = await getFromStorage('token-date', storageLocation) || magisterApiUserTokenDate

        if (magisterApiUserId && magisterApiUserToken && magisterApiUserTokenDate && new Date(magisterApiUserTokenDate) && Math.abs(now - new Date(magisterApiUserTokenDate)) < 30000) {
            resolve({ userId: magisterApiUserId, token: magisterApiUserToken })
        } else {
            getApiCredentialsMemory(resolve, reject)
        }
    }
}

const MagisterApi = {
    accountInfo: async () => {
        return new Promise(async (resolve, reject) => {
            magisterApiCache.accountInfo ??=
                fetchWrapper(
                    `https://${magisterApiSchoolName}.magister.net/api/account?noCache=0`
                )
            resolve(
                (await magisterApiCache.accountInfo)
            )
        })
    },
    years: async () => {
        return new Promise(async (resolve, reject) => {
            magisterApiCache.years ??=
                fetchWrapper(
                    `https://${magisterApiSchoolName}.magister.net/api/leerlingen/$USERID/aanmeldingen?begin=2013-01-01&einde=${new Date().getFullYear() + 1}-01-01`
                )
            resolve(
                (await magisterApiCache.years)?.items || []
            )
        })
    },
    yearInfo: async (year) => {
        return new Promise(async (resolve, reject) => {
            magisterApiCache['yearInfo' + year.id] ??=
                fetchWrapper(
                    `https://${magisterApiSchoolName}.magister.net/api/aanmeldingen/${year.id}`
                )
            resolve(
                (await magisterApiCache['yearInfo' + year.id])
            )
        })
    },
    examInfo: async (year) => {
        return new Promise(async (resolve, reject) => {
            magisterApiCache['examInfo' + year.id] ??=
                fetchWrapper(
                    `https://${magisterApiSchoolName}.magister.net/api/aanmeldingen/${year.id}/examen`
                )
            resolve(
                (await magisterApiCache['examInfo' + year.id])
            )
        })
    },
    events: async (start = gatherStart, end = gatherEnd) => {
        return new Promise(async (resolve, reject) => {
            magisterApiCache['events' + start.toISOString().substring(0, 10) + end.toISOString().substring(0, 10)] ??=
                fetchWrapper(
                    `https://${magisterApiSchoolName}.magister.net/api/personen/$USERID/afspraken?van=${start.toISOString().substring(0, 10)}&tot=${end.toISOString().substring(0, 10)}`
                )
            resolve(
                (await magisterApiCache['events' + start.toISOString().substring(0, 10) + end.toISOString().substring(0, 10)])?.Items || []
            )
        })
    },
    grades: {
        recent: async () => {
            return new Promise(async (resolve, reject) => {
                magisterApiCache.gradesRecent ??=
                    fetchWrapper(
                        `https://${magisterApiSchoolName}.magister.net/api/personen/$USERID/cijfers/laatste?top=12&skip=0`
                    )
                resolve(
                    (await magisterApiCache.gradesRecent)?.items || []
                )
            })
        },
        forYear: async (year) => {
            return new Promise(async (resolve, reject) => {
                magisterApiCache['gradesYear' + year.id] ??=
                    fetchWrapper(
                        `https://${magisterApiSchoolName}.magister.net/api/personen/$USERID/aanmeldingen/${year.id}/cijfers/cijferoverzichtvooraanmelding?actievePerioden=false&alleenBerekendeKolommen=false&alleenPTAKolommen=false&peildatum=${year.einde}`
                    )
                resolve(
                    (await magisterApiCache['gradesYear' + year.id])?.Items || []
                )
            })
        },
        columnInfo: async (year, columnId) => {
            return new Promise(async (resolve, reject) => {
                magisterApiCache['gradesYear' + year.id + 'Col' + columnId] ??=
                    fetchWrapper(
                        `https://${magisterApiSchoolName}.magister.net/api/personen/$USERID/aanmeldingen/${year.id}/cijfers/extracijferkolominfo/${columnId}`
                    )
                resolve(
                    (await magisterApiCache['gradesYear' + year.id + 'Col' + columnId]) || {}
                )
            })
        }
    },
    assignments: {
        top: async () => {
            return new Promise(async (resolve, reject) => {
                magisterApiCache.assignments ??=
                    fetchWrapper(
                        `https://${magisterApiSchoolName}.magister.net/api/personen/$USERID/opdrachten?top=12&skip=0&startdatum=${gatherStart.toISOString().substring(0, 10)}&einddatum=${gatherEnd.toISOString().substring(0, 10)}`
                    )
                resolve(
                    (await magisterApiCache.assignments)?.Items || []
                )
            })
        },
        forYear: async (year) => {
            return new Promise(async (resolve, reject) => {
                magisterApiCache['assignmentsYear' + year.id] ??=
                    fetchWrapper(
                        `https://${magisterApiSchoolName}.magister.net/api/personen/$USERID/opdrachten?top=250&startdatum=${year.begin}&einddatum=${year.einde}`
                    )
                resolve(
                    (await magisterApiCache['assignmentsYear' + year.id])?.Items || []
                )
            })
        }
    },
    messages: async () => {
        return new Promise(async (resolve, reject) => {
            magisterApiCache.messages ??=
                fetchWrapper(
                    `https://${magisterApiSchoolName}.magister.net/api/berichten/postvakin/berichten?top=12&skip=0&gelezenStatus=ongelezen`
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
                    `https://${magisterApiSchoolName}.magister.net/api/personen/$USERID/activiteiten?status=NogNietAanEisVoldaan`
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
                    `https://${magisterApiSchoolName}.magister.net/api/leerlingen/$USERID/logboeken/count`
                )
            resolve(
                Array((await magisterApiCache.logs).count) || []
            )
        })
    },
    absences: {
        forYear: async (year) => {
            return new Promise(async (resolve, reject) => {
                magisterApiCache['absencesYear' + year.id] ??=
                    fetchWrapper(
                        `https://${magisterApiSchoolName}.magister.net/api/personen/$USERID/absenties?van=${year.begin}&tot=${year.einde}`
                    )
                resolve(
                    (await magisterApiCache['absencesYear' + year.id])?.Items || []
                )
            })
        }
    },
}

/**
 * Wrapper for fetch().json()
 * @param {number} url
 * @param {Object} options
 * @returns {Promise<Object>}
 */
async function fetchWrapper(url, options) {
    const promiseReq = new Promise(async (resolve, reject) => {

        await updateApiCredentials()

        const res1 = await fetch(url.replace(/(\$USERID)/gi, magisterApiUserId), { headers: { Authorization: magisterApiUserToken }, ...options })

        // Resolve if no errors
        if (res1.ok) {
            const json = await res1.json()
            return resolve(json)
        }

        // Reject when forbidden (e.g. feature disabled by school)
        if (res1.status === 403) {
            return reject(res1.status)
        }

        // Reject when ratelimit is hit
        if (res1.status === 429) {
            notify('snackbar', `Verzoeksquotum overschreden\nWacht even, vernieuw de pagina en probeer het opnieuw`)
            return reject(res1.status)
        }

        // If it's not a ratelimit, retry one more time. Also forcibly refresh from memory.
        await updateApiCredentials()

        // Retry with a second request
        const res2 = await fetch(url.replace(/(\$USERID)/gi, magisterApiUserId), { headers: { Authorization: magisterApiUserToken }, ...options })

        // Resolve if no errors
        if (res2.ok) {
            const json = await res2.json()
            return resolve(json)
        }

        // Reject when forbidden (e.g. feature disabled by school)
        if (res1.status === 403) {
            return reject(res1.status)
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
        console.error(`Error ${res2.status} occurred while processing a network request. Details:\n\nurl: ${url}\nuserId: ${magisterApiUserId}\nuserToken.length: ${magisterApiUserToken?.length}`)
        return reject(res2.status)
    })

    const promiseTime = new Promise((resolve, reject) => setTimeout(reject, 8000, 'Timeout exceeded!'))

    return Promise.race([promiseReq, promiseTime])
}
