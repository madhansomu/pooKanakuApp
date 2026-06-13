import { NextResponse } from "next/server"
import { supabaseServer } from "@/src/lib/supabaseServer"

export async function GET() {
  const sb = supabaseServer()
  const { data, error } = await sb.from('shop_leaves').select('*').order('leave_date', { ascending: true })
  if (error) return NextResponse.json({ error: error.message }, { status: 500 })
  return NextResponse.json(data)
}

export async function POST(req: Request) {
  try {
    const body = await req.json()
    const { leave_date, leave_type, reason, custom_description, notes } = body
    if (!leave_date || !leave_type) {
      return NextResponse.json({ error: "leave_date and leave_type required" }, { status: 400 })
    }
    const supabase = supabaseServer()
    const { data, error } = await supabase.from("shop_leaves").insert([
      { leave_date, leave_type, reason, custom_description, notes },
    ])
    if (error) return NextResponse.json({ error: error.message }, { status: 500 })
    return NextResponse.json({ data })
  } catch (e) {
    const message = e instanceof Error ? e.message : String(e)
    return NextResponse.json({ error: message }, { status: 500 })
  }
}

export async function PUT(req: Request) {
  try {
    const body = await req.json()
    const { id, leave_date, leave_type, reason, custom_description, notes } = body
    if (!id) return NextResponse.json({ error: "id required" }, { status: 400 })
    const supabase = supabaseServer()
    const { data, error } = await supabase
      .from("shop_leaves")
      .update({ leave_date, leave_type, reason, custom_description, notes })
      .eq("id", id)
      .select()
      .single()
    if (error) return NextResponse.json({ error: error.message }, { status: 500 })
    return NextResponse.json(data)
  } catch (e) {
    const message = e instanceof Error ? e.message : String(e)
    return NextResponse.json({ error: message }, { status: 500 })
  }
}

export async function DELETE(req: Request) {
  try {
    const { searchParams } = new URL(req.url)
    const id = searchParams.get('id')
    if (!id) return NextResponse.json({ error: "id required" }, { status: 400 })
    const supabase = supabaseServer()
    const { error } = await supabase.from("shop_leaves").delete().eq("id", id)
    if (error) return NextResponse.json({ error: error.message }, { status: 500 })
    return NextResponse.json({ success: true })
  } catch (e) {
    const message = e instanceof Error ? e.message : String(e)
    return NextResponse.json({ error: message }, { status: 500 })
  }
}
