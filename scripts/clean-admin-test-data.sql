-- Clean fake/admin test data (development only)
-- Run in Supabase SQL Editor

begin;

-- Remove seeded/test records from all admin-facing datasets
truncate table
  grievances,
  social_media_grievances,
  mahila_shakti_grievances,
  complaints,
  volunteers,
  yuva_shakthi_members,
  scheme_eligibility,
  contact_messages,
  profiles
restart identity;

commit;

-- Verify cleanup
select 'complaints' as table_name, count(*) from complaints
union all
select 'grievances', count(*) from grievances
union all
select 'social_media_grievances', count(*) from social_media_grievances
union all
select 'volunteers', count(*) from volunteers
union all
select 'yuva_shakthi_members', count(*) from yuva_shakthi_members
union all
select 'mahila_shakti_grievances', count(*) from mahila_shakti_grievances
union all
select 'scheme_eligibility', count(*) from scheme_eligibility
union all
select 'contact_messages', count(*) from contact_messages
union all
select 'profiles', count(*) from profiles;
