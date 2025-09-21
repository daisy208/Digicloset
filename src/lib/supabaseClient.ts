import { createClient } from "@supabase/supabase-js";

const supabaseUrl = "https://YOUR_PROJECT_URL.supabase.co";
const supabaseAnonKey = "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6ImJsa3ZucGVqcXFpYnFpZnR4bmlvIiwicm9sZSI6ImFub24iLCJpYXQiOjE3NTg0MzQ5NDAsImV4cCI6MjA3NDAxMDk0MH0.9gKnb9nwNuHbRsb0KNzoE4HhB7SpVUCla5rqIjjbWgo";

export const supabase = createClient(supabaseUrl, supabaseAnonKey);
