import { useCallback, useEffect, useRef, useState } from 'react';
import { useGSAP } from '@gsap/react';
import { gsap } from 'gsap';
import styles from './Contact.module.css';
import { profile, socialLinks } from '../data/profile';
import { useReducedMotion } from '../hooks/useReducedMotion';

/*
  Contact — the last screen before the footer.

  Sending is real but never faked. With an access key in
  src/data/profile.js (profile.formAccessKey) the form POSTs to Web3Forms
  over fetch; the success panel appears only when the response literally
  says { success: true }. With no key it does the honest thing instead: it
  opens the visitor's mail client and says that sending is not connected
  yet. Nothing pretends a message was delivered, nothing is tracked, and no
  key is invented here.

  A hidden honeypot field plus Web3Forms' own botcheck cover spam.
*/

const EMPTY = { name: '', email: '', message: '', website: '' };

const ENDPOINT = 'https://api.web3forms.com/submit';
const REQUEST_TIMEOUT_MS = 15000;
const RESEND_LOCK_MS = 30000;

const MESSAGES = {
  sending: 'Sending…',
  success: 'Thanks, your message was sent. I will reply to the email you gave.',
  error: 'Could not send. Please email me directly',
  notConnected:
    'Sending is not connected on this site yet — this opens your email app instead.',
};

function validate(values) {
  const errors = {};
  if (!values.name.trim()) errors.name = 'Please add your name.';
  if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(values.email.trim())) {
    errors.email = 'Please add a valid email address.';
  }
  if (values.message.trim().length < 12) {
    errors.message = 'A sentence or two is plenty — just a little more detail.';
  }
  return errors;
}

export default function Contact() {
  const reduced = useReducedMotion();
  const [values, setValues] = useState(EMPTY);
  const [errors, setErrors] = useState({});
  /* 'idle' | 'sending' | 'success' | 'error' | 'fallback'. Nothing renders
     in the panel until there is a status to show — no empty green box. */
  const [status, setStatus] = useState('idle');
  const [fallbackNote, setFallbackNote] = useState('');
  const [copied, setCopied] = useState(false);
  const [revealed, setRevealed] = useState(false);

  const revealRef = useRef(null);
  const copyTimer = useRef(0);
  const lockTimer = useRef(0);
  /* Blocks resubmitting for 30s after a real success. */
  const [lockedUntil, setLockedUntil] = useState(0);

  /* Live sending needs a key in src/data/profile.js. ?contact=live is a
     hidden developer override (same idea as ?motion=) so the send path can
     be exercised — against a mocked endpoint — before a key exists. */
  const canSend =
    Boolean(profile.formAccessKey) ||
    new URLSearchParams(window.location.search).get('contact') === 'live';

  const update = (field) => (event) => {
    setValues((prev) => ({ ...prev, [field]: event.target.value }));
  };

  /* Headline reveal: a masked line lifts into view on hover or keyboard focus.
     Under reduced motion the line is simply shown in full (static).
     GSAP owns the hidden state (not CSS): a CSS translateY(110%) would be
     parsed by GSAP as a pixel `y`, which yPercent alone cannot undo. */
  useGSAP(
    () => {
      const line = revealRef.current;
      if (!line) return undefined;
      if (reduced) {
        gsap.set(line, { yPercent: 0, y: 0, autoAlpha: 1 });
        return undefined;
      }
      gsap.fromTo(
        line,
        { yPercent: 110, y: 0, autoAlpha: 0 },
        {
          yPercent: revealed ? 0 : 110,
          y: 0,
          autoAlpha: revealed ? 1 : 0,
          duration: 0.55,
          ease: 'power3.out',
          overwrite: 'auto',
        }
      );
      return undefined;
    },
    { dependencies: [revealed, reduced], revertOnUpdate: true }
  );

  /* Success panel entrance (static under reduced motion). */
  useGSAP(
    () => {
      if (status !== 'success') return undefined;
      const el = document.querySelector('[data-contact-status]');
      if (!el) return undefined;
      if (reduced) {
        gsap.set(el, { autoAlpha: 1, y: 0 });
        return undefined;
      }
      gsap.fromTo(
        el,
        { autoAlpha: 0, y: 12 },
        { autoAlpha: 1, y: 0, duration: 0.55, ease: 'power3.out' }
      );
      return undefined;
    },
    { dependencies: [status, reduced] }
  );

  useEffect(
    () => () => {
      window.clearTimeout(copyTimer.current);
      window.clearTimeout(lockTimer.current);
    },
    []
  );

  const copyEmail = useCallback(async () => {
    try {
      await navigator.clipboard.writeText(profile.email);
    } catch {
      const area = document.createElement('textarea');
      area.value = profile.email;
      area.setAttribute('readonly', '');
      area.style.position = 'absolute';
      area.style.left = '-9999px';
      document.body.appendChild(area);
      area.select();
      try {
        document.execCommand('copy');
      } catch {
        /* nothing else we can do — the email is visible to copy by hand */
      }
      area.remove();
    }
    const timer = window.setTimeout(() => setCopied(false), 3200);
    copyTimer.current = timer;
    setCopied(true);
  }, []);

  /* Opens the visitor's email app with everything filled in. Used only when
     no access key is configured, and as the escape hatch on a failed send. */
  const openMailClient = useCallback(() => {
    const name = values.name.trim() || '…';
    const body = `${values.message.trim()}\n\n— ${name}\n${values.email.trim()}`;
    const href = `mailto:${profile.email}?subject=${encodeURIComponent(
      `New message from your portfolio`
    )}&body=${encodeURIComponent(body)}`;
    window.location.href = href;
  }, [values]);

  const send = useCallback(async () => {
    const controller = new AbortController();
    const timer = window.setTimeout(() => controller.abort(), REQUEST_TIMEOUT_MS);

    const payload = {
      access_key: profile.formAccessKey,
      name: values.name.trim(),
      email: values.email.trim(),
      message: values.message.trim(),
      subject: 'New message from your portfolio',
      from_name: profile.name,
      botcheck: values.website.trim(),
    };

    try {
      const res = await fetch(ENDPOINT, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json', Accept: 'application/json' },
        body: JSON.stringify(payload),
        signal: controller.signal,
      });
      /* Never trust the status code alone — only the documented flag. */
      const data = await res.json().catch(() => null);
      if (data && data.success === true) {
        setStatus('success');
        setLockedUntil(Date.now() + RESEND_LOCK_MS);
        setValues(EMPTY);
        lockTimer.current = window.setTimeout(() => setLockedUntil(0), RESEND_LOCK_MS);
      } else {
        setStatus('error');
      }
    } catch {
      /* Network failure, non-JSON body, or the 15s timeout. */
      setStatus('error');
    } finally {
      window.clearTimeout(timer);
    }
  }, [values]);

  const onSubmit = (event) => {
    event.preventDefault();

    /* Honeypot: only a bot fills this (it is hidden from people). Silently stop. */
    if (values.website.trim()) return;

    const nextErrors = validate(values);
    setErrors(nextErrors);
    if (Object.keys(nextErrors).length > 0) {
      setStatus('idle');
      return;
    }

    if (!canSend) {
      /* Honest fallback: say plainly that sending is not connected, then
         open the mail client with the message already written. */
      setFallbackNote(MESSAGES.notConnected);
      openMailClient();
      return;
    }

    if (Date.now() < lockedUntil) return; /* 30s resubmit lock after success */

    setFallbackNote('');
    setStatus('sending');
    send();
  };

  return (
    <section id="contact" className="section">
      <div className="container">
        <p className="eyebrow">Contact</p>
        <h2
          className={styles.heading}
          data-reveal-heading
          data-revealed={revealed}
          tabIndex={0}
          onMouseEnter={() => setRevealed(true)}
          onMouseLeave={() => setRevealed(false)}
          onFocus={() => setRevealed(true)}
          onBlur={() => setRevealed(false)}
        >
          Let&apos;s make something{' '}
          <em className={styles.headingEm}>unforgettable.</em>
          <span className={styles.revealMask} aria-hidden="true">
            <span className={styles.revealLine} ref={revealRef} data-reveal-line>
              Tell me about the page you have in mind.
            </span>
          </span>
        </h2>
      </div>

      <div className={`container grid-12 ${styles.grid}`}>
        <div className={`col-span-5 ${styles.intro}`}>
          <p className={styles.lead}>
            If you need a landing page or a marketing site designed and built, the fastest path
            is a short message with the goal and the page you have in mind. If you are here for a
            design critique instead, say so — I treat it just as seriously.
          </p>

          <div className={styles.contactRow}>
            <button type="button" className={styles.copy} onClick={copyEmail} data-copy-email>
              {copied ? 'Email copied' : 'Copy my email'}
            </button>
            <p className={styles.toast} role="status" data-show={copied} data-toast>
              {copied ? `Copied — ${profile.email}` : ''}
            </p>
          </div>

          <ul className={styles.links}>
            <li>
              <a className={styles.link} href={`mailto:${profile.email}`}>
                {profile.email}
              </a>
            </li>
            {socialLinks.map((link) => (
              <li key={link.label}>
                <a
                  className={styles.link}
                  href={link.url}
                  target="_blank"
                  rel="noopener noreferrer"
                >
                  {link.label}
                </a>
              </li>
            ))}
          </ul>

          <dl className={styles.facts}>
            <div className={styles.fact}>
              <dt className={styles.factKey}>Based</dt>
              <dd className={styles.factValue}>{profile.location}</dd>
            </div>
            <div className={styles.fact}>
              <dt className={styles.factKey}>Timezone</dt>
              <dd className={styles.factValue}>
                {profile.timezone} (<TimezoneOffset />)
              </dd>
            </div>
            <div className={styles.fact}>
              <dt className={styles.factKey}>Open to</dt>
              <dd className={styles.factValue}>
              Landing pages, marketing sites, the front-end build, and design reviews of
              AI-generated pages
            </dd>
            </div>
          </dl>
        </div>

        <form className={`col-span-7 ${styles.form}`} onSubmit={onSubmit} noValidate>
          <div className={styles.field}>
            <label className={styles.label} htmlFor="contact-name">
              Name
            </label>
            <input
              id="contact-name"
              className={styles.input}
              type="text"
              name="name"
              autoComplete="name"
              value={values.name}
              onChange={update('name')}
              aria-invalid={Boolean(errors.name)}
              aria-describedby={errors.name ? 'contact-name-error' : undefined}
            />
            {errors.name && (
              <p id="contact-name-error" className={styles.error}>
                {errors.name}
              </p>
            )}
          </div>

          <div className={styles.field}>
            <label className={styles.label} htmlFor="contact-email">
              Email
            </label>
            <input
              id="contact-email"
              className={styles.input}
              type="email"
              name="email"
              autoComplete="email"
              value={values.email}
              onChange={update('email')}
              aria-invalid={Boolean(errors.email)}
              aria-describedby={errors.email ? 'contact-email-error' : undefined}
            />
            {errors.email && (
              <p id="contact-email-error" className={styles.error}>
                {errors.email}
              </p>
            )}
          </div>

          <div className={styles.field}>
            <label className={styles.label} htmlFor="contact-message">
              Message
            </label>
            <textarea
              id="contact-message"
              className={`${styles.input} ${styles.textarea}`}
              name="message"
              rows={5}
              value={values.message}
              onChange={update('message')}
              aria-invalid={Boolean(errors.message)}
              aria-describedby={errors.message ? 'contact-message-error' : undefined}
            />
            {errors.message && (
              <p id="contact-message-error" className={styles.error}>
                {errors.message}
              </p>
            )}
          </div>

          {/* Spam honeypot — hidden from people, tempting to bots. */}
          <div className={styles.honeypot} aria-hidden="true">
            <label htmlFor="contact-website">Website (leave this empty)</label>
            <input
              id="contact-website"
              name="website"
              type="text"
              tabIndex={-1}
              autoComplete="off"
              value={values.website}
              onChange={update('website')}
            />
          </div>

          <div className={styles.actions}>
            <button
              type="submit"
              className={styles.submit}
              disabled={status === 'sending' || Date.now() < lockedUntil}
              aria-busy={status === 'sending'}
            >
              {status === 'sending' ? MESSAGES.sending : canSend ? 'Send message' : 'Open in my email app'}
            </button>
            {!canSend && (
              <p className={styles.hint} data-contact-hint>
                {MESSAGES.notConnected}
              </p>
            )}
          </div>

          {/* One polite live region for every outcome. Nothing is rendered
              here until there is something to say. */}
          <p className="visually-hidden" role="status" aria-live="polite">
            {status === 'sending'
              ? MESSAGES.sending
              : status === 'success'
                ? MESSAGES.success
                : status === 'error'
                  ? MESSAGES.error
                  : fallbackNote}
          </p>

          {status === 'success' && (
            <div className={styles.success} data-contact-status data-tone="success">
              <p className={styles.successTitle}>{MESSAGES.success}</p>
              <p className={styles.successBody}>
                Sent to {profile.email}. Nothing else is stored or tracked.
              </p>
            </div>
          )}

          {status === 'error' && (
            <div className={styles.failure} data-contact-status data-tone="error">
              <p className={styles.failureTitle}>{MESSAGES.error}</p>
              <p className={styles.failureBody}>
                The form could not reach the mail service. Copy my address and write
                directly — {profile.email}.
              </p>
              <button type="button" className={styles.copy} onClick={copyEmail} data-copy-email>
                {copied ? 'Email copied' : 'Copy my email'}
              </button>
            </div>
          )}
        </form>
      </div>
    </section>
  );
}

/* The Karachi offset is a fixed +05:00 (no daylight saving), derived from the
   profile timezone rather than hard-coded twice. */
function TimezoneOffset() {
  const parts = new Intl.DateTimeFormat('en-GB', {
    timeZone: profile.timezone,
    timeZoneName: 'shortOffset',
  }).formatToParts(new Date());
  const zone = parts.find((part) => part.type === 'timeZoneName')?.value;
  return <>{zone ?? 'GMT+5'}</>;
}
