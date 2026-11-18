# Clem setup: Ceramics Gallery

Answers for the NBLB setup wizard (nobrandleftbehind.com → /setup), with the reasoning behind each so they can be challenged or changed later. Paste the quoted text into the matching field.

## What the news section is for

Ceramics Gallery is a marketplace with three things to sell: **pots** (12% commission), **courses** (free listings now, paid booking tier later) and **the site itself to potters** (sign-ups). The news section should earn search traffic from people at the start of those journeys and pass them to the right page:

| Reader | What they search | Where Clem should send them |
|---|---|---|
| Buyer, browsing | "handmade mugs", "studio pottery gift" | /shop |
| Buyer, researching | "stoneware vs porcelain", "is handmade pottery dishwasher safe" | /shop, after answering the question |
| Would-be learner | "pottery classes near me", "pottery taster" | /courses |
| Potter | "where to sell pottery online", "how to price pottery" | /signup |

Marketplaces win search with **helpful, specific answers**, not with category pages. Category pages can't compete against Etsy, John Lewis and Not On The High Street for "buy handmade mug". A clear answer to "what's the difference between stoneware and porcelain?" can, and the reader lands one click from the shop.

## 1. Basics

- **Company / site name:** Ceramics Gallery
- **Domain:** ceramicsgallery.co.uk

**Why:** the Content API finds the tenant from the domain (slug `ceramicsgallery`). The site's /news pages read from that slug, so the domain must be exactly this, without `www`.

## 2. Brand

**Brand voice**

> Warm, knowledgeable and unpretentious, like a potter talking to a curious visitor in their studio. British English. Plain words over art-world jargon; explain any technical term (glaze, bisque, reduction firing) the first time it appears. Respect the craft and the makers: be specific about materials, processes and the time things take, and never treat handmade work as a commodity. Gently encourage buying from and learning with independent potters, without hard selling. Short paragraphs, concrete examples, a little dry humour is welcome. No exclamation-mark enthusiasm, no listicle filler.

**Why:**
- *"A potter talking to a visitor"* matches the site's design and copy, which are warm and editorial rather than retail.
- *Explain terms on first use.* Most buyers don't know what bisque or reduction means, and explanations are exactly what search engines and AI answers quote.
- *Specific about materials and time.* Specificity is what makes the case for handmade prices, and it's what separates useful writing from generic AI content.
- *No hard selling.* The audience is wary of being sold to, and the potters are the real brand. The site should feel like a guide, not a shop window.

**Target audience**

> UK adults, mostly 30 to 65, who love handmade things: people buying a first piece or a gift, existing collectors of studio pottery, and beginners thinking about a pottery taster or course. Also working potters who might sell or teach through the site.

**Why:** buyers of studio pottery and pottery course-goers skew this age range, and gifting is a large share of first purchases. Naming potters as a secondary audience lets Clem write occasional pieces for them (pricing, photographing work, selling online) that support sign-ups.

**Forbidden words**

> mass-produced bargain, cheap, artisanal, curated collection, elevate, unleash, game-changer, delve, testament, tapestry, nestled, in today's world, must-have

**Why:**
- *cheap, bargain, must-have:* wrong for handmade work, and they undercut potters' pricing.
- *artisanal, curated collection:* lifestyle-brand filler that potters themselves dislike.
- *elevate, unleash, delve, testament, tapestry, nestled, in today's world, game-changer:* the most recognisable AI-writing tells. Readers and editors spot them at once.

## 3. Publishing

- **Cadence:** 1× per week
- **Days:** Thursday
- **Time:** 09:00
- **Publish method:** NBLB Hosted (embed)

**Why:**
- *Weekly to start:* the first month is about getting the voice right. Reviewing one post a week is manageable, and a steady rhythm matters more to search engines than volume. Move to twice a week once the posts need few edits.
- *Thursday morning:* gift and weekend-plans searches build towards Friday and Saturday, so a Thursday post is indexed and shareable before the weekend.
- *NBLB Hosted:* posts go live through the Content API and ceramicsgallery.co.uk/news renders them on the server with proper titles and descriptions. That's better for search than the blog.js script, and needs no repo or pull request.

## 4. Keywords

UK search terms grouped by intent. Search volumes aren't included because I haven't measured them. Check them in Scout or a keyword tool before fixing the order. The priorities below are judgement: how closely the term matches what the site sells, and how beatable the current results look.

### Buying (high priority: leads to /shop)

| Keyword | Post angle |
|---|---|
| handmade pottery uk | Why buy direct from the potter, and what you're paying for |
| handmade mugs uk | What makes a good handmade mug: handle, weight, glaze, lip |
| studio pottery | What "studio pottery" means and how to start a collection |
| handmade ceramic gifts | Choosing pottery as a gift: safe bets and what to avoid |
| pottery gifts for her / for him | Seasonal gift guides (November, before Mother's Day) |
| handmade dinnerware / tableware uk | Buying a mismatched or matched handmade set |
| handmade vase | Choosing a vase for the flowers you actually buy |
| wedding gift pottery | Handmade pieces as wedding and anniversary gifts |

### Questions and care (high priority: easy to rank, builds trust)

| Keyword | Post angle |
|---|---|
| stoneware vs porcelain / earthenware | The three clays, explained with what they mean for daily use |
| is handmade pottery dishwasher safe | Dishwasher, microwave and oven: what's safe and why |
| is stoneware microwave safe | Same post, or a short dedicated answer |
| how to tell handmade pottery | Throwing marks, foot rings, maker's stamps |
| why is handmade pottery expensive | Hours, firings and failure rates behind one mug |
| crazing in pottery | What crazing is and whether it matters |
| how to clean / care for raku | Caring for raku, pit-fired and unglazed pieces |
| what is a glaze | Glaze explained without the chemistry lecture |
| reduction / wood / soda firing | How the kiln shapes the pot |
| what is raku | Raku: the fire, the smoke and the crackle |

### Learning (high priority: leads to /courses)

| Keyword | Post angle |
|---|---|
| pottery classes near me | Can't be won by a post. Win it with /courses and local pages later. Posts support it |
| pottery taster session | Your first taster: what happens, what to wear, what you'll take home |
| pottery wheel class for beginners | Wheel or handbuilding: which to start with |
| pottery workshop gift / experience | Giving a pottery class as a present |
| how long to learn pottery wheel | Realistic timeline from first centring to a decent mug |
| pottery course weekend uk | Weekend courses: what you can learn in two days |
| hen party pottery / pottery party | Private group sessions (supports the private_group format) |

### Potters (medium priority: leads to /signup)

| Keyword | Post angle |
|---|---|
| where to sell pottery online uk | Etsy, own site, galleries and marketplaces compared honestly |
| how to price handmade pottery | A pricing method potters can actually use |
| how to photograph pottery | Phone photography for pottery that sells |
| running pottery classes from home | Insurance, kiln access, group size, pricing |

### Seasonal hooks

- **Late October to mid December:** Christmas gift guides, potter gift ideas, "gifts under £40".
- **February to March:** Mother's Day gifts.
- **January:** "new hobby" pottery classes, the strongest month for course searches.
- **Spring and summer:** garden pottery and planters, outdoor raku and pit firing events.

### Avoid

- **"pottery barn":** a US furniture brand, not pottery.
- **"ceramics" alone:** dominated by industrial, dental and university results.
- **Brand-name dinnerware (Denby, Emma Bridgewater):** retail giants own those results, and comparing would put potters next to factory ware.

## 5. First eight briefs

In this order, because the first four answer high-intent questions and the next four cover gifts and learning as the season turns:

1. Stoneware, earthenware and porcelain: what's the difference?
2. Is handmade pottery dishwasher and microwave safe?
3. How to tell handmade pottery from factory-made
4. Why handmade pottery costs what it does
5. Pottery gifts: a guide for people who don't know pottery
6. Your first pottery taster: what to expect
7. Wheel throwing or handbuilding: which to start with?
8. Giving a pottery class as a present

After that, alternate buying, care and learning posts, with a potter "studio visit" profile once a month (each needs the potter's sign-off).

## 6. Linking

Clem should link to these pages, in the body where they fit naturally, not as a sales block. The site already adds a "Browse the shop / Find a class" panel under every post.

- **/shop:** handmade pottery for sale. Filtered links will help once categories exist.
- **/potters:** directory of potters. Link to an individual potter, `/<potter-slug>`, when writing about their work.
- **/courses:** pottery classes and workshops. Technique filters such as `/courses?technique=wheel` and `/courses?technique=raku` are useful deep links.
- **/signup:** for potter-facing posts only.

Links between posts should use `/news/<slug>`. Old `/blog/...` links redirect automatically.
