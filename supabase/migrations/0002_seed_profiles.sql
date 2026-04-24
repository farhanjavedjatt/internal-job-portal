-- Seed: Germany construction & infrastructure profile. Idempotent via unique name.

insert into public.search_profiles
  (name, keywords, locations, sites, country_indeed, hours_old, results_wanted, include_bundesagentur, enabled)
values
  ('germany_construction',
   array[
     'bauingenieur','tiefbau','hochbau','bauleiter',
     'glasfaser','telekommunikation',
     'energietechnik','elektrotechnik',
     'bahnbau','netzingenieur'
   ],
   array[
     'Berlin, Germany','München, Germany','Hamburg, Germany',
     'Frankfurt, Germany','Köln, Germany','Stuttgart, Germany',
     'Düsseldorf, Germany'
   ],
   -- Indeed + Bundesagentur only; LinkedIn/Glassdoor need rotating proxies and are off by default.
   array['indeed'],
   'germany', 168, 40, true, true)
on conflict (name) do update
  set keywords              = excluded.keywords,
      locations             = excluded.locations,
      sites                 = excluded.sites,
      country_indeed        = excluded.country_indeed,
      hours_old             = excluded.hours_old,
      results_wanted        = excluded.results_wanted,
      include_bundesagentur = excluded.include_bundesagentur,
      enabled               = excluded.enabled;
