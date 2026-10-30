# Morgonbrief

En lugn svensk morgonöversikt över världen, vetenskapen och AI. Byggd för GitHub Pages: statisk HTML, CSS och JavaScript, inga externa typsnitt, inget CMS, inga tredjepartsskript, inga API-nycklar.

## Redaktionell princip

- Egna korta sammanfattningar, inte kopierade fulltexter.
- Varje nyhet länkar till källorna och visar publicerings- och kontrolltid; händelsedatum anges separat när känt.
- Exakt tidsbestämda nyheter måste ligga inom utgåvans 24-timmarsfönster.
- En källa som enbart visar samma kalenderdatum kan ingå i en **begränsad** utgåva, med uttrycklig reservation: klockslag och tidszon saknas, därför är den exakta 24-timmarsgränsen inte verifierad.
- Fakta, redaktionell relevansbedömning, preprint och osäkerhet är separerade.
- Datum avser en faktiskt publicerad utgåva. Ett sidbesök daterar aldrig om innehållet.
- Vid misslyckad uppdatering behålls den senast godkända utgåvan. Inga påhittade ersättningsnyheter.

Målet är en ny utgåva till kl. 06.00 Europe/Stockholm. Den redaktionella körningen styrs separat från den här statiska webbplatsen. GitHub Actions validerar och publicerar endast en redan granskad utgåva; den producerar inte nyheter och är ingen exakt klockgaranti.

## Lokal kontroll

Node.js 22 eller senare. Inga npm-beroenden behövs.

```sh
npm run check
```

`npm test` kör schema-, säkerhets-, tids- och publiceringsskydd. `npm run build` producerar en ren `dist/` med SHA-256-manifest och ett grundläggande alternativ utan JavaScript.

## Ny utgåva

1. Samla och kontrollera originalkällor. Utgåvans sluttid bestäms innan urvalet; starttiden är exakt 24 timmar tidigare.
2. Skapa kandidat enligt `assets/model.mjs` och `docs/schema.md`. Aldrig privata användaruppgifter, inloggningar eller intern granskningshistorik i repot.
3. Oberoende sak- och processgranskning av en fryst kandidat. Allvarliga fel innebär omarbetning och ny granskning.
4. `node scripts/publish-edition.mjs /path/to/reviewed-candidate.json` och `npm run check`.
5. Commit med **både** `data/latest.json` och `archive/YYYY-MM-DD.json` i samma revision. Använd aktuell huvudrevision som lease vid API-publicering; skriv inte över parallella ändringar.
6. Kontrollera validering, publiceringsjobb, live-utgåva och innehållshash för exakt commit. Enbart en skapad commit räknas inte som färdig publicering.

`publish-edition.mjs` vägrar dubbla/äldre utgåvor och vägrar att ersätta en tidigare lyckad utgåva med en tom kandidat. Vid fel ändras inte `latest.json`. Arkivfiler skrivs inte över automatiskt. Rättelser görs i en separat granskad commit, dokumenterar vad som ändrats, och behåller ursprunglig publiceringstid.

## Tillgänglighet och integritet

Semantiska nyhetskort, tangentbordsåtkomst, inbyggd modal dialog med Escape och fokusåtergång, större lästext, sök/ämnesfilter och mobil läsvy. Källänkar tillåter bara publika HTTPS-adresser. Källtext sätts med `textContent`, aldrig som körbar HTML. Ingen spårning eller användarprofil lagras.
