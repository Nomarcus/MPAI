# MPAI – SEO-aktionsplan

Status: **kod-delen är klar**. Kvarstår 4 steg som måste göras i hostingens/Googles gränssnitt eftersom jag inte har åtkomst dit.

---

## ✅ Klart (implementerat i koden)

- Meta description (148 tecken) med primära keywords
- Title utökad till 57 tecken med Copilot 365-fokus
- 6 JSON-LD-block (ProfessionalService, Person, WebSite, Service×4 + Product, FAQPage, BreadcrumbList)
- Open Graph + Twitter Cards + OG-bild (1200×630)
- robots.txt med explicit tillstånd för GPTBot, Perplexity, Claude, Google-Extended
- sitemap.xml med image sitemap
- .htaccess med HTTPS-redirect, HSTS, security headers, gzip, browser caching
- Komplett favicon-set (16, 32, 180, 192, 512, .ico)
- site.webmanifest för PWA-signaler
- hreflang + canonical
- Article published/modified dates (freshness)
- Author meta + Person schema (E-E-A-T)
- Preconnect till Formspree för snabbare form-submit

---

## 🔲 Steg 1 – Aktivera HTTPS (25 % av SEO-lyftet)

**Hos One.com / Loopia / din hostingleverantör:**

1. Logga in på hostingens kontrollpanel
2. Hitta "SSL-certifikat" eller "Let's Encrypt"
3. Klicka "Aktivera gratis SSL" för mpai.se
4. Vänta 5–15 min på certifikatet
5. Testa: öppna `https://mpai.se/` – ska ladda utan varningar

När HTTPS är aktivt kickar `.htaccess` automatiskt in och 301-redirectar all HTTP-trafik → HTTPS. Ingen mer kod-ändring behövs.

**Verifiera:** öppna `http://mpai.se/` – ska redirecta till `https://mpai.se/`

---

## 🔲 Steg 2 – Google Search Console

1. Gå till https://search.google.com/search-console
2. Logga in med ditt Google-konto
3. Klicka "Lägg till egendom" → "URL-prefix" → skriv `https://mpai.se/`
4. Verifiera ägarskap:
   - Välj metod **"HTML-tagg"** → kopiera meta-taggen
   - Skicka den till mig så lägger jag in den i head:en
   - Eller: välj **"DNS"** och lägg TXT-record hos domänleverantören
5. När verifierat: gå till "Sitemaps" i vänster meny
6. Skriv `sitemap.xml` och klicka "Skicka"

Efter 2–7 dagar börjar Google visa indexeringsstatus, rich-result-kvalitet, sökfrågor etc.

---

## 🔲 Steg 3 – Bing Webmaster Tools

1. Gå till https://www.bing.com/webmasters
2. "Add site" → `https://mpai.se/`
3. Importera från Google Search Console (enklast) – eller verifiera separat
4. Submit `sitemap.xml`

---

## 🔲 Steg 4 – Testa allt

När HTTPS är på plats, testa i tur och ordning:

| Verktyg | URL | Vad det testar |
|---------|-----|----------------|
| Rich Results Test | https://search.google.com/test/rich-results | JSON-LD (FAQ, Org, Person, Service) |
| Mobile Friendly Test | https://search.google.com/test/mobile-friendly | Mobilanpassning |
| PageSpeed Insights | https://pagespeed.web.dev/ | Core Web Vitals |
| LinkedIn Post Inspector | https://www.linkedin.com/post-inspector/ | OG-taggar för LinkedIn-delning |
| Meta Sharing Debugger | https://developers.facebook.com/tools/debug/ | OG-taggar för Facebook |
| Twitter Card Validator | https://cards-dev.twitter.com/validator | Twitter-kort |

Paste-in `https://mpai.se/` i varje och kontrollera att det inte finns fel.

---

## 🔲 Steg 5 – LinkedIn-profil

Uppdatera LinkedIn-profilen så Google kopplar ihop dig med sajten:

1. Lägg `mpai.se` som företag på din LinkedIn
2. Koppla `mpai.se` i "Kontaktinformation" → "Webbplats"
3. När du är verifierad, lägg till LinkedIn-URL:en i JSON-LD `sameAs`-arrayen (skicka din LinkedIn-URL till mig så uppdaterar jag)

---

## Förväntat resultat

| Före | Efter kod + HTTPS | Efter alla steg (3–6 mån) |
|------|-------------------|---------------------------|
| 73/100 | ~88/100 | ~95/100 |
| AI Search: 35/100 | AI Search: ~85/100 | AI Search: ~95/100 |
| 0 JSON-LD | 6 JSON-LD-block | 6 JSON-LD-block indexerade |
| Ingen OG-bild | OG-bild 1200×630 | Rich previews på sociala medier |
| HTTP | HTTPS + HSTS | Trust-signal + rankning-boost |

---

## Löpande underhåll

- **Var 3:e månad:** Uppdatera `article:modified_time` i index.html till dagens datum
- **Efter innehållsändring:** Resubmit sitemap i Search Console
- **Månadsvis:** Kolla Search Console för nya sökfrågor + klickrate

---

*Genererad 2026-04-21*
