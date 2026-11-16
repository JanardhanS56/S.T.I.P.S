// Central place for limits and rules. Change numbers here, not scattered in routes.
export const config = {
  isProd: process.env.NODE_ENV === 'production',
  jwtSecret: process.env.JWT_SECRET,
  postMaxChars: 280,
  messageMaxChars: 500,
  limits: {
    postsPerHour: 10,
    pollsPerDay: 5,
    messagesPerHour: 60,
    reportsPerDay: 20,
    loginFailuresBeforeLock: 5,
    lockMinutes: 10,
  },
  // 'teacher-student': a DM needs at least one teacher or admin. Student-to-student DMs are off.
  dmRule: 'teacher-student',
};

if (!config.jwtSecret) {
  throw new Error('JWT_SECRET is not set. See .env.example');
}
