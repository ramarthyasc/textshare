import pool from "./api.pool";

export async function healthCheckQuery() {
    const text = "SELECT 1"
    //let it throw
    const { rows } = await pool.query(text);
    return rows;
}

export async function pastesPostQuery(id: string, content: string, expires_at: Date | null, max_views: number | null) {
    const text = `INSERT INTO pastes (id, content, expires_at, remaining_views) VALUES ($1, $2, $3, $4)
                    RETURNING id`;

    const values = [id, content, expires_at, max_views];
    //let it throw
    const { rows } = await pool.query(text, values);
    return rows;
}

interface IPasteGet {
    content: string;
    remaining_views: number | null;
    expires_at: Date | null;
}

export async function checkPasteQuery(id: string, now: Date) {
    const client = await pool.connect();

    try {
        await client.query("BEGIN");

        // LOCK THE ROW

        // Select and Lock the rows
        const selectText = `SELECT content, remaining_views, expires_at FROM pastes WHERE id = $1 FOR UPDATE`;
        const selectValues = [id];
        const result = await client.query(selectText, selectValues);
        const selectedRows: IPasteGet[] = result.rows;

        if (selectedRows[0]) {

            //Update
            const selectedRow = selectedRows[0];
            if (selectedRow.remaining_views !== null) {
                const updateText = `UPDATE pastes
                    SET remaining_views = remaining_views - 1 
                    WHERE id = $1 AND remaining_views IS NOT NULL`;
                const updateValues = [id];
                await client.query(updateText, updateValues);

            }

            //Delete if remaining_views is 0 or expiry is over (when expires_at is null, then it becomes false)
            if ((selectedRow.remaining_views !== null && selectedRow.remaining_views < 2) || (
                selectedRow.expires_at && selectedRow.expires_at < now)
            ) {
                const deleteText = `DELETE FROM pastes
                                WHERE id = $1 AND (remaining_views < 1 OR expires_at < $2)`;
                const deleteValues = [id, now];
                await client.query(deleteText, deleteValues);
            }
        }

        // Commit and return
        await client.query("COMMIT");
        return selectedRows;

    } catch (err) {
        await client.query("ROLLBACK");
        return;
    } finally {
        client.release();
    }
}



