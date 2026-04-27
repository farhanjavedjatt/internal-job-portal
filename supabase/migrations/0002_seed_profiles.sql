-- Seed: Germany-wide sweep (all industries). Idempotent via unique name.
-- Empty keyword + 16 Bundesländer = full coverage of Bundesagentur listings.

insert into public.search_profiles
  (name, keywords, locations, sites, country_indeed, hours_old, results_wanted, include_bundesagentur, enabled)
values
  ('germany_all',
   array['']::text[],                    -- empty = no keyword filter
   array[
     'Nordrhein-Westfalen','Bayern','Baden-Württemberg','Niedersachsen',
     'Hessen','Sachsen','Rheinland-Pfalz','Berlin','Schleswig-Holstein',
     'Brandenburg','Sachsen-Anhalt','Thüringen','Hamburg','Mecklenburg-Vorpommern',
     'Saarland','Bremen'
   ],
   array[]::text[],                      -- no JobSpy: Indeed/LinkedIn need a keyword
   'germany', 0, 0, true, true)
on conflict (name) do update
  set keywords              = excluded.keywords,
      locations             = excluded.locations,
      sites                 = excluded.sites,
      country_indeed        = excluded.country_indeed,
      hours_old             = excluded.hours_old,
      results_wanted        = excluded.results_wanted,
      include_bundesagentur = excluded.include_bundesagentur,
      enabled               = excluded.enabled;
