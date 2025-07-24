
import { serve } from 'https://deno.land/std@0.171.0/http/server.ts';
import { createClient } from 'https://esm.sh/@supabase/supabase-js@2';

const supabaseAdmin = createClient(
  Deno.env.get('SUPABASE_URL')!,
  Deno.env.get('SUPABASE_SERVICE_ROLE_KEY')!
);

serve(async (req: Request) => {
  try {
    // Fetch all guards
    const { data: guards, error: guardsError } = await supabaseAdmin
      .from('users')
      .select('id, role')
      .eq('role', 'guard');

    if (guardsError) throw guardsError;

    // Fetch all achievements definitions
    const { data: achievements, error: achievementsError } = await supabaseAdmin
      .from('achievements_master')
      .select('*');

    if (achievementsError) throw achievementsError;

    for (const guard of guards) {
      // Get guard's stats
      const { count: jobsCompleted, error: jobsError } = await supabaseAdmin
        .from('jobs')
        .select('id', { count: 'exact' })
        .eq('guard_id', guard.id)
        .eq('status', 'completed');
      if (jobsError) console.error('Error fetching jobs for guard', guard.id, jobsError);

      const { data: avgRatingData, error: ratingError } = await supabaseAdmin.rpc('get_guard_average_rating', { guard_uuid: guard.id });
      const averageRating = avgRatingData || 0;
      if (ratingError) console.error('Error fetching rating for guard', guard.id, ratingError);

      const { count: incidentsReported, error: incidentsError } = await supabaseAdmin
        .from('incidents')
        .select('id', { count: 'exact' })
        .eq('guard_id', guard.id);
      if (incidentsError) console.error('Error fetching incidents for guard', guard.id, incidentsError);

      for (const achievement of achievements) {
        let awarded = false;
        switch (achievement.criteria_type) {
          case 'jobs_completed':
            if (jobsCompleted >= achievement.criteria_value) {
              awarded = true;
            }
            break;
          case 'average_rating':
            if (averageRating >= achievement.criteria_value) {
              awarded = true;
            }
            break;
          case 'incidents_reported':
            if (incidentsReported >= achievement.criteria_value) {
              awarded = true;
            }
            break;
        }

        if (awarded) {
          // Check if already awarded
          const { data: existingAchievement, error: existingError } = await supabaseAdmin
            .from('guard_achievements')
            .select('id')
            .eq('guard_id', guard.id)
            .eq('achievement_id', achievement.id)
            .single();

          if (existingError && existingError.code === 'PGRST116') { // No rows found
            const { error: insertError } = await supabaseAdmin
              .from('guard_achievements')
              .insert([{ guard_id: guard.id, achievement_id: achievement.id }]);
            if (insertError) console.error('Error awarding achievement:', insertError);
            else console.log(`Awarded ${achievement.name} to guard ${guard.id}`);
          } else if (existingError) {
            console.error('Error checking existing achievement:', existingError);
          }
        }
      }
    }

    return new Response(JSON.stringify({ message: 'Achievements awarded successfully' }), {
      status: 200,
      headers: { 'Content-Type': 'application/json' },
    });
  } catch (err: any) {
    console.error('Function caught error:', err.stack || err);
    return new Response(JSON.stringify({ error: err.message, stack: err.stack }), {
      status: 400,
      headers: { 'Content-Type': 'application/json' },
    });
  }
});
