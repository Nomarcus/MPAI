# MPAI Signal — bygganteckningar, 23 oktober 2026

## Uppdraget och valet

Marcus gav fria händer att använda sitt GitHub och tidigare arbete för att bygga något verkligt användbart med AI och maskininlärning. Jag kartlade 25 åtkomliga repon, hämtade README där sådan fanns och fördjupade mig i MPAI:s befintliga källstruktur. Detta är en produktorienterad genomgång, inte en fullständig revision av varje kodrad.

Mönstret var tydligt: experiment med lärande agenter, interaktiva utbildningar, pedagogik och små användbara webbverktyg. Friktionen var ofta vägen från intressant experiment till något som är lätt att öppna, förstå och faktiskt använda.

Signal låter Marcus både visa hur ML fungerar i MPAI-workshops och skapa egna små textverktyg. Dess oväntade del är kedjan **omärkt text → upptäckta ordteman → mänskligt granskade exempel → lärd modell → fristående AI-verktyg**.

## Hur befintligt arbete påverkade valet

| Projektområde | Verifierad iakttagelse | Konsekvens i Signal |
| --- | --- | --- |
| SnakeAI / Snake-ML / Python-varianter | Synligt lärande, utvärdering och körbara agenter är centrala. | Visa modellval, förlustkurva och faktiskt beteende; exportera tränade vikter. |
| AIWorkshop- och MPAI | Interaktiva svenska workshopmaterial och konsultverksamhet. | En länk, svenska arbetsytor, färdigt 10-minuterspass och affärsförfrågningar som demo. |
| FoodSim | Textklassificering och ärenderouting, med uttalade skillnader mellan regler och modeller. | Lär kategorier från märkta exempel och testa på andra texter. |
| Föräldrahjälpen | Pedagogik och hjälp att förklara. | Visa varför modellen föreslår en kategori och ge begripliga granskningsorsaker. |
| Små webbverktyg och mobilspel | Låg starttröskel och direkt återkoppling. | Inga konton i appen, inga API-nycklar, få steg till en fungerande specialist. |
| Experiment som avslutats | En produkt behöver ett tydligt användningsskäl och en lättbegriplig nästa handling. | ”Visa → träna → rätta → exportera” är huvudflödet. |

Inga ändringar har gjorts i befintliga produktionsappar. GitHub-leveransen lägger till ett separat `labs/signal/` på en feature branch i MPAI. Den publicerade appen är en separat privat installation. Inga privata repo-innehåll, arbetsgivardata, kundtexter, hemligheter eller slutanvändardata kopierades in i demo-underlaget.

## Mätningar på fiktiva exempel

Mätt med den levererade deterministiska träningsmotorn, standardseed och standardparametrar. Inga externa AI-anrop.

| Demo | Träningsexempel | 3-fold accuracy | Macro-F1 | Separat reservprov |
| --- | ---: | ---: | ---: | ---: |
| Kundservice | 54 | 81,5 % | 0,814 | 15/15 |
| MPAI:s förfrågningar | 36 | 75,0 % | 0,751 | 9/9 |
| Kundfeedback | 36 | 80,6 % | 0,807 | 9/9 |

Hybridvarianten med ordfragment valdes för alla tre. Dessa resultat gäller bara det handskrivna demomaterialet. Reservproven är små, tydliga och skrivna av samma skapare; de är inte realistiska produktionsbenchmarkar. Flera korrekta förstahandsförslag begär också granskning.

## Metodval

Signal använder en egen JavaScript-implementation av etablerade metoder. Ingen färdig skenmodell eller hårdkodad etikettlogik. Den byter faktisk inlärd etikett om träningsetiketterna vänds, vilket verifieras i testerna.

- TF-IDF med smoothed IDF och L2-normaliserade glesa vektorer.
- Ord och ordpar jämfört med samma representation plus teckenfragment inom ord.
- Multinomial logistisk regression med softmax, balanserade klassbidrag, L2-reglering och deterministisk SGD.
- Vokabulär och IDF anpassas separat för varje träningspartition. Ingen vokabulär från testpartitionen används i fit.
- Stratifierad 3-fold korsvalidering och macro-F1 för modellval. Ingen nested CV; modellvalsresultatet redovisas därför uttryckligen som en utvecklingsindikator.
- Exakta dubbletter tas bort före uppdelning. Gruppering av närdubbletter är en framtida förbättring.
- Granskningssignaler är okalibrerade heuristiker: softmax, marginal, känd ordandel och cosine-likhet till klassprototyp. Ingen garanti om detektion av alla okända ämnen.
- Oövervakad gruppering använder spherical k-means, fem omstarter, k-means++ och cosine-likhet. Vanliga svenska önskemålsfraser filtreras i temaarbetsytan. Inga temakategorier är hårdkodade.

Primärkällor för metodval och begränsningar:

- https://scikit-learn.org/stable/modules/feature_extraction.html#text-feature-extraction
- https://scikit-learn.org/stable/common_pitfalls.html#data-leakage
- https://scikit-learn.org/stable/modules/cross_validation.html
- https://developers.google.com/machine-learning/guides/text-classification/step-3

## Kontroller och kvarvarande gränser

15 automatiska tester passerar. Träning, klassificering, separat test, lokalt återställt projekt och oövervakad gruppering är manuellt kontrollerade i Chromium. Genererad HTML har körts i en isolerad JS-kontext med ett DOM-testskal och ger samma kategorier som huvudmodellen. Testet provar också ett projektnamn med en scriptinjektion.

Browserautomationens nedladdningshändelse uteblev trots att exportåtgärden slutfördes i appen. Filnedladdning och faktisk öppning av HTML på iPhone/Android har därför inte verifierats. Service worker kan inte testas från den osäkra interna HTTP-previewen; offlinecache och installation på fysisk mobil återstår. 390-pixlars mobil-layout är visuellt kontrollerad i iframe; ingen fysisk mobiltest är genomförd.

## Bra första riktiga användning

Ta 60–100 icke-känsliga och manuellt granskade texter från en enda tydlig uppgift. Håll undan ett nytt sluttest innan du börjar träna. Lär modellen resten, rätta gränsfallen och utvärdera det undanhållna sluttestet en gång. Blanda inte in arbetsgivar- eller kunddata utan rätt underlag för användningen.

Möjliga nästa steg utifrån faktisk användning: kalibrera sannolikheter, gruppera närdubbletter, minnes- och hastighetstesta större data, verifiera mobil export/offline och därefter överväga en valbar lokal flerspråkig embeddingmodell. Ingen sådan embeddingmodell eller LLM är levererad i version 1.
