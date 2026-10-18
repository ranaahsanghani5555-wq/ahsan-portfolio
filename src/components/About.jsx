import styles from './About.module.css';
import Portrait from './Portrait';
import { profile } from '../data/profile';

/*
  About — who I am, how I work, and what I look for.
  Personal details come from src/data/profile.js. There are no testimonials
  anywhere on this site: instead, a three-principle pull-quote strip in my own
  voice.
*/

const PRINCIPLES = [
  {
    n: '01',
    title: 'One job on the first screen',
    body: 'One headline, one clear action, nothing competing for the same rank. If the first screen tries to do three things, it does none of them.',
  },
  {
    n: '02',
    title: 'Claims I can check',
    body: 'Specific, verifiable copy beats adjectives I have to trust. “Ready by 7am, order by 5pm” does more work than “freshly baked happiness”.',
  },
  {
    n: '03',
    title: 'Motion that only clarifies',
    body: 'Movement should explain the reading order, not decorate it. If I can remove an animation and lose nothing, it was never earning its place.',
  },
];

export default function About() {
  return (
    <section id="about" className="section">
      <div className={`container grid-12 ${styles.grid}`}>
        <div className={`col-span-5 ${styles.aside}`}>
          <p className="eyebrow">About</p>
          <h2 className={styles.name}>{profile.name}</h2>
          <p className={styles.role}>
            Web designer · {profile.location} ({profile.timezone})
          </p>

          <Portrait />
        </div>

        <div className={`col-span-6 ${styles.body}`}>
          <p className={styles.lead}>
            I am a web designer based in {profile.location}. I work the parts of a page that
            decide whether it works: visual hierarchy, layout composition, typography,
            responsive behaviour and the small UX details people feel but rarely name.
          </p>

          {/* EDIT: make this sound like me */}
          <p>
            My taste leans quiet. I trust straightforward type, deliberate spacing and one clear
            focal point more than decoration, and I would rather a page feel composed than
            clever. Most of what I do is subtraction — keeping what carries the idea and cutting
            the rest.
          </p>

          <p>
            I build in a loop: draft, then review the result as if someone else had made it, then
            cut. That same habit is why I write critiques of the work I make and of pages AI
            drafts — naming plainly what is weak and what is working is the fastest way I know
            to get better.
          </p>

          <p className={styles.honest}>
            I art-direct and build with AI-assisted tools, and I&apos;m interested in how humans
            and AI shape web design together.
          </p>

          <h3 className={styles.subhead}>Working set</h3>
          <ul className={styles.tools} data-tools>
            {profile.tools.map((tool) => (
              <li key={tool} className={styles.tool}>
                {tool}
              </li>
            ))}
          </ul>
        </div>
      </div>

      <div className="container">
        <div className={styles.principles}>
          <header className={styles.principlesHead}>
            <p className="eyebrow">What I look for</p>
            <h3 className={styles.principlesTitle}>What I look for in a great landing page.</h3>
          </header>

          <ul className={styles.principleList}>
            {PRINCIPLES.map((item) => (
              <li key={item.n} className={styles.principle}>
                <span className={styles.principleNum} aria-hidden="true">
                  {item.n}
                </span>
                <p className={styles.principleQuote}>{item.title}</p>
                <p className={styles.principleBody}>{item.body}</p>
              </li>
            ))}
          </ul>
        </div>
      </div>
    </section>
  );
}