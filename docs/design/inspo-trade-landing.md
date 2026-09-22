# ERP introduction page

Reference study: Inspo hosted MCP `recommend` and `get_screen(canvasapp-com)` on 2026-09-17. Reference: [Canvas / Supernova](https://canvasapp.com/), captured by Inspo on 2026-05-27.

Uses the reference's centered message, generous whitespace and product visual hierarchy. Replaces the detailed dashboard with an original skeleton workflow illustration, as requested. Navy #172d55, blue #4965ef, slate #5c6c85, pale blue #f5f8fd, white #ffffff and border #dbe4f0. Uses the existing sans font and button components. Workflow steps are numbered because they represent a sequence. Received and outgoing documents converge on a Deal.

Routes: `/` and `/erp/landing`. The existing workspace is available at `/erp/home`.

Animation: `/lottie/trade-workflow.json`, 780 × 340, 30 fps, 9 seconds, no fonts or external assets. Editable source: `scripts/generate-trade-lottie.py`; regenerate with `python3 scripts/generate-trade-lottie.py`. Named markers: receive, review, connect. Includes pause/play, selectable static stages, reduced-motion support and a skeleton fallback when loading fails.

Validation: production build, ESLint for changed TSX files, Chrome at 1440 and 390px, no horizontal overflow, stage selection, reduced motion and signup navigation.

## Revised design

User requested the complete original guidance and realistic product examples with larger typography. The landing now retains the source's incoming/outgoing loops, four workflow steps, five feature/pain pairs, three hero assurance points, owner guidance, AI trust/review guidance, all plan contents and add-on information. A navy opening with a blue product panel replaces the largely white centered hero. Main body copy is 16–18px; desktop headings are 46–52px.

Five selectable product examples show invoice generation, PDF field extraction and confidence, a question/answer with a source document, AR/AP schedules, and Magic Link document delivery and viewing history. Clearly marked as illustrative examples. The original Lottie remains as a secondary workflow guide under the detailed four steps.

Chrome checks at 1440px and 390px cover all five examples, no horizontal overflow, original guidance headings and no page errors. Production build and ESLint passed.

## Inspo source implementation and neutral palette

Retrieved canonical JSX with `get_reference_jsx` for `hero/split-screen`, `features/bento`, and `pricing/three-card`. Unmodified returned source and metadata are archived in `docs/design/inspo-source/`. Runtime adaptations are `src/components/inspo-reference-layouts.tsx`: original split composition, two-column/two-row lead bento and wide supporting tile, and a plan trio with the recommended plan marked by a top rule. Slots retain all ERP copy and realistic product examples. The empty atmospheric hero panel is replaced with the requested ERP demo.

Visual reference: Inspo `get_screen(granola-ai)`, captured 2026-05-18. Its clear document-led presentation and restrained surface colors inform the revision; this is not the Granola application's source code. Surfaces use neutral stone/gray, with ECOYA blue limited to primary actions, selected tabs and key figures. The blue wash was removed.

## Indigo revision preserving copy and placement

The latest request explicitly preserves the existing copy and layout. The original split-screen, bento slot positions, workflow sequence and pricing placement therefore remain intact. Changes are visual: open explanatory sections instead of individual card backgrounds, indigo typography and separators, lavender section surfaces, a dark indigo trust section, and layered paper styling only for the realistic product example. Body guidance is 20–22px on desktop and 18–19px on mobile, with larger workflow and feature headings. All five demo interactions, original guidance headings and mobile overflow checks passed in Chrome.

## Brevo typography and exact brand color

User selected Brevo's clean typography and text placement. Reference fetched through Inspo MCP `get_screen(brevo-com)` (capture 2026-05-27) and the original site inspected in Chrome. Uses the existing Pretendard font: regular-weight explanatory copy, stronger headings, restrained labels, consistent left alignment, and clear spacing between title, pain point and description. Retains all original text and slot positions. User-specified indigo is exactly #052D61; broad lavender surfaces were replaced with neutral gray, and the purple hero gradient removed. Desktop explanatory copy remains 20–22px and mobile copy 18–19px. Reference archive: `inspo-candidates/brevo-com.json`, `brevo-com.webp`, and `brevo-live-feature.png`.

## IBM heading font and photographic logistics closing section

Large marketing headings use self-hosted IBM Plex Sans KR SemiBold/Bold from the official `@ibm/plex-sans-kr` package (OFL-1.1); body copy and small application labels retain Pretendard. Explanatory body text uses Medium. Font source and license: https://github.com/IBM/plex and https://www.ibm.com/design/language/typography/typeface/ .

The existing closing CTA keeps its complete copy and signup destination over a full-width real warehouse photograph, following the user's Glide closing-section screenshot. Image: Arum Visuals, “a warehouse filled with lots of boxes and pallets”, Unsplash, https://unsplash.com/photos/a-warehouse-filled-with-lots-of-boxes-and-pallets-VnMbc9Szs-E (free under the Unsplash License). Downloaded locally as `public/images/trade-logistics.webp` at 2400px width, with lazy loading. The image is decorative, and a #052D61 overlay supports readable white text. The mobile crop preserves the pallet racks.

## Open walkthrough and simpler opening

Removed the outer demo frame, window bar, preview label, illustrative badge and duplicated demo titles. All five interactive feature previews remain; document paper keeps its border. Key copy (“AI에게 한 줄”, “PDF 업로드”, etc.) is now a prominent IBM heading above each preview. Four workflow steps remain open with no card fills. The hero now follows one axis: title, core description, CTA, trust note. Incoming/outgoing paragraphs move to the detailed workflow section without losing their text.

The closing photograph is replaced with a real port and container-ship image: https://unsplash.com/photos/an-aerial-view-of-a-large-cargo-ship-in-the-water-IVG8SDczupk (Unsplash License). Its desktop crop focuses on the vessels rather than the sky.

## Timed workflow and section hierarchy

The four-step workflow now uses the Glide product reference's timed left-side progress and changing right-side view: PDF document, extracted fields, human review, and settlement/customer link. Steps advance every six seconds only while the section is visible; selecting a step pauses playback. A pause/resume control and reduced-motion preference support manual viewing. Original operational guidance remains in the step descriptions.

Main anchors and supporting feature phrases use designed labels. Full-width neutral section surfaces and thin rules distinguish the workflow, features, daily work, trust, and pricing. Exact brand #052D61 remains unchanged. Removed duplicated preview headings, illustrative-window labels, and implementation-focused marketing copy; kept the product's core message and useful supporting guidance.

The final port image is by Logan Voss on Unsplash, stored locally as trade-logistics.webp. Desktop and mobile interactions, automatic progression, manual selection, reduced motion, and horizontal overflow were checked in Chrome.

## White page background

Per the latest user direction, the page, navigation, hero, workflow, features, daily work, trust, pricing and footer use white backgrounds. Thin section rules and generous spacing retain the hierarchy. The trust section now uses indigo headings and gray supporting copy on white. Brand labels, primary actions, real product UI surfaces and the container-ship photographic closing CTA remain.

Hero feature panels share one CSS grid row sized to the tallest preview at the current viewport. Inactive panels remain in layout but are visually hidden, aria-hidden and inert, so switching any of the five features cannot change hero height or shift adjacent content.

The final background preference supersedes white: all broad page surfaces use very light gray #F7F8FA. Real documents remain white; section rules and indigo labels provide separation.

Feature-section cleanup: removed staggered article top borders and the repeated field dividers inside the invoice summary. The broad section boundary remains; internal grouping uses labels and spacing.

## Glide composition refinement

Reviewed https://www.glideapps.com/ directly. Removed decorative rules above section copy, assurances, trust points and pricing. Selected surfaces group document creation, AI query, settlement and the action banner; other feature explanations remain open. The invoice summary uses a clear header and a two-column field layout. Workflow product scenes sit on one light neutral stage, and the active progress indicator sits below its text. Page background remains #F7F8FA, accent #052D61, with IBM headings and Pretendard body. Hero panels retain their shared fixed-height grid.

Final background adjustment: near-white neutral #F8F8F8 replaces the cool gray page; selected large stages use #EEEEEE, document surfaces stay white, and label fills are neutral. This removes the blue cast while retaining the user-requested indigo headings and actions.

## Korean typography final pass

Following the user's request for Glide-level visual simplicity with suitable Korean typography, headings now use Pretendard with the body and UI. Removed the unused IBM font-face downloads. Heading hierarchy uses 700/650 weights, descriptive text uses 400 at 20–21px desktop and 18px mobile, and neutral text colors remove the blue cast from supporting copy. The brand indigo remains on headings/actions.

## Structural redesign after user rejected cosmetic iterations

White is the user's final page-background choice. Replaced the split hero with a centered two-line Korean message, centered actions, and a wide product stage below. The stage uses five tabs and a fixed-height shared grid, with explanatory text beside real document previews. Replaced the staggered bento with two equally sized create/read product demonstrations, followed by three consistently aligned supporting functions. Primary feature copy and examples share matching baselines. Text content, workflow interaction, plans and closing port photograph remain available. This is a structural reinterpretation of the selected Glide home/product reference, not a color-only revision.

## Major section boundaries

Added one thin content-width divider at each major transition: workflow, features, daily work, trust and pricing. Dividers align to the desktop/mobile content gutters, with generous section padding between the rule and heading. The page stays white, and individual text blocks retain their open layout. Hero bottom spacing now separates assurances from the first boundary.

Section headers now share a two-column grid with last-baseline alignment: the title and supporting copy end on the same text baseline, with no artificial top padding on the copy. At 820px and below the description follows the heading with a consistent 20px gap. Divider gutters match the actual 48/32/24px container padding.

Paired product/text sections now align to their lower edge on desktop: hero explanation/preview, workflow selector/stage, and daily-work guidance/preview. The section headers and supporting visual rows share equal columns and a 64px gap, so right-hand copy and imagery begin on the same vertical axis. Mobile retains natural top-to-bottom reading order.

Mid-page emphasis requested by the user: daily-work content now forms a full-width #052D61 band with white headings, light supporting copy, and a white trade preview. The workflow visual stage uses a stronger neutral gray #E5E7EA. Other page backgrounds remain white. Rules are omitted where the brand band itself defines the section boundary.

Final scrolling rhythm: white hero/workflow, full-width light gray #F3F4F5 features, #052D61 daily-work band, white trust, light gray pricing, and the port photograph. These are section backgrounds across the viewport, not just card interiors. Decorative rules are retained only at transitions that need them; contrasting surfaces define the others.

Official logo and auth entry audit: landing header/footer now use the design-system ECOYA wordmark, cropped identically to the common public header. Login and signup preserve ERP context; public auth logo/service/pricing links return to the selected product, and recovery/signup navigation retains ERP or SNAP. Existing authentication is a client-side prototype (no real account creation or server credential verification); this limitation was reported to the user. Browser regression coverage checks both viewport sizes and both product contexts.

ERP entry shows only the ERP action after prototype login and opens /erp/home. The landing routes never direct users to SNAP; the separately existing SNAP product context remains isolated.

## Brand content in the existing design (2026-09-21)

The user confirmed that `https://devdev-e6t.pages.dev/` supplies the design and `https://pr67wvp5tr-svg.github.io/ecoya-landing/` supplies content only. Keep the existing layout, typography, interactive product demos, login, and signup actions. The main message now introduces ECOYA's field and trade records; add the brand story and introductions for SNAP and Trade OS. The header links sit directly after the logo, aligned left. Mobile places the same links on a second left-aligned row while retaining the existing auth actions. SNAP's introduction explicitly links to the existing `/snap` public page; this supersedes the earlier ERP-only marketing navigation constraint. Auth actions retain `product=erp`.

The user-supplied palette is scoped in `src/features/trade-landing-theme.css`: Primary Blue #166DD7, Bright Blue #1478EB, Indigo #1C3D61, Dark Band #0F1E36, Band2 #152A48, Ink #152238. Primary section backgrounds use brand blue and action buttons use indigo. Home light surfaces use paper #EEF0F4, card #FFFFFF, and card2 #E9ECF2. `/erp/landing` gets the supplied Trade OS surface overrides. Dark tokens follow the app's existing `.dark` theme class; the default remains light. No source-site images or styles are copied into this project.

## Separate brand and product pages (2026-09-21)

The user clarified that the brand story, Trade OS, and SNAP must be separate pages, superseding the combined-page section navigation above. `/` is the brand story (also available at `/brand-story`), `/trade-os` is the original Trade OS product introduction (with `/erp/landing` retained as an alias), and `/snap` is the dedicated SNAP introduction. Only those exact public routes are intercepted by CommonEntry; SNAP workspace routes remain intact. Shared `LandingShell` preserves the logo, left-aligned navigation, active-page indicator, login and signup buttons. SNAP auth buttons preserve `product=snap`; Trade OS and brand entry retain `product=erp`.

The brand page contains the source brand narrative, before/after, AI/human/record principles, vision, and links to the product pages. Trade OS keeps its own demo, workflow, features, pricing and CTA. SNAP has its own hero, four manually selectable workflow stages, use cases, web/PDF reporting, trust statement, FAQ and signup CTA. All three use the user-specified colors and the existing deployed design language, without importing the source site's styling or images.

## Brand story references, product screens and shared auth header (2026-09-21)

At the user's explicit request, connected to Inspo and reviewed `everlaw-com--about`, `brex-com--about`, and `nglm-com--about` via recommend/search/get_screen. Their mission-first typography and broad narrative photography inform the brand story hero. Keep ECOYA's supplied palette and current Korean typography; do not adopt their colors or copy. The existing local `/images/trade-logistics.webp` provides the wide field photograph. References: https://everlaw.com, https://brex.com, https://www.nglm.com/about.

SNAP now includes six screenshots captured from the local prototype with demo fixtures: task request, AI checklist, mobile worker capture, manager evidence review, web report, and document report preview. Assets live at `public/images/snap-landing/`. They are explicitly labelled product examples. Every screenshot opens in an accessible enlarged dialog with a close button, Escape support, and focus restoration. Workflow selectors switch the corresponding screenshot. The source marketing website supplies content only.

The user's supplied hero screenshot confirms the broad pale curved backdrop behind the white card. Fixed a theme specificity conflict that made the backdrop and surrounding surface the same color. Hero surfaces are now white/card; the curved shape uses each product's paper token. Primary bands remain #166DD7, filled CTAs remain #1C3D61, and pricing outline CTAs use the same indigo for their text/border.

Login, signup, and password recovery now reuse `LandingHeader` with the same blue band, white logo, left-aligned brand/product navigation, language selector, login and indigo start action. Product query parameters and each auth logo's home destination remain intact. Mobile retains the visible second navigation row. Existing account forms are retained.

## Vision-led direction selected (2026-09-21)

The user selected the Coursera-style vision-led reference from the Inspo shortlist. Supersede the earlier wide photograph under the editorial headline: the brand hero now pairs a vision statement and supporting copy on the left with field photography on the right. The rounded white composition overlaps the requested pale curved backdrop. The story continues through the field origin, AI/human/record principles, a centered full-width #166DD7 belief statement, and separate product links. Retain indigo actions, existing shared navigation, and vertically stacked composition on mobile. No invented history dates, company milestones, or customer claims were added.

## Open full-width main composition (2026-09-21)

The user rejected the contained split-card revision as insufficiently spacious. The brand homepage now opens with a full-width field photograph, a large two-line vision headline, and existing auth/story actions directly over a navy contrast layer. Remove the enclosing card, its border and inset photo. The origin uses an asymmetric editorial column; principles become three broad horizontal rows; the blue belief section has larger display text and whitespace; products use large open text links. The pale curved treatment now introduces the principles section. Trade OS and SNAP retain their existing hero backdrop treatments. Changes are scoped to the brand main page.

## Source copy and section order restored (2026-09-21)

The user clarified that the completed spacious design stays, while content and order must follow https://pr67wvp5tr-svg.github.io/ecoya-landing/#story. Restored the seven source sections in order: original hero headline/body, photograph-as-first-record hook, origin with the six-item SNAP-to-Trade-OS chain, complete before/after comparison, three AI/human/system principles, original vision, and original closing statement. Removed the added product-promotional closing section; individual product routes remain accessible through the shared header and footer. Retained existing login/start actions. Introduction inquiries link to the source site's actual contact page.

Browser text comparison checked 40 source headings, paragraphs, and list items against the rendered brand page (whitespace normalized), with none missing at 1440px and 390px. Both viewports have no horizontal overflow. Full-width photography, brand tokens, open spacing, and existing separate product pages remain.

## 2026-09-21 — Product navigation, pricing, and evidence illustrations

- Latest header reference takes precedence: white header, left logo, centered brand/product/pricing navigation, right login/contact/start. Shared across marketing and auth pages.
- Product menu links directly to `/trade-os` and `/snap`, without an overview page per latest direction. Dedicated detail pages retain original content ordering and Trade OS demos; SNAP report rows use alternating text and large illustrations.
- Added `/pricing` with Trade OS/SNAP tabs, three plan columns, comparison table, FAQ and indigo contact section. Source plan definitions remain existing Trade locale pricing and SNAP SC-02 values; query parameters preserve selected product through signup.
- Restored SNAP use cases, report delivery details, evidence principles and seven FAQs. Replaced app screenshots with landing illustrations; source copy remains independent from illustrative diagrams.
- Brand Before → After now includes the generated evidence-to-record image. Image prompts and asset provenance: [ecoya-landing-illustrations.md](./ecoya-landing-illustrations.md).
- Production build and targeted ESLint passed. Landing/auth/playback/product/pricing suite: 19 passed. Visual checks at 390, 768 and 1440px found no horizontal overflow or broken images.

## 2026-09-21 — Indigo content and blue actions

- Updated the earlier indigo-button direction: main light-mode text and emphasis section backgrounds use indigo #1C3D61; primary actions now use blue #166DD7 (hover #125DB5).
- Pricing's featured card remains indigo; its CTA is blue with white text, consistent with other plans and header/hero/contact actions.
- Section labels, product-selection emphasis and recommendation badges use pale blue #E8F0FB with dark blue #125DB5 text. Dark-mode labels use #132B48/#8FBAFF.
- White header and main reading surfaces remain. Verified computed colors and desktop/mobile rendering across brand, Trade OS, SNAP and pricing; Vite build passed.

- Label refinement: sampled the supplied blue swatches as #1662D1 for light-mode label text. Section labels now use pill corners and 10px/20px padding; use-case/report chips 10px/18px; pricing recommendation badge 8px/16px. Checked 1440px and 390px layouts.

## 2026-09-21 — SNAP aligned with Trade OS

- SNAP hero uses inline document/checklist/capture/review visuals with four preview controls; generated hero artwork is no longer displayed. Existing asset retained as a design artifact.
- Workflow uses the same `trade-timeline`/step/progress/preview classes and structure as Trade OS. Manual selection pauses automatic playback.
- Removed all SNAP enlarge buttons and dialogs; illustrations are readable inline.
- Hero use cases use transparent blue outlines, 18px desktop/16px mobile text. “그리고 …” rotates through six existing use cases every 3.5 seconds; pauses with the preview control, hover/focus, background tabs, or reduced motion.
- Section heading labels remain filled; content labels (report type, delivery methods, additional use cases, trust roles) use transparent outlines. On indigo sections, outline text is light blue for contrast.

- Pricing refinement: selected product tab is filled indigo with white text. Featured ERP Pro/Team cards use a navy-indigo gradient with restrained blue lighting and shadow; primary CTAs remain blue. Removed the section divider above pricing cards and increased tab-to-card spacing.
- Final verification: Vite build and targeted ESLint passed. Six focused interaction checks passed, including the previously interrupted Trade OS question-selection check, product/pricing navigation, inline SNAP visuals, all six rotating use cases, pause and reduced motion. Desktop/mobile views have no horizontal overflow.

## 2026-09-21 — Published SNAP app capture reference

- Verified the App Store listing (id6758074089, version 1.0.6) via Apple's lookup endpoint: work-code entry, step-based photo capture, offline capture/automatic upload, pending/uploading/completed status, office/field sharing.
- Rebuilt capture illustration around a white app card, work code, stage navigation and actual seal-photo evidence; separate upload-status panel stays clear of the evidence. The container example is explicitly labelled as one logistics use case.
- App Store screenshot 5 is retained unmodified at `public/images/snap-app/app-store-evidence.jpg`; CSS displays its evidence-photo regions. Source: https://apps.apple.com/kr/app/id6758074089 . This is an illustrative landing composition, not a screenshot claim for the full reconstructed UI.
- Added readable app capabilities and App Store navigation beside the workflow preview. Existing AI request, industry coverage and report content remain in place.
- Production build and targeted ESLint passed; desktop/mobile capture previews checked. SNAP interaction regression checks include inline rendering and playback.

## 2026-09-21 — SNAP source copy and FAQ parity

- Compared against https://pr67wvp5tr-svg.github.io/ecoya-landing/snap/ . Preserved the existing visual layout, illustrations, colors and start actions.
- Restored source section labels and workflow preview titles; removed supplemental editorial copy so the reading sequence follows the source. App Store navigation and the capture illustration remain.
- Source order: hero → How it works → Any field, one way → AI × 사람 → Trusted evidence → FAQ → closing contact.
- Saved 89 source text blocks in an independent regression fixture. Browser check verifies all blocks in sequence and all seven FAQ questions and answers in exact order, including opening and closing each answer.

## 2026-09-21 — Public typography readability

- Audited brand story, Trade OS, SNAP, pricing, login and signup with loaded local Pretendard fonts. Header links were weight 400; login/contact were only 14px desktop and 12px on narrow screens.
- Shared header now uses weight 600: desktop menus 18px, login/contact 16px; mobile menus 16px and actions 14px. Login/contact use indigo text. Product suffix and action labels use the same stronger weight.
- Landing body copy uses weight 500, preserving larger headings and the established indigo/blue palette. Restored native font smoothing instead of forcing thin grayscale rendering. Auth form typography was checked; the shared header is updated there as well.
- Report context labels use 15px semibold outlines; helper captions use readable secondary ink instead of faint text. Pricing tabs/actions use 16px semibold; pricing notes use 15px medium.
- Captured before/after views under /tmp/font-before-* and /tmp/font-after-*. Checked all six routes at 1440px, 390px and 320px with no horizontal page overflow. Production build passed.

## 2026-09-22 — Richer SNAP scenes with stable stage height

- Replaced sparse request/checklist/review artwork with a connected logistics example: container illustration and request, three illustrated shot guides, evidence review and web/PDF delivery. Original source headings, body order and seven FAQs remain unchanged.
- Field illustrations are inline vector assets, explicitly labelled as examples. Existing app capture photos remain; the tall app is framed around the important capture area and an offline-storage note on narrow screens.
- Hero and workflow illustration viewports share fixed heights (480px wide / 460px narrow). Workflow heading and optional App Store link have reserved rows. Mobile workflow descriptions use a stable single-column area so the next section does not move.
- Browser measurements at 1440, 1024, 390 and 320px confirmed identical hero heights and following-section positions across all four stages, with no horizontal overflow. Reduced-motion views inspected; targeted source-copy/FAQ, inline visual and playback tests: 4 passed. ESLint and production build passed.
