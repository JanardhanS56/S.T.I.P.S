import { useNavigate } from 'react-router-dom';
import BaroqueFresco from '../components/BaroqueFresco.jsx';

export default function Landing() {
  const navigate = useNavigate();

  const series = {
    name: 'S.T.I.P.S',
    issue: 'Campus Portal',
    href: '/'
  };

  const story = {
    kicker: 'Student–Teacher Interaction & Polling System',
    title: ['One', 'Campus'],
    subject: 'Every voice, counted inside the campus walls',
    deck: '**S.T.I.P.S** _is a private, calm space for your institute. Notices, campus polls, and direct student-teacher messaging without phone numbers._',
    cta: {
      label: 'Sign in with your username',
      href: '/signin'
    }
  };

  const sections = [
    {
      title: 'How It Works',
      ornament: 'pearl',
      items: [
        {
          q: '01. The office creates a community',
          a: 'The administration sets up the institute, then issues usernames and first-time passwords to teachers and students.'
        },
        {
          q: '02. You sign in and join',
          a: 'Sign in with the credentials you were given. You are added automatically, or you can enter the community code your office shared.'
        },
        {
          q: '03. Post, ask, and vote',
          a: 'Share notices, discuss campus events, answer whole-campus polls, and message teachers directly. Everything stays securely inside your community.'
        }
      ]
    },
    {
      title: 'Safety & Privacy',
      ornament: 'pearl',
      items: [
        {
          q: 'Family-friendly by default',
          a: 'Posts and messages are screened before they appear. Any community member can report inappropriate content for administrative review.'
        },
        {
          q: 'Rate limits & spam protection',
          a: 'Posting, voting, and messaging are throttled per account to keep conversations constructive and prevent automated abuse.'
        },
        {
          q: 'Minimal data footprint',
          a: 'Only username, display name, role, and community are stored. No personal phone numbers, no tracking scripts, no third-party advertisements.'
        },
        {
          q: 'Administration stays in charge',
          a: 'Institute moderators can remove content, mute or suspend accounts, and resolve flagged issues instantly.'
        }
      ]
    },
    {
      title: 'Frequently Asked Questions',
      ornament: 'pearl',
      items: [
        {
          q: 'Can outsiders or public users sign up?',
          a: 'No. S.T.I.P.S accounts are issued exclusively by your school or college administration. There are no public registrations.'
        },
        {
          q: 'Are direct messages private?',
          a: 'Yes. Messages are exchanged strictly between you and your recipient. Contact details and phone numbers are never shared.'
        },
        {
          q: 'Can I use S.T.I.P.S on my mobile phone?',
          a: 'Yes. S.T.I.P.S is fully responsive and runs smoothly on smartphones, tablets, laptops, and desktop browsers.'
        }
      ]
    }
  ];

  const quote = {
    text: '**One campus.** _Every voice, counted._',
    cite: 'S.T.I.P.S Portal'
  };

  const next = {
    label: 'Campus Access',
    title: ['Sign', 'In'],
    blurb: 'Ready to join your institute? Sign in with your username and password.',
    href: '/signin'
  };

  const legal = [
    { label: 'Privacy Policy', href: '/privacy' },
    { label: 'Cookie Policy', href: '/cookies' },
    { label: 'Terms of Service', href: '/terms' }
  ];

  const labels = {
    index: 'Portal',
    next: 'Sign In',
    scroll: 'Scroll to explore',
    progress: 'Reading progress',
    nextStory: 'Enter Campus Portal',
    menu: 'Menu',
    top: 'Back to top'
  };

  return (
    <BaroqueFresco
      series={series}
      story={story}
      sections={sections}
      quote={quote}
      next={next}
      legal={legal}
      labels={labels}
      palette="coral"
      theme="dark"
      onNext={(target) => {
        if (target?.href) navigate(target.href);
      }}
    />
  );
}
