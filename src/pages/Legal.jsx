import { Link } from 'react-router-dom';
import PublicFooter from '../components/PublicFooter.jsx';
import FloatingContact from '../components/FloatingContact.jsx';

function Doc({ title, children }) {
  return (
    <div className="legal">
      <a href="#main-content" className="skip-link">
        Skip to content
      </a>
      <header style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
        <Link to="/" className="wordmark dark" aria-label="S.T.I.P.S Home">
          S.T.I.P.S
        </Link>
      </header>
      <main id="main-content" tabIndex="-1">
        <h1>{title}</h1>
        {children}
        <div
          className="legal-meta"
          style={{
            marginTop: '48px',
            paddingTop: '16px',
            borderTop: '1px solid var(--line)',
            fontSize: '13px',
            color: 'var(--mute)'
          }}
        >
          <p>
            Last updated: November 17, 2026. For questions or grievances, contact{' '}
            <a href="mailto:grievance@campus.edu">grievance@campus.edu</a>.
          </p>
        </div>
      </main>
      <PublicFooter />
      <FloatingContact />
    </div>
  );
}

export const Privacy = () => (
  <Doc title="Privacy Policy">
    <p className="lead">
      S.T.I.P.S is a private, closed-loop network designed exclusively for authorized members of
      this educational campus. We do not track, profile, or sell data.
    </p>

    <h3>1. Data Fiduciary and Platform Operator</h3>
    <p>
      {/* [NEEDS HUMAN REVIEW: verify institute registered entity name and address] */}
      The campus educational institute acts as the Data Fiduciary responsible for deciding the
      purposes and means of processing personal data on this platform. The platform technical
      operator acts as a Data Processor on behalf of the institute.
    </p>

    <h3>2. Data Inventory: What We Process</h3>
    <table className="table" aria-label="Personal Data Inventory">
      <thead>
        <tr>
          <th scope="col">Data Element</th>
          <th scope="col">Purpose</th>
          <th scope="col">Retention Period</th>
        </tr>
      </thead>
      <tbody>
        <tr>
          <td>Name, Username, Role, Department</td>
          <td>Account identification, campus authorization, and role-based permissions</td>
          <td>Duration of active account lifetime</td>
        </tr>
        <tr>
          <td>Password Hash (one-way bcrypt/scrypt)</td>
          <td>Secure account sign-in authentication</td>
          <td>Duration of active account lifetime</td>
        </tr>
        <tr>
          <td>Profile Bio (Optional)</td>
          <td>Self-expression within the closed campus</td>
          <td>Until edited or account deleted</td>
        </tr>
        <tr>
          <td>Posts, Replies, Reactions, Poll Votes</td>
          <td>Core community interaction, open discussions, and campus voting</td>
          <td>Until deleted by author or removed in moderation</td>
        </tr>
        <tr>
          <td>Direct Messages</td>
          <td>Teacher-student academic communication</td>
          <td>Account lifetime; subject to safety review if reported</td>
        </tr>
        <tr>
          <td>Reports and Administrative Audit Log</td>
          <td>Campus safety, abuse prevention, and accountability</td>
          <td>
            {/* [NEEDS HUMAN REVIEW: confirm campus audit retention target e.g. 365 days] */} 365
            days
          </td>
        </tr>
        <tr>
          <td>
            Session Cookie (<code>stips_session</code>)
          </td>
          <td>Maintaining active authenticated session</td>
          <td>7 days from issuance</td>
        </tr>
        <tr>
          <td>Client IP (Rate Limit Store)</td>
          <td>Spam prevention, DDoS mitigation, and brute-force protection</td>
          <td>15 minutes to 24 hours (hashed key)</td>
        </tr>
      </tbody>
    </table>

    <p>
      <strong>Data we NEVER collect:</strong> We do not ask for or record phone numbers, personal
      email addresses, physical home addresses, camera/photo uploads, GPS geolocation, device
      fingerprints, or advertising trackers.
    </p>

    <h3>3. Sub-Processors and Data Infrastructure</h3>
    <p>
      To deliver the service, data is stored and processed with vetted technical infrastructure
      providers acting under strict processing agreements:
    </p>
    <ul>
      <li>
        <strong>Database &amp; Storage:</strong> Supabase PostgreSQL (encrypted in transit and at
        rest).
        {/* [NEEDS HUMAN REVIEW: verify AWS region e.g. ap-south-1 Mumbai] */}
      </li>
      <li>
        <strong>Application Hosting:</strong> Vercel Serverless Edge (encrypted TLS connections).
        {/* [NEEDS HUMAN REVIEW: verify Vercel deployment region] */}
      </li>
      <li>
        <strong>Text Screening:</strong> Local deterministic word and pattern checks. Automated
        assistance, if enabled, transmits only stripped content text without personal identifiers or
        user metadata.
      </li>
    </ul>

    <h3>4. Children and Students Under 18</h3>
    <p>
      {/* [NEEDS HUMAN REVIEW: confirm parental consent procedure administered by institute at enrollment] */}
      Many students on campus may be under 18. S.T.I.P.S operates strictly within the institutional
      campus boundary without behavioral advertising, tracking cookies, or public exposure. Guardian
      consent is verified and maintained by the educational institute through student enrollment
      procedures. Direct messaging is permitted only between verified faculty and students;
      unmonitored student-to-student private channels are disabled.
    </p>

    <h3>5. Security Safeguards</h3>
    <p>
      We implement multi-layered technical safeguards: Row-Level Security (RLS) isolating each
      campus community, strong Content Security Policy (CSP), HTTP-only SameSite=Strict secure
      cookies, automated rate limiting on every endpoint, and cryptographic token revocation.
    </p>

    <h3>6. Your Rights (Access, Portability, Erasure)</h3>
    <p>Every member possesses the right to control their data:</p>
    <ul>
      <li>
        <strong>Right to Access &amp; Portability:</strong> You can download a complete,
        machine-readable JSON archive of your profile, posts, votes, and messages at any time from
        your Profile page.
      </li>
      <li>
        <strong>Right to Correction:</strong> You may edit your profile display name and bio
        directly in settings.
      </li>
      <li>
        <strong>Right to Erasure:</strong> You can initiate an account deletion request from your
        Profile. Upon confirmation by campus administrators, your personal information is wiped,
        username randomized, and past contributions anonymized to &ldquo;Deleted user&rdquo;.
      </li>
      <li>
        <strong>Right to Grievance Redressal:</strong> Any privacy concerns can be lodged with the
        designated Grievance Officer.
      </li>
    </ul>
  </Doc>
);

export const Terms = () => (
  <Doc title="Terms of Use">
    <p className="lead">
      These Terms govern access to and use of S.T.I.P.S. By signing in, you agree to these
      conditions.
    </p>

    <h3>1. Authorized Campus Eligibility</h3>
    <p>
      Access to S.T.I.P.S is restricted strictly to active students, faculty, and administrative
      staff of the participating educational institution. Accounts are non-transferable and issued
      solely for academic and campus life purposes.
    </p>

    <h3>2. Account Responsibility</h3>
    <p>
      You are responsible for keeping your credentials confidential. You must not share your account
      or use another person&apos;s login. If you suspect unauthorized access, notify the campus
      administration immediately to reset your credentials.
    </p>

    <h3>3. Acceptable Use and Content Standards</h3>
    <p>
      Every post, poll, reply, and direct message must adhere to our Community Guidelines. You agree
      not to publish content that:
    </p>
    <ul>
      <li>Harasses, bullies, threatens, or demeans any member of the community.</li>
      <li>Discloses personal contact details (phone numbers, email addresses, personal IDs).</li>
      <li>Promotes discrimination, hate speech, vulgarity, or illegal activities.</li>
      <li>Spams feeds, manipulates poll outcomes, or circumvents rate limits.</li>
    </ul>

    <h3>4. Content License and Moderation</h3>
    <p>
      You retain ownership of the text and contributions you publish. By posting on S.T.I.P.S, you
      grant the institution a limited license to display and store your content inside the closed
      campus network. Campus administrators reserve the right to review reported content, apply
      automated screening, and remove any material that breaches safety guidelines.
    </p>

    <h3>5. Enforcement and Suspension</h3>
    <p>
      Breaches of these Terms may result in automated content rejection, progressive temporary
      muting, or account suspension by campus administration. Serious violations will be escalated
      according to the institute&apos;s disciplinary code.
    </p>

    <h3>6. Disclaimers and Governing Law</h3>
    <p>
      {/* [NEEDS HUMAN REVIEW: confirm governing jurisdiction city/state] */}
      The platform is provided on an &ldquo;as is&rdquo; and &ldquo;as available&rdquo; basis for
      non-commercial campus communication. These Terms are governed by the laws of India and subject
      to the jurisdiction of courts in the institute&apos;s home state.
    </p>
  </Doc>
);

export const Cookies = () => (
  <Doc title="Cookie Notice">
    <p className="lead">
      S.T.I.P.S uses strictly necessary cookies and local storage tokens. We use zero tracking, zero
      analytics, and zero advertising cookies.
    </p>

    <h3>Storage Elements Used</h3>
    <table className="table" aria-label="Cookies and Local Storage Used">
      <thead>
        <tr>
          <th scope="col">Name</th>
          <th scope="col">Type</th>
          <th scope="col">Duration</th>
          <th scope="col">Purpose</th>
        </tr>
      </thead>
      <tbody>
        <tr>
          <td>
            <code>stips_session</code>
          </td>
          <td>HTTP-only Cookie (Strict, Secure)</td>
          <td>7 days</td>
          <td>
            Essential: Maintains your encrypted authentication session across requests. Cannot be
            read by JavaScript.
          </td>
        </tr>
        <tr>
          <td>
            <code>stips_notice</code>
          </td>
          <td>Browser Local Storage</td>
          <td>Persistent</td>
          <td>
            Functional: Remembers when you have acknowledged this informational notice so the banner
            is not repeated.
          </td>
        </tr>
      </tbody>
    </table>

    <h3>No Third-Party Tracking</h3>
    <p>
      Because we do not employ non-essential tracking or marketing cookies, no complex consent
      opt-in mechanism is required under data privacy standards. The session cookie is purely
      technical and mandatory to sign in.
    </p>

    <h3>Managing Cookies</h3>
    <p>
      You can inspect, block, or delete cookies at any time through your browser settings. Note that
      disabling cookies will prevent you from signing in to your campus account.
    </p>
  </Doc>
);

export const Guidelines = () => (
  <Doc title="Community Guidelines">
    <p className="lead">
      S.T.I.P.S is our shared campus square. Keep discussions constructive, honest, and respectful.
    </p>

    <h3>1. What We Encourage</h3>
    <ul>
      <li>Sharing genuine campus news, club announcements, and academic updates.</li>
      <li>Creating constructive polls to gather community perspectives.</li>
      <li>Sharing respectful humor, memes, and celebration of campus milestones.</li>
      <li>Asking thoughtful questions to faculty and student peers.</li>
    </ul>

    <h3>2. What Is Prohibited</h3>
    <ul>
      <li>
        <strong>Bullying and Harassment:</strong> Personal attacks, targeted insults, trolling, or
        intimidation.
      </li>
      <li>
        <strong>Hate Speech:</strong> Slurs, discriminatory remarks based on religion, gender,
        caste, race, or disability.
      </li>
      <li>
        <strong>Doxxing &amp; Personal Info:</strong> Sharing telephone numbers, external social
        handles, or private photos.
      </li>
      <li>
        <strong>Academic Dishonesty:</strong> Distributing exam questions, leaked papers, or
        deceptive academic material.
      </li>
      <li>
        <strong>Commercial Spam:</strong> Unauthorized promotional campaigns, referral links, or
        solicitations.
      </li>
    </ul>

    <h3>3. Moderation and Reporting</h3>
    <p>
      Every post and reply has a &ldquo;Report&rdquo; button. If you observe content that violates
      these guidelines, submit a report. The campus moderation team reviews reported content in an
      admin queue.
    </p>

    <h3>4. Progressive Consequences</h3>
    <p>
      Violations lead to progressive enforcement: 1) warning / automated content rejection, 2)
      account muting (read-only mode), and 3) account suspension. Repeat offenders face
      institutional disciplinary action.
    </p>
  </Doc>
);

export const Accessibility = () => (
  <Doc title="Accessibility Statement">
    <p className="lead">
      S.T.I.P.S is dedicated to ensuring equal digital access for all students, faculty, and staff,
      targeting conformance with the Web Content Accessibility Guidelines (WCAG) 2.2 Level AA.
    </p>

    <h3>Key Accessibility Features</h3>
    <ul>
      <li>
        <strong>Keyboard Accessibility:</strong> All functionality (signing in, posting, replying,
        voting in polls, sending direct messages) is operable entirely via keyboard with visible
        focus outlines and focus management on route navigation.
      </li>
      <li>
        <strong>Screen Reader Semantics:</strong> Standard HTML landmarks (
        <code>&lt;header&gt;</code>, <code>&lt;main&gt;</code>, <code>&lt;nav&gt;</code>,{' '}
        <code>&lt;footer&gt;</code>), progress bar attributes (
        <code>role=&quot;progressbar&quot;</code>), and ARIA live regions for notifications.
      </li>
      <li>
        <strong>Visual Contrast:</strong> High-contrast color palette exceeding the 4.5:1 minimum
        contrast ratio for standard body text and 3:1 for large headers and interface borders.
      </li>
      <li>
        <strong>Responsive &amp; Reflow:</strong> Clean reflow on mobile viewports down to 320px
        width without horizontal scrollbars, minimum 44px touch targets on mobile touch devices.
      </li>
      <li>
        <strong>Motion and Flashing:</strong> Calm visual design with no auto-playing animations,
        video, or flashing elements.
      </li>
    </ul>

    <h3>Continuous Testing</h3>
    <p>
      Our codebase runs automated accessibility checks via <code>@axe-core</code> in CI, testing
      both desktop and mobile viewports.
    </p>

    <h3>Reporting Accessibility Barriers</h3>
    <p>
      If you encounter any difficulty navigating or accessing content on S.T.I.P.S, please reach out
      to <a href="mailto:grievance@campus.edu">grievance@campus.edu</a> with details of the barrier
      and device used. We aim to respond within 2 business days.
    </p>
  </Doc>
);

export const Contact = () => (
  <Doc title="Contact &amp; Grievance Redressal">
    <p className="lead">
      We are committed to prompt, transparent communication and resolving any community or privacy
      concerns.
    </p>

    <h3>Campus Administration Office</h3>
    <p>
      {/* [NEEDS HUMAN REVIEW: confirm campus administrative office address] */}
      For general account provisioning, class access, or campus code verification, visit the Campus
      Administration Office during academic hours (Monday to Friday, 9:00 AM – 5:00 PM).
    </p>

    <h3>Grievance Officer Details</h3>
    <p>
      In accordance with applicable digital data protection standards, the institution has appointed
      a designated Grievance Officer:
    </p>
    <ul>
      <li>
        <strong>Title:</strong> Campus Grievance Officer
      </li>
      <li>
        <strong>Designation:</strong> Dean of Student Welfare / Administrative Head
      </li>
      <li>
        <strong>Email:</strong> <a href="mailto:grievance@campus.edu">grievance@campus.edu</a>
      </li>
      <li>
        {/* [NEEDS HUMAN REVIEW: confirm campus grievance officer legal name and physical desk location] */}
        <strong>Office:</strong> Student Affairs &amp; Grievance Cell, Administration Block
      </li>
    </ul>

    <h3>Redressal Timelines</h3>
    <ul>
      <li>
        <strong>Acknowledgment:</strong> Grievance reports received via email or in person are
        acknowledged within 24 hours.
      </li>
      <li>
        <strong>Resolution:</strong> The Grievance Officer reviews all submitted complaints,
        coordinates with the moderation audit trail, and aims to provide formal resolution within 15
        working days.
      </li>
    </ul>
  </Doc>
);
