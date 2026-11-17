import { Router } from 'express';
import { db } from '../db.js';
import { h, HttpError } from '../http.js';
import { enforceExportCap } from '../limits.js';

const r = Router();

r.get(
  '/export',
  h(async (req, res) => {
    await enforceExportCap(req, res);
    const userId = req.user.id;

    // 1. Profile
    const { data: user, error: userErr } = await db
      .from('users')
      .select(
        'id,username,display_name,role,department,bio,status,created_at,accepted_terms_at,terms_version,community_id'
      )
      .eq('id', userId)
      .single();

    if (userErr || !user) throw new HttpError(404, 'User profile not found.');

    // Community if attached
    let community = null;
    if (user.community_id) {
      const { data: c } = await db
        .from('communities')
        .select('id,name,code')
        .eq('id', user.community_id)
        .maybeSingle();
      community = c || null;
    }

    // 2. Posts and Replies
    const { data: allPosts } = await db
      .from('posts')
      .select('id,parent_id,category,body,created_at,status,pinned_at,is_official')
      .eq('author_id', userId);

    const posts = (allPosts || []).filter((p) => !p.parent_id);
    const replies = (allPosts || []).filter((p) => Boolean(p.parent_id));

    // 3. Reactions
    const { data: reactions } = await db
      .from('post_reactions')
      .select('post_id,kind,created_at')
      .eq('user_id', userId);

    // 4. Polls created
    const { data: polls } = await db
      .from('polls')
      .select('id,question,created_at,expires_at,status,poll_options(id,text)')
      .eq('author_id', userId);

    // 5. Poll votes
    const { data: votes } = await db
      .from('poll_votes')
      .select('poll_id,option_id,created_at')
      .eq('user_id', userId);

    // 6. Direct messages sent and received
    const { data: sentMessages } = await db
      .from('messages')
      .select('id,recipient_id,body,created_at,read_at')
      .eq('sender_id', userId);

    const { data: receivedMessages } = await db
      .from('messages')
      .select('id,sender_id,body,created_at,read_at')
      .eq('recipient_id', userId);

    const exportPayload = {
      exportMetadata: {
        exportedAt: new Date().toISOString(),
        formatVersion: '1.0',
        platform: 'S.T.I.P.S'
      },
      profile: {
        id: user.id,
        username: user.username,
        displayName: user.display_name,
        role: user.role,
        department: user.department,
        bio: user.bio,
        status: user.status,
        createdAt: user.created_at,
        acceptedTermsAt: user.accepted_terms_at,
        termsVersion: user.terms_version
      },
      community,
      posts: posts || [],
      replies: replies || [],
      reactions: reactions || [],
      pollsCreated: polls || [],
      pollVotes: votes || [],
      messages: {
        sent: sentMessages || [],
        received: receivedMessages || []
      }
    };

    const filename = `stips-export-${user.username}-${new Date().toISOString().slice(0, 10)}.json`;
    res.setHeader('Content-Disposition', `attachment; filename="${filename}"`);
    res.json(exportPayload);
  })
);

export default r;
