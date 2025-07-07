import { neon } from "@neondatabase/serverless";
import { headers } from "next/headers";

// 데이터베이스 연결 설정
const sql = neon(process.env.DATABASE_URL!);

export default async function handler(req: any, res: any) {
    if (req.query.token !== process.env.API_SECRET) {
        return res.status(401).json({ error: "Unauthorized" });
    }

    try {
        await sql.begin(async (sql) => {
            await sql`UPDATE users SET meetup_count = 0`;
        });
        res.status(200).json({ message: "Users table meetup_count reset successfully" });
    } catch (error) {
        console.error("Error resetting Users table meetup_count:", error);
        res.status(500).json({ error: "Failed to reset Users table meetup_count" });
    }
}