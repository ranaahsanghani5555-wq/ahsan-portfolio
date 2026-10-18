import styles from './Critique.module.css';

/*
  CritiqueMockups — the three example landing pages used by the teardown.

  Each is an INVENTED, simplified mockup drawn in HTML/CSS — never an image or
  a screenshot, and never a copy of a real brand's page. They are built as
  scaled "artboards": every size inside `.mPage` is expressed in container
  query units (cqw), so the mockup scales proportionally with its frame at any
  width and never reflows. That keeps the composition identical to what the
  annotations describe, and lets the hotspot layer measure stable positions.

  `data-target="…"` attributes mark the elements the hotspots point at; the
  Critique component measures those elements to place its markers.

  Fake buttons and links are rendered as <span>, not <button>/<a>, so the
  illustrative chrome never enters the tab order.
*/

function WeakScreen() {
  return (
    <div className={`${styles.mPage} ${styles.mWeak}`}>
      <div className={styles.mNav}>
        <span className={styles.mLogo}>Vortexa</span>
        <span className={styles.mNavLinks}>
          <span>Product</span>
          <span>Solutions</span>
          <span>Pricing</span>
        </span>
        <span className={styles.mNavBtn}>Get Started</span>
      </div>

      <div className={styles.mHero} data-target="hero">
        <p className={styles.mEyebrow}>AI-powered analytics</p>
        <h4 className={styles.mHeadline} data-target="headline">
          Revolutionize your workflow
        </h4>
        <p className={styles.mSub} data-target="subhead">
          Leverage cutting-edge AI to unlock seamless, scalable productivity across your entire
          organization.
        </p>
        <div className={styles.mCtas} data-target="ctas">
          <span className={`${styles.mBtn} ${styles.mBtnPrimary}`}>Get Started</span>
          <span className={styles.mBtn}>Learn More</span>
        </div>
        <div className={styles.mIllustration} data-target="illustration" aria-hidden="true">
          <span className={styles.mBubble} />
          <span className={styles.mBubble} />
          <span className={styles.mBubble} />
        </div>
      </div>

      <div className={styles.mCards} data-target="cards">
        {['Powerful', 'Scalable', 'Secure'].map((title) => (
          <div className={styles.mCard} key={title}>
            <span className={styles.mCardIcon} aria-hidden="true" />
            <p className={styles.mCardTitle}>{title}</p>
            <p className={styles.mCardBody}>Everything you need, built for teams that move fast.</p>
          </div>
        ))}
      </div>

      <div className={styles.mFooter}>© Vortexa · Privacy · Terms</div>
    </div>
  );
}

function DecentScreen() {
  return (
    <div className={`${styles.mPage} ${styles.mDecent}`}>
      <div className={styles.mNav}>
        <span className={styles.mLogo}>Helio</span>
        <span className={styles.mNavLinks}>
          <span>Product</span>
          <span>Pricing</span>
          <span>Customers</span>
        </span>
        <span className={styles.mNavBtn}>Start free trial</span>
      </div>

      <div className={styles.mHero} data-target="hero">
        <div className={styles.mHeroCopy}>
          <p className={styles.mEyebrow}>Project management</p>
          <h4 className={styles.mHeadline} data-target="headline">
            Keep every project and every teammate on the same page
          </h4>
          <p className={styles.mSub} data-target="subhead">
            Plan work, assign tasks and track progress in one shared space. Built for teams of five
            to fifty.
          </p>
          <div className={styles.mCtas} data-target="ctas">
            <span className={styles.mBtn}>Book a demo</span>
            <span className={`${styles.mBtn} ${styles.mBtnPrimary}`}>Start free trial</span>
          </div>
        </div>
        <div className={styles.mShot} aria-hidden="true">
          <span className={styles.mShotBar} />
          <span className={styles.mShotRow} />
          <span className={styles.mShotRow} />
          <span className={styles.mShotRow} />
        </div>
      </div>

      <div className={styles.mCards} data-target="cards">
        {[
          ['Boards', 'Drag-and-drop boards for the way your team already works.'],
          ['Timeline', 'See every deadline on one shared calendar.'],
          ['Reports', 'Weekly summaries without the manual roll-up.'],
        ].map(([title, body]) => (
          <div className={styles.mCard} key={title}>
            <span className={styles.mCardIcon} aria-hidden="true" />
            <p className={styles.mCardTitle}>{title}</p>
            <p className={styles.mCardBody}>{body}</p>
          </div>
        ))}
      </div>

      <div className={styles.mFooter}>© Helio · Security · Status</div>
    </div>
  );
}

function StrongScreen() {
  return (
    <div className={`${styles.mPage} ${styles.mStrong}`}>
      <div className={styles.mNav}>
        <span className={styles.mLogo}>Cinder &amp; Sage</span>
        <span className={styles.mNavLinks}>
          <span>Bread</span>
          <span>Pastry</span>
          <span>Visit</span>
        </span>
        <span className={styles.mNavBtn}>Order for pickup</span>
      </div>

      <div className={styles.mHero} data-target="hero">
        <div className={styles.mHeroCopy}>
          <p className={styles.mEyebrow}>Sourdough · since 2016</p>
          <h4 className={styles.mHeadline} data-target="headline">
            Out of the oven at seven.
          </h4>
          <p className={styles.mSub} data-target="subhead">
            Small-batch bread, baked before sunrise and ready for pickup. Order by 5pm for tomorrow
            morning.
          </p>
          <div className={styles.mCtas} data-target="ctas">
            <span className={`${styles.mBtn} ${styles.mBtnPrimary}`}>Order for pickup</span>
            <span className={styles.mLink}>See this week’s bake</span>
          </div>
        </div>
        <div className={styles.mImage} aria-hidden="true">
          <span className={styles.mImageDisc} />
          <span className={styles.mImageLabel}>Wed–Sun · 7–2</span>
        </div>
      </div>

      <div className={styles.mStrip}>
        <span>Stone-milled flour</span>
        <span>48-hour ferment</span>
        <span>Baked daily</span>
      </div>

      <div className={styles.mFooter}>Cinder &amp; Sage · 14 Mill Lane · Open Wed–Sun</div>
    </div>
  );
}

export const mockupScreens = {
  weak: WeakScreen,
  decent: DecentScreen,
  strong: StrongScreen,
};
