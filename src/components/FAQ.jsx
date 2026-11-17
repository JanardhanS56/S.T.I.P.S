/**
 * Expandable FAQ Accordion Component (Item 19: Expandable FAQ)
 * Accessible semantic <details><summary> accordion with animated expanders.
 */
export default function FAQ() {
  const faqs = [
    {
      q: 'Who can access our campus community?',
      a: 'Only verified students, faculty, and administrative staff belonging to the institution. Access requires either an invitation credential issued by the campus office or joining via your confidential campus code.'
    },
    {
      q: 'Are polls truly anonymous?',
      a: 'Yes. While the database enforces one vote per student to prevent tampering, individual voter identities are mathematically separated from option tallies. Results remain hidden until you vote or the poll closes.'
    },
    {
      q: 'Can students send direct messages to other students?',
      a: 'No. To prevent harassment and protect student safety, direct messaging is strictly between students and teachers/office. Phone numbers and personal email addresses are automatically blocked.'
    },
    {
      q: 'How can I download or delete my account data?',
      a: 'Under your Profile settings, you can export a complete JSON archive of your account data anytime (once per 24 hours), or request full erasure and anonymization.'
    },
    {
      q: 'What is the content moderation policy?',
      a: 'All posts and messages undergo automatic screening against prohibited terms, contact information sharing, and spam. Repeated violations trigger an automated 1-hour mute escalation.'
    }
  ];

  return (
    <section className="faq-section" aria-labelledby="faq-heading">
      <h2 id="faq-heading" style={{ fontSize: '24px', marginBottom: '16px' }}>
        Frequently Asked Questions
      </h2>
      <div className="faq-accordion">
        {faqs.map((item, idx) => (
          <details key={idx} className="faq-details">
            <summary className="faq-summary">
              <span>{item.q}</span>
            </summary>
            <div className="faq-body">
              <p style={{ margin: 0 }}>{item.a}</p>
            </div>
          </details>
        ))}
      </div>
    </section>
  );
}
