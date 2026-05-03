import os, textwrap

OUT_DIR='deliverables'
os.makedirs(OUT_DIR, exist_ok=True)
OUT_FILE=os.path.join(OUT_DIR,'MPAI_ChatGPT_Utbildning.pdf')

W,H=595,842  # A4 points

# MPAI-inspired palette (blue/cyan + dark navy)
C_BG=(245,250,255)
C_PRIMARY=(19,106,168)
C_SECONDARY=(29,191,196)
C_DARK=(16,39,64)
C_MUTED=(96,120,145)
C_WHITE=(255,255,255)


def esc(s):
    return s.replace('\\','\\\\').replace('(','\\(').replace(')','\\)')

def rgb(c):
    return f"{c[0]/255:.3f} {c[1]/255:.3f} {c[2]/255:.3f}"

class Page:
    def __init__(self):
        self.ops=[]
    def rect(self,x,y,w,h,fill=None,stroke=None,lw=1):
        if fill:
            self.ops.append(f"{rgb(fill)} rg")
        if stroke:
            self.ops.append(f"{rgb(stroke)} RG {lw} w")
        if fill and stroke:
            op='B'
        elif fill:
            op='f'
        else:
            op='S'
        self.ops.append(f"{x:.1f} {y:.1f} {w:.1f} {h:.1f} re {op}")
    def line(self,x1,y1,x2,y2,color=C_DARK,lw=1):
        self.ops.append(f"{rgb(color)} RG {lw} w {x1:.1f} {y1:.1f} m {x2:.1f} {y2:.1f} l S")
    def text(self,x,y,text,size=12,color=C_DARK,font='Helvetica'):
        self.ops.append(f"BT /{font} {size} Tf {rgb(color)} rg 1 0 0 1 {x:.1f} {y:.1f} Tm ({esc(text)}) Tj ET")
    def wrapped(self,x,y,w,text,size=12,leading=1.35,color=C_DARK,font='Helvetica'):
        max_chars=max(18,int(w/(size*0.53)))
        lines=[]
        for para in text.split('\n'):
            if not para.strip():
                lines.append('')
            else:
                lines.extend(textwrap.wrap(para,width=max_chars))
        yy=y
        for line in lines:
            self.text(x,yy,line,size=size,color=color,font=font)
            yy-=size*leading
        return yy


def title_bar(p,title,subtitle=None):
    p.rect(0,0,W,H,fill=C_BG)
    p.rect(0,H-115,W,115,fill=C_DARK)
    p.rect(0,H-125,W,10,fill=C_SECONDARY)
    p.text(40,H-62,'MPAI x ChatGPT',size=14,color=C_SECONDARY,font='Helvetica-Bold')
    p.text(40,H-95,title,size=24,color=C_WHITE,font='Helvetica-Bold')
    if subtitle:
        p.text(40,H-113,subtitle,size=11,color=(200,220,240))

pages=[]

# 1 Cover
p=Page(); title_bar(p,'Enkel visuell utbildning', 'För olika roller: från nybörjare till avancerad användning')
p.rect(40,120,515,570,fill=C_WHITE,stroke=(220,231,242))
p.text(65,650,'Vad du får i denna PDF:',size=16,color=C_PRIMARY,font='Helvetica-Bold')
items=['Navigera i ChatGPT-gränssnittet','Prompting: från enkelt till kraftfullt','GPTs och Projects','Bildskapande med AI','Rollbaserade exempel (ledning, sälj, HR, support)','Best practices och policy för säkert användande']
y=620
for it in items:
    p.rect(65,y-4,8,8,fill=C_SECONDARY)
    p.text(80,y-2,it,size=12,color=C_DARK)
    y-=42
p.text(65,150,'Design: inspirerad av MPAI (mörkblå + cyan).',size=11,color=C_MUTED)
pages.append(p)

# 2 Navigation UI
p=Page(); title_bar(p,'1. Kom igång: Navigera i ChatGPT')
p.rect(40,130,515,560,fill=C_WHITE,stroke=(220,231,242))
# mock app
p.rect(60,170,475,480,fill=(249,252,255),stroke=(210,223,238))
p.rect(60,170,120,480,fill=(239,246,253),stroke=(210,223,238))
p.text(72,620,'Sidomeny',11,C_PRIMARY,'Helvetica-Bold')
for i,t in enumerate(['Ny chatt','Historik','GPTs','Projects','Inställningar']):
    p.text(72,592-i*26,f'• {t}',10,C_DARK)
p.rect(180,170,355,480,fill=C_WHITE,stroke=(210,223,238))
p.text(195,620,'Huvudyta',11,C_PRIMARY,'Helvetica-Bold')
p.rect(195,560,325,70,fill=(245,249,254),stroke=(220,231,242))
p.text(205,603,'Rubrik + modellval',10,C_MUTED)
p.rect(195,250,325,290,fill=(252,254,255),stroke=(232,238,246))
p.text(205,510,'Chatflöde (frågor + svar)',10,C_MUTED)
p.rect(195,190,325,45,fill=C_WHITE,stroke=(190,212,233))
p.text(205,207,'Promptfält: "Skriv tydligt vad du vill uppnå"',10,C_DARK)
p.text(60,140,'Tips: Börja med standardmodellen, byt först när du vet varför.',11,C_MUTED)
pages.append(p)

# 3 Prompting
p=Page(); title_bar(p,'2. Prompting som fungerar')
p.rect(40,130,515,560,fill=C_WHITE,stroke=(220,231,242))
p.text(60,650,'Formel: Roll + Mål + Kontext + Format + Kvalitetskrav',14,C_PRIMARY,'Helvetica-Bold')
p.rect(60,560,475,72,fill=(239,248,255),stroke=(190,212,233))
p.wrapped(72,605,450,'Exempel: "Du är en pedagogisk coach. Skapa en 20-minuters introduktion till AI för säljteam. Använd enkel svenska och avsluta med 3 praktiska övningar."',11,color=C_DARK)
p.text(60,530,'Snabb checklista innan du skickar prompten:',12,C_PRIMARY,'Helvetica-Bold')
checks=['Är målet tydligt?','Har du målgrupp/roll?','Har du önskat format (lista, tabell, mail)?','Har du längd/tone-of-voice?','Bad du om förbättring i steg 2?']
y=504
for c in checks:
    p.rect(65,y-2,7,7,fill=C_SECONDARY); p.text(78,y-1,c,11,C_DARK); y-=30
p.rect(60,190,475,250,fill=(252,254,255),stroke=(220,231,242))
p.text(72,415,'Proffstips:',12,C_PRIMARY,'Helvetica-Bold')
p.wrapped(72,392,450,'1) Be om alternativ: "Ge mig 3 varianter."\n2) Iterera: "Förkorta med 30%, gör mer konkret."\n3) För kvalitet: "Lägg till risker, antaganden och nästa steg."',11)
pages.append(p)

# 4 GPTs Projects Images
p=Page(); title_bar(p,'3. GPTs, Projects och Bilder')
p.rect(40,130,515,560,fill=C_WHITE,stroke=(220,231,242))
cols=[(60,'GPTs','Skapa specialiserade assistenter för t.ex. HR-policy, säljmail eller supportscript.'),
      (235,'Projects','Samla filer, instruktioner och chatthistorik per team eller kundcase.'),
      (410,'Bilder','Generera illustrationer, konceptskisser och kampanjidéer från text.')] 
for x,title,txt in cols:
    p.rect(x,220,165,390,fill=(247,251,255),stroke=(210,223,238))
    p.rect(x,560,165,50,fill=C_PRIMARY)
    p.text(x+14,578,title,14,C_WHITE,'Helvetica-Bold')
    p.wrapped(x+12,540,140,txt,10.5,color=C_DARK)
    p.rect(x+20,255,125,90,fill=C_WHITE,stroke=(190,212,233))
    p.text(x+30,295,'Visuell',11,C_MUTED)
    p.text(x+30,278,'mockup',11,C_MUTED)
p.text(60,170,'Arbetssätt: skapa mallar per roll och återanvänd dem i Projects.',11,C_MUTED)
pages.append(p)

# 5 Role plan
p=Page(); title_bar(p,'4. Utbildningsplan per roll (förslag 2 veckor)')
p.rect(40,130,515,560,fill=C_WHITE,stroke=(220,231,242))
p.text(60,650,'Vecka 1: Grund + säkra rutiner',12,C_PRIMARY,'Helvetica-Bold')
p.wrapped(60,628,500,'• Ledning: beslutsunderlag, sammanfattningar, riskanalys\n• Sälj/Marknad: kampanjutkast, mötesförberedelser, follow-up mail\n• HR: jobbannonser, policyutkast, intervjufrågor\n• Support/Drift: svarsmallar, felsökningsguider, intern dokumentation',11)
p.text(60,495,'Vecka 2: Fördjupning + mätning',12,C_PRIMARY,'Helvetica-Bold')
p.wrapped(60,473,500,'• Bygg 1 GPT per team\n• Starta 1 Project per huvudprocess\n• Sätt KPI: tidsbesparing, kvalitet, återanvändning\n• Demo fredag: "före/efter" med verkliga case',11)
p.rect(60,180,475,260,fill=(239,248,255),stroke=(190,212,233))
p.text(72,415,'Målbild efter 14 dagar',12,C_PRIMARY,'Helvetica-Bold')
p.wrapped(72,392,450,'- Alla team kan skriva bra prompts på egen hand\n- Minst 3 standardmallar per roll\n- Tydliga riktlinjer för dataskydd och kvalitet\n- En intern AI-ansvarig per avdelning',11)
pages.append(p)

# 6 Best practices
p=Page(); title_bar(p,'5. Best practice & nästa steg')
p.rect(40,130,515,560,fill=C_WHITE,stroke=(220,231,242))
p.text(60,650,'Do:',13,C_PRIMARY,'Helvetica-Bold')
for i,t in enumerate(['Ge tydlig kontext','Be om källkritik och antaganden','Spara bra prompts som mallar','Arbeta iterativt i korta steg']):
    p.text(70,625-i*26,f'✅ {t}',11,C_DARK)
p.text(60,500,'Avoid:',13,C_PRIMARY,'Helvetica-Bold')
for i,t in enumerate(['Klistra in känsliga personuppgifter','För breda uppgifter utan mål','Acceptera första svaret utan granskning']):
    p.text(70,475-i*26,f'⚠️ {t}',11,C_DARK)
p.rect(60,220,475,200,fill=C_DARK)
p.wrapped(80,380,435,'Vill du att jag även gör en version 2 med er logotyp, exakt färgpalett och era egna exempel per avdelning?\n\nDå kan jag leverera en premiumversion med workshop-material och övningar.',13,color=C_WHITE)
p.text(80,250,'Kontakt/notes: fyll i intern ansvarig + datum för kickoff.',10,(190,220,245))
pages.append(p)


def build_pdf(pages, path):
    objs=[]
    def add(b): objs.append(b); return len(objs)
    font1=add(b"<< /Type /Font /Subtype /Type1 /BaseFont /Helvetica >>")
    font2=add(b"<< /Type /Font /Subtype /Type1 /BaseFont /Helvetica-Bold >>")
    kids=[]
    for pg in pages:
        stream='\n'.join(pg.ops).encode('latin-1','replace')
        cont=add(f"<< /Length {len(stream)} >>\nstream\n".encode()+stream+b"\nendstream")
        page=add(f"<< /Type /Page /Parent 0 0 R /MediaBox [0 0 {W} {H}] /Resources << /Font << /Helvetica {font1} 0 R /Helvetica-Bold {font2} 0 R >> >> /Contents {cont} 0 R >>".encode())
        kids.append(page)
    kids_refs=' '.join([f"{k} 0 R" for k in kids])
    pages_obj=add(f"<< /Type /Pages /Count {len(kids)} /Kids [ {kids_refs} ] >>".encode())
    catalog=add(f"<< /Type /Catalog /Pages {pages_obj} 0 R >>".encode())
    # fix parent refs
    for k in kids:
        objs[k-1]=objs[k-1].replace(b"/Parent 0 0 R",f"/Parent {pages_obj} 0 R".encode())

    out=[b"%PDF-1.4\n%\xe2\xe3\xcf\xd3\n"]
    x=[0]
    pos=len(out[0])
    for i,obj in enumerate(objs,1):
        x.append(pos)
        chunk=f"{i} 0 obj\n".encode()+obj+b"\nendobj\n"
        out.append(chunk); pos+=len(chunk)
    xref_pos=pos
    out.append(f"xref\n0 {len(objs)+1}\n".encode())
    out.append(b"0000000000 65535 f \n")
    for off in x[1:]:
        out.append(f"{off:010d} 00000 n \n".encode())
    out.append(f"trailer\n<< /Size {len(objs)+1} /Root {catalog} 0 R >>\nstartxref\n{xref_pos}\n%%EOF\n".encode())
    with open(path,'wb') as f:
        for c in out: f.write(c)

build_pdf(pages,OUT_FILE)
print(OUT_FILE)
print('size',os.path.getsize(OUT_FILE))
