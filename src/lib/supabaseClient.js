import { createClient } from "@supabase/supabase-js";

const supabaseUrl = "https://dwnftgsixxyyyjmzkjeq.supabase.co";
const supabaseKey =
  "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6ImR3bmZ0Z3NpeHh5eXlqbXpramVxIiwicm9sZSI6ImFub24iLCJpYXQiOjE3NjA4NzU5ODAsImV4cCI6MjA3NjQ1MTk4MH0.Tuh3D0oFr1KbtNDUtIQlAmKww4L6doO4SJNt648KGZw";
const supabase = createClient(supabaseUrl, supabaseKey);

export default supabase;
