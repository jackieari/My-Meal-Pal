
import { NextResponse } from "next/server"
import { connectToDatabase } from "@/lib/mongodb"
import CustomRecipe from "@/models/CustomRecipe"

export async function DELETE(req, { params }) {
    const { id } = params
    try {
        await connectToDatabase()
        const deleted = await CustomRecipe.findByIdAndDelete(id)
        if (!deleted) {
            return NextResponse.json(
                { error: "Recipe not found" },
                { status: 404 }
            )
        }
        return NextResponse.json({ message: "Deleted successfully" })
    } catch (error) {
        console.error("DELETE /api/custom-recipes/[id] error:", error)
        return NextResponse.json(
            { error: "Failed to delete recipe" },
            { status: 500 }
        )
    }
}