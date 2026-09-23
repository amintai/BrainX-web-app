import { useEffect, useRef } from 'react';
import { RealtimePostgresChangesPayload } from '@supabase/supabase-js';
import { supabase } from '../utils/supabase';

type Event = 'INSERT' | 'UPDATE' | 'DELETE' | '*';

interface SubscriptionOptions<T extends Record<string, unknown>> {
  channel: string;
  table: string;
  event?: Event;
  filter?: string;
  onData: (payload: RealtimePostgresChangesPayload<T>) => void;
}

export const useRealtimeSubscription = <T extends Record<string, unknown>>({
  channel,
  table,
  event = '*',
  filter,
  onData,
}: SubscriptionOptions<T>) => {
  // Stable ref so channel isn't recreated on every parent re-render
  const onDataRef = useRef(onData);
  onDataRef.current = onData;

  useEffect(() => {
    const sub = supabase
      .channel(channel)
      .on(
        'postgres_changes',
        { event, schema: 'public', table, ...(filter && { filter }) },
        (payload) => onDataRef.current(payload as RealtimePostgresChangesPayload<T>),
      )
      .subscribe();

    return () => {
      supabase.removeChannel(sub);
    };
  }, [channel, table, event, filter]);
};
