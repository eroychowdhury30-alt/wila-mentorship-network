import { createClientFromRequest } from 'npm:@base44/sdk@0.8.23';

Deno.serve(async (req) => {
  const base44 = createClientFromRequest(req);
  const user = await base44.auth.me();

  if (!user || !['admin', 'superadmin'].includes(user.role)) {
    return Response.json({ error: 'Forbidden' }, { status: 403 });
  }

  const { userId, role, password } = await req.json();

  const correctPassword = Deno.env.get('PROMOTION_PASSWORD');
  if (!password || password !== correctPassword) {
    return Response.json({ error: 'Incorrect promotion password' }, { status: 401 });
  }

  await base44.asServiceRole.entities.User.update(userId, { role });

  return Response.json({ success: true });
});