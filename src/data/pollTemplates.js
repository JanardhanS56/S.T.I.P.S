export const POLL_TEMPLATES = [
  {
    id: 'cr-election',
    title: 'Class Representative (CR) Election',
    category: 'Governance',
    description: 'Elect the student representative for your class or section.',
    question: 'Class Representative (CR) Election - Select your preferred candidate',
    options: ['Candidate A', 'Candidate B', 'Candidate C'],
    days: 3
  },
  {
    id: 'event-date',
    title: 'Event Date Selection',
    category: 'Scheduling',
    description: 'Find the date that works best for the community.',
    question: 'Which date works best for the upcoming department symposium?',
    options: ['Friday, Dec 5th', 'Saturday, Dec 6th', 'Sunday, Dec 7th'],
    days: 3
  },
  {
    id: 'teacher-of-the-year',
    title: 'Teacher of the Year Recognition',
    category: 'Recognition',
    description: 'Celebrate and vote for the most inspiring faculty member.',
    question: 'Vote for Faculty Mentor & Teacher of the Year',
    options: [
      'Dr. Sharma (Computer Science)',
      'Prof. Anjali (Mathematics)',
      'Dr. Verma (Physics)',
      'Prof. Iyer (Humanities)'
    ],
    days: 7
  },
  {
    id: 'event-contribution',
    title: 'Event Contribution & Budgeting',
    category: 'Finance',
    description: 'Decide on recommended individual contributions for campus events.',
    question: 'Suggested individual contribution for the Annual Cultural Night',
    options: ['₹100', '₹200', '₹300', '₹500'],
    days: 3
  },
  {
    id: 'subject-help',
    title: 'Subject Tutoring & Study Group Help',
    category: 'Academic',
    description: 'Identify which course or subject students need the most help with.',
    question: 'Which subject needs the most peer-tutoring help this semester?',
    options: [
      'Data Structures & Algorithms',
      'Operating Systems',
      'Linear Algebra',
      'Database Management'
    ],
    days: 3
  },
  {
    id: 'project-option',
    title: 'Best Project Tech Stack / Option',
    category: 'Projects',
    description: 'Vote to select the best option or technology out of choices.',
    question: 'Which tech stack / framework should we use for the hackathon project?',
    options: ['React + Node.js', 'Python + FastAPI', 'Flutter + Go', 'Next.js + Supabase'],
    days: 3
  },
  {
    id: 'eval-slot',
    title: 'Project Evaluation / Viva Time Slot',
    category: 'Scheduling',
    description: 'Determine the most convenient window for academic evaluations.',
    question: 'Preferred time slot for lab project evaluations',
    options: [
      'Morning (9:00 AM - 12:00 PM)',
      'Afternoon (1:30 PM - 4:30 PM)',
      'Evening (5:00 PM - 7:00 PM)'
    ],
    days: 2
  },
  {
    id: 'workshop-topic',
    title: 'Campus Workshop Topic',
    category: 'Workshops',
    description: 'Choose which technical or career skill to focus on next.',
    question: 'What topic should the upcoming weekend workshop cover?',
    options: [
      'AI & Machine Learning',
      'Cloud & DevOps',
      'Cybersecurity Basics',
      'Open Source Contributing'
    ],
    days: 5
  },
  {
    id: 'cafeteria-special',
    title: 'Cafeteria / Canteen Menu Special',
    category: 'Campus Life',
    description: 'Vote on special food items or menu preferences.',
    question: 'Which special dish should be served in the campus cafeteria on Friday?',
    options: ['South Indian Thali', 'Pasta & Garlic Bread', 'Paneer Biryani', 'Chole Bhature'],
    days: 2
  },
  {
    id: 'sports-tournament',
    title: 'Inter-Branch Sports Tournament',
    category: 'Sports',
    description: 'Pick the next sporting event to organize across campus.',
    question: 'Which inter-branch tournament should we organize next month?',
    options: [
      'Badminton (Singles/Doubles)',
      'Box Cricket League',
      'Football 5-a-side',
      'Chess Tournament'
    ],
    days: 4
  }
];
