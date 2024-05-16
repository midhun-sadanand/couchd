// supabaseClient.js
import { createClient } from '@supabase/supabase-js';

const supabaseUrl = 'https://rqectbjbsthqwwhpydeq.supabase.co';
const supabaseAnonKey = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6InJxZWN0Ympic3RocXd3aHB5ZGVxIiwicm9sZSI6ImFub24iLCJpYXQiOjE3MTQ0MTk5MjIsImV4cCI6MjAyOTk5NTkyMn0.lM3sBJ-m6x1mi1XHpiKNI_mi6WbdowxhbZjr5WBaSF0';

export const supabase = createClient(supabaseUrl, supabaseAnonKey);
