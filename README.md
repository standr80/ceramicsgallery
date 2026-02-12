# Ceramics Gallery — www.ceramicsgallery.co.uk

A website that lists multiple ceramacists (potters), each with their own page, biography, and product catalog. Ecommerce is powered by Stripe Connect.

## Features

- **Home page** — Featured products from each potter, plus links to all potters
- **Potter pages** — One page per potter at `/fredbloggs`, `/henrymay`, `/violetsmith`, etc., with biography and product catalog (price, description, image)
- **Signup page** — Form for new potters to apply to join the gallery
- **Ecommerce** — Stripe Checkout for purchases; potters connect Stripe to receive payouts. “Add to cart”

## Tech stack

- **Next.js 14** (App Router)
- **TypeScript**
- **Tailwind CSS**
- Data: JSON file (`data/potters.json`) — can later be replaced by a CMS or database

## Getting started

1. **Install Node.js** (v18 or later) if you don’t have it: [nodejs.org](https://nodejs.org).

2. **Install dependencies and run the dev server:**

   ```bash
   cd ceramicsgallery
   npm install
   npm run dev
   ```

3. Open [http://localhost:3000](http://localhost:3000) in your browser.

## Adding potters and products

- **Data:** Edit `data/potters.json`. Each potter has:
  - `id`, `slug` (used in URL, e.g. `fredbloggs`)
  - `name`, `biography`, `image` (potter photo)
  - `products`: array of objects with `id`, `name`, `description`, `price`, `currency`, `image`, optional `featured`, `sku`

- **Images:** Put files in:
  - Potter photos: `public/images/potters/` (e.g. `fred-bloggs.jpg`)
  - Product photos: `public/images/products/` (e.g. `fb-bowl.jpg`)

  Then set the `image` field in `potters.json` to paths like `/images/potters/fred-bloggs.jpg` and `/images/products/fb-bowl.jpg`. Until you add real images, the site uses a placeholder from `public/images/placeholder.svg`.

## Ecommerce (Stripe Connect)

- Potters connect their Stripe accounts via **Dashboard → Payments**.
- “Add to cart” is not wired yet; you can add Foxycart or Ecwid scripts and buttons that use each product’s `id`, `name`, `price`, and `sku` when you’re ready.

## Signup form

- The signup page at `/signup` is a client-side form that logs to the console on submit.
- To make it functional: send the form to your backend or a service (e.g. Formspree, your API), or store applications in a database and process them manually.

## Build for production

```bash
npm run build
npm start
```

## Deploying

You can deploy to Vercel, Netlify, or any host that supports Next.js. Point the domain www.ceramicsgallery.co.uk to your deployment when ready.
