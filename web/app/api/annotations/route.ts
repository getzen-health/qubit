import { createSecureApiHandler, secureJsonResponse, secureErrorResponse } from '@/lib/security'
import { encryptHealthAnnotation, decryptHealthAnnotations } from '@/lib/encryption'

function getEncryptionKey(): string {
  return process.env.SUPABASE_ENCRYPTION_KEY || ''
}

export const GET = createSecureApiHandler(
  {
    rateLimit: 'healthData',
    requireAuth: true,
    auditAction: 'READ',
    auditResource: 'annotation',
  },
  async (request, { user, supabase }) => {
    const { searchParams } = new URL(request.url)
    const startDate = searchParams.get('start_date')
    const endDate = searchParams.get('end_date')
    const entryType = searchParams.get('entry_type')

    let query = supabase
      .from('health_annotations')
      .select('*')
      .eq('user_id', user!.id)
      .order('entry_date', { ascending: false })

    if (startDate) {
      query = query.gte('entry_date', startDate)
    }

    if (endDate) {
      query = query.lte('entry_date', endDate)
    }

    if (entryType) {
      query = query.eq('entry_type', entryType)
    }

    const { data, error } = await query

    if (error) {
      return secureErrorResponse('Failed to fetch annotations', 400)
    }

    // Decrypt encrypted notes if encryption key is available
    const encryptionKey = getEncryptionKey()
    if (encryptionKey && data) {
      return secureJsonResponse(await decryptHealthAnnotations(supabase, data, encryptionKey))
    }

    return secureJsonResponse(data)
  }
)

export const POST = createSecureApiHandler(
  {
    rateLimit: 'healthData',
    requireAuth: true,
    auditAction: 'CREATE',
    auditResource: 'annotation',
  },
  async (request, { user, supabase }) => {
    const body = await request.json()
    const { entry_type, entry_date, note, category } = body

    if (!entry_type || !entry_date || !note) {
      return secureErrorResponse('Missing required fields: entry_type, entry_date, note', 400)
    }

    let annotationData: any = {
      user_id: user!.id,
      entry_type,
      entry_date,
      note,
      category: category || null,
    }

    // Encrypt note if encryption key is available
    const encryptionKey = getEncryptionKey()
    if (encryptionKey && note) {
      annotationData = await encryptHealthAnnotation(supabase, annotationData, encryptionKey)
    }

    const { data, error } = await supabase
      .from('health_annotations')
      .upsert(
        annotationData,
        { onConflict: 'user_id,entry_type,entry_date' }
      )
      .select()

    if (error) {
      return secureErrorResponse('Failed to save annotation', 400)
    }

    return secureJsonResponse(data[0], 201)
  }
)

export const PATCH = createSecureApiHandler(
  {
    rateLimit: 'healthData',
    requireAuth: true,
    auditAction: 'UPDATE',
    auditResource: 'annotation',
  },
  async (request, { user, supabase }) => {
    const body = await request.json()
    const { id, note, category } = body

    if (!id) {
      return secureErrorResponse('Missing annotation id', 400)
    }

    let updateData: any = {}

    if (category !== undefined) {
      updateData.category = category
    }

    // Encrypt note if provided and encryption key is available
    if (note !== undefined) {
      const encryptionKey = getEncryptionKey()
      if (encryptionKey) {
        const encrypted = await encryptHealthAnnotation(
          supabase,
          { date: '', category: '', note, user_id: user!.id },
          encryptionKey
        )
        updateData.encrypted_note = encrypted.encrypted_note
        updateData.is_encrypted = encrypted.is_encrypted
        updateData.note = encrypted.note
      } else {
        updateData.note = note
      }
    }

    const { data, error } = await supabase
      .from('health_annotations')
      .update(updateData)
      .eq('id', id)
      .eq('user_id', user!.id)
      .select()

    if (error) {
      return secureErrorResponse('Failed to update annotation', 400)
    }

    if (!data || data.length === 0) {
      return secureErrorResponse('Annotation not found', 404)
    }

    // Decrypt if encrypted
    const encryptionKey = getEncryptionKey()
    if (encryptionKey && data[0]?.is_encrypted) {
      const [decrypted] = await decryptHealthAnnotations(supabase, [data[0]], encryptionKey)
      return secureJsonResponse(decrypted)
    }

    return secureJsonResponse(data[0])
  }
)

export const DELETE = createSecureApiHandler(
  {
    rateLimit: 'healthData',
    requireAuth: true,
    auditAction: 'DELETE',
    auditResource: 'annotation',
  },
  async (request, { user, supabase }) => {
    const { searchParams } = new URL(request.url)
    const id = searchParams.get('id')

    if (!id) {
      return secureErrorResponse('Missing annotation id', 400)
    }

    const { error } = await supabase
      .from('health_annotations')
      .delete()
      .eq('id', id)
      .eq('user_id', user!.id)

    if (error) {
      return secureErrorResponse('Failed to delete annotation', 400)
    }

    return secureJsonResponse({ success: true })
  }
)
