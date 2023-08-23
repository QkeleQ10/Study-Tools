const subjects = {
    id: "subjects",
    title: "Vaknamen bewerken",
    subtitle: "Geef vaknamen en de bijbehorende afkortingen en aliassen op, zodat Study Tools weet welke studiewijzers bij elkaar horen.",
    type: "SubjectEditor",
    conditions: [
        { settingId: 'magister-vd-overhaul', operator: 'equal', value: true }
    ],
    default: [
        { name: "Aardrijkskunde", aliases: "ak" },
        { name: "Bedrijfseconomie", aliases: "beco" },
        { name: "Beeldende vorming", aliases: "be, bv, kubv" },
        { name: "Biologie", aliases: "bi, bio" },
        { name: "Cult. en kunstz. vorming", aliases: "ckv" },
        { name: "Drama", aliases: "dr, kudr" },
        { name: "Duits", aliases: "du, dutl, Duitse, Deutsch" },
        { name: "Economie", aliases: "ec, eco, econ" },
        { name: "Engels", aliases: "en, entl, Engels, English" },
        { name: "Frans", aliases: "fa, fatl, Franse, Français" },
        { name: "Geschiedenis", aliases: "gs" },
        { name: "Grieks", aliases: "gtc, gr, grtl, Griekse" },
        { name: "Kunst algemeen", aliases: "ku, kua" },
        { name: "Latijn", aliases: "ltc, la, latl, Latijnse" },
        { name: "Levensbeschouwing", aliases: "lv" },
        { name: "Sport", aliases: "lo, s&b, lichamelijke opvoeding, gym" },
        { name: "Loopbaan­oriëntatie en -begeleiding", aliases: "lob" },
        { name: "Maatschappijleer", aliases: "ma, malv" },
        { name: "Maatschappij­wetenschappen", aliases: "maw" },
        { name: "Mentor", aliases: "mentoruur, mentoraat" },
        { name: "Muziek", aliases: "mu, kumu" },
        { name: "Natuurkunde", aliases: "na, nat" },
        { name: "Nederlands", aliases: "ne, netl, Nederlandse" },
        { name: "Scheikunde", aliases: "sk, sch" },
        { name: "Spaans", aliases: "sp, sptl, Spaanse, Español" },
        { name: "Wiskunde", aliases: "wi, wa, wb, wc, wd, wisa, wisb, wisc, wisd" }
    ]
}

const periods = {
    id: "periods",
    title: "Perioden bewerken",
    subtitle: "Dit wordt gebruikt om de huidige periode te bepalen en om studiewijzers te groeperen.",
    type: "PeriodEditor",
    default: [30, 47, 9],
}

export default [
    {
        id: "appearance",
        settings: [
            {
                id: "theme",
                title: "Kleurenschema",
                type: "SegmentedButton",
                wizard: "Kies in welk kleurenthema Magister moet worden weergegeven.",
                default: "auto",
                options: [
                    {
                        value: "auto",
                        title: "Systeem",
                        icon: "brightness_auto"
                    },
                    {
                        value: "light",
                        title: "Licht",
                        icon: "light_mode"
                    },
                    {
                        value: "dark",
                        title: "Donker",
                        icon: "dark_mode"
                    },
                ]
            },
            {
                id: "color",
                title: "Accentkleur",
                type: "ColorPicker",
                default: { h: 207, s: 95, l: 55 },
                wizard: "Wil je een alternatieve accentkleur kiezen?",
            },
            {
                id: "shape",
                title: "Afgeronde hoeken",
                type: "SlideInput",
                default: 8,
                format: "px",
                decimals: 0,
                min: 0,
                max: 20,
                step: 1,
            },
            {
                id: "magister-css-dark-invert",
                title: "Inhoud donker maken",
                subtitle: "Studiewijzers en opdrachten donker maken indien het donkere thema actief is.",
                conditions: [
                    { settingId: 'beta-options', operator: 'equal', value: true }
                ],
                default: true,
            },
            {
                id: "magister-appbar-week",
                title: "Weeknummer in zijbalk",
                default: true,
            },
            {
                id: 'magister-picture',
                title: "Profielfoto",
                type: "SegmentedButton",
                default: 'hide',
                options: [
                    {
                        value: "show",
                        title: "Schoolfoto",
                        icon: "photo_camera_front"
                    },
                    {
                        value: "custom",
                        title: "Aangepast",
                        icon: "add_photo_alternate"
                    },
                    {
                        value: "hide",
                        title: "Verbergen",
                        icon: "visibility_off"
                    },
                ],
            },
            {
                id: 'magister-picture-source',
                title: "Profielfoto kiezen",
                type: "ImageInput",
                conditions: [
                    { settingId: 'magister-picture', operator: 'equal', value: 'custom' }
                ],
            },
            {
                id: "magister-cf-failred",
                title: "Onvoldoendes rood kleuren",
                subtitle: "Alleen in het cijferoverzicht.",
                default: true,
            },
        ]
    },
    {
        id: "login",
        wizard: "Kies de manier van inloggen op je school om automatisch inloggen in te schakelen.",
        settings: [
            {
                id: "magisterLogin-method",
                title: "Automatisch inloggen",
                subtitle: "Log automatisch in met je Microsoft-account of met een Magister-wachtwoord.",
                type: "SegmentedButton",
                default: "microsoft",
                options: [
                    {
                        value: "microsoft",
                        title: "Microsoft"
                    },
                    {
                        value: "password",
                        title: "Wachtwoord",
                    },
                    {
                        value: "off",
                        title: "Uit",
                    },
                ]
            },
            {
                id: "magisterLogin-username",
                title: "Gebruikersnaam",
                type: "TextInput",
                conditions: [
                    { settingId: 'magisterLogin-method', operator: 'not equal', value: 'off' }
                ],
            },
            {
                id: "magisterLogin-email",
                title: "E-mailadres",
                subtitle: "Van het Microsoft-account dat moet worden gekozen.",
                type: "TextInput",
                fieldType: "email",
                conditions: [
                    { settingId: 'magisterLogin-method', operator: 'equal', value: 'microsoft' }
                ],
            },
            {
                id: "magisterLogin-password",
                title: "Wachtwoord",
                type: "TextInput",
                fieldType: "password",
                conditions: [
                    { settingId: 'magisterLogin-method', operator: 'equal', value: 'password' }
                ],
            },
        ]
    },
    {
        id: "enhancements",
        settings: [
            {
                id: "magister-vd-overhaul",
                title: "Verbeterd startscherm",
                default: true,
            },
            {
                id: "magister-vd-agendaHeight",
                title: "Hoogte agenda",
                type: "SlideInput",
                default: 1,
                format: "percent",
                decimals: 0,
                min: 0.5,
                max: 2.5,
                step: 0.01,
                conditions: [
                    { settingId: 'magister-vd-overhaul', operator: 'equal', value: true }
                ],
            },
            {
                id: "vd-subjects-display",
                title: "Vaknotatie in agenda",
                type: "SegmentedButton",
                default: "custom",
                conditions: [
                    { settingId: 'magister-vd-overhaul', operator: 'equal', value: true }
                ],
                options: [
                    {
                        value: "custom",
                        title: "Vaknamen",
                        icon: "notes"
                    },
                    {
                        value: "default",
                        title: "Vakafkortingen",
                        icon: "short_text"
                    },
                ],
            },
            subjects,
            {
                id: "magister-vd-grade",
                title: "Laatste cijfer op startscherm",
                subtitle: "Toon het laatste cijfer op het startscherm, laat alleen zien hoeveel nieuwe cijfers er zijn of toon helemaal niets.",
                type: "SegmentedButton",
                default: "full",
                conditions: [
                    { settingId: 'magister-vd-overhaul', operator: 'equal', value: true }
                ],
                options: [
                    {
                        value: "full",
                        title: "Volledig",
                        icon: "star"
                    },
                    {
                        value: "partial",
                        title: "Aantal",
                        icon: "app_badging"
                    },
                    {
                        value: "off",
                        title: "Verbergen",
                        icon: "visibility_off"
                    },
                ]
            },
            {
                id: "magister-cf-calculator",
                title: "Cijfercalculator",
                subtitle: "Zie wat je moet halen of wat je komt te staan op basis van je cijferlijst en/of aangepaste cijfers.",
                default: true,
            },
            {
                id: "magister-cf-statistics",
                title: "Cijferstatistieken",
                subtitle: "Nieuw tabblad in het cijferoverzicht met statistieken, grafiekjes en handige filters.",
                default: true,
            },
            {
                id: "magister-cf-backup",
                title: "Cijferback-up",
                subtitle: "Knop in het cijferoverzicht om je cijferlijst te exporteren en te importeren.",
                default: true,
                links: [
                    { icon: 'upload', label: "Cijferback-up importeren", href: 'https://qkeleq10.github.io/studytools/grades' }
                ]
            },
            {
                id: "magister-sw-display",
                title: "Studiewijzers ordenen",
                subtitle: "Studiewijzers zullen worden gegroepeerd op vaknaam en periodenummer.",
                type: "SegmentedButton",
                default: "grid",
                options: [
                    {
                        value: "grid",
                        title: "Raster",
                        icon: "grid_view"
                    },
                    {
                        value: "list",
                        title: "Lijst",
                        icon: "sort"
                    },
                    {
                        value: "off",
                        title: "Uit",
                        icon: "block"
                    },
                ]
            },
            subjects,
            periods,
            {
                id: "magister-sw-period",
                title: "Periodenummers bij studiewijzers",
                subtitle: "In plaats van de naam van de studiewijzer.",
                default: true,
                conditions: [
                    { settingId: 'magister-sw-display', operator: 'equal', value: 'grid' }
                ],
            },
            {
                id: "sw-current-week-behavior",
                title: "Huidige week in studiewijzer",
                type: "SegmentedButton",
                default: "focus",
                options: [
                    {
                        value: "focus",
                        title: "Scrollen",
                        icon: "bolt"
                    },
                    {
                        value: "highlight",
                        title: "Markeren",
                        icon: "ink_highlighter"
                    },
                    {
                        value: "off",
                        title: "Uit",
                        icon: "block"
                    },
                ]
            },
        ]
    },
    {
        id: "overlay",
        settings: [
            {
                id: 'magister-overlay-hotkey',
                title: "Activatietoets",
                subtitle: "Deze toets activeert de overlay en sneltoetsen.",
                type: "KeyPicker",
                default: "S",
            },
            {
                id: 'hotkeys-enabled',
                title: "Sneltoetsen",
                subtitle: "Houd de activatietoets ingedrukt en druk op een getal op je toetsenbord voor snelle navigatie.",
                default: true,
                conditions: [
                    { settingId: 'magister-overlay-hotkey', operator: 'defined' }
                ],
            },
            {
                id: 'hotkeys-today',
                title: "Snellere sneltoetsen",
                subtitle: "Op de startpagina zijn sneltoetsen bruikbaar zonder de activatietoets ingedrukt te hoeven houden.",
                default: true,
                conditions: [
                    { settingId: 'magister-overlay-hotkey', operator: 'defined' },
                    { settingId: 'hotkeys-enabled', operator: 'equal', value: true }
                ],
            },
            // 'sidebar-expand-all' to automatically expand every sidebar item
            {
                id: 'notes-enabled',
                title: "Notitieblok",
                default: false,
                conditions: [
                    { settingId: 'magister-overlay-hotkey', operator: 'defined' },
                    { settingId: 'beta-options', operator: 'equal', value: true }
                ],
            },
            // INCORPORATE INTO THE OVERLAY
            // BROWSER NOT EQUAL OPERATOR
            // {
            //     id: "gamification-enabled",
            //     title: "Gamificatie",
            //     subtitle: "Punten worden toegekend op basis van je prestaties. Lees meer in het scoremenu.",
            //     default: false,
            //     conditions: [
            //         { settingId: 'beta-options', operator: 'equal', value: true },
            //         { operator: 'browser not equal', value: 'firefox' }
            //     ],
            // },
        ]
    },
    {
        id: "about",
        settings: [
            // about!
            {
                id: "update-notes",
                title: "Update-informatie weergeven",
                subtitle: "Af en toe een korte melding over de nieuwste updates weergeven.",
                default: true,
            },
            {
                id: "beta-options",
                title: "Experimentele opties",
                subtitle: "Er verschijnen extra opties voor functies die nog niet af zijn.",
                default: false,
            },
            {
                id: "updates",
                title: "Melding bij beschikbare update",
                conditions: [
                    { settingId: 'beta-options', operator: 'equal', value: true }
                ],
            },
            {
                id: "beta",
                title: "Melding bij beschikbare bèta-update",
                subtitle: "Bèta-builds bevatten de laatste bugfixes, maar kunnen ook nieuwe bugs bevatten.",
                conditions: [
                    { settingId: 'updates', operator: 'equal', value: true },
                    { settingId: 'beta-options', operator: 'equal', value: true }
                ],
            },
            {
                id: "disable-css",
                title: "Algemene CSS-modificaties uitschakelen",
                subtitle: "Veel functies van Study Tools werken mogelijk niet.",
                default: false,
                conditions: [
                    { settingId: 'beta-options', operator: 'equal', value: true }
                ],
            },
        ]
    },
]