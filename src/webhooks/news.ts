import {
    RealtimeChannel,
    RealtimePostgresInsertPayload,
    RealtimePostgresUpdatePayload,
} from '@supabase/supabase-js';
import { Client, ShardingManager } from 'discord.js';

import { supabase } from '../utils/database/index.js';
import { DiscordNews } from '../utils/database/news-db-utils.js';

export function startInsertNewsChannel(shardManager: ShardingManager): RealtimeChannel {
    return supabase
        .channel('news_insert_changes')
        .on(
            'postgres_changes',
            {
                event: 'INSERT',
                schema: 'public',
                table: 'discord_news',
            },
            async (data: RealtimePostgresInsertPayload<DiscordNews>) => {
                if (data.new.approved) {
                    const newsId = data.new.id;
                    await shardManager.broadcastEval(broadcastNewsId, { context: { newsId } });
                }
            }
        )
        .subscribe();
}

export function startUpdateNewsChannel(shardManager: ShardingManager): RealtimeChannel {
    return supabase
        .channel('news_update_changes')
        .on(
            'postgres_changes',
            {
                event: 'UPDATE',
                schema: 'public',
                table: 'discord_news',
            },
            async (data: RealtimePostgresUpdatePayload<DiscordNews>) => {
                if (data.new.approved) {
                    const newsId = data.new.id;
                    await shardManager.broadcastEval(broadcastNewsId, { context: { newsId } });
                }
            }
        )
        .subscribe();
}

export async function broadcastNewsId(
    client: Client,
    { newsId }: { newsId: number }
): Promise<void> {
    client.emit('scheduleNews', {
        newsId,
    });
}
