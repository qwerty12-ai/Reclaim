import db from "@/lib/db";

export async function POST(request: Request) {
    try {
        const body = await request.json();
        const {caseId} = body;

        if(!caseId) {
            return Response.json({
                message: "caseId is required",
            }, {status: 400});
        }

        const [rows] = await db.query(`
            SELECT 
                id,
                customer_name,
                amount,
                currency,
                issue_type,
                status,
                risk_score
            FROM cases WHERE id=?
        `, [caseId])

        const cases = rows as Array<{
            id: string;
            customer_name: string;
            amount: string;
            currency: string;
            issue_type: string;
            status: string;
            risk_score: number;
        }>;

        if(cases.length === 0) {
            return Response.json(
                {message: "Case not found"},
                {status: 404}
            )
        }

        const recoveryCase = cases[0]

        return Response.json({
            status: "ready",
            case: recoveryCase,
            message: "Case is ready for recovery analysis."
        });
    } catch (error) {
        console.error("Recovery request failed: ", error);
        return Response.json({
            message: "Recovery request failed."
        }, {status: 500})
    }
}