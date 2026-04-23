-- Seed Profile A — idempotent via unique name.

insert into public.search_profiles
  (name, keywords, locations, sites, country_indeed, hours_old, results_wanted, include_bundesagentur, enabled)
values
  ('profile_a_us',
   array['software engineer','data engineer'],
   array['New York, NY'],
   array['linkedin','indeed','glassdoor'],
   'usa', 72, 50, false, true),
  ('profile_a_uk',
   array['software engineer','data engineer'],
   array['London, UK'],
   array['linkedin','indeed','glassdoor'],
   'uk', 72, 50, false, true),
  ('profile_a_de',
   array['software engineer','data engineer'],
   array['Berlin, Germany'],
   array['linkedin','indeed','glassdoor'],
   'germany', 72, 50, true, true)
on conflict (name) do nothing;
