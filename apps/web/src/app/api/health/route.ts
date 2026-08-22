import db from "@/lib/db";

export async function GET() {
    try {
        const [rows] = await db.query("SELECT 1 as connected");
        return Response.json({
            status: "ok",
            database: rows,
        })
    } catch(error) {
        console.error("Database connection failed: ", error);
        return Response.json({
            status: "error",
            message: "Database connection failed"
        }, {status: 500})
    }
}