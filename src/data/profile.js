/*
  profile.js — the single source of truth for personal details.
  Every component reads from here. If a field has no value, leave it '' — it
  will not render anywhere (no dead links, no placeholder links ever).

  Honesty rules:
  - Numbers are either real, derivable from real data (the six concept demos),
    or measured and recorded (see data/lighthouse.js). Nothing is invented.
  - The portrait lives in /public/images and is used only on the About page.
*/

export const profile = {
  name: 'Muhammad Ahsan Ghani',
  brand: 'Ahsan Ghani',
  location: 'Arifwala, Pakistan',
  timezone: 'Asia/Karachi',

  email: 'ahsanghani159@gmail.com',

  // EDIT: paste my Web3Forms access key. Create one (free) at
  // https://web3forms.com — the key is public-safe; it only lets the form
  // send mail to my inbox. While this is an empty string the form does NOT
  // pretend to send: it falls back to opening the visitor's email app and
  // says so plainly.
  formAccessKey: '743c2a25-656c-492b-b65b-22f3c99deea4',

  contraUrl: 'https://contra.com/s/FYFqmYr3-full-stack-web-mobile-and-ai-development',
  linkedinUrl: '', // empty on purpose — nothing renders when a link is empty

  // EDIT: my real hours. The default (75) is the honest sum of the six
  // concept-demo hours recorded in src/data/projects.js (14+12+16+9+13+11),
  // so this number is real until you replace it with your actual total.
  hoursSpent: 75,

  // Relative so the photo also resolves when the site is served from a
  // sub-path (base: './') — the page URL stays at the document path.
  portraitSrc: './images/ahsan-ghani.webp', // ~800×1066, generated from /ahsan.jpg.jpeg
  portraitSrc400: './images/ahsan-ghani-400.webp', // ~400×534
  portraitWidth: 800,
  portraitHeight: 1066,
  // The portrait alt is a plain description of the photo.
  portraitAlt: 'Portrait of Muhammad Ahsan Ghani',

  // EDIT: add only tools I really use (e.g. Figma, Framer, Webflow) and
  // remove the rest.
  tools: ['HTML', 'CSS', 'JavaScript', 'React', 'GSAP', 'AI-assisted coding tools'],
};

/*
  Social links — only entries with a non-empty url render. Add profiles here;
  empty entries (like LinkedIn, below) are skipped everywhere automatically.
*/
export const socialLinks = [
  { label: 'Contra', url: profile.contraUrl },
  { label: 'LinkedIn', url: profile.linkedinUrl },
].filter((link) => link.url);