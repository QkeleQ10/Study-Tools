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
    if (verbose) console.info("CREDS START.")

    const timeInit = new Date()

    const promiseMemory = new Promise(getApiCredentialsMemory)

    return Promise.race([
        promiseMemory,
        new Promise((resolve, reject) => {
            // Reject after 5 seconds
            setTimeout(() => reject(new Error("Timed out")), 5000)
        })
    ])
        .catch(err => {
            console.error(`CREDS ERR: ${err}.`)
        })

    async function getApiCredentialsMemory(resolve, reject) {
        let storageLocation = chrome.storage.session?.get ? 'session' : 'local'
        now = new Date()

        if (!(magisterApiUserId?.length > 1))
            magisterApiUserId = await getFromStorage('user-id', 'sync')
        magisterApiUserToken = await getFromStorage('token', storageLocation) || magisterApiUserToken
        magisterApiUserTokenDate = await getFromStorage('token-date', storageLocation) || magisterApiUserTokenDate

        if (magisterApiUserId && magisterApiUserToken && magisterApiUserTokenDate && new Date(magisterApiUserTokenDate) && Math.abs(now - new Date(magisterApiUserTokenDate)) < 30000) {
            resolve({ userId: magisterApiUserId, token: magisterApiUserToken })
            if (verbose) console.info(`CREDS OK: userId: ${magisterApiUserId} | userToken.length: ${magisterApiUserToken?.length}`)
        } else {
            if (new Date() - timeInit < 3000) {
                if (verbose) console.info(`CREDS OK: Data too old! userId: ${magisterApiUserId} | userToken.length: ${magisterApiUserToken?.length}`)
                resolve({ userId: magisterApiUserId, token: magisterApiUserToken })
            } else {
                if (verbose) console.info("CREDS ERR: Data too old! Retrying...")
                getApiCredentialsMemory(resolve, reject)
            }
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
            magisterApiCache['yearInfo' + year?.id] ??=
                fetchWrapper(
                    `https://${magisterApiSchoolName}.magister.net/api/aanmeldingen/${year?.id}`
                )
            resolve(
                (await magisterApiCache['yearInfo' + year?.id])
            )
        })
    },
    examInfo: async (year) => {
        return new Promise(async (resolve, reject) => {
            magisterApiCache['examInfo' + year?.id] ??=
                fetchWrapper(
                    `https://${magisterApiSchoolName}.magister.net/api/aanmeldingen/${year?.id}/examen`
                )
            resolve(
                (await magisterApiCache['examInfo' + year?.id])
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
                magisterApiCache['gradesYear' + year?.id] ??=
                    fetchWrapper(
                        `https://${magisterApiSchoolName}.magister.net/api/personen/$USERID/aanmeldingen/${year?.id}/cijfers/cijferoverzichtvooraanmelding?actievePerioden=false&alleenBerekendeKolommen=false&alleenPTAKolommen=false&peildatum=${year.einde}`
                    )
                resolve(
                    (await magisterApiCache['gradesYear' + year?.id])?.Items || []
                )
            })
        },
        columnInfo: async (year, columnId) => {
            return new Promise(async (resolve, reject) => {
                magisterApiCache['gradesYear' + year?.id + 'Col' + columnId] ??=
                    fetchWrapper(
                        `https://${magisterApiSchoolName}.magister.net/api/personen/$USERID/aanmeldingen/${year?.id}/cijfers/extracijferkolominfo/${columnId}`
                    )
                resolve(
                    (await magisterApiCache['gradesYear' + year?.id + 'Col' + columnId]) || {}
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
                magisterApiCache['assignmentsYear' + year?.id] ??=
                    fetchWrapper(
                        `https://${magisterApiSchoolName}.magister.net/api/personen/$USERID/opdrachten?top=250&startdatum=${year.begin}&einddatum=${year.einde}`
                    )
                resolve(
                    (await magisterApiCache['assignmentsYear' + year?.id])?.Items || []
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
                magisterApiCache['absencesYear' + year?.id] ??=
                    fetchWrapper(
                        `https://${magisterApiSchoolName}.magister.net/api/personen/$USERID/absenties?van=${year.begin}&tot=${year.einde}`
                    )
                resolve(
                    (await magisterApiCache['absencesYear' + year?.id])?.Items || []
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
        if (!magisterApiUserId || !magisterApiUserToken) {
            await updateApiCredentials()
                .catch(err => console.error(err))
        }

        const res1 = await fetch(url.replace(/(\$USERID)/gi, magisterApiUserId), { headers: { Authorization: magisterApiUserToken }, ...options })

        // Resolve if no errors
        if (res1.ok) {
            const json = await res1.json()
            return resolve(json)
        }

        // Reject when forbidden (e.g. feature disabled by school)
        if (res1.status === 403) {
            return resolve({})
        }

        // Reject when ratelimit is hit
        if (res1.status === 429) {
            notify('snackbar', `Verzoeksquotum overschreden\nWacht even, vernieuw de pagina en probeer het opnieuw`)
            return resolve({})
        }

        if (verbose) console.info(`APIRQ ERR: ${res1.status}. Retrying...`)

        // If it's not a ratelimit, retry one more time. Also forcibly refresh from memory.
        await updateApiCredentials()
            .catch(err => console.error(err))

        // Retry with a second request
        const res2 = await fetch(url.replace(/(\$USERID)/gi, magisterApiUserId), { headers: { Authorization: magisterApiUserToken }, ...options })

        // Resolve if no errors
        if (res2.ok) {
            const json = await res2.json()
            if (verbose) console.info(`APIRQ OK: Succeeded on second try.`)
            return resolve(json)
        }

        // Reject when forbidden (e.g. feature disabled by school)
        if (res2.status === 403) {
            return resolve({})
        }

        // Reject when ratelimit is hit
        if (res2.status === 429) {
            notify('snackbar', `Verzoeksquotum overschreden\nWacht even, vernieuw de pagina en probeer het opnieuw`)
            return resolve({})
        }

        // Handle other errors
        notify(
            'snackbar',
            `Er is iets misgegaan. Druk op Ctrl + Shift + J en stuur me een screenshot!`,
            [
                { innerText: "e-mail", href: `mailto:quinten@althues.nl` },
                { innerText: "Discord", href: `https://discord.gg/2rP7pfeAKf` }
            ],
            120000
        )
        console.log(`Het zou me erg helpen als je een screenshot of kopie van de volgende informatie doorstuurt via e-mail (quinten@althues.nl) of Discord (https://discord.gg/2rP7pfeAKf) 💚`)
        console.error(`APIRQ: ${res2.status}\n\nurl: ${url}\nuserId: ${magisterApiUserId}\nuserToken.length: ${magisterApiUserToken?.length}`)
        return resolve({})
    })

    return Promise.race([
        promiseReq,
        new Promise((resolve, reject) => {
            // Reject after 10 seconds
            setTimeout(() => reject(new Error("Request timed out.")), 10000)
        })
    ])
        .catch(err => {
            notify(
                'snackbar',
                `Er is iets misgegaan. Druk op Ctrl + Shift + J en stuur me een screenshot!`,
                [
                    { innerText: "e-mail", href: `mailto:quinten@althues.nl` },
                    { innerText: "Discord", href: `https://discord.gg/2rP7pfeAKf` }
                ],
                120000
            )
            console.log(`Het zou me erg helpen als je een screenshot of kopie van de volgende informatie doorstuurt via e-mail (quinten@althues.nl) of Discord (https://discord.gg/2rP7pfeAKf) 💚`)
            console.error(`APIRQ: ${err}\n\nurl: ${url}\nuserId: ${magisterApiUserId}\nuserToken.length: ${magisterApiUserToken?.length}`)
            return resolve({})
        })
}
