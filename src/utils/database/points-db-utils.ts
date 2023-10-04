import { supabase } from './index.js';
import { InputInteraction } from './input-interaction-db-utils.js';
import { PollInteraction } from './poll-interaction-db-utils.js';
import { QuizInteraction } from './quiz-interactions.db-utils.js';

type GiveDailyProfilePointsOptions = {
    userId: string;
    guildId?: string;
    newsId?: number;
};

export class PointsDbUtils {
    public static async givePollPoints(pollInteraction: PollInteraction): Promise<number> {
        const { data, error } = await supabase.rpc('give_poll_points', {
            created_date: pollInteraction.created_at,
            guild_id: pollInteraction.guild_id,
            user_id: pollInteraction.user_id,
            news_id: pollInteraction.news_id,
            poll_id: pollInteraction.poll_id,
            poll_choice_id: pollInteraction.poll_choice_id,
        });

        if (error) {
            throw error;
        }

        return data;
    }

    public static async giveQuizPoints(quizInteraction: QuizInteraction): Promise<number> {
        const { data, error } = await supabase.rpc('give_quiz_points', {
            created_date: quizInteraction.created_at,
            guild_id: quizInteraction.guild_id,
            user_id: quizInteraction.user_id,
            news_id: quizInteraction.news_id,
            quiz_id: quizInteraction.quiz_id,
            quiz_choice_id: quizInteraction.quiz_choice_id,
        });

        if (error) {
            throw error;
        }

        return data;
    }

    public static async giveInputPoints(inputInteraction: InputInteraction): Promise<number> {
        const { data, error } = await supabase.rpc('give_input_points', {
            created_date: inputInteraction.created_at,
            guild_id: inputInteraction.guild_id,
            user_id: inputInteraction.user_id,
            news_id: inputInteraction.news_id,
            input_id: inputInteraction.input_id,
            input: inputInteraction.input,
        });

        if (error) {
            throw error;
        }

        return data;
    }

    public static async giveDailyProfilePoints(
        options: GiveDailyProfilePointsOptions
    ): Promise<number> {
        const { data, error } = await supabase.rpc('give_daily_profile_points', {
            discord_user_id: options.userId,
            guild_id: options.guildId,
            news_id: options.newsId,
        });

        if (error) {
            throw error;
        }

        return data;
    }
}
