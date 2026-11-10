-- 10 nov 2026 — «SEGNALA QUESTA CONVERSAZIONE» (anti-truffa)
-- Il cliente (senza account) e l'impresa (dal pannello) possono segnalare una
-- chat sospetta. La segnalazione finisce nella tabella `segnalazioni`, che
-- l'admin legge gia' (sezione Segnalazioni).
--
-- ⛔ Chi segnala manda SOLO il codice della conversazione e il motivo.
-- Impresa, cliente e ultimi messaggi li legge il database: nessuno puo'
-- scrivere a nome di un altro. Il codice della conversazione e' lungo e lo
-- conosce solo chi sta nella chat (come chat_leggi).
-- Una chat si segnala una volta al giorno per parte; massimo 30 segnalazioni
-- all'ora da tutto il sito, perche' nessuno riempia l'admin.

alter table public.segnalazioni
  add column if not exists tipo text,
  add column if not exists riferimento text,
  add column if not exists da text,
  add column if not exists avvisata_il timestamptz;

create or replace function public.segnala_chat(p_conv text, p_motivo text)
returns json
language plpgsql
security definer
set search_path = public, pg_temp
as $$
declare
  v_imp   bigint;
  v_cnome text;
  v_cmail text;
  v_inome text;
  v_iuser uuid;
  v_imail text;
  v_da    text;
  v_mot   text;
  v_ult   text;
  v_id    bigint;
begin
  if p_conv is null or length(p_conv) < 20 then
    return json_build_object('esito','non_trovata');
  end if;

  select m.impresa_id into v_imp
  from chat_messaggi m where m.conversation_id = p_conv
  order by m.created_at asc limit 1;
  if v_imp is null then
    return json_build_object('esito','non_trovata');
  end if;

  select m.cliente_nome, m.cliente_email into v_cnome, v_cmail
  from chat_messaggi m
  where m.conversation_id = p_conv and m.mittente = 'cliente'
  order by m.created_at asc limit 1;

  select coalesce(i.nome_attivita, i.nome), i.user_id, i.email
    into v_inome, v_iuser, v_imail
  from imprese i where i.id = v_imp;

  v_da := case when auth.uid() is not null and auth.uid() = v_iuser then 'impresa' else 'cliente' end;

  -- una volta al giorno per chat e per parte
  if exists (select 1 from segnalazioni s
             where s.tipo = 'chat' and s.riferimento = p_conv and s.da = v_da
               and s.created_at > now() - interval '24 hours') then
    return json_build_object('esito','gia');
  end if;
  -- freno su tutto il sito
  if (select count(*) from segnalazioni s
      where s.tipo = 'chat' and s.created_at > now() - interval '1 hour') >= 30 then
    return json_build_object('esito','troppe');
  end if;

  v_mot := left(btrim(regexp_replace(coalesce(p_motivo,''), '\s+', ' ', 'g')), 600);
  if v_mot = '' then v_mot := 'nessun motivo scritto'; end if;

  select string_agg('[' || x.mittente || '] ' || left(regexp_replace(x.testo, '\s+', ' ', 'g'), 200), E'\n' order by x.created_at)
    into v_ult
  from (select mittente, testo, created_at from chat_messaggi
        where conversation_id = p_conv order by created_at desc limit 6) x;

  insert into segnalazioni (user_id, descrizione, stato, email, nome_impresa, tipo, riferimento, da)
  values (
    auth.uid(),
    'CHAT SEGNALATA ' || case when v_da = 'impresa' then 'DALL''IMPRESA' else 'DAL CLIENTE' end
      || E'\nMotivo: ' || v_mot
      || E'\nImpresa: ' || coalesce(v_inome,'?') || ' (id ' || v_imp || ')'
      || E'\nCliente: ' || coalesce(v_cnome,'?') || coalesce(' <' || v_cmail || '>','')
      || E'\nUltimi messaggi:\n' || coalesce(v_ult,'—'),
    'aperto',
    case when v_da = 'impresa' then v_imail else v_cmail end,
    v_inome,
    'chat', p_conv, v_da
  ) returning id into v_id;

  return json_build_object('esito','ok','id',v_id);
end $$;

revoke all on function public.segnala_chat(text, text) from public;
grant execute on function public.segnala_chat(text, text) to anon, authenticated;
