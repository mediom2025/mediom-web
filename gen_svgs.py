#!/usr/bin/env python3
# -*- coding: utf-8 -*-
"""Generates on-brand placeholder illustrations for mediom-web.
Run once locally to (re)produce the SVG assets under images/ and images/works/.
Not shipped as a page dependency -- safe to delete after use, kept in-repo
so the placeholder art can be regenerated/tweaked later without redoing it by hand.
"""

GREEN = "#1e5142"

WRAP_OPEN = '''<svg viewBox="0 0 800 600" xmlns="http://www.w3.org/2000/svg" role="img" aria-label="{label}">
<defs>
<radialGradient id="g-{key}a" cx="14%" cy="18%" r="65%">
<stop offset="0%" stop-color="#eae7e0"/>
<stop offset="100%" stop-color="#f4f2ec"/>
</radialGradient>
<radialGradient id="g-{key}b" cx="88%" cy="90%" r="55%">
<stop offset="0%" stop-color="#e6e2da" stop-opacity="0.9"/>
<stop offset="100%" stop-color="#f4f2ec" stop-opacity="0"/>
</radialGradient>
</defs>
<rect width="800" height="600" fill="url(#g-{key}a)"/>
<rect width="800" height="600" fill="url(#g-{key}b)"/>
<circle cx="700" cy="40" r="230" fill="none" stroke="{green}" stroke-opacity="0.16" stroke-width="1"/>
<circle cx="30" cy="580" r="170" fill="none" stroke="{green}" stroke-opacity="0.16" stroke-width="1"/>
<g stroke="{green}" fill="none" stroke-linecap="round" stroke-linejoin="round">
'''

WRAP_CLOSE = '''</g>
<text x="42" y="546" font-family="ui-monospace,SFMono-Regular,Menlo,Consolas,monospace" font-size="15" letter-spacing="3" fill="{green}" fill-opacity="0.5">{tag}</text>
<line x1="42" y1="90" x2="42" y2="130" stroke="{green}" stroke-opacity="0.35" stroke-width="1"/>
</svg>
'''

def wrap(key, label, tag, inner):
    return WRAP_OPEN.format(key=key, label=label, green=GREEN) + inner + WRAP_CLOSE.format(green=GREEN, tag=tag)

motifs = {}

# 1. AOBA -- corporate / manufacturing, branding: architectural tower with window grid
windows = "\n".join(
    f'<rect x="{330+col*36}" y="{200+row*46}" width="20" height="26" stroke-width="1.5" stroke-opacity="0.6"/>'
    for row in range(4) for col in range(3)
)
motifs["work-aoba"] = wrap("aoba", "Aoba Corporate Site Renewal", "AOBA — BRANDING", f'''
<rect x="310" y="170" width="180" height="270" stroke-width="2" stroke-opacity="0.75"/>
{windows}
<line x1="230" y1="440" x2="570" y2="440" stroke-width="2" stroke-opacity="0.75"/>
<line x1="400" y1="170" x2="400" y2="130" stroke-width="2" stroke-opacity="0.75"/>
<circle cx="400" cy="112" r="18" stroke-width="2" stroke-opacity="0.75"/>
''')

# 2. GREEN KITCHEN -- web, kitchen brand: bowl + leaf + steam
motifs["work-green-kitchen"] = wrap("gk", "Green Kitchen Brand Site", "GREEN KITCHEN — WEB", '''
<path d="M270 360 C270 420 320 460 400 460 C480 460 530 420 530 360" stroke-width="2.2" stroke-opacity="0.75"/>
<line x1="270" y1="360" x2="530" y2="360" stroke-width="2.2" stroke-opacity="0.75"/>
<path d="M400 320 C380 300 360 250 400 210 C440 250 420 300 400 320 Z" stroke-width="2" stroke-opacity="0.7"/>
<line x1="400" y1="320" x2="400" y2="260" stroke-width="1.4" stroke-opacity="0.55"/>
<path d="M470 300 C480 270 470 240 460 220" stroke-width="1.4" stroke-opacity="0.4"/>
<path d="M330 300 C320 270 330 240 340 220" stroke-width="1.4" stroke-opacity="0.4"/>
''')

# 3. NAGOMI -- uiux, real estate app: house + phone/app frame
house_roof = "M240 300 L400 190 L560 300"
motifs["work-nagomi"] = wrap("nagomi", "Nagomi Estate App", "NAGOMI — UI/UX", f'''
<path d="{house_roof}" stroke-width="2.2" stroke-opacity="0.75"/>
<rect x="270" y="300" width="260" height="150" stroke-width="2.2" stroke-opacity="0.75"/>
<rect x="380" y="370" width="40" height="80" stroke-width="1.6" stroke-opacity="0.6"/>
<rect x="500" y="230" width="150" height="270" rx="16" stroke-width="2.2" stroke-opacity="0.8"/>
<line x1="520" y1="270" x2="630" y2="270" stroke-width="1.6" stroke-opacity="0.55"/>
<line x1="520" y1="300" x2="610" y2="300" stroke-width="1.6" stroke-opacity="0.4"/>
<line x1="520" y1="330" x2="620" y2="330" stroke-width="1.6" stroke-opacity="0.4"/>
<rect x="520" y="360" width="110" height="60" rx="6" stroke-width="1.6" stroke-opacity="0.5"/>
''')

# 4. SORA COFFEE -- branding, packaging: coffee cup + steam + bean
motifs["work-sora-coffee"] = wrap("sora", "Sora Coffee Package", "SORA COFFEE — BRANDING", '''
<path d="M300 280 L330 430 C332 445 348 456 364 456 L436 456 C452 456 468 445 470 430 L500 280 Z" stroke-width="2.2" stroke-opacity="0.75"/>
<path d="M470 300 C505 300 522 320 522 345 C522 370 505 388 470 386" stroke-width="2" stroke-opacity="0.7"/>
<path d="M345 250 C335 225 355 215 348 190" stroke-width="1.6" stroke-opacity="0.5"/>
<path d="M400 250 C390 225 410 215 403 190" stroke-width="1.6" stroke-opacity="0.5"/>
<path d="M455 250 C445 225 465 215 458 190" stroke-width="1.6" stroke-opacity="0.5"/>
<ellipse cx="590" cy="410" rx="34" ry="24" transform="rotate(-25 590 410)" stroke-width="2" stroke-opacity="0.55"/>
<path d="M566 402 C580 408 596 412 612 406" stroke-width="1.4" stroke-opacity="0.45"/>
''')

# 5. HANARE -- web, traditional inn: torii gate + lantern
motifs["work-hanare"] = wrap("hanare", "Hanare Hotel Website", "HANARE — WEB", '''
<line x1="290" y1="220" x2="290" y2="460" stroke-width="2.4" stroke-opacity="0.75"/>
<line x1="510" y1="220" x2="510" y2="460" stroke-width="2.4" stroke-opacity="0.75"/>
<line x1="260" y1="220" x2="540" y2="220" stroke-width="2.4" stroke-opacity="0.75"/>
<line x1="270" y1="248" x2="530" y2="248" stroke-width="1.6" stroke-opacity="0.6"/>
<line x1="400" y1="248" x2="400" y2="460" stroke-width="1.6" stroke-opacity="0.4"/>
<ellipse cx="400" cy="330" rx="34" ry="42" stroke-width="1.8" stroke-opacity="0.55"/>
<line x1="400" y1="288" x2="400" y2="300" stroke-width="1.8" stroke-opacity="0.55"/>
<line x1="400" y1="372" x2="400" y2="388" stroke-width="1.8" stroke-opacity="0.55"/>
''')

# 6. TSUMUGI -- uiux, booking, "to spin/weave" thread: interlocking wave lattice
h_waves = "\n".join(
    f'<path d="M260 {260+row*35} C 330 {230+row*35}, 400 {290+row*35}, 470 {260+row*35} S 610 {230+row*35}, 640 {260+row*35}" stroke-width="1.6" stroke-opacity="0.55"/>'
    for row in range(4)
)
motifs["work-tsumugi"] = wrap("tsumugi", "Tsumugi Booking UI", "TSUMUGI — UI/UX", f'''
{h_waves}
<rect x="230" y="230" width="360" height="150" rx="14" stroke-width="2" stroke-opacity="0.7"/>
''')

# 7. ABOUT / STUDIO -- desk corner scene: window + plant + desk
window_panes = '<line x1="330" y1="190" x2="330" y2="330" stroke-width="1.4" stroke-opacity="0.45"/><line x1="260" y1="260" x2="400" y2="260" stroke-width="1.4" stroke-opacity="0.45"/>'
motifs["about-studio"] = wrap("studio", "mediom design studio", "STUDIO", f'''
<rect x="260" y="190" width="140" height="140" stroke-width="2" stroke-opacity="0.65"/>
{window_panes}
<line x1="150" y1="440" x2="650" y2="440" stroke-width="2.2" stroke-opacity="0.75"/>
<path d="M520 440 C512 380 528 330 560 300" stroke-width="2" stroke-opacity="0.6"/>
<path d="M560 300 C540 280 545 250 570 235 C590 260 585 290 560 300 Z" stroke-width="1.8" stroke-opacity="0.6"/>
<path d="M560 300 C580 285 605 285 620 260 C598 250 575 262 560 300 Z" stroke-width="1.8" stroke-opacity="0.55"/>
<rect x="500" y="440" width="70" height="26" stroke-width="1.8" stroke-opacity="0.55"/>
<line x1="220" y1="440" x2="220" y2="370" stroke-width="2" stroke-opacity="0.6"/>
<path d="M195 370 L245 370 L235 330 L205 330 Z" stroke-width="1.8" stroke-opacity="0.55"/>
''')

# 8. SERVICE — BRANDING: pen nib + swatches
motifs["service-branding"] = wrap("svc-brand", "ブランディング", "01 — BRANDING", f'''
<path d="M420 190 L455 225 L345 430 L318 460 L312 420 Z" stroke-width="2" stroke-opacity="0.72"/>
<line x1="420" y1="190" x2="330" y2="405" stroke-width="1.4" stroke-opacity="0.5"/>
<circle cx="330" cy="405" r="4" fill="{GREEN}" fill-opacity="0.6" stroke="none"/>
<circle cx="540" cy="290" r="26" stroke-width="1.8" stroke-opacity="0.6"/>
<circle cx="592" cy="330" r="26" stroke-width="1.8" stroke-opacity="0.45" fill="{GREEN}" fill-opacity="0.07"/>
<circle cx="560" cy="380" r="26" stroke-width="1.8" stroke-opacity="0.3"/>
''')

# 9. SERVICE — WEB: browser window with wireframe
motifs["service-web"] = wrap("svc-web", "Webサイト制作", "02 — WEB", '''
<rect x="230" y="190" width="340" height="230" rx="10" stroke-width="2.2" stroke-opacity="0.75"/>
<line x1="230" y1="232" x2="570" y2="232" stroke-width="1.8" stroke-opacity="0.6"/>
<circle cx="256" cy="211" r="5" fill-opacity="0.55" stroke-width="1.4"/>
<circle cx="276" cy="211" r="5" fill-opacity="0.55" stroke-width="1.4"/>
<circle cx="296" cy="211" r="5" fill-opacity="0.55" stroke-width="1.4"/>
<line x1="256" y1="264" x2="440" y2="264" stroke-width="4" stroke-opacity="0.55"/>
<line x1="256" y1="292" x2="500" y2="292" stroke-width="1.6" stroke-opacity="0.4"/>
<line x1="256" y1="314" x2="470" y2="314" stroke-width="1.6" stroke-opacity="0.4"/>
<rect x="256" y="340" width="120" height="46" rx="6" stroke-width="1.8" stroke-opacity="0.55"/>
<path d="M560 420 L610 470" stroke-width="2.4" stroke-opacity="0.7"/>
<circle cx="540" cy="400" r="42" stroke-width="2.4" stroke-opacity="0.7"/>
''')

# 10. SERVICE — UI/UX: toggle + slider + cursor
motifs["service-uiux"] = wrap("svc-uiux", "UI/UXデザイン", "03 — UI/UX", f'''
<rect x="270" y="230" width="120" height="56" rx="28" stroke-width="2.2" stroke-opacity="0.7"/>
<circle cx="352" cy="258" r="20" fill="{GREEN}" fill-opacity="0.55" stroke="none"/>
<line x1="270" y1="340" x2="470" y2="340" stroke-width="2" stroke-opacity="0.55"/>
<circle cx="380" cy="340" r="14" fill="#f4f2ec" stroke-width="2.2" stroke-opacity="0.75"/>
<rect x="270" y="400" width="220" height="60" rx="10" stroke-width="1.8" stroke-opacity="0.5"/>
<path d="M540 250 L540 400 L570 370 L590 410 L605 402 L585 362 L620 358 Z" stroke-width="2" stroke-opacity="0.7" stroke-linejoin="round"/>
''')

import os
base = os.path.dirname(os.path.abspath(__file__))
out_map = {
    "work-aoba": "images/works/aoba.svg",
    "work-green-kitchen": "images/works/green-kitchen.svg",
    "work-nagomi": "images/works/nagomi.svg",
    "work-sora-coffee": "images/works/sora-coffee.svg",
    "work-hanare": "images/works/hanare.svg",
    "work-tsumugi": "images/works/tsumugi.svg",
    "about-studio": "images/about-studio.svg",
    "service-branding": "images/service-branding.svg",
    "service-web": "images/service-web.svg",
    "service-uiux": "images/service-uiux.svg",
}
for key, relpath in out_map.items():
    full = os.path.join(base, relpath)
    os.makedirs(os.path.dirname(full), exist_ok=True)
    with open(full, "w", encoding="utf-8") as f:
        f.write(motifs[key])
    print("wrote", relpath)
