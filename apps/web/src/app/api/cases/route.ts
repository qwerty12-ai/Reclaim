import db from "@/lib/db"

export async function GET() {
    try {
        const [rows] = await db.query(`
            SELECT
                id,
                customer_name,
                customer_email,
                amount,
                currency,
                issue_type,
                status,
                risk_score,
                created_at,
                updated_at
            FROM cases ORDER BY created_at DESC    
        `);
        return Response.json({
            cases: rows
        });
    } catch (error) {
        console.error("Failed to fetch cases: ", error)
        return Response.json({
            message: "Falied to fetch cases",
        }, {status: 500})
    }
}