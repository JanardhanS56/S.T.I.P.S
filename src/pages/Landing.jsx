import { Link } from 'react-router-dom';

export default function Landing() {
  return (
    <div className="landing">
      <div className="wrap">
        <header className="topbar">
          <span className="wordmark dark">S.T.I.P.S</span>
          <nav>
            <a href="#how">How it works</a>
            <a href="#safe">Safety &amp; privacy</a>
            <Link to="/signin" className="btn btn-dark">
              Sign in
            </Link>
          </nav>
        </header>

        <section className="hero">
          <div className="hero-l">
            <div className="mono small green">STUDENT–TEACHER INTERACTION &amp; POLLING SYSTEM</div>
            <h1>
              One campus.
              <br />
              Every voice,
              <br />
              <span className="green">counted.</span>
            </h1>
          </div>
          <div className="hero-r">
            <p className="lead">
              A private space for one institute at a time. Notices, memes and event calls in one
              feed. Polls the whole campus can answer. Messages between students and teachers that
              never need a phone number.
            </p>
            <div className="row">
              <Link to="/signin" className="btn btn-dark btn-lg">
                Sign in with your username
              </Link>
              <Link to="/signin" className="underline">
                I have a community code
              </Link>
            </div>
          </div>
        </section>

        <section className="goal">
          <div>
            <div className="mono small green-light">OUR GOAL</div>
            <h2>Make it easy to ask, answer and decide together, inside the campus walls.</h2>
          </div>
          <div className="goal-copy">
            <p>
              Most college talk is scattered across group chats, notice boards and corridors.
              S.T.I.P.S gives each institute one place with clear roles: the office creates it,
              teachers and students take part.
            </p>
            <p>
              Everyone is known by username and name only. No personal numbers, no outsiders, no
              open signups.
            </p>
          </div>
        </section>

        <section id="how" className="block">
          <div className="mono small green">HOW IT WORKS</div>
          <h2 className="h2">Three steps from office to feed.</h2>
          <div className="steps">
            {[
              [
                '01',
                'The office creates a community',
                'The principal or office sets up the institute, then issues usernames and one-time passwords to teachers and students.'
              ],
              [
                '02',
                'You sign in and join',
                'Sign in with the username you were given. You are added automatically, or you enter the community code the office shared.'
              ],
              [
                '03',
                'Post, ask, vote',
                'Share a short post, start a poll, message a teacher. Everything stays inside your community.'
              ]
            ].map(([n, t, d]) => (
              <div key={n} className="step">
                <span className="mono green">{n}</span>
                <h3>{t}</h3>
                <p>{d}</p>
              </div>
            ))}
          </div>
        </section>

        <section id="safe" className="block safe">
          <div>
            <div className="mono small green">SAFETY &amp; PRIVACY</div>
            <h2 className="h2">Built to stay clean and calm.</h2>
          </div>
          <ul className="rules">
            <li>
              <b>Family-friendly by default.</b> Posts and messages are screened before they appear.
              Anyone can report content.
            </li>
            <li>
              <b>Rate limits and spam control.</b> Posting, voting and messaging are throttled per
              account.
            </li>
            <li>
              <b>Minimal data.</b> Username, name, role and community. No tracking, no ads, one
              sign-in cookie.
            </li>
            <li>
              <b>Admins stay in charge.</b> The office can remove content, mute or suspend accounts
              and review reports.
            </li>
          </ul>
        </section>

        <footer className="foot">
          <span>
            <b className="wordmark dark">S.T.I.P.S</b> · Prototype
          </span>
          <span>
            <Link to="/guidelines">Community guidelines</Link>
            <Link to="/privacy">Privacy policy</Link>
            <Link to="/cookies">Cookie notice</Link>
          </span>
        </footer>
      </div>
    </div>
  );
}
