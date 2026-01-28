import { Pool } from "pg";
// import { createClient } from '@supabase/supabase-js'
// const supabaseUrl = process.env.SUPABASE_URL!;
// const serviceKey = process.env.SERVICE_KEY!;
//
// const supabase = createClient(supabaseUrl, serviceKey);
//
// export default supabase;

const pool = new Pool({
    connectionString: process.env.DATABASE_URL!,
    ssl: { rejectUnauthorized: false }
})

export default pool;
