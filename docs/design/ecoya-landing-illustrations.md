# ECOYA landing illustrations

2026-09-21. Generated with the built-in image_gen.imagegen tool; originals retained. No third-party logos or screenshots used.

## Shipped assets

- public/images/landing-illustrations/snap-hero.png: cross-industry workflow, retained design artifact; replaced on the SNAP landing by native inline document previews.
- public/images/landing-illustrations/brand-records.png: evidence becomes a verified record, brand story Before → After.
- Native React/Lucide SNAP workflow/report diagrams: src/features/snap-landing-screens.tsx. Playback pauses on interaction and honors reduced motion.

## Prompts

### snap-hero

Create one high-quality finished illustration asset for ECOYA SNAP, a Korean field-evidence SaaS landing page. Landscape aspect ratio 4:3. Art direction: crisp premium editorial 3D paper-and-acrylic illustration, restrained friendly geometry, white seamless background, extremely light cool-gray ground shadows. Colors exclusively brand blue #166DD7, bright #1478EB, indigo #1C3D61, ink #152238, white and very light gray. Central composition: an elegant upright smartphone tilted slightly in perspective, screen shows a stylized photograph of a blue shipping container with a simple camera framing reticle, beside it a large floating white checklist sheet with three clearly checked blue checkboxes. A few small floating photo cards show container doors, a seal lock, and a package. A curved thin blue path connects a small speech bubble on the left to checklist, phone, then a compact verified report card on the right. Deliberate sparse composition, substantial negative space, objects large and legible at 500px width. Communicate 'speak a request, AI prepares a shot list, capture evidence, human verifies'. No actual app screenshot, no browser chrome, no dashboard, no tiny UI text, no letters or words, no gradients flooding the background, no purple, no robots, no people, no logo. Refined white background that blends into an existing white website card.

### brand-records

Create one finished landscape 3:2 editorial illustration for ECOYA brand story, showing scattered field photos and trade documents becoming one trusted verified record. Premium precise paper sculpture with subtle dimensional depth and soft shadows, clean white seamless background, restrained brand blue #166DD7 and indigo #1C3D61 with ink #152238 and very light cool grays only. On the left, three lightly scattered photographic evidence cards with stylized container port, container seal, and cargo package drawings, plus a loosely placed document sheet. A simple thin indigo connector flows through a single circular human-verification checkmark in the center into one neatly aligned document folder and a large clean verified report on the right. The right-hand record has structured lines and three blue checkmarks, but no actual text, no numbers, no browser UI, no people or hands, no robot, no logo. Keep the entire evidence-to-record story in one coherent balanced composition. Large objects, generous negative space, high-end calm business illustration, visually clear on a white brand-story page at 600px width. Avoid generic glossy spheres, rainbow gradients, excessive decoration, and illegible miniature text.

### SNAP cross-industry edit (final)

Edit this illustration for a cross-industry field-evidence service. Preserve its white background, blue-indigo premium 3D composition, speech bubble, checklist, phone and verified report. Change the subjects of the evidence images so the image does NOT imply a container-only logistics product: phone photo should show a clean modern interior maintenance inspection with a wall pipe/valve and tiled room; the three floating photo cards should depict an apartment room after cleaning, a damaged vehicle bumper for insurance assessment, and a recyclable material bale. Change the little report thumbnail to a clean building interior. Keep all other visual quality, positions, blue brand palette, large legibility and restrained shadows. No text, no logo, no people. This image should clearly communicate many industries sharing one capture-and-verification workflow.

## References and implementation

- Product presentation: https://www.glideapps.com/product
- Pricing presentation: https://www.glideapps.com/pricing
- SNAP source content and order: https://pr67wvp5tr-svg.github.io/ecoya-landing/snap/
- Trade prices/features: src/reference-3030/messages/ko/erp-landing.json, pricing object.
- SNAP prices: existing SC-02 in src/features/snap-prototypes.tsx. Existing local pricing values, not verified commercial API prices. No API, billing, tax, or discount claims added; final scope/pricing confirmed via consultation.
- Header: logo left; brand story/product/pricing centered; login/contact/start right. Product dropdown links directly to Trade OS and SNAP; there is no overview page.
- Pricing has Trade OS/SNAP tabs; query string and authentication context follow selected product.
- Dedicated product detail sections preserve source order and existing Trade OS demos. SNAP now includes six main use cases, further uses, full report delivery information, three evidence principles and seven FAQs.

Validation: production build, targeted ESLint, landing/navigation/playback Playwright checks, 390/768/1440px screenshot review.


Latest SNAP presentation uses inline Trade OS-style diagrams without enlargement. The generated SNAP hero file is retained but no longer displayed.
