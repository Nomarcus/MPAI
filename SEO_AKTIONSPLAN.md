# MPAI – SEO-aktionsplan

Status: **kod-delen är nu faktiskt klar (uppdaterad 2026-04-27)**. HTTPS är aktiverat på GitHub Pages. Kvarstår 3 steg som måste göras i Google/Bing/LinkedIn.

> **Notering:** Tidigare version av detta dokument hävdade att kod-delen var klar redan 2026-04-21, men `<head>` i `index.html` saknade i praktiken alla meta-taggar och JSON-LD-block. Det är åtgärdat 2026-04-27.

---

## ✅ Klart 2026-04-27 (faktiskt implementerat i koden)

**Head-metadata i `index.html`:**
- Title utökad till 58 tecken: "MPAI – AI-rådgivning & Copilot 365-utbildning för ledare"
- Meta description (158 tecken) med primära keywords
- Meta keywords + meta robots (`index,follow,max-image-preview:large`)
- Author meta + Person JSON-LD (E-E-A-T)
- Canonical → `https://mpai.se/`
- Favicon-set länkat (.ico, 16×16, 32×32, 180×180 apple-touch, 192×192, 512×512)
- `<link rel="manifest">` → `site.webmanifest`
- Theme-color (#1A5C34)
- Open Graph (type, locale, site_name, title, description, url, image 1200×630, alt)
- Twitter Cards (summary_large_image)
- Article published/modified dates (freshness signals)

**8 JSON-LD-block:**
1. ProfessionalService (Organization-entity)
2. Person (Marcus Petersson)
3. WebSite
4. FAQPage med 8 Q&A
5. Service – Utbildning Copilot 365 & ChatGPT (med pris)
6. Service – AI just nu
7. Service – Verksamhetsanpassad AI-genomgång
8. BreadcrumbList

**Innehåll i body:**
- FAQ utökad från 6 → 8 frågor (lade till "Skillnaden mellan ChatGPT och Copilot 365" + "Hur kommer vi igång")
- About-sektionen utbyggd med 2 nya stycken (E-E-A-T, primärkällor)
- Ny "Resurser & källor"-sektion med 5 auktoritativa externa länkar (EU-Lex, Microsoft Learn, IMY, OpenAI, DIGG)
- "FAQ" tillagd i navigation
- "Senast uppdaterad: 27 april 2026"-rad i footer
- Trasigt CSS-block städat

**Server-sida (var redan klart):**
- `robots.txt` med explicit tillstånd för GPTBot, ChatGPT-User, PerplexityBot, ClaudeBot, anthropic-ai, Google-Extended
- `sitemap.xml` med image-sitemap
- `.htaccess` med HTTPS-redirect, HSTS, security headers, gzip, browser caching (gäller om sajten flyttas till Apache-host; GitHub Pages tvingar redan HTTPS)
- `site.webmanifest` för PWA-signaler

---

## ✅ HTTPS aktivt (klart 2026-04-27)

GitHub Pages har "Enforce HTTPS" påslaget för mpai.se. All trafik tvingas till `https://`. Trasiga `http://`-länkar redirectas automatiskt av GitHub Pages — `.htaccess` (Apache-konfig) ligger kvar i repo om sajten en dag flyttas till en Apache-host, men har ingen effekt på GitHub Pages.

**Verifiera:** öppna `http://mpai.se/` – ska redirecta till `https://mpai.se/`. SSL Labs-test (`https://www.ssllabs.com/ssltest/analyze.html?d=mpai.se`) bör ge A eller A+.

---

## 🔲 Steg 1 – Google Search Console

1. Gå till https://search.google.com/search-console
2. Logga in med ditt Google-konto
3. Klicka "Lägg till egendom" → "URL-prefix" → skriv `https://mpai.se/`
4. Verifiera ägarskap:
   - Välj metod **"HTML-tagg"** → kopiera meta-taggen
   - Skicka den till mig så lägger jag in den i head:en
   - Eller: välj **"DNS"** och lägg TXT-record hos domänleverantören
5. När verifierat: gå till "Sitemaps" i vänster meny
6. Skriv `sitemap.xml` och klicka "Skicka"
7. Använd "URL inspection" → "Request indexing" på `https://mpai.se/` för att skynda på första indexeringen

Efter 2–7 dagar börjar Google visa indexeringsstatus, rich-result-kvalitet, sökfrågor etc.

---

## 🔲 Steg 2 – Bing Webmaster Tools

1. Gå till https://www.bing.com/webmasters
2. "Add site" → `https://mpai.se/`
3. Importera från Google Search Console (enklast) – eller verifiera separat
4. Submit `sitemap.xml`

---

## 🔲 Steg 3 – LinkedIn-profil + sameAs

Uppdatera LinkedIn-profilen så Google kopplar ihop dig med sajten:

1. Lägg `mpai.se` som företag på din LinkedIn
2. Koppla `mpai.se` i "Kontaktinformation" → "Webbplats"
3. Skicka din LinkedIn-URL till mig så lägger jag in den i `sameAs`-arrayen i både `Organization`- och `Person`-schemat (de står som tomma `[]` just nu, rad 728 och 759 i `index.html`)

Andra profiler som kan läggas till för bättre entity clarity: Crunchbase, GitHub, eventuell företagsprofil på Allabolag/Hitta.se.

---

## 🔲 Steg 4 – Verifieringstester (kör så fort sajten är ompublicerad)

| Verktyg | URL | Vad det testar |
|---------|-----|----------------|
| Rich Results Test | https://search.google.com/test/rich-results | JSON-LD (FAQ, Org, Person, Service, Breadcrumb) |
| Schema Validator | https://validator.schema.org/ | Komplett schema-validering |
| Mobile Friendly Test | https://search.google.com/test/mobile-friendly | Mobilanpassning |
| PageSpeed Insights | https://pagespeed.web.dev/ | Core Web Vitals (var 100/100) |
| LinkedIn Post Inspector | https://www.linkedin.com/post-inspector/ | OG-taggar för LinkedIn-delning |
| Meta Sharing Debugger | https://developers.facebook.com/tools/debug/ | OG-taggar för Facebook |
| SSL Labs | https://www.ssllabs.com/ssltest/analyze.html?d=mpai.se | HTTPS-konfig & cert |

Paste-in `https://mpai.se/` i varje och kontrollera att det inte finns fel. Förvänta dig att `Organization` saknar varning om `sameAs` tills LinkedIn-länken läggs till.

---

## Förväntat resultat

| Före (2026-04-26) | Efter kod + HTTPS (2026-04-27) | Efter alla steg (3–6 mån) |
|------|-------------------|---------------------------|
| 72/100 | ~88/100 | ~95/100 |
| AI Search: ~35/100 | AI Search: ~88/100 | AI Search: ~95/100 |
| 0 JSON-LD | 8 JSON-LD-block | 8 JSON-LD-block indexerade |
| Ingen OG-bild | OG-bild 1200×630 | Rich previews på sociala medier |
| 2 externa länkar | 7+ auktoritativa externa länkar | Topical authority byggd |
| HTTP | HTTPS (GitHub Pages-enforced) | Trust-signal + rankning-boost |
| Title 39 tecken | Title 58 tecken | CTR-optimerad |

---

## Löpande underhåll

- **Var 3:e månad:** Uppdatera `article:modified_time` i `index.html` (rad ~52) + "Senast uppdaterad" i footer + `<lastmod>` i `sitemap.xml` till dagens datum
- **Efter innehållsändring:** Resubmit sitemap i Search Console
- **Månadsvis:** Kolla Search Console för nya sökfrågor + klickrate
- **Halvårsvis:** Granska FAQ – lägg till nya vanliga frågor från kunder, ta bort inaktuella

---

*Senast uppdaterad: 2026-04-27*
