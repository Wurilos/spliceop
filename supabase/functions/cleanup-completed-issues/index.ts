import { createClient } from 'https://esm.sh/@supabase/supabase-js@2'

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
}

Deno.serve(async (req) => {
  if (req.method === 'OPTIONS') {
    return new Response(null, { headers: corsHeaders })
  }

  try {
    const supabaseUrl = Deno.env.get('SUPABASE_URL')!
    const supabaseServiceKey = Deno.env.get('SUPABASE_SERVICE_ROLE_KEY')!
    
    const supabase = createClient(supabaseUrl, supabaseServiceKey)

    // Find issues that have been in "Concluído" for more than 24 hours
    const twentyFourHoursAgo = new Date(Date.now() - 24 * 60 * 60 * 1000).toISOString()

    // Delete completed issues older than 24 hours
    const { data: deletedIssues, error: deleteError } = await supabase
      .from('pending_issues')
      .delete()
      .not('completed_at', 'is', null)
      .lt('completed_at', twentyFourHoursAgo)
      .select('id, title')

    if (deleteError) {
      throw deleteError
    }

    console.log(`Deleted ${deletedIssues?.length || 0} completed issues older than 24 hours`)

    return new Response(
      JSON.stringify({ 
        success: true, 
        deletedCount: deletedIssues?.length || 0,
        deletedIssues: deletedIssues?.map(i => ({ id: i.id, title: i.title }))
      }),
      { 
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
        status: 200 
      }
    )
  } catch (error) {
    const errorMessage = error instanceof Error ? error.message : 'Unknown error'
    console.error('Error cleaning up completed issues:', errorMessage)
    return new Response(
      JSON.stringify({ success: false, error: errorMessage }),
      { 
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
        status: 500 
      }
    )
  }
})
