const subjects = {
    id: "subjects",
    title: "Vaknamen bewerken",
    subtitle: "Geef vaknamen en de bijbehorende afkortingen en aliassen op, zodat Study Tools weet welke studiewijzers bij elkaar horen.",
    type: "SubjectEditor",
    inline: true,
    conditions: [
        { settingId: 'magister-vd-overhaul', operator: 'equal', value: true }
    ],
    default: [
        { name: "Aardrijkskunde", aliases: "ak" },
        { name: "Bedrijfseconomie", aliases: "beco, bec" },
        { name: "Beeldende vorming", aliases: "kubv, be, bv" },
        { name: "Biologie", aliases: "bio, bi" },
        { name: "Cult. en kunstz. vorming", aliases: "ckv" },
        { name: "Drama", aliases: "kudr, dr" },
        { name: "Duits", aliases: "dutl, du, Duitse, Deutsch" },
        { name: "Economie", aliases: "eco, ec, econ" },
        { name: "Engels", aliases: "entl, en, Engels, English" },
        { name: "Frans", aliases: "fatl, fa, Franse, Français" },
        { name: "Geschiedenis", aliases: "gs" },
        { name: "Grieks", aliases: "gtc, gr, grkc, grtl, Griekse" },
        { name: "Kunst algemeen", aliases: "ku, kua" },
        { name: "Latijn", aliases: "ltc, la, lakc, latl, Latijnse" },
        { name: "Levensbeschouwing", aliases: "lv" },
        { name: "Sport", aliases: "lo, s&b, lichamelijke opvoeding, gym" },
        { name: "Loopbaan­oriëntatie en -begeleiding", aliases: "lob" },
        { name: "Maatschappijleer", aliases: "ma, malv" },
        { name: "Maatschappij­wetenschappen", aliases: "maw" },
        { name: "Mentor", aliases: "mentoruur, mentoraat" },
        { name: "Muziek", aliases: "kumu, mu" },
        { name: "Natuurkunde", aliases: "nat, na" },
        { name: "Nederlands", aliases: "netl, ne, Nederlandse" },
        { name: "Scheikunde", aliases: "sk, sch" },
        { name: "Spaans", aliases: "sptl, sp, Spaanse, Español" },
        { name: "Wiskunde", aliases: "wi, wa, wb, wc, wd, wisa, wisb, wisc, wisd" }
    ]
}

const shortcuts = {
    id: "shortcuts",
    title: "Snelkoppelingen zijbalk",
    type: "ShortcutsEditor",
    default: [
        { icon: '', href: '$SCHOOLNAAM.zportal.nl/app', hotkey: 'z' }
    ]
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
                id: "darken-content",
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
            shortcuts,
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
                default: null,
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
                default: '',
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
                default: '',
                conditions: [
                    { settingId: 'magisterLogin-method', operator: 'equal', value: 'microsoft' }
                ],
            },
            {
                id: "magisterLogin-password",
                title: "Wachtwoord",
                type: "TextInput",
                fieldType: "password",
                default: '',
                conditions: [
                    { settingId: 'magisterLogin-method', operator: 'equal', value: 'password' }
                ],
            },
        ]
    },
    {
        id: "enhancements",
        settings: [
            // TODO: possibly condense vd-enabled and vd-schedule-view into one: vd-view (off, schedule, list)
            {
                id: "vd-enabled",
                title: "Verbeterd startscherm",
                default: true,
            },
            // TODO: possibly a setting to determine the widgets panel display mode: vd-widgets-view: (split, overlay)
            {
                id: "vd-schedule-view",
                title: "Weergave rooster",
                type: "SegmentedButton",
                default: "schedule",
                conditions: [
                    { settingId: 'vd-enabled', operator: 'equal', value: true }
                ],
                options: [
                    {
                        value: "schedule",
                        title: "Agenda",
                        icon: "calendar_view_day"
                    },
                    {
                        value: "list",
                        title: "Lijst",
                        icon: "list"
                    },
                ],
            },
            {
                id: "vd-schedule-days",
                title: "Aantal dagen weergeven",
                type: "SlideInput",
                default: 1,
                format: " d",
                decimals: 0,
                min: 1,
                max: 5,
                step: 1,
                conditions: [
                    { settingId: 'vd-enabled', operator: 'equal', value: true },
                    { settingId: 'vd-schedule-view', operator: 'equal', value: 'schedule' }
                ],
            },
            {
                id: "vd-schedule-extra-day",
                title: "Extra dag weergeven",
                subtitle: "Aan het eind van de schooldag alvast de volgende schooldag weergeven.",
                default: true,
                conditions: [
                    { settingId: 'vd-enabled', operator: 'equal', value: true },
                    { settingId: 'vd-schedule-view', operator: 'equal', value: 'schedule' },
                    { settingId: 'vd-schedule-days', operator: 'equal', value: 1 }
                ],
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
                id: "sw-enabled",
                title: "Studiewijzers ordenen",
                subtitle: "Studiewijzers zullen worden gegroepeerd op vak.",
                default: true,
            },
            subjects,
            {
                id: "sw-cols",
                title: "Aantal kolommen",
                type: "SlideInput",
                default: 3,
                decimals: 0,
                min: 1,
                max: 5,
                step: 1,
                conditions: [
                    { settingId: 'sw-enabled', operator: 'equal', value: true }
                ],
            },
            {
                id: "sw-period",
                title: "Periodenummers bij studiewijzers",
                subtitle: "In plaats van de naam van de studiewijzer.",
                default: true,
                conditions: [
                    { settingId: 'sw-enabled', operator: 'equal', value: true }
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
                id: 'hotkeys-quick',
                title: "Snellere sneltoetsen",
                subtitle: "Op de startpagina zijn sneltoetsen bruikbaar zonder de activatietoets ingedrukt te hoeven houden.",
                default: false,
                conditions: [
                    { settingId: 'magister-overlay-hotkey', operator: 'defined' },
                    { settingId: 'hotkeys-enabled', operator: 'equal', value: true }
                ],
            },
            {
                id: 'gamification-enabled',
                title: "Puntensysteem",
                subtitle: "Bètafunctie: werkt soms, heeft negatieve bijwerkingen.",
                default: false,
                conditions: [
                    { settingId: 'magister-overlay-hotkey', operator: 'defined' },
                    { settingId: 'beta-options', operator: 'equal', value: true }
                ]
            },
            {
                id: 'notes-enabled',
                title: "Notitieblok",
                subtitle: "Bètafunctie: werkt niet, notities worden niet opgeslagen.",
                default: false,
                conditions: [
                    { settingId: 'magister-overlay-hotkey', operator: 'defined' },
                    { settingId: 'beta-options', operator: 'equal', value: true }
                ],
            },
        ]
    },
    {
        id: "about",
        settings: [
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
                id: "disable-css",
                title: "Algemene CSS-modificaties uitschakelen",
                subtitle: "Veel functies van Study Tools werken mogelijk niet.",
                default: false,
                conditions: [
                    { settingId: 'beta-options', operator: 'equal', value: true }
                ],
            },
            // TODO: setting to disable color adaptation for dark theme
        ]
    },
]