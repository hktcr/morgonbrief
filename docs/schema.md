# Utgåveformat, version 1

Den exekverbara och auktoritativa valideringen finns i `assets/model.mjs` (`validateEdition`). Tider i ISO 8601 med UTC-offset; datum utan tid är `YYYY-MM-DD`.

```json
{
  "schemaVersion": 1,
  "editionId": "YYYY-MM-DD",
  "generatedAt": "ISO timestamp",
  "windowStart": "ISO timestamp",
  "windowEnd": "ISO timestamp",
  "timezone": "Europe/Stockholm",
  "status": "published | partial | empty",
  "editorialNote": "Kort ärlig beskrivning av täckning och luckor.",
  "stories": [{
    "id": "unique-kebab-case",
    "category": "world | science | ai | other",
    "title": "Kort titel",
    "summary": "Egen kort sammanfattning",
    "whyItMatters": "Tydligt redaktionell relevansbedömning",
    "details": ["Källstödd fördjupning"],
    "publishedAt": "ISO timestamp or null",
    "publishedDate": "YYYY-MM-DD when publishedAt is null",
    "eventDate": "YYYY-MM-DD or null",
    "verifiedAt": "ISO timestamp",
    "confidence": "high | medium",
    "kind": "news | research | analysis",
    "preprint": false,
    "sources": [{"name":"Källa","url":"https://…","publishedAt":"ISO timestamp or null","publishedDate":"YYYY-MM-DD if needed"}],
    "caveats": ["Konkret osäkerhet, intressekonflikt eller begränsning"]
  }]
}
```

`editionId` är det svenska datumet vid `windowEnd`. Fönstret är exakt 24 timmar. `generatedAt` är den faktiska framställningstiden, inte en framtida planerad utgivning. En källa måste styrka nyhetens publiceringstid. Kompletterande bakgrundskällor kan vara äldre.

Om klockslag saknas: `publishedAt:null`, verifierat `publishedDate` som matchar utgåvedagen och källan, `status:partial`, samt en uttrycklig reservation om tidsosäkerheten. Detta framställs inte som en exakt verifierad 24-timmarsnyhet. Preprint och medelhög säkerhet kräver också konkret reservation. Saknade uppgifter är `null`, inte påhittade datum.
