class MagisterApi {
    constructor() {
        this.#initialize();
    }

    async #initialize() {
        this.cache = {};
        this.schoolName = window.location.hostname.split('.')[0];
        this.userId = await this.getFromStorage('user-id', 'sync');
        this.userToken = await getFromStorage('token', chrome.storage.session?.get ? 'session' : 'local');
        this.userTokenDate = await getFromStorage('token-date', chrome.storage.session?.get ? 'session' : 'local');

        this.updateApiCredentials();

        this.permissions = await this.updateApiPermissions();
        this.gatherStart = midnight(new Date().getDate() - (new Date().getDay() + 6) % 7);
        this.gatherEarlyStart = midnight(new Date().getDate() - 42);
        this.gatherEnd = midnight(new Date().getDate() + 42);
        this.useSampleData = false;

    }

    async updateApiCredentials() {
        const calledAt = new Date();
        const storageLocation = chrome.storage.session?.get ? 'session' : 'local';

        this.userId = await getFromStorage('user-id', 'sync');
        this.userToken = await getFromStorage('token', storageLocation);
        this.userTokenDate = await getFromStorage('token-date', storageLocation);

        if (this.userId && this.userToken && this.userTokenDate && new Date(this.userTokenDate)) {
            if (Math.abs(new Date() - new Date(this.userTokenDate)) < 60000) {
                console.info(`CREDS OK after ${new Date() - calledAt} ms`);
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
    constructor() {
        this.identifier;
        this.path;
    }

    get() {
        return new Promise(async (resolve, reject) => {
            if (magisterApi.useSampleData && this.sample) {
                resolve(this.sample);
            } else if (!this.identifier || !this.path) {
                reject();
            } else if (magisterApi.cache[this.identifier] && !magisterApi.cache[this.identifier].then) {
                resolve(magisterApi.cache[this.identifier]);
            } else {
                let res = await this.#fetchWrapper(
                    `https://${magisterApi.schoolName}.magister.net/${this.path}`,
                );
                resolve(res);
            }
        });
    }

    #fetchWrapper(url, options = {}) {
        return new Promise(async (resolve, reject) => {
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
            if (!magisterApi.userId || !magisterApi.userToken) {
                await magisterApi.updateApiCredentials()
                    .catch(err => console.error(err));
            }
            let res = await fetch(url.replace(/(\$USERID)/gi, magisterApi.userId), {
                headers: {
                    Authorization: magisterApi.userToken,
                    'X-Request-Source': 'study-tools'
                },
                ...options
            });
            if (res.ok) {
                let json = await res.json();
                console.info(`APIRQ OK after ${new Date() - calledAt} ms (@ ${this.identifier})`);
                resolve(json);
            } else {
                console.info(`APIRQ ERR: ${res.status}.`);
                reject(res);
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
    sample = [{ "Docenten": [{ "Naam": "O. Baguette", "Docentcode": "OBA" }], "Start": now.toISOString().split('T')[0] + " 09:00", "Einde": now.toISOString().split('T')[0] + " 10:00", "Id": 1, "InfoType": 0, "Inhoud": null, "LesuurTotMet": 2, "LesuurVan": 2, "Lokalen": [{ "Naam": "11s" }], "Omschrijving": "fatl - oba", "Lokatie": "11s", "Status": 5, "Vakken": [{ "Naam": "Franse taal" }] }, { "Docenten": [{ "Naam": "G. Gifje", "Docentcode": "GIF" }], "Start": now.toISOString().split('T')[0] + " 10:00", "Einde": now.toISOString().split('T')[0] + " 11:00", "Id": 2, "InfoType": 0, "Inhoud": null, "LesuurTotMet": 3, "LesuurVan": 3, "Lokalen": [{ "Naam": "11s" }], "Omschrijving": "mem - gif", "Lokatie": "11s", "Vakken": [{ "Naam": "memekunde" }] }, { "Docenten": [{ "Naam": "M. Millenial", "Docentcode": "MMI" }], "Start": now.toISOString().split('T')[0] + " 11:30", "Einde": now.toISOString().split('T')[0] + " 12:30", "Id": 3, "InfoType": 0, "Inhoud": null, "LesuurTotMet": 4, "LesuurVan": 4, "Lokalen": [{ "Naam": "11l" }], "Omschrijving": "stk - mmi", "Lokatie": "11l", "Vakken": [{ "Naam": "straattaalkunde" }] }, { "Docenten": [{ "Id": 0, "Naam": "E. Musk", "Docentcode": "EMU" }], "Start": now.toISOString().split('T')[0] + " 12:30", "Einde": now.toISOString().split('T')[0] + " 13:30", "Id": 4, "InfoType": 0, "Inhoud": null, "LesuurTotMet": 5, "LesuurVan": 5, "Lokalen": [{ "Naam": "binas6" }], "Omschrijving": "na - emu", "Lokatie": "binas6", "Vakken": [{ "Naam": "natuurkunde" }] }, { "Docenten": [{ "Id": 0, "Naam": "B. Baan", "Docentcode": "BBA" }], "Start": now.toISOString().split('T')[0] + " 14:00", "Einde": now.toISOString().split('T')[0] + " 15:00", "Id": 5, "InfoType": 0, "Inhoud": null, "LesuurTotMet": 6, "LesuurVan": 6, "Lokalen": [{ "Naam": "at1_ondersteboven" }], "Omschrijving": "ka - bba", "Lokatie": "at1_ondersteboven", "Type": 7, "Vakken": [{ "Naam": "kinderarbeid" }] }, { Start: new Date(new Date().setHours(0, 0, 0, 0) + 122400000), Einde: new Date(new Date().setHours(0, 0, 0, 0) + 125100000), Inhoud: "<p>Dit is een onvoltooid huiswerkitem.</p>", Opmerking: null, InfoType: 1, Afgerond: false, "Docenten": [{ "Naam": "O. Baguette", "Docentcode": "OBA" }], Vakken: [{ Naam: "Niet-bestaand vak" }] }, { Start: new Date(new Date().setHours(0, 0, 0, 0) + 297900000), Einde: new Date(new Date().setHours(0, 0, 0, 0) + 300600000), Inhoud: "<p>In deze les heb je een schriftelijke overhoring. Neem je oortjes mee.</p>", Opmerking: null, InfoType: 2, Afgerond: false, "Docenten": [{ "Naam": "O. Baguette", "Docentcode": "OBA" }], Vakken: [{ Naam: "Lichamelijke opvoeding" }] }, { Start: new Date(new Date().setHours(0, 0, 0, 0) + 297900000), Einde: new Date(new Date().setHours(0, 0, 0, 0) + 300600000), Inhoud: "<p>Dit item heb je al wel voltooid. Good job.</p>", Opmerking: null, InfoType: 1, Afgerond: true, "Docenten": [{ "Naam": "O. Baguette", "Docentcode": "OBA" }], Vakken: [{ Naam: "Jouw favoriete vak" }] }];
}

class MagisterApiRequestGradesRecent extends MagisterApiRequest {
    constructor() {
        super();
        this.identifier = 'gradesRecent';
        this.path = `api/personen/$USERID/cijfers/laatste?top=20&skip=0`;
    }
    outputFormat = (res) => res.items;
    sample = [{ omschrijving: "Voorbeeld", ingevoerdOp: new Date(now - 172800000), vak: { code: "netl", omschrijving: "Nederlandse taal" }, waarde: "6,9", weegfactor: 0, isVoldoende: true }, { omschrijving: "Baguette", ingevoerdOp: new Date(now - 691200000), vak: { code: "fatl", omschrijving: "Franse taal" }, waarde: "U", weegfactor: 0, isVoldoende: true }, { omschrijving: "Grade mockery", ingevoerdOp: new Date(now - 6891200000), vak: { code: "entl", omschrijving: "Engelse taal" }, waarde: "5,4", weegfactor: 0 }];
}

class MagisterApiRequestGradesForYear extends MagisterApiRequest {
    constructor(year) {
        super();
        this.identifier = `gradesYear${year?.id}`;
        this.path = `api/personen/$USERID/aanmeldingen/${year?.id}/cijfers/cijferoverzichtvooraanmelding?actievePerioden=false&alleenBerekendeKolommen=false&alleenPTAKolommen=false&peildatum=${year?.einde}`;
    }
    outputFormat = (res) => res.Items;
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
    sample = [{ onderwerp: "🔥😂💚🍀😔🐜😝🙏👍🪢💀☠️", afzender: { naam: "Quinten Althues (V6E)" }, heeftBijlagen: true, verzondenOp: new Date(now - 3032000000) }, { onderwerp: "Wie gebruikt Berichten in vredesnaam?", afzender: { naam: "Quinten Althues (V6E)" }, heeftPrioriteit: true, verzondenOp: new Date(now - 1000000) }];
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
