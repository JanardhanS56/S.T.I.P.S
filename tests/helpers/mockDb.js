import { randomUUID } from 'node:crypto';
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
    // Community A
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
      id: '00000000-0000-0000-0001-000000000008',
      community_id: '00000000-0000-0000-0000-000000000001',
      username: 'student_a2',
      display_name: 'Student A Two',
      role: 'student',
      password_hash: testPasswordHash,
      must_change_password: false,
      bio: 'Student 2',
      department: 'Arts',
      status: 'active',
      failed_attempts: 0,
      locked_until: null,
      token_version: 0
    },
    {
      id: '00000000-0000-0000-0001-000000000007',
      community_id: '00000000-0000-0000-0000-000000000001',
      username: 'muted_a',
      display_name: 'Muted Student',
      role: 'student',
      password_hash: testPasswordHash,
      must_change_password: false,
      bio: 'Muted bio',
      department: 'Arts',
      status: 'muted',
      failed_attempts: 0,
      locked_until: null,
      token_version: 0
    },
    {
      id: '00000000-0000-0000-0001-000000000009',
      community_id: '00000000-0000-0000-0000-000000000001',
      username: 'admin_a2',
      display_name: 'Vice Principal A',
      role: 'admin',
      password_hash: testPasswordHash,
      must_change_password: false,
      bio: 'Vice Principal',
      department: 'Office',
      status: 'active',
      failed_attempts: 0,
      locked_until: null,
      token_version: 0
    },
    // Community B
    {
      id: '00000000-0000-0000-0002-000000000001',
      community_id: '00000000-0000-0000-0000-000000000002',
      username: 'admin_b',
      display_name: 'Principal Beta',
      role: 'admin',
      password_hash: testPasswordHash,
      must_change_password: false,
      bio: 'Principal Beta',
      department: 'Office',
      status: 'active',
      failed_attempts: 0,
      locked_until: null,
      token_version: 0
    },
    {
      id: '00000000-0000-0000-0002-000000000002',
      community_id: '00000000-0000-0000-0000-000000000002',
      username: 'teacher_b1',
      display_name: 'Prof. Bob B',
      role: 'teacher',
      password_hash: testPasswordHash,
      must_change_password: false,
      bio: 'Physics',
      department: 'Science',
      status: 'active',
      failed_attempts: 0,
      locked_until: null,
      token_version: 0
    },
    {
      id: '00000000-0000-0000-0002-000000000003',
      community_id: '00000000-0000-0000-0000-000000000002',
      username: 'student_b1',
      display_name: 'Student B One',
      role: 'student',
      password_hash: testPasswordHash,
      must_change_password: false,
      bio: 'Student Beta',
      department: 'Science',
      status: 'active',
      failed_attempts: 0,
      locked_until: null,
      token_version: 0
    },
    // Special Users
    {
      id: '00000000-0000-0000-0001-000000000005',
      community_id: null,
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

  const posts = [
    {
      id: '00000000-0000-0000-0003-000000000001',
      community_id: '00000000-0000-0000-0000-000000000001',
      author_id: '00000000-0000-0000-0001-000000000002',
      category: 'Notice',
      body: 'Welcome to the semester at Alpha Institute!',
      status: 'visible',
      created_at: new Date(Date.now() - 3600000).toISOString()
    },
    {
      id: '00000000-0000-0000-0003-000000000002',
      community_id: '00000000-0000-0000-0000-000000000002',
      author_id: '00000000-0000-0000-0002-000000000002',
      category: 'Notice',
      body: 'Welcome to Beta College community.',
      status: 'visible',
      created_at: new Date(Date.now() - 3600000).toISOString()
    },
    ...(initialData.posts || [])
  ];

  const polls = [
    {
      id: '00000000-0000-0000-0004-000000000001',
      community_id: '00000000-0000-0000-0000-000000000001',
      author_id: '00000000-0000-0000-0001-000000000002',
      question: 'Preferred time for office hours?',
      status: 'visible',
      closes_at: new Date(Date.now() + 7 * 86400000).toISOString(),
      created_at: new Date(Date.now() - 3600000).toISOString()
    },
    {
      id: '00000000-0000-0000-0004-000000000002',
      community_id: '00000000-0000-0000-0000-000000000002',
      author_id: '00000000-0000-0000-0002-000000000002',
      question: 'Beta preferred exam date?',
      status: 'visible',
      closes_at: new Date(Date.now() + 7 * 86400000).toISOString(),
      created_at: new Date(Date.now() - 3600000).toISOString()
    },
    ...(initialData.polls || [])
  ];

  const poll_options = [
    {
      id: '00000000-0000-0000-0005-000000000001',
      poll_id: '00000000-0000-0000-0004-000000000001',
      label: 'Morning (10:00 AM)'
    },
    {
      id: '00000000-0000-0000-0005-000000000002',
      poll_id: '00000000-0000-0000-0004-000000000001',
      label: 'Afternoon (2:00 PM)'
    },
    {
      id: '00000000-0000-0000-0005-000000000003',
      poll_id: '00000000-0000-0000-0004-000000000002',
      label: 'Option Beta 1'
    },
    ...(initialData.poll_options || [])
  ];

  const poll_votes = [...(initialData.poll_votes || [])];

  const messages = [
    {
      id: '00000000-0000-0000-0006-000000000001',
      community_id: '00000000-0000-0000-0000-000000000001',
      sender_id: '00000000-0000-0000-0001-000000000002',
      recipient_id: '00000000-0000-0000-0001-000000000003',
      body: 'Hello Student A1 from Teacher A1',
      created_at: new Date(Date.now() - 10000).toISOString()
    },
    {
      id: '00000000-0000-0000-0006-000000000002',
      community_id: '00000000-0000-0000-0000-000000000002',
      sender_id: '00000000-0000-0000-0002-000000000002',
      recipient_id: '00000000-0000-0000-0002-000000000003',
      body: 'Hello Beta Student from Beta Teacher',
      created_at: new Date(Date.now() - 10000).toISOString()
    },
    ...(initialData.messages || [])
  ];

  const reports = [
    {
      id: '00000000-0000-0000-0007-000000000001',
      community_id: '00000000-0000-0000-0000-000000000001',
      reporter_id: '00000000-0000-0000-0001-000000000003',
      target_type: 'post',
      target_id: '00000000-0000-0000-0003-000000000001',
      reason: 'Spam report test A',
      status: 'open',
      created_at: new Date(Date.now() - 5000).toISOString()
    },
    {
      id: '00000000-0000-0000-0007-000000000002',
      community_id: '00000000-0000-0000-0000-000000000002',
      reporter_id: '00000000-0000-0000-0002-000000000003',
      target_type: 'post',
      target_id: '00000000-0000-0000-0003-000000000002',
      reason: 'Spam report test B',
      status: 'open',
      created_at: new Date(Date.now() - 5000).toISOString()
    },
    ...(initialData.reports || [])
  ];

  const tables = {
    communities,
    users,
    posts,
    polls,
    poll_options,
    poll_votes,
    messages,
    reports
  };

  return {
    ...tables,
    from(tableName) {
      const collection = tables[tableName] || [];
      const filters = [];
      let updates = null;
      let insertedRecord = null;
      let isCountHead = false;
      let orderByCol = null;
      let orderAscending = true;
      let limitCount = null;

      const executeUpdates = () => {
        if (!updates) return;
        for (const item of collection) {
          if (filters.every((fn) => fn(item))) {
            Object.assign(item, updates);
          }
        }
      };

      const resolveItem = (item) => {
        if (!item) return null;
        const copy = { ...item };
        if (tableName === 'posts') {
          const author = users.find((u) => u.id === copy.author_id);
          copy.author = author
            ? { username: author.username, display_name: author.display_name, role: author.role }
            : null;
        } else if (tableName === 'polls') {
          const author = users.find((u) => u.id === copy.author_id);
          copy.author = author
            ? { username: author.username, display_name: author.display_name, role: author.role }
            : null;
          copy.options = poll_options
            .filter((o) => o.poll_id === copy.id)
            .map((o) => ({ id: o.id, label: o.label }));
        } else if (tableName === 'messages') {
          const sender = users.find((u) => u.id === copy.sender_id);
          const recipient = users.find((u) => u.id === copy.recipient_id);
          copy.sender = sender
            ? {
                id: sender.id,
                username: sender.username,
                display_name: sender.display_name,
                role: sender.role
              }
            : null;
          copy.recipient = recipient
            ? {
                id: recipient.id,
                username: recipient.username,
                display_name: recipient.display_name,
                role: recipient.role
              }
            : null;
        } else if (tableName === 'reports') {
          const reporter = users.find((u) => u.id === copy.reporter_id);
          copy.reporter = reporter ? { username: reporter.username } : null;
        }
        return copy;
      };

      const getFilteredData = () => {
        let list = collection.filter((item) => filters.every((fn) => fn(item)));
        if (orderByCol) {
          list = [...list].sort((a, b) => {
            const av = a[orderByCol];
            const bv = b[orderByCol];
            if (av < bv) return orderAscending ? -1 : 1;
            if (av > bv) return orderAscending ? 1 : -1;
            return 0;
          });
        }
        if (limitCount !== null) {
          list = list.slice(0, limitCount);
        }
        return list.map(resolveItem);
      };

      const queryBuilder = {
        select(_fields, options) {
          if (options && options.count === 'exact' && options.head) {
            isCountHead = true;
          }
          return queryBuilder;
        },
        limit(n) {
          limitCount = n;
          return queryBuilder;
        },
        order(col, opts = { ascending: true }) {
          orderByCol = col;
          orderAscending = opts.ascending !== false;
          return queryBuilder;
        },
        eq(col, val) {
          filters.push((item) => item[col] === val);
          return queryBuilder;
        },
        neq(col, val) {
          filters.push((item) => item[col] !== val);
          return queryBuilder;
        },
        in(col, vals) {
          filters.push((item) => vals.includes(item[col]));
          return queryBuilder;
        },
        gte(col, val) {
          filters.push((item) => item[col] >= val);
          return queryBuilder;
        },
        gt(col, val) {
          filters.push((item) => item[col] > val);
          return queryBuilder;
        },
        lte(col, val) {
          filters.push((item) => item[col] <= val);
          return queryBuilder;
        },
        lt(col, val) {
          filters.push((item) => item[col] < val);
          return queryBuilder;
        },
        or(expression) {
          // Supports expressions like:
          // 1. "sender_id.eq.X,recipient_id.eq.X"
          // 2. "and(sender_id.eq.A,recipient_id.eq.B),and(sender_id.eq.B,recipient_id.eq.A)"
          filters.push((item) => {
            if (expression.startsWith('and(')) {
              const clauses = expression.split('),and(').map((c) => c.replace(/^and\(|\)$/g, ''));
              return clauses.some((clause) => {
                const parts = clause.split(',');
                return parts.every((part) => {
                  const [k, v] = part.split('.eq.');
                  return item[k] === v;
                });
              });
            }
            if (expression.includes('sender_id.eq') && expression.includes('recipient_id.eq')) {
              const matches = expression.match(/[a-z_]+\.eq\.([0-9a-f-]+)/g);
              if (matches) {
                return matches.some((m) => {
                  const [k, v] = m.split('.eq.');
                  return item[k] === v;
                });
              }
            }
            return true;
          });
          return queryBuilder;
        },
        insert(data) {
          const items = Array.isArray(data) ? data : [data];
          for (const item of items) {
            if (tableName === 'poll_votes') {
              const exists = poll_votes.some(
                (v) => v.poll_id === item.poll_id && v.user_id === item.user_id
              );
              if (exists) {
                const err = new Error('duplicate key value violates unique constraint');
                err.code = '23505';
                return {
                  select: () => queryBuilder,
                  single: async () => ({ data: null, error: err }),
                  then(onFulfilled, onRejected) {
                    return Promise.resolve({ data: null, error: err }).then(
                      onFulfilled,
                      onRejected
                    );
                  }
                };
              }
            }
            const record = {
              id: item.id || randomUUID(),
              created_at: new Date().toISOString(),
              ...(tableName === 'posts' || tableName === 'polls' ? { status: 'visible' } : {}),
              ...item
            };
            collection.push(record);
            insertedRecord = record;
          }
          return queryBuilder;
        },
        update(fields) {
          updates = fields;
          return queryBuilder;
        },
        async maybeSingle() {
          executeUpdates();
          const list = getFilteredData();
          return { data: list.length ? list[0] : null, error: null };
        },
        async single() {
          executeUpdates();
          if (insertedRecord) {
            return { data: resolveItem(insertedRecord), error: null };
          }
          const list = getFilteredData();
          return list.length
            ? { data: list[0], error: null }
            : { data: null, error: new Error('Record not found') };
        },
        then(onFulfilled, onRejected) {
          executeUpdates();
          if (isCountHead) {
            const count = collection.filter((item) => filters.every((fn) => fn(item))).length;
            return Promise.resolve({ count, data: null, error: null }).then(
              onFulfilled,
              onRejected
            );
          }
          const list = getFilteredData();
          return Promise.resolve({ data: list, error: null }).then(onFulfilled, onRejected);
        }
      };

      return queryBuilder;
    }
  };
}
