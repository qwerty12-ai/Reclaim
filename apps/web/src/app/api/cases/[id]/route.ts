import db from "@/lib/db";
import { Case } from "@/types";

type RouteContext = {
    params: Promise<{
        id: string;
    }>;
}

export async function GET(request: Request, {params}: RouteContext) {
    try {
        const {id} = await params;
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
            FROM cases
            WHERE id = ?
        `,[id]);

        const cases = rows as Case[];

        if(cases.length === 0) {
            return Response.json(
                {message: "Case not found"},
                {status: 404}
            )
        }

        return Response.json({
            case: cases[0]
        })
    } catch (error) {
        return Response.json(
            {message: "Failed to fetch case"},
            {status: 500}
        )
    }
}