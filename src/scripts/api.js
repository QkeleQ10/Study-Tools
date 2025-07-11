class MagisterApi {
    constructor() {
        this.#initialize();
    }

    async #initialize() {
        if (!window.location.pathname.includes('magister')) return;

        this.cache = {};
        this.schoolName = window.location.hostname.split('.')[0];
        this.userId = await this.getFromStorage('user-id', 'sync');
        this.userToken = await getFromStorage('token', chrome.storage.session?.get ? 'session' : 'local');
        this.userTokenDate = await getFromStorage('token-date', chrome.storage.session?.get ? 'session' : 'local');

        this.updateApiCredentials();

        this.permissions = await this.updateApiPermissions();
        this.gatherStart = dates.gatherStart;
        this.gatherEarlyStart = dates.gatherEarlyStart;
        this.gatherEnd = dates.gatherEnd;
        this.useSampleData = false;
    }

    async updateApiCredentials() {
        if (!window.location.pathname.includes('magister')) return;

        const calledAt = new Date();
        const storageLocation = chrome.storage.session?.get ? 'session' : 'local';

        this.userId = await getFromStorage('user-id', 'sync');
        this.userToken = await getFromStorage('token', storageLocation);
        this.userTokenDate = await getFromStorage('token-date', storageLocation);

        if (this.userId && this.userToken && this.userTokenDate && new Date(this.userTokenDate)) {
            if (Math.abs(new Date().getTime() - new Date(this.userTokenDate).getTime()) < 60000) {
                console.debug(`CREDS OK after ${new Date().getTime() - calledAt.getTime()} ms`);
            } else {
                console.info(`CREDS WARN: Data too old! Retrying...`);
                setTimeout(() => this.updateApiCredentials(), 200);
            }
        } else {
            console.info(`CREDS INFO: Data incomplete! Retrying...`);
            setTimeout(() => this.updateApiCredentials(), 200);
        }
    }

    async updateApiPermissions() {
        return new Promise(async (resolve) => {
            this.permissions = (await new MagisterApiRequestAccount().get())?.Groep?.[0]?.Privileges?.filter(p => p.AccessType.includes('Read')).map(p => p.Naam);
            resolve(this.permissions);
        });
    }

    async getFromStorage(key, storageType) {
        return new Promise((resolve) => {
            chrome.storage[storageType].get(key, (result) => {
                resolve(result[key]);
            });
        });
    }

    accountInfo() {
        return new MagisterApiRequestAccount().get();
    }

    years() {
        return new MagisterApiRequestYears().get();
    }

    yearInfo(year) {
        return new MagisterApiRequestYearInfo(year).get();
    }

    examsList(year) {
        return new MagisterApiRequestExamsList(year).get();
    }

    examsInfo(year) {
        return new MagisterApiRequestExamsInfo(year).get();
    }

    events(start = this.gatherStart, end = this.gatherEnd) {
        return new MagisterApiRequestEvents(start, end).get();
    }

    event(id) {
        return new MagisterApiRequestEvent(id).get();
    }

    putEvent(id, body) {
        return new MagisterApiRequestEvent(id).put(body);
    }

    eventAttachment(id) {
        return new MagisterApiRequestEventAttachment(id).get();
    }

    kwtChoices(start = dates.now, end = dates.now) {
        return new MagisterApiRequestKwtChoices(start, end).get();
    }

    gradesRecent() {
        return new MagisterApiRequestGradesRecent().get();
    }

    gradesForYear(year) {
        return new MagisterApiRequestGradesForYear(year).get();
    }

    gradesColumnInfo(year, columnId) {
        return new MagisterApiRequestGradesColumnInfo(year, columnId).get();
    }

    assignmentsTop(start = this.gatherEarlyStart, end = this.gatherEnd) {
        return new MagisterApiRequestAssignmentsTop(start, end).get();
    }

    assignmentsForYear(year) {
        return new MagisterApiRequestAssignmentsForYear(year).get();
    }

    messages() {
        return new MagisterApiRequestMessages().get();
    }

    activities() {
        return new MagisterApiRequestActivities().get();
    }

    logs() {
        return new MagisterApiRequestLogs().get();
    }

    absencesForYear(year) {
        return new MagisterApiRequestAbsencesForYear(year).get();
    }
}

class MagisterApiRequest {
    identifier;
    path;

    constructor() {
    }

    get(options = {}) {

        if (!window.location.pathname.includes('magister')) return Promise.reject();

        if (magisterApi.useSampleData && this.sample) {
            return Promise.resolve(this.sample);
        } else if (!this.identifier || !this.path) {
            return Promise.reject();
        } else if (magisterApi.cache[this.identifier] && !magisterApi.cache[this.identifier].then) {
            return Promise.resolve(magisterApi.cache[this.identifier]);
        } else {
            return this.#fetchWrapper(
                `https://${magisterApi.schoolName}.magister.net/${this.path}`,
                options
            );
        }
    }

    async put(body = {}, options = {}) {
        return new Promise(async (resolve, reject) => {
            if (!window.location.pathname.includes('magister')) reject();

            let res = await fetch(
                `https://${magisterApi.schoolName}.magister.net/${this.path}`.replace(/(\$USERID)/gi, magisterApi.userId),
                {
                    method: 'PUT',
                    body: JSON.stringify(body),
                    headers: {
                        Authorization: magisterApi.userToken,
                        'Content-Type': 'application/json;charset=UTF-8',
                        'X-Request-Source': 'study-tools'
                    },
                    ...options
                }
            );
            resolve(res);
        });
        // this.get({ method: 'PUT', body: JSON.stringify(body), ...options });
    }

    #fetchWrapper(url, options = {}) {
        return new Promise(async (resolve, reject) => {
            if (!window.location.pathname.includes('magister')) reject();

            if (!magisterApi.userId || !magisterApi.userToken) {
                await magisterApi.updateApiCredentials()
                    .catch(err => console.error(err));
            }

            try {
                let res = await this.#executeRequest(url, options);
                resolve(this.#formatOutput(res));
                magisterApi.cache[this.identifier] = this.#formatOutput(res);
            } catch (error) {
                console.error(error);
                try {
                    await new Promise(resolve => setTimeout(resolve, 100));
                    await magisterApi.updateApiCredentials();
                    let res2 = await this.#executeRequest(url, options);
                    resolve(this.#formatOutput(res2));
                    magisterApi.cache[this.identifier] = this.#formatOutput(res2);
                } catch (error) {
                    console.error(error);
                    reject(error);
                }
            }
        });
    }

    #executeRequest(url, options = {}) {
        const calledAt = new Date();
        return new Promise(async (resolve, reject) => {
            if (!window.location.pathname.includes('magister')) reject();

            if (!magisterApi.userId || !magisterApi.userToken) {
                await magisterApi.updateApiCredentials()
                    .catch(err => console.error(err));
            }

            try {
                let res = await fetch(url.replace(/(\$USERID)/gi, magisterApi.userId), {
                    headers: {
                        Authorization: magisterApi.userToken,
                        'X-Request-Source': 'study-tools'
                    },
                    ...options
                });

                if (!res.ok)
                    throw new Error(`Request failed: ${res.status} ${res.statusText} (@ ${this.identifier})`);

                let json = await res.json();
                console.debug(`APIRQ OK after ${new Date().getTime() - calledAt.getTime()} ms (@ ${this.identifier})`);
                resolve(json);
            } catch (error) {
                console.error(error);
                reject(error);
            }
        });
    }

    #formatOutput(res) {
        return this.outputFormat(res);
    }

    outputFormat = (res) => res;

    sample;
}

class MagisterApiRequestAccount extends MagisterApiRequest {
    constructor() {
        super();
        this.identifier = 'accountInfo';
        this.path = 'api/account?noCache=0';
    }
}

class MagisterApiRequestYears extends MagisterApiRequest {
    constructor() {
        super();
        this.identifier = 'years';
        this.path = `api/leerlingen/$USERID/aanmeldingen?begin=2013-01-01&einde=${new Date().getFullYear() + 1}-01-01`;
    }
    outputFormat = (res) => res.items;
}

class MagisterApiRequestYearInfo extends MagisterApiRequest {
    constructor(year) {
        super();
        this.identifier = `yearInfo${year?.id}`;
        this.path = `api/aanmeldingen/${year?.id}`;
    }
}

class MagisterApiRequestExamsList extends MagisterApiRequest {
    constructor(year) {
        super();
        this.identifier = `examsList${year?.id}`;
        this.path = `api/aanmeldingen/${year?.id}/examens`;
    }
    outputFormat = (res) => res.items;
}

class MagisterApiRequestExamsInfo extends MagisterApiRequest {
    constructor(year) {
        super();
        this.identifier = `examsInfo${year?.id}`;
        this.path = `api/aanmeldingen/${year?.id}/examen`;
    }
}

class MagisterApiRequestEvents extends MagisterApiRequest {
    constructor(start, end) {
        super();
        this.identifier = `events${start?.toISOString().substring(0, 10)}${end?.toISOString().substring(0, 10)}`;
        this.path = `api/personen/$USERID/afspraken?van=${start?.toISOString().substring(0, 10)}&tot=${end?.toISOString().substring(0, 10)}`;
    }
    outputFormat = (res) => res.Items;
    sample = [{ "Docenten": [{ "Naam": "O. Baguette", "Docentcode": "OBA" }], "Start": new Date().toISOString().split('T')[0] + " 09:00", "Einde": new Date().toISOString().split('T')[0] + " 10:00", "Id": 1, "InfoType": 0, "Inhoud": null, "LesuurTotMet": 2, "LesuurVan": 2, "Lokalen": [{ "Naam": "11s" }], "Omschrijving": "fatl - oba", "Lokatie": "11s", "Status": 5, "Vakken": [{ "Naam": "Franse taal" }] }, { "Docenten": [{ "Naam": "G. Gifje", "Docentcode": "GIF" }], "Start": new Date().toISOString().split('T')[0] + " 10:00", "Einde": new Date().toISOString().split('T')[0] + " 11:00", "Id": 2, "InfoType": 0, "Inhoud": null, "LesuurTotMet": 3, "LesuurVan": 3, "Lokalen": [{ "Naam": "11s" }], "Omschrijving": "mem - gif", "Lokatie": "11s", "Vakken": [{ "Naam": "memekunde" }] }, { "Docenten": [{ "Naam": "M. Millenial", "Docentcode": "MMI" }], "Start": new Date().toISOString().split('T')[0] + " 11:30", "Einde": new Date().toISOString().split('T')[0] + " 12:30", "Id": 3, "InfoType": 0, "Inhoud": null, "LesuurTotMet": 4, "LesuurVan": 4, "Lokalen": [{ "Naam": "11l" }], "Omschrijving": "stk - mmi", "Lokatie": "11l", "Vakken": [{ "Naam": "straattaalkunde" }] }, { "Docenten": [{ "Id": 0, "Naam": "E. Musk", "Docentcode": "EMU" }], "Start": new Date().toISOString().split('T')[0] + " 12:30", "Einde": new Date().toISOString().split('T')[0] + " 13:30", "Id": 4, "InfoType": 0, "Inhoud": null, "LesuurTotMet": 5, "LesuurVan": 5, "Lokalen": [{ "Naam": "binas6" }], "Omschrijving": "na - emu", "Lokatie": "binas6", "Vakken": [{ "Naam": "natuurkunde" }] }, { "Docenten": [{ "Id": 0, "Naam": "B. Baan", "Docentcode": "BBA" }], "Start": new Date().toISOString().split('T')[0] + " 14:00", "Einde": new Date().toISOString().split('T')[0] + " 15:00", "Id": 5, "InfoType": 0, "Inhoud": null, "LesuurTotMet": 6, "LesuurVan": 6, "Lokalen": [{ "Naam": "at1_ondersteboven" }], "Omschrijving": "ka - bba", "Lokatie": "at1_ondersteboven", "Type": 7, "Vakken": [{ "Naam": "kinderarbeid" }] }, { Start: new Date(new Date().setHours(0, 0, 0, 0) + 122400000), Einde: new Date(new Date().setHours(0, 0, 0, 0) + 125100000), Inhoud: "<p>Dit is een onvoltooid huiswerkitem.</p>", Opmerking: null, InfoType: 1, Afgerond: false, "Docenten": [{ "Naam": "O. Baguette", "Docentcode": "OBA" }], Vakken: [{ Naam: "Niet-bestaand vak" }] }, { Start: new Date(new Date().setHours(0, 0, 0, 0) + 297900000), Einde: new Date(new Date().setHours(0, 0, 0, 0) + 300600000), Inhoud: "<p>In deze les heb je een schriftelijke overhoring. Neem je oortjes mee.</p>", Opmerking: null, InfoType: 2, Afgerond: false, "Docenten": [{ "Naam": "O. Baguette", "Docentcode": "OBA" }], Vakken: [{ Naam: "Lichamelijke opvoeding" }] }, { Start: new Date(new Date().setHours(0, 0, 0, 0) + 297900000), Einde: new Date(new Date().setHours(0, 0, 0, 0) + 300600000), Inhoud: "<p>Dit item heb je al wel voltooid. Good job.</p>", Opmerking: null, InfoType: 1, Afgerond: true, "Docenten": [{ "Naam": "O. Baguette", "Docentcode": "OBA" }], Vakken: [{ Naam: "Jouw favoriete vak" }] }];
}

class MagisterApiRequestEvent extends MagisterApiRequest {
    constructor(id) {
        super();
        this.identifier = `event${id}`;
        this.path = `api/personen/$USERID/afspraken/${id}`;
    }
}

class MagisterApiRequestEventAttachment extends MagisterApiRequest {
    constructor(id) {
        super();
        this.identifier = `event${id}`;
        this.path = `api/personen/$USERID/afspraken/bijlagen/${id}?redirect_type=body`;
    }
}

class MagisterApiRequestKwtChoices extends MagisterApiRequest {
    constructor(start, end) {
        super();
        this.identifier = `kwtChoices${start?.toISOString()}${end?.toISOString()}`;
        this.path = `api/leerlingen/$USERID/keuzewerktijd/keuzes?van=${start?.toISOString().substring(0, 10)}+${start?.toISOString().substring(11, 16)
            }&tot=${end?.toISOString().substring(0, 10)}+${end?.toISOString().substring(11, 16)
            }`;
    }
    outputFormat = (res) => res.Items;
}

class MagisterApiRequestGradesRecent extends MagisterApiRequest {
    constructor() {
        super();
        this.identifier = 'gradesRecent';
        this.path = `api/personen/$USERID/cijfers/laatste?top=20&skip=0`;
    }
    outputFormat = (res) => res.items;
    sample = [{ omschrijving: "Voorbeeld", ingevoerdOp: new Date(now.getTime() - 172800000), vak: { code: "netl", omschrijving: "Nederlandse taal" }, waarde: "6,9", weegfactor: 0, isVoldoende: true }, { omschrijving: "Baguette", ingevoerdOp: new Date(now.getTime() - 691200000), vak: { code: "fatl", omschrijving: "Franse taal" }, waarde: "U", weegfactor: 0, isVoldoende: true }, { omschrijving: "Grade mockery", ingevoerdOp: new Date(now.getTime() - 6891200000), vak: { code: "entl", omschrijving: "Engelse taal" }, waarde: "5,4", weegfactor: 0 }];
}

class MagisterApiRequestGradesForYear extends MagisterApiRequest {
    constructor(year) {
        super();
        this.identifier = `gradesYear${year?.id}`;
        this.path = `api/personen/$USERID/aanmeldingen/${year?.id}/cijfers/cijferoverzichtvooraanmelding?actievePerioden=false&alleenBerekendeKolommen=false&alleenPTAKolommen=false&peildatum=${year?.einde}`;
    }
    outputFormat = (res) => res.Items.filter(item => !syncedStorage['ignore-grade-columns'].includes(item.CijferKolom?.KolomKop || 'undefined'));
}

class MagisterApiRequestGradesColumnInfo extends MagisterApiRequest {
    constructor(year, columnId) {
        super();
        this.identifier = `gradesYear${year?.id}Col${columnId}`;
        this.path = `api/personen/$USERID/aanmeldingen/${year?.id}/cijfers/extracijferkolominfo/${columnId}`;
    }
}

class MagisterApiRequestAssignmentsTop extends MagisterApiRequest {
    constructor(start, end) {
        super();
        this.identifier = 'assignments';
        this.path = `api/personen/$USERID/opdrachten?top=20&skip=0&startdatum=${start?.toISOString().substring(0, 10)}&einddatum=${end?.toISOString().substring(0, 10)}`;
    }
    outputFormat = (res) => res.Items;
    sample = [{ Titel: "Praktische opdracht", Vak: "sk", InleverenVoor: new Date(new Date().setHours(0, 0, 0, 0) + 300600000), Omschrijving: "Zorg ervoor dat je toestemming hebt van de TOA voordat je begint met je experiment." }, { Titel: "Boekverslag", Vak: "netl", InleverenVoor: new Date(new Date().setHours(0, 0, 0, 0) + 400500000) }];
}

class MagisterApiRequestAssignmentsForYear extends MagisterApiRequest {
    constructor(year) {
        super();
        this.identifier = `assignmentsYear${year?.id}`;
        this.path = `api/personen/$USERID/opdrachten?top=250&startdatum=${year.begin}&einddatum=${year.einde}`;
    }
    outputFormat = (res) => res.Items;
}

class MagisterApiRequestMessages extends MagisterApiRequest {
    constructor() {
        super();
        this.identifier = 'messages';
        this.path = 'api/berichten/postvakin/berichten?top=20&skip=0&gelezenStatus=ongelezen';
    }
    outputFormat = (res) => res.items;
    sample = [{ onderwerp: "🔥😂💚🍀😔🐜😝🙏👍🪢💀☠️", afzender: { naam: "Quinten Althues (V6E)" }, heeftBijlagen: true, verzondenOp: new Date(now.getTime() - 3032000000) }, { onderwerp: "Wie gebruikt Berichten in vredesnaam?", afzender: { naam: "Quinten Althues (V6E)" }, heeftPrioriteit: true, verzondenOp: new Date(now.getTime() - 1000000) }];
}

class MagisterApiRequestActivities extends MagisterApiRequest {
    constructor() {
        super();
        this.identifier = 'activities';
        this.path = `api/personen/$USERID/activiteiten?status=NogNietAanEisVoldaan`;
    }
    outputFormat = (res) => res.Items;
    sample = [null];
}

class MagisterApiRequestLogs extends MagisterApiRequest {
    constructor() {
        super();
        this.identifier = 'logs';
        this.path = `api/leerlingen/$USERID/logboeken/count`;
    }
    outputFormat = (res) => Array(res?.count || 0);
    sample = [null];
}

class MagisterApiRequestAbsencesForYear extends MagisterApiRequest {
    constructor(year) {
        super();
        this.identifier = `absencesYear${year?.id}`;
        this.path = `api/personen/$USERID/absenties?van=${year.begin}&tot=${year.einde}`;
    }
    outputFormat = (res) => res.Items;
}

const magisterApi = new MagisterApi();
