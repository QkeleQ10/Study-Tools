let magisterApiCache = {},
    magisterApiUserId,
    magisterApiUserToken,
    magisterApiUserTokenDate,
    magisterApiSchoolName = window.location.hostname.split('.')[0],
    magisterApiPermissions = []

now = new Date()

const gatherStart = new Date()
gatherStart.setDate(now.getDate() - (now.getDay() + 6) % 7)
gatherStart.setHours(0, 0, 0, 0)

const gatherEarlyStart = new Date()
gatherEarlyStart.setDate(now.getDate() - 42)
gatherEarlyStart.setHours(0, 0, 0, 0)

const gatherEnd = new Date()
gatherEnd.setDate(now.getDate() + 42)
gatherEnd.setHours(0, 0, 0, 0)

const MagisterApi = {
    useSampleData: false,
    accountInfo: async () => {
        return new Promise(async (resolve, reject) => {
            magisterApiCache.accountInfo ??=
                fetchWrapper(
                    `https://${magisterApiSchoolName}.magister.net/api/account?noCache=0`, null, 'accountInfo'
                )
            resolve(
                (await magisterApiCache.accountInfo)
            )
            magisterApiPermissions = (await magisterApiCache.accountInfo)?.Groep?.[0]?.Privileges?.filter(p => p.AccessType.includes('Read')).map(p => p.Naam)
        })
    },
    years: async () => {
        return new Promise(async (resolve, reject) => {
            magisterApiCache.years ??=
                fetchWrapper(
                    `https://${magisterApiSchoolName}.magister.net/api/leerlingen/$USERID/aanmeldingen?begin=2013-01-01&einde=${new Date().getFullYear() + 1}-01-01`, null, 'years'
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
                    `https://${magisterApiSchoolName}.magister.net/api/aanmeldingen/${year?.id}`, null, 'yearInfo'
                )
            resolve(
                (await magisterApiCache['yearInfo' + year?.id])
            )
        })
    },
    exams: {
        list: async (year) => {
            return new Promise(async (resolve, reject) => {
                magisterApiCache['examsList' + year?.id] ??=
                    fetchWrapper(
                        `https://${magisterApiSchoolName}.magister.net/api/aanmeldingen/${year?.id}/examens`, null, 'examsList'
                    )
                resolve(
                    (await magisterApiCache['examsList' + year?.id])?.items || null
                )
            })
        },
        info: async (year) => {
            return new Promise(async (resolve, reject) => {
                magisterApiCache['examsInfo' + year?.id] ??=
                    fetchWrapper(
                        `https://${magisterApiSchoolName}.magister.net/api/aanmeldingen/${year?.id}/examen`, null, 'examsInfo', true
                    )
                resolve(
                    (await magisterApiCache['examsInfo' + year?.id]) || {}
                )
            })
        }
    },
    events: async (start = gatherStart, end = gatherEnd) => {
        if (MagisterApi.useSampleData) {
            return [{ "Docenten": [{ "Naam": "O. Baguette", "Docentcode": "OBA" }], "Start": now.toISOString().split('T')[0] + " 09:00", "Einde": now.toISOString().split('T')[0] + " 10:00", "Id": 1, "InfoType": 0, "Inhoud": null, "LesuurTotMet": 2, "LesuurVan": 2, "Lokalen": [{ "Naam": "11s" }], "Omschrijving": "fatl - oba", "Lokatie": "11s", "Status": 5, "Vakken": [{ "Naam": "Franse taal" }] }, { "Docenten": [{ "Naam": "G. Gifje", "Docentcode": "GIF" }], "Start": now.toISOString().split('T')[0] + " 10:00", "Einde": now.toISOString().split('T')[0] + " 11:00", "Id": 2, "InfoType": 0, "Inhoud": null, "LesuurTotMet": 3, "LesuurVan": 3, "Lokalen": [{ "Naam": "11s" }], "Omschrijving": "mem - gif", "Lokatie": "11s", "Vakken": [{ "Naam": "memekunde" }] }, { "Docenten": [{ "Naam": "M. Millenial", "Docentcode": "MMI" }], "Start": now.toISOString().split('T')[0] + " 11:30", "Einde": now.toISOString().split('T')[0] + " 12:30", "Id": 3, "InfoType": 0, "Inhoud": null, "LesuurTotMet": 4, "LesuurVan": 4, "Lokalen": [{ "Naam": "11l" }], "Omschrijving": "stk - mmi", "Lokatie": "11l", "Vakken": [{ "Naam": "straattaalkunde" }] }, { "Docenten": [{ "Id": 0, "Naam": "E. Musk", "Docentcode": "EMU" }], "Start": now.toISOString().split('T')[0] + " 12:30", "Einde": now.toISOString().split('T')[0] + " 13:30", "Id": 4, "InfoType": 0, "Inhoud": null, "LesuurTotMet": 5, "LesuurVan": 5, "Lokalen": [{ "Naam": "binas6" }], "Omschrijving": "na - emu", "Lokatie": "binas6", "Vakken": [{ "Naam": "natuurkunde" }] }, { "Docenten": [{ "Id": 0, "Naam": "B. Baan", "Docentcode": "BBA" }], "Start": now.toISOString().split('T')[0] + " 14:00", "Einde": now.toISOString().split('T')[0] + " 15:00", "Id": 5, "InfoType": 0, "Inhoud": null, "LesuurTotMet": 6, "LesuurVan": 6, "Lokalen": [{ "Naam": "at1_ondersteboven" }], "Omschrijving": "ka - bba", "Lokatie": "at1_ondersteboven", "Type": 7, "Vakken": [{ "Naam": "kinderarbeid" }] }, { Start: new Date(new Date().setHours(0, 0, 0, 0) + 122400000), Einde: new Date(new Date().setHours(0, 0, 0, 0) + 125100000), Inhoud: "<p>Dit is een onvoltooid huiswerkitem.</p>", Opmerking: null, InfoType: 1, Afgerond: false, "Docenten": [{ "Naam": "O. Baguette", "Docentcode": "OBA" }], Vakken: [{ Naam: "Niet-bestaand vak" }] }, { Start: new Date(new Date().setHours(0, 0, 0, 0) + 297900000), Einde: new Date(new Date().setHours(0, 0, 0, 0) + 300600000), Inhoud: "<p>In deze les heb je een schriftelijke overhoring. Neem je oortjes mee.</p>", Opmerking: null, InfoType: 2, Afgerond: false, "Docenten": [{ "Naam": "O. Baguette", "Docentcode": "OBA" }], Vakken: [{ Naam: "Lichamelijke opvoeding" }] }, { Start: new Date(new Date().setHours(0, 0, 0, 0) + 297900000), Einde: new Date(new Date().setHours(0, 0, 0, 0) + 300600000), Inhoud: "<p>Dit item heb je al wel voltooid. Good job.</p>", Opmerking: null, InfoType: 1, Afgerond: true, "Docenten": [{ "Naam": "O. Baguette", "Docentcode": "OBA" }], Vakken: [{ Naam: "Jouw favoriete vak" }] }]
        }
        return new Promise(async (resolve, reject) => {
            magisterApiCache['events' + start.toISOString().substring(0, 10) + end.toISOString().substring(0, 10)] ??=
                fetchWrapper(
                    `https://${magisterApiSchoolName}.magister.net/api/personen/$USERID/afspraken?van=${start.toISOString().substring(0, 10)}&tot=${end.toISOString().substring(0, 10)}`, null, 'events'
                )
            resolve(
                (await magisterApiCache['events' + start.toISOString().substring(0, 10) + end.toISOString().substring(0, 10)])?.Items || null
            )
        })
    },
    grades: {
        recent: async () => {

            if (MagisterApi.useSampleData) {
                return [{ omschrijving: "Voorbeeld", ingevoerdOp: new Date(now - 172800000), vak: { code: "netl", omschrijving: "Nederlandse taal" }, waarde: "6,9", weegfactor: 0, isVoldoende: true }, { omschrijving: "Baguette", ingevoerdOp: new Date(now - 691200000), vak: { code: "fatl", omschrijving: "Franse taal" }, waarde: "U", weegfactor: 0, isVoldoende: true }, { omschrijving: "Grade mockery", ingevoerdOp: new Date(now - 6891200000), vak: { code: "entl", omschrijving: "Engelse taal" }, waarde: "5,4", weegfactor: 0 }
                ]
            }
            return new Promise(async (resolve, reject) => {
                magisterApiCache.gradesRecent ??=
                    fetchWrapper(
                        `https://${magisterApiSchoolName}.magister.net/api/personen/$USERID/cijfers/laatste?top=20&skip=0`, null, 'grades.recent'
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
                        `https://${magisterApiSchoolName}.magister.net/api/personen/$USERID/aanmeldingen/${year?.id}/cijfers/cijferoverzichtvooraanmelding?actievePerioden=false&alleenBerekendeKolommen=false&alleenPTAKolommen=false&peildatum=${year.einde}`, null, 'grades.forYear'
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
                        `https://${magisterApiSchoolName}.magister.net/api/personen/$USERID/aanmeldingen/${year?.id}/cijfers/extracijferkolominfo/${columnId}`, null, 'grades.columnInfo'
                    )
                resolve(
                    (await magisterApiCache['gradesYear' + year?.id + 'Col' + columnId]) || {}
                )
            })
        }
    },
    assignments: {
        top: async () => {
            if (MagisterApi.useSampleData) {
                return [{ Titel: "Praktische opdracht", Vak: "sk", InleverenVoor: new Date(new Date().setHours(0, 0, 0, 0) + 300600000), Omschrijving: "Zorg ervoor dat je toestemming hebt van de TOA voordat je begint met je experiment." }, { Titel: "Boekverslag", Vak: "netl", InleverenVoor: new Date(new Date().setHours(0, 0, 0, 0) + 400500000) }]
            }
            return new Promise(async (resolve, reject) => {
                magisterApiCache.assignments ??=
                    fetchWrapper(
                        `https://${magisterApiSchoolName}.magister.net/api/personen/$USERID/opdrachten?top=20&skip=0&startdatum=${gatherEarlyStart.toISOString().substring(0, 10)}&einddatum=${gatherEnd.toISOString().substring(0, 10)}`, null, 'assignments.top'
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
                        `https://${magisterApiSchoolName}.magister.net/api/personen/$USERID/opdrachten?top=250&startdatum=${year.begin}&einddatum=${year.einde}`, null, 'assignments.forYear'
                    )
                resolve(
                    (await magisterApiCache['assignmentsYear' + year?.id])?.Items || []
                )
            })
        }
    },
    messages: async () => {
        if (MagisterApi.useSampleData) {
            return [{ onderwerp: "🔥😂💚🍀😔🐜😝🙏👍🪢💀☠️", afzender: { naam: "Quinten Althues (V6E)" }, heeftBijlagen: true, verzondenOp: new Date(now - 3032000000) }, { onderwerp: "Wie gebruikt Berichten in vredesnaam?", afzender: { naam: "Quinten Althues (V6E)" }, heeftPrioriteit: true, verzondenOp: new Date(now - 1000000) }
            ]
        }
        return new Promise(async (resolve, reject) => {
            magisterApiCache.messages ??=
                fetchWrapper(
                    `https://${magisterApiSchoolName}.magister.net/api/berichten/postvakin/berichten?top=20&skip=0&gelezenStatus=ongelezen`, null, 'messages'
                )
            resolve(
                (await magisterApiCache.messages)?.items || []
            )
        })
    },
    activities: async () => {
        if (MagisterApi.useSampleData) {
            return [null]
        }
        return new Promise(async (resolve, reject) => {
            magisterApiCache.activities ??=
                fetchWrapper(
                    `https://${magisterApiSchoolName}.magister.net/api/personen/$USERID/activiteiten?status=NogNietAanEisVoldaan`, null, 'activities'
                )
            resolve(
                (await magisterApiCache.activities)?.Items || []
            )
        })
    },
    logs: async () => {
        if (MagisterApi.useSampleData) {
            return [null]
        }
        return new Promise(async (resolve, reject) => {
            magisterApiCache.logs ??=
                fetchWrapper(
                    `https://${magisterApiSchoolName}.magister.net/api/leerlingen/$USERID/logboeken/count`, null, 'logs'
                )
            resolve(
                Array((await magisterApiCache.logs).count || 0) || []
            )
        })
    },
    absences: {
        forYear: async (year) => {
            return new Promise(async (resolve, reject) => {
                magisterApiCache['absencesYear' + year?.id] ??=
                    fetchWrapper(
                        `https://${magisterApiSchoolName}.magister.net/api/personen/$USERID/absenties?van=${year.begin}&tot=${year.einde}`, null, 'absences'
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
async function fetchWrapper(url, options, identifier = 'unknown', quiet = false) {
    const calledAt = new Date()

    const promiseReq = new Promise(async (resolve, reject) => {
        if (!magisterApiUserId || !magisterApiUserToken) {
            await updateApiCredentials(identifier)
                .catch(err => console.error(err))
        }

        const res1 = await fetch(url.replace(/(\$USERID)/gi, magisterApiUserId), {
            headers: {
                Authorization: magisterApiUserToken,
                'X-Request-Source': 'study-tools'
            }, ...options
        })

        // Resolve if no errors
        if (res1.ok) {
            const json = await res1.json()
            if (verbose) console.info(`APIRQ OK after ${new Date() - calledAt} ms (@ ${identifier})`)
            return resolve(json)
        }

        if (verbose) console.info(`APIRQ ERR: ${res1.status}. Retrying... (@ ${identifier})`)

        // Reject when forbidden (e.g. feature disabled by school)
        if (res1.status === 403) {
            return resolve({})
        }

        // Reject when ratelimit is hit
        if (res1.status === 429 && !quiet) {
            notify('snackbar', `Verzoeksquotum overschreden\nWacht even, vernieuw de pagina en probeer het opnieuw`)
            return resolve({})
        }

        // If it's not a ratelimit, retry one more time. Also forcibly refresh from memory.
        await updateApiCredentials(identifier)
            .catch(err => console.error(err))

        // Retry with a second request
        const res2 = await fetch(url.replace(/(\$USERID)/gi, magisterApiUserId), {
            headers: {
                Authorization: magisterApiUserToken,
                'X-Request-Source': 'study-tools'
            }, ...options
        })

        // Resolve if no errors
        if (res2.ok) {
            const json = await res2.json()
            if (verbose) console.info(`APIRQ OK after ${new Date() - calledAt} ms: Succeeded on second try. (@ ${identifier})`)
            return resolve(json)
        }

        if (verbose) console.info(`APIRQ ERR: ${res1.status}. Resolving empty. (@ ${identifier})`)

        // Reject when forbidden (e.g. feature disabled by school)
        if (res2.status === 403) {
            return resolve({})
        }

        // Reject when ratelimit is hit
        if (res2.status === 429 && !quiet) {
            notify('snackbar', `Verzoeksquotum overschreden\nWacht even, vernieuw de pagina en probeer het opnieuw`)
            return resolve({})
        }

        // Handle other errors
        if (!quiet) {
            notify(
                'snackbar',
                `Fout ${res2.status}. Vernieuw de pagina.`,
                [
                    { innerText: "Hulp", expandToDialog: "Probeer eerst wat achtergrondprogramma's te sluiten en de pagina te vernieuwen.\n\nBlijf je problemen ervaren? Druk op Ctrl + Shift + J en volg de aanwijzingen in het blauw." }
                ],
                120000
            )
            console.log("%cBlijf je problemen ervaren? Neem contact op via e-mail (quinten@althues.nl) of Discord (https://discord.gg/2rP7pfeAKf) en stuur een screenshot van onderstaande foutmelding mee:", 'background-color: hsl(207 95 55); color: #fff; padding: 10px 20px; font: 600 13px system-ui;')
        }
        console.error(`APIRQ: ${res2.status}\n\nurl: ${url}\nuserId: ${magisterApiUserId}\nuserToken.length: ${magisterApiUserToken?.length} (@ ${identifier})`)
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
            if (!quiet) {
                notify(
                    'snackbar',
                    `Er is iets misgegaan. Vernieuw de pagina.`,
                    [
                        { innerText: "Hulp", expandToDialog: "Probeer eerst wat achtergrondprogramma's te sluiten en de pagina te vernieuwen.\n\nBlijf je problemen ervaren? Druk op Ctrl + Shift + J en volg de aanwijzingen in het blauw." }
                    ],
                    120000
                )
                console.log("%cBlijf je problemen ervaren? Neem contact op via e-mail (quinten@althues.nl) of Discord (https://discord.gg/2rP7pfeAKf) en stuur een screenshot van onderstaande foutmelding mee:", 'background-color: hsl(207 95 55); color: #fff; padding: 10px 20px; font: 600 13px system-ui;')
            }
            console.error(`APIRQ: ${err}\n\nurl: ${url}\nuserId: ${magisterApiUserId}\nuserToken.length: ${magisterApiUserToken?.length} (@ ${identifier})`)
            return ({})
        })
}

/**
 * Retrieve the latest credentials information from memory.
 * @returns {Promise<Object>} Object containing userId and token
 */
async function updateApiCredentials(identifier = 'unknown') {
    let isCancelled = false

    now = new Date()
    const calledAt = new Date()

    const timeInit = new Date()

    const promiseMemory = new Promise(getApiCredentialsMemory)

    return Promise.race([
        promiseMemory,
        new Promise((resolve, reject) => {
            // Reject after 4 seconds
            setTimeout(() => {
                isCancelled = true
                reject(new Error("Timed out"))
            }, 4000)
        })
    ])
        .catch(err => {
            console.error(`CREDS ERR: ${err} (@ ${identifier})`)
        })

    async function getApiCredentialsMemory(resolve, reject) {
        let storageLocation = chrome.storage.session?.get ? 'session' : 'local'
        now = new Date()

        if (!(magisterApiUserId?.length > 1)) {
            magisterApiUserId = await getFromStorage('user-id', 'sync')
        }

        magisterApiUserToken = await getFromStorage('token', storageLocation) || magisterApiUserToken
        magisterApiUserTokenDate = await getFromStorage('token-date', storageLocation) || magisterApiUserTokenDate

        if (magisterApiUserId && magisterApiUserToken && magisterApiUserTokenDate && new Date(magisterApiUserTokenDate)) {
            if (Math.abs(now - new Date(magisterApiUserTokenDate)) < 60000) {
                resolve({ userId: magisterApiUserId, token: magisterApiUserToken })
                if (verbose) console.info(`CREDS OK after ${now - calledAt} ms (@ ${identifier})\nuserId: ${magisterApiUserId}\nuserToken.length: ${magisterApiUserToken?.length}\nuserTokenDate: ${new Date(magisterApiUserTokenDate).toTimeString().split(' ')[0]} (${Math.abs(now - new Date(magisterApiUserTokenDate))} ms ago)`)
            } else {
                if (new Date() - timeInit < 3000) {
                    if (verbose) console.info(`CREDS WARN after ${now - calledAt} ms: Data too old! (@ ${identifier})\nuserId: ${magisterApiUserId}\nuserToken.length: ${magisterApiUserToken?.length}\nuserTokenDate: ${new Date(magisterApiUserTokenDate).toTimeString().split(' ')[0]} (${Math.abs(now - new Date(magisterApiUserTokenDate))} ms ago)`)
                    resolve({ userId: magisterApiUserId, token: magisterApiUserToken })
                } else {
                    if (isCancelled) return reject(new Error("Timed out"))
                    if (verbose) console.info(`CREDS WARN: Data too old! Retrying... (@ ${identifier})`)
                    setTimeout(() => getApiCredentialsMemory(resolve, reject), 200)
                }
            }
        } else {
            if (isCancelled) return reject(new Error("Timed out"))
            if (verbose) console.info(`CREDS INFO: Data incomplete! Retrying... (@ ${identifier})\nuserId: ${magisterApiUserId}\nuserToken.length: ${magisterApiUserToken?.length}\nuserTokenDate: ${new Date(magisterApiUserTokenDate).toTimeString().split(' ')[0]} (${Math.abs(now - new Date(magisterApiUserTokenDate))} ms ago)`)
            setTimeout(() => getApiCredentialsMemory(resolve, reject), 200)
        }
    }
}
