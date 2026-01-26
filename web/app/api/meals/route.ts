import { NextRequest, NextResponse } from 'next/server'
import { createClient } from '@/lib/supabase/server'

interface MealItemInput {
  name: string
  brand?: string
  barcode?: string
  serving_size: string
  servings: number
  calories: number
  protein: number
  carbs: number
  fat: number
  fiber?: number
  sugar?: number
  sodium?: number
  source: 'barcode' | 'ai_recognition' | 'manual' | 'search'
  confidence?: number
}

interface CreateMealInput {
  name: string
  meal_type: 'breakfast' | 'lunch' | 'dinner' | 'snack' | 'other'
  logged_at?: string
  notes?: string
  image_url?: string
  items: MealItemInput[]
}

// GET /api/meals - Get user's meals
export async function GET(request: NextRequest) {
  try {
    const supabase = await createClient()
    const { data: { user }, error: authError } = await supabase.auth.getUser()

    if (authError || !user) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }

    const searchParams = request.nextUrl.searchParams
    const date = searchParams.get('date') // Optional: filter by date (YYYY-MM-DD)
    const limit = parseInt(searchParams.get('limit') || '20')

    let query = supabase
      .from('meals')
      .select(`
        *,
        meal_items (*)
      `)
      .eq('user_id', user.id)
      .order('logged_at', { ascending: false })
      .limit(limit)

    if (date) {
      query = query
        .gte('logged_at', `${date}T00:00:00`)
        .lt('logged_at', `${date}T23:59:59`)
    }

    const { data: meals, error } = await query

    if (error) {
      console.error('Error fetching meals:', error)
      return NextResponse.json({ error: 'Failed to fetch meals' }, { status: 500 })
    }

    return NextResponse.json({ meals })
  } catch (error) {
    console.error('Meals GET error:', error)
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 })
  }
}

// POST /api/meals - Create a new meal with items
export async function POST(request: NextRequest) {
  try {
    const supabase = await createClient()
    const { data: { user }, error: authError } = await supabase.auth.getUser()

    if (authError || !user) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }

    const body: CreateMealInput = await request.json()

    if (!body.name || !body.meal_type || !body.items || body.items.length === 0) {
      return NextResponse.json(
        { error: 'Missing required fields: name, meal_type, and at least one item' },
        { status: 400 }
      )
    }

    // Create the meal
    const { data: meal, error: mealError } = await supabase
      .from('meals')
      .insert({
        user_id: user.id,
        name: body.name,
        meal_type: body.meal_type,
        logged_at: body.logged_at || new Date().toISOString(),
        notes: body.notes,
        image_url: body.image_url,
      })
      .select()
      .single()

    if (mealError) {
      console.error('Error creating meal:', mealError)
      return NextResponse.json({ error: 'Failed to create meal' }, { status: 500 })
    }

    // Create meal items
    const mealItems = body.items.map((item) => ({
      meal_id: meal.id,
      user_id: user.id,
      name: item.name,
      brand: item.brand,
      barcode: item.barcode,
      serving_size: item.serving_size,
      servings: item.servings,
      calories: item.calories,
      protein: item.protein,
      carbs: item.carbs,
      fat: item.fat,
      fiber: item.fiber,
      sugar: item.sugar,
      sodium: item.sodium,
      source: item.source,
      confidence: item.confidence,
    }))

    const { error: itemsError } = await supabase
      .from('meal_items')
      .insert(mealItems)

    if (itemsError) {
      console.error('Error creating meal items:', itemsError)
      // Rollback meal creation
      await supabase.from('meals').delete().eq('id', meal.id)
      return NextResponse.json({ error: 'Failed to create meal items' }, { status: 500 })
    }

    // Fetch the complete meal with items
    const { data: completeMeal } = await supabase
      .from('meals')
      .select(`
        *,
        meal_items (*)
      `)
      .eq('id', meal.id)
      .single()

    return NextResponse.json({ meal: completeMeal }, { status: 201 })
  } catch (error) {
    console.error('Meals POST error:', error)
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 })
  }
}

// DELETE /api/meals?id=xxx - Delete a meal
export async function DELETE(request: NextRequest) {
  try {
    const supabase = await createClient()
    const { data: { user }, error: authError } = await supabase.auth.getUser()

    if (authError || !user) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }

    const mealId = request.nextUrl.searchParams.get('id')
    if (!mealId) {
      return NextResponse.json({ error: 'Meal ID required' }, { status: 400 })
    }

    // Delete meal (items will cascade delete)
    const { error } = await supabase
      .from('meals')
      .delete()
      .eq('id', mealId)
      .eq('user_id', user.id)

    if (error) {
      console.error('Error deleting meal:', error)
      return NextResponse.json({ error: 'Failed to delete meal' }, { status: 500 })
    }

    return NextResponse.json({ success: true })
  } catch (error) {
    console.error('Meals DELETE error:', error)
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 })
  }
}
