// All examples are fictional and hand-written. No customer or workplace data.
export const DISCOVERY_DEMO=[
  'Kan kalendern visa nästa veckas aktiviteter?', 'Jag önskar en kalender som går att dela med familjen.',
  'Kalendern behöver kunna visa flera veckor samtidigt.', 'Det vore bra med en påminnelse från kalendern.',
  'Vi vill kunna lägga till återkommande aktiviteter i kalendern.', 'Kan man synka kalendern med mobilen?',
  'Kalendern är tydlig men jag saknar månadsöversikt.', 'Jag hittar inte nästa aktivitet i kalendern.',
  'Kan ni lägga till export till PDF?', 'PDF-exporten fungerar inte på min dator.',
  'Jag vill exportera rapporten som PDF.', 'Det vore bra om PDF-exporten hade större text.',
  'Exporten ger mig en tom PDF-fil.', 'Jag behöver kunna exportera flera PDF-rapporter samtidigt.',
  'När jag exporterar till PDF saknas bilderna.', 'Jag uppskattar verkligen möjligheten att exportera PDF.',
  'Kan jag välja engelska som språk?', 'Vi behöver fler språk i menyerna.',
  'Det vore bra med språkstöd för arabiska.', 'Jag vill byta språk utan att starta om.',
  'Svenska och engelska borde vara valbara språk.', 'Var väljer jag språk i appen?',
  'Några menyer visas på fel språk.', 'Fler språk skulle hjälpa många i vår grupp.'
];
function rows(label,texts) { return texts.map(text=>({label,text})); }
export const PRESETS = [
  {
    id:'support',name:'Kundservice',eyebrow:'SORTERA INKOMMANDE ÄRENDEN',description:'Teknik, konto eller betalning? Lär modellen hur din inkorg fungerar.',
    labels:['Teknik','Konto','Betalning'],
    rows:[
      ...rows('Teknik',[
        'Appen kraschar varje gång jag öppnar en bild.', 'Webbsidan laddar inte och visar felkod 500.',
        'Det går inte att ladda upp PDF-filer i systemet.', 'Exporten till Excel ger en tom fil.',
        'Bilderna försvinner när jag sparar dokumentet.', 'Rapporten fastnar och programmet slutar svara.',
        'Jag får ett tekniskt fel när jag försöker skriva ut.', 'Sökfunktionen hittar inga resultat trots att dokumenten finns.',
        'Integrationen skickar inte data till vårt system.', 'Videon hackar och ljudet försvinner.',
        'Min filuppladdning stannar på femtio procent.', 'Knappen spara fungerar inte i webbläsaren.',
        'Servern svarar inte och tjänsten verkar ligga nere.', 'Efter uppdateringen kraschar programmet vid start.',
        'Det uppstår en bugg när vi skapar en rapport.', 'Sidan blir helt vit när jag öppnar verktyget.',
        'En felkod visas när jag försöker importera data.', 'PDF-exporten misslyckas med ett felmeddelande.'
      ]),
      ...rows('Konto',[
        'Jag har glömt mitt lösenord och behöver återställa det.', 'Hur ändrar jag e-postadressen på mitt konto?',
        'Kan ni lägga till en ny användare i vårt team?', 'Jag behöver ändra behörighet för en kollega.',
        'Min inloggning är spärrad efter för många försök.', 'Jag vill radera mitt användarkonto.',
        'Återställningslänken för lösenord har gått ut.', 'Hur aktiverar jag tvåfaktorsautentisering?',
        'Jag får ingen engångskod för att logga in.', 'Kan ni bjuda in vår nya medarbetare?',
        'Jag vill byta namn i min användarprofil.', 'Vem kan ge mig administratörsbehörighet?',
        'Vi behöver ta bort en användare som har slutat.', 'Jag har bytt telefon och kommer inte åt mitt konto.',
        'Lösenordet accepteras inte vid inloggning.', 'Hur återställer vi åtkomsten till administratörskontot?',
        'Kan jag byta min registrerade e-postadress?', 'Inbjudan till teamet har inte kommit fram.'
      ]),
      ...rows('Betalning',[
        'Jag har fått en faktura med fel belopp.', 'Kan ni skicka ett kvitto för förra månadens betalning?',
        'Mitt kort har debiterats två gånger.', 'Hur säger jag upp mitt abonnemang?',
        'Jag vill ha en återbetalning för köpet.', 'Kan vi betala med faktura i stället för kort?',
        'Det saknas moms på underlaget.', 'Priset på vår prenumeration verkar ha höjts.',
        'Kan ni uppdatera vår faktureringsadress?', 'Min betalning nekades trots att det finns pengar på kortet.',
        'Vi behöver ett underlag till bokföringen.', 'Hur byter vi betalningskort för abonnemanget?',
        'Fakturan är redan betald men jag har fått en påminnelse.', 'Jag vill avsluta prenumerationen innan nästa debitering.',
        'Kan ni kreditera den felaktiga fakturan?', 'Vi har betalat för många licenser och vill få pengarna tillbaka.',
        'Är priserna inklusive eller exklusive moms?', 'Jag behöver betalningsuppgifter och förfallodatum.'
      ])
    ],
    blind:[
      {text:'Alla uppladdade foton ger felmeddelande och sidan hänger sig.',label:'Teknik'},
      {text:'Excel-exporten kraschar efter senaste versionen.',label:'Teknik'},
      {text:'Sökningen i dokumentarkivet fungerar inte längre.',label:'Teknik'},
      {text:'Det blir en vit sida i stället för rapporten.',label:'Teknik'},
      {text:'Vår serverintegration har slutat överföra data.',label:'Teknik'},
      {text:'Min nya kollega behöver ett användarkonto med administratörsbehörighet.',label:'Konto'},
      {text:'Jag behöver en ny länk för att återställa mitt lösenord.',label:'Konto'},
      {text:'Var ändrar jag e-post i profilen?',label:'Konto'},
      {text:'Hur tar vi bort en gammal teammedlems åtkomst?',label:'Konto'},
      {text:'Engångskoden för inloggning saknas fortfarande.',label:'Konto'},
      {text:'Beloppet på fakturan stämmer inte med vårt avtal.',label:'Betalning'},
      {text:'Jag önskar få ett kvitto med moms till bokföringen.',label:'Betalning'},
      {text:'Avsluta vår prenumeration före nästa kortdebitering.',label:'Betalning'},
      {text:'Vi vill bli återbetalda eftersom ni dragit pengar dubbelt.',label:'Betalning'},
      {text:'Vilket datum måste vår faktura vara betald?',label:'Betalning'}
    ],
    queue:[
      'Programmet kraschar när jag försöker exportera rapporten.',
      'Jag behöver byta e-postadress och återställa lösenordet.',
      'Var hittar jag kvittot för vår prenumeration?',
      'Kan ni bjuda in två nya användare till vårt team?',
      'Jag får felkod 500 vid filuppladdning.',
      'Kortet har debiterats två gånger. Jag vill få pengarna tillbaka.',
      'Kan vi boka ett möte om ert nya erbjudande?',
      'Det går inte att logga in och jag har fått en felaktig faktura.'
    ]
  },
  {
    id:'mpai',name:'MPAI:s förfrågningar',eyebrow:'HITTA RÄTT AFFÄR',description:'Utbildning, rådgivning eller utveckling? Träna en specialist för dina förfrågningar.',
    labels:['Utbildning','Rådgivning','Utveckling'],
    rows:[
      ...rows('Utbildning',[
        'Vi vill boka en workshop om Copilot för våra medarbetare.', 'Kan du hålla en introduktion till AI på vår APT?',
        'Vi behöver en utbildning i att skriva bra promptar.', 'Har ni en kurs i Microsoft 365 Copilot?',
        'Vi söker en föreläsare till en inspirationsdag om AI.', 'Vi vill lära personalen att använda AI i vardagen.',
        'Kan du ordna en praktisk workshop för vår ledningsgrupp?', 'Vad kostar ett utbildningspass på två timmar?',
        'Vi vill boka en föreläsning om hur generativ AI fungerar.', 'Kan lärarna få en introduktionskurs i AI-verktyg?',
        'Vi planerar en studiedag och behöver AI-utbildning.', 'Vi vill träna på promptar tillsammans i en workshop.'
      ]),
      ...rows('Rådgivning',[
        'Vi behöver hjälp att ta fram en AI-strategi.', 'Kan ni granska vår AI-policy och våra riktlinjer?',
        'Vi behöver en plan för att införa AI i organisationen.', 'Hur kartlägger vi riskerna med våra AI-system?',
        'Vi vill ha rådgivning om ansvarsfull AI-användning.', 'Kan du hjälpa oss prioritera våra AI-initiativ?',
        'Vi behöver bedöma var AI skapar mest verksamhetsnytta.', 'Vi söker stöd i att formulera en handlingsplan för AI.',
        'Kan ni hjälpa oss med förändringsledning och AI-adoption?', 'Vi behöver en nulägesanalys av vår AI-mognad.',
        'Hur mäter vi effekten av vår satsning på Copilot?', 'Vi vill ha en oberoende genomgång av vår AI-styrning.'
      ]),
      ...rows('Utveckling',[
        'Vi vill bygga en egen chattbot för våra kunder.', 'Kan ni utveckla en app som sorterar inkommande ärenden?',
        'Vi behöver en integration mellan vår databas och ett AI-verktyg.', 'Kan ni bygga en prototyp som analyserar dokument?',
        'Vi vill automatisera ett arbetsflöde med ett API.', 'Vi behöver hjälp med kod och utveckling av en webbtjänst.',
        'Kan ni skapa ett interaktivt spel till vår webbplats?', 'Vi vill koppla vårt CRM till en egen AI-agent.',
        'Vi behöver en specialbyggd dashboard med våra data.', 'Kan ni utveckla en mobilapp för våra användare?',
        'Vi vill bygga en dokumentassistent som söker i våra filer.', 'Vi söker hjälp att programmera en intern AI-lösning.'
      ])
    ],
    blind:[
      {text:'Vi önskar en promptworkshop för tjugo personer.',label:'Utbildning'},
      {text:'Boka gärna en föreläsning till vår personaldag.',label:'Utbildning'},
      {text:'Kan du utbilda vårt team i Copilot?',label:'Utbildning'},
      {text:'Vår organisation behöver en AI-policy och införandeplan.',label:'Rådgivning'},
      {text:'Vi söker råd om AI-mognad och förändringsledning.',label:'Rådgivning'},
      {text:'Hjälp oss att prioritera verksamhetens AI-satsningar.',label:'Rådgivning'},
      {text:'Kan du programmera en mobilapp med en egen chattbot?',label:'Utveckling'},
      {text:'Vi vill bygga en databas-integration för dokumentanalys.',label:'Utveckling'},
      {text:'En ny prototyp och ett API behöver utvecklas.',label:'Utveckling'}
    ],
    queue:['Kan vi boka en inspirationsföreläsning om AI till vår studiedag?', 'Vi behöver en AI-strategi och stöd i förändringsledning.', 'Vi vill bygga en AI-app med koppling till vårt CRM.', 'Kan du hjälpa oss med vår AI-policy?', 'Vi vill utbilda vår personal i Copilot.', 'Vad äter ni till lunch på fredag?']
  },
  {
    id:'feedback',name:'Kundfeedback',eyebrow:'FÖRSTÅ VAD SOM BEHÖVS',description:'Hitta buggar, förbättringsidéer och beröm i en hög med kommentarer.',
    labels:['Felrapport','Önskemål','Beröm'],
    rows:[
      ...rows('Felrapport',[
        'Appen stänger ner sig när jag öppnar kameran.', 'Ljudet fungerar inte i den senaste versionen.',
        'Jag får felmeddelande när jag sparar.', 'Bilderna går inte att öppna längre.',
        'Sidan fryser efter några sekunder.', 'Det går inte att skicka in formuläret.',
        'Mina sparade uppgifter har försvunnit.', 'Knapparna reagerar inte när jag trycker.',
        'Det finns en bugg i sökningen.', 'Skärmen blir svart när jag startar videon.',
        'Programmet kraschar vid export.', 'Ingen text visas i rapporten trots att jag har skrivit.'
      ]),
      ...rows('Önskemål',[
        'Jag skulle vilja kunna välja mörkt tema.', 'Kan ni lägga till stöd för fler språk?',
        'Det vore bra om man kunde exportera till PDF.', 'Jag önskar en funktion för påminnelser.',
        'Ni borde lägga till en gemensam kalender.', 'Vi vill gärna ha möjlighet att dela med kollegor.',
        'Ett förslag är att lägga till större textstorlek.', 'Kan ni bygga ett läge som fungerar offline?',
        'Jag saknar möjligheten att sortera listorna.', 'Det hade varit fint med fler övningar.',
        'Jag önskar en knapp för att ångra.', 'Lägg gärna till möjlighet att välja färger.'
      ]),
      ...rows('Beröm',[
        'Vilken fantastisk app, den hjälper oss varje dag!', 'Tack för ett enkelt och tydligt verktyg.',
        'Superbra upplevelse och snabb support!', 'Jag är väldigt nöjd med hur smidigt allt fungerar.',
        'Det här är precis vad vi behövde, stort tack.', 'En riktigt bra tjänst som sparar massor av tid.',
        'Vi älskar det tydliga gränssnittet.', 'Otroligt lätt att komma igång, bra jobbat!',
        'Fantastiskt bra förklaringar och fin design.', 'Det fungerar jättebra och är roligt att använda.',
        'Jag rekommenderar er till alla jag känner.', 'Så smart och enkelt, fortsätt så här!'
      ])
    ],
    blind:[
      {text:'Kameran kraschar varje gång jag tar en bild.',label:'Felrapport'},
      {text:'Ljudet försvinner och videon fryser.',label:'Felrapport'},
      {text:'Knappen för att spara reagerar inte.',label:'Felrapport'},
      {text:'Jag önskar stöd för engelska och större text.',label:'Önskemål'},
      {text:'Lägg gärna till en funktion för PDF-export.',label:'Önskemål'},
      {text:'Det vore bra med möjlighet att dela kalendern.',label:'Önskemål'},
      {text:'Fantastiskt verktyg, tack för all hjälp!',label:'Beröm'},
      {text:'Vi är supernöjda med den enkla designen.',label:'Beröm'},
      {text:'Vilken bra tjänst, jag rekommenderar den varmt.',label:'Beröm'}
    ],
    queue:['Det vore bra med fler språk och en ångraknapp.', 'Appen kraschar när jag öppnar en bild.', 'Fantastiskt verktyg, jag sparar massor av tid!', 'Kan ni lägga till ett mörkt tema?', 'Knapparna i formuläret reagerar inte.', 'Tåget till Göteborg går klockan sju.']
  }
];
