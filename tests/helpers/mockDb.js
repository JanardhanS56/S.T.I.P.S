import bcrypt from 'bcryptjs';

export function createMockDb(initialData = {}) {
  const testPasswordHash = bcrypt.hashSync('TestPassword123!', 10);

  const communities = [
    {
      id: '00000000-0000-0000-0000-000000000001',
      name: 'Alpha Institute',
      code: 'ALPH-0001'
    },
    {
      id: '00000000-0000-0000-0000-000000000002',
      name: 'Beta College',
      code: 'BETA-0002'
    },
    ...(initialData.communities || [])
  ];

  const users = [
    {
      id: '00000000-0000-0000-0001-000000000001',
      community_id: '00000000-0000-0000-0000-000000000001',
      username: 'admin_a',
      display_name: 'Principal Alpha',
      role: 'admin',
      password_hash: testPasswordHash,
      must_change_password: false,
      bio: 'Principal',
      department: 'Office',
      status: 'active',
      failed_attempts: 0,
      locked_until: null,
      token_version: 0
    },
    {
      id: '00000000-0000-0000-0001-000000000002',
      community_id: '00000000-0000-0000-0000-000000000001',
      username: 'teacher_a1',
      display_name: 'Prof. Alice A',
      role: 'teacher',
      password_hash: testPasswordHash,
      must_change_password: false,
      bio: 'Math',
      department: 'Science',
      status: 'active',
      failed_attempts: 0,
      locked_until: null,
      token_version: 0
    },
    {
      id: '00000000-0000-0000-0001-000000000004',
      community_id: '00000000-0000-0000-0000-000000000001',
      username: 'student_a1',
      display_name: 'Student A One',
      role: 'student',
      password_hash: testPasswordHash,
      must_change_password: false,
      bio: 'Student',
      department: 'Science',
      status: 'active',
      failed_attempts: 0,
      locked_until: null,
      token_version: 0
    },
    {
      id: '00000000-0000-0000-0001-000000000005',
      community_id: null, // User without community for join test
      username: 'no_community_user',
      display_name: 'New Student',
      role: 'student',
      password_hash: testPasswordHash,
      must_change_password: false,
      bio: '',
      department: '',
      status: 'active',
      failed_attempts: 0,
      locked_until: null,
      token_version: 0
    },
    {
      id: '00000000-0000-0000-0001-000000000006',
      community_id: '00000000-0000-0000-0000-000000000001',
      username: 'suspended_user',
      display_name: 'Suspended Student',
      role: 'student',
      password_hash: testPasswordHash,
      must_change_password: false,
      bio: '',
      department: '',
      status: 'suspended',
      failed_attempts: 0,
      locked_until: null,
      token_version: 0
    },
    ...(initialData.users || [])
  ];

  return {
    communities,
    users,
    from(tableName) {
      const collection = tableName === 'communities' ? communities : users;
      const filters = [];
      let updates = null;

      const executeUpdates = () => {
        if (!updates) return;
        for (const item of collection) {
          if (filters.every((fn) => fn(item))) {
            Object.assign(item, updates);
          }
        }
      };

      const queryBuilder = {
        select(_fields) {
          return queryBuilder;
        },
        limit(_n) {
          return queryBuilder;
        },
        eq(col, val) {
          filters.push((item) => item[col] === val);
          return queryBuilder;
        },
        update(fields) {
          updates = fields;
          return queryBuilder;
        },
        async maybeSingle() {
          executeUpdates();
          const matched = collection.find((item) => filters.every((fn) => fn(item)));
          return { data: matched ? { ...matched } : null, error: null };
        },
        async single() {
          executeUpdates();
          const matched = collection.find((item) => filters.every((fn) => fn(item)));
          return matched
            ? { data: { ...matched }, error: null }
            : { data: null, error: new Error('Record not found') };
        },
        then(onFulfilled, onRejected) {
          executeUpdates();
          return Promise.resolve({ data: null, error: null }).then(onFulfilled, onRejected);
        }
      };

      return queryBuilder;
    }
  };
}
