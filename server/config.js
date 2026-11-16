import { env } from './env.js';

// Central place for limits and rules. Change numbers here, not scattered in routes.
export const config = {
  isProd: env.NODE_ENV === 'production',
  jwtSecret: env.JWT_SECRET,
  port: env.PORT,
  postMaxChars: 280,
  messageMaxChars: 500,
  limits: {
    postsPerHour: 10,
    pollsPerDay: 5,
    messagesPerHour: 60,
    reportsPerDay: 20,
    loginFailuresBeforeLock: 5,
    lockMinutes: 10,
    autoMuteThreshold: 5,
    autoMuteWindowSeconds: 3600
  },
  spam: {
    maxRepeatedChars: 6,
    maxRepeatedWords: 4,
    allCapsMinLength: 10,
    allCapsRatio: 0.7,
    allowLinks: false
  },
  // 'teacher-student': a DM needs at least one teacher or admin. Student-to-student DMs are off.
  dmRule: 'teacher-student'
};
