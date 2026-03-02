<!-- Tambah di index.html, sebelum script utama -->
<script type="module">
    import { createClient } from 'https://cdn.jsdelivr.net/npm/@supabase/supabase-js@2/+esm';
    
    window.supabase = createClient(
        'https://rqpodzjexghrvcpyacyo.supabase.co',
        'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6InJxcG9kempleGdocnZjcHlhY3lvIiwicm9sZSI6ImFub24iLCJpYXQiOjE3NzEzNzQyMTMsImV4cCI6MjA4Njk1MDIxM30.elXwh437xIqITUH7ZwiNqOXB2clTWd9_OlS51O-lNxw'
    );
    
    console.log('✅ Supabase initialized (inline)');
</script>
