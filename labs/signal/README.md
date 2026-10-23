# MPAI Signal

**Lär en egen AI. Använd den. Ta den med dig.**

Signal är en svensk, lokal AI-verkstad för text. Du lär en statistisk specialist med märkta exempel, låter den föreslå kategorier och rättar svåra fall. En andra arbetsyta hittar återkommande ordteman i omärkt text med oövervakad inlärning.

**Privat app:** https://mpai-signal.nomarcus.chatgpt.site

## Prova på en minut

1. Välj **Prova på 60 sekunder**. Två modellvarianter tränas i en Web Worker.
2. Öppna **Prova en text**, skriv ett eget supportärende och titta på förslag och bidragande ord.
3. I **Sortera en samling**, välj rätt kategori för ett ärende och tryck **Bekräfta & lär**.
4. Välj **Träna om AI:n**. Rättelsen blir träningsdata.
5. Öppna **Se resultaten** för korsvalidering och separat reservprov.
6. Välj **Spara & exportera → Mitt eget AI-verktyg** för en fristående HTML-specialist.

Under **Upptäck teman** kan du prova omärkt feedback. Granska grupperingen, namnge ett tema och markera enskilda texter innan du gör dem till träningsexempel. Den arbetsytans inmatning och gruppering finns bara i flikens minne; valda träningsexempel sparas i projektet.

## Vad som faktiskt är AI

- Övervakad inlärning: TF-IDF + multinomial logistisk regression/softmax. Gradientnedstigning lär vikter från dina exempel. Inga hårdkodade kategoriregler.
- Automatiskt modellval: ord/ordpar jämförs med ord/ordpar/ordfragment genom stratifierad 3-fold korsvalidering. Högst macro-F1 väljs, därefter tränas slutmodellen på alla exempel.
- Oövervakad inlärning: spherical k-means med cosine-likhet, k-means++-initiering och fem deterministiska omstarter.
- Aktivt lärande: granskningskön prioriterar osäkerhet och text som avviker från träningsunderlaget. Mänskliga rättelser blir nya märkta exempel.

Det är **inte en stor språkmodell**. Ordfragment hjälper med vissa böjningar och stavvarianter, men modellen förstår inte fakta, ironi eller avsikt. Den väljer en kategori per text. Modellpoäng är okalibrerade softmaxvärden, inte sannolikhet att ett beslut är korrekt.

## Kör lokalt

Node.js 22+ för tester. Python 3 eller valfri statisk server för appen. Ingen npm-installation, byggprocess, API-nyckel eller databas behövs.

```sh
npm test
python3 -m http.server 8000 --directory dist
```

Öppna http://localhost:8000. Servern behövs för ES-moduler och Web Workers. Dubbelklicka inte på appens `dist/index.html`; den **exporterade specialistfilen** är däremot självständig och saknar nätverksberoenden.

Hela `dist/` kan läggas på valfri statisk HTTPS-server, även i en underkatalog. `.openai/hosting.json` hör bara till den privata Sites-installationen och behövs inte i annan drift.

## Data och filer

- CSV använder `text;kategori` (även `label` godtas). Komma, semikolon och tabulator, BOM, citat och flerradiga fält stöds.
- Märkta CSV-rader läggs till i träningsdata; omärkta rader i kön. Inmatningen förhandsvisas före import. JSON-projekt och modellfiler ersätter det öppna projektet efter bekräftelse.
- Exakta dubbletter normaliseras och tas bort. Motstridiga etiketter i en CSV-import avvisas. Manuella rättelser ersätter den gamla etiketten för samma text.
- Automatisk lokal lagring via IndexedDB. En skrivande flik åt gången där Web Locks stöds. Exportera säkerhetskopior; webbläsardata kan rensas.
- Säkerhetskopian innehåller originaltexter och är okrypterad. Modell/HTML innehåller vikter och vokabulär, inte originaltexterna. Inlärda vikter kan ändå avslöja uppgifter och bör behandlas varsamt.
- Inget projektinnehåll skickas till AI-tjänster. Appens statiska filer laddas från webbhotellet. Ingen analytics, telemetri, extern font eller CDN.
- Service worker försöker cacha appfiler för offlinebruk efter ett första lyckat HTTPS-besök. Installerbarhet och offlinecache på fysisk iPhone är inte verifierade.

## Gränser

Högst 12 kategorier, 5 000 träningsexempel, 2 000 texter i sorteringskön och 12 000 tecken per text. Tema-arbetsytan tar 6–1 500 texter. CSV max 3 MB; JSON max 20 MB. Stora underlag kan vara långsamma på mobil; träning går att avbryta. Full belastningstest av maxgränserna återstår.

Utvärderingen återanvänds för modellval och kan vara optimistisk. Nästan likadana texter kan hamna i olika vikningar. Använd nytt, representativt, oberoende material före verklig drift. Reservproven är små och påhittade. Appen avvisar exakta överlapp mellan träningsdata och ett separat test.

## Verifiering

`npm test` kör 15 tester: faktisk inlärning, okända texter, omvända etiketter, utvärderingsuppdelning, modell-export/import, oövervakad gruppering, CSV och felhantering, formelskydd samt körning av exporterad HTML inklusive skydd mot scriptinjektion.

Manuellt kontrollerat i Chromium via intern preview: start, Web Worker-träning, sorteringsförslag, ordbevis, korsvalidering, reservprov, omärkt klustring och lagrad modell efter omladdning, rättelse/omträning och layout i en 390-pixlars iframe. Webbläsarverktyget bekräftade exportåtgärden men levererade ingen nedladdningshändelse/fil; verklig filhämtning och öppning på fysisk iOS/Android återstår. Exportens genererade JavaScript har körts och jämförts med huvudmotorn i testerna.

Se [docs/BUILD_NOTES.md](docs/BUILD_NOTES.md) för idéval, mätningar, metodkällor och fortsättning.

## Kod

| Fil | Ansvar |
| --- | --- |
| `dist/engine.js` | TF-IDF, sparse gradient descent, modellval, utvärdering och inläsningsvalidering |
| `dist/discover.js` | Oövervakad tematisk gruppering |
| `dist/worker.js` | Avbrytbar bakgrundsträning |
| `dist/app.js` | Arbetsytor, granskning, återkoppling och lokal projektlivscykel |
| `dist/io.js` | CSV, nedladdningar och IndexedDB |
| `dist/exporter.js` | Fristående HTML-specialist utan nätverksberoenden |
| `tests/` | Automatiska tester med Node:s inbyggda testmotor |

Inga externa kodberoenden. Ingen generell öppen källkodslicens är tillagd.
