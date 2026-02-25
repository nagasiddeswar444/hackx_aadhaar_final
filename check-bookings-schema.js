const { createClient } = require('@supabase/supabase-js');
require('dotenv').config({ path: '.env.local' });

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL;
const supabaseKey = process.env.SUPABASE_SERVICE_ROLE_KEY || process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY;

const supabase = createClient(supabaseUrl, supabaseKey);

async function checkBookingsTable() {
    const { data, error } = await supabase.from('bookings').select('*').limit(1);
    if (error) {
        console.error('Error fetching bookings:', error.message);
    } else {
        // If table is empty, we still get an array. 
        // To check columns, we examine a row or the error message of selecting a fake column
        const { error: testColError } = await supabase.from('bookings').select('update_type').limit(1);

        if (testColError && testColError.message.includes('Could not find the public.bookings.update_type')) {
            console.log('COLUMN_DOES_NOT_EXIST');
        } else if (!testColError) {
            console.log('COLUMN_EXISTS');
        } else {
            console.log('OTHER_ERROR', testColError.message);
        }
    }
}

checkBookingsTable();
