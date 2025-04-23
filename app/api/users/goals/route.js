import { NextResponse } from "next/server"
import { cookies }        from "next/headers"
import { connectToDatabase } from "@/lib/mongodb"
import User from "@/models/User"

/* GET  /api/user/goals
   Returns: { calorieLimit, macros:{ protein, carbs, fat } }
   Requires a “session” cookie (same one you already use elsewhere) */
export async function GET() {
  try {
    const raw = cookies().get("session")?.value
    if (!raw) {
      return NextResponse.json({ error: "Not authenticated" }, { status: 401 })
    }

    await connectToDatabase()
    const user = await User.findById(raw.split("_")[0]).lean()

    if (!user) {
      return NextResponse.json({ error: "User not found" }, { status: 404 })
    }

    const { calorieLimit, macros } = user.nutritionalPreferences || {}
    return NextResponse.json({ calorieLimit, macros }, { status: 200 })
  } catch (err) {
    console.error(err)
    return NextResponse.json({ error: "Failed to fetch goals" }, { status: 500 })
  }
}
