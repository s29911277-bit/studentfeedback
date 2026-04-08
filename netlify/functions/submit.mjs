import { getStore } from '@netlify/blobs'

const MAX_SUBMISSIONS_PER_PERSON = 2

function normalizeIdentity(value) {
  return (value || '').trim().toLowerCase()
}

function countMatchingSubmissions(entries, name, email) {
  const normalizedName = normalizeIdentity(name)
  const normalizedEmail = normalizeIdentity(email)
  return entries.filter(
    (entry) =>
      normalizeIdentity(entry.name) === normalizedName &&
      normalizeIdentity(entry.email) === normalizedEmail
  ).length
}

export default async (req) => {
  if (req.method !== 'POST') {
    return new Response(JSON.stringify({ error: 'Method not allowed' }), {
      status: 405,
      headers: { 'Content-Type': 'application/json' },
    })
  }

  const data = await req.json().catch(() => ({}))

  if (!data.name || !data.course || !data.rating) {
    return new Response(
      JSON.stringify({ error: 'name, course and rating are required' }),
      { status: 400, headers: { 'Content-Type': 'application/json' } }
    )
  }

  const store = getStore({ name: 'submissions', consistency: 'strong' })

  let entries = []
  try {
    const existing = await store.get('all', { type: 'json' })
    if (Array.isArray(existing)) {
      entries = existing
    }
  } catch {
    entries = []
  }

  if (
    countMatchingSubmissions(entries, data.name, data.email) >=
    MAX_SUBMISSIONS_PER_PERSON
  ) {
    return new Response(
      JSON.stringify({
        error: 'This name and email can only submit feedback twice.',
      }),
      { status: 400, headers: { 'Content-Type': 'application/json' } }
    )
  }

  const entry = { ...data, receivedAt: new Date().toISOString() }
  entries.push(entry)
  await store.setJSON('all', entries)

  return new Response(JSON.stringify({ ok: true }), {
    status: 200,
    headers: { 'Content-Type': 'application/json' },
  })
}

export const config = {
  path: '/submit',
  method: 'POST',
}
