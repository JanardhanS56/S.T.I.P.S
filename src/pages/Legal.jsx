import { Link } from 'react-router-dom';

// Starter policy text. It is NOT legal advice. Have your institute's legal contact review it
// and replace the [PLACEHOLDERS] before real students use the platform.
function Doc({ title, children }) {
  return (
    <div className="legal">
      <Link to="/" className="wordmark dark">S.T.I.P.S</Link>
      <h1>{title}</h1>
      {children}
      <p className="small muted">Starter text for the prototype. Last updated [DATE]. Contact: [OFFICE EMAIL].</p>
    </div>
  );
}

export const Privacy = () => (
  <Doc title="Privacy policy">
    <h3>What we keep</h3>
    <p>Your name, username, role, department, short bio, the posts, poll votes and messages you create, and your community. Passwords are stored only as one-way hashes. We do not ask for or store phone numbers, email addresses, home addresses or photos.</p>
    <h3>Who can see it</h3>
    <p>Only members of your own community. The office (admin) can review reported content and messages that are reported. Nobody outside the community can see anything.</p>
    <h3>How content is checked</h3>
    <p>Posts, polls, messages and bios are screened by a word filter and, if the institute enables it, an automated AI check. The text sent to the AI provider contains only the content, never your name or username.</p>
    <h3>Your choices</h3>
    <p>You can edit your profile, change your password, and ask the office to delete your account and content. [RETENTION PERIOD] after an account is removed, its data is deleted.</p>
    <h3>Students under 18</h3>
    <p>[CONFIRM WITH YOUR INSTITUTE how parental or institutional consent is handled for minors in your region.]</p>
  </Doc>
);

export const Guidelines = () => (
  <Doc title="Community guidelines">
    <p>S.T.I.P.S is for college life: notices, events, memes, funny moments, questions and decisions. Keep it kind and family-friendly.</p>
    <h3>Not allowed</h3>
    <p>Bullying or harassment, hate or discrimination, sexual or violent content, drugs, sharing personal contact details, impersonation, and spam. Repeated or serious breaches can lead to a mute or suspension by the office.</p>
    <h3>If you see something</h3>
    <p>Use Report on a post. The office reviews every report.</p>
  </Doc>
);

export const Cookies = () => (
  <Doc title="Cookie notice">
    <p>S.T.I.P.S sets one cookie, <code>stips_session</code>, that keeps you signed in for up to 7 days. It is HTTP-only, HTTPS-only and not sent on cross-site requests. We also remember in your browser that you dismissed the cookie banner.</p>
    <p>We use no analytics, advertising or tracking cookies.</p>
  </Doc>
);
