import { Guild } from 'discord.js';
import Jimp from 'jimp';
import { promises as fs } from 'node:fs';

import { GuildDbUtils } from './database/guild-db-utils.js';
import { supabase } from './database/index.js';
import { Logger } from '../services/index.js';

type SaveBannerOptions = {
    guild: Guild;
    filePath: string;
};

export class BannerUtils {
    public static async createBanner(guild: Guild): Promise<string> {
        try {
            let bannerUrl = await this.getBanner(guild.id);
            if (bannerUrl) {
                await GuildDbUtils.updateBanner(guild, bannerUrl);
                return bannerUrl;
            }
            const bannerPath = await this.buildBanner(guild);
            if (!bannerUrl) bannerUrl = await this.saveBanner({ guild, filePath: bannerPath });
            await GuildDbUtils.updateBanner(guild, bannerUrl);
            await fs.unlink(bannerPath);
            return bannerUrl;
        } catch (err) {
            await Logger.error({
                message: `Could not create banner for guild ${guild.name}:\n${err}`,
                guildId: guild.id,
            });
            return 'https://ukpyihvuutfrafurfkmj.supabase.co/storage/v1/object/public/banners/DiscordNoPFP.jpg';
        }
    }

    private static async getBanner(guildId: string): Promise<string | null> {
        const {
            data: { publicUrl },
        } = supabase.storage.from(`banners`).getPublicUrl(`${guildId}.png`);

        return publicUrl;
    }

    private static async buildBanner(guild: Guild): Promise<string> {
        try {
            const backgroundImage = await Jimp.read('./public/background.jpg');
            const font = await Jimp.loadFont('./public/PoppinsBold.fnt');
            // regex for removing emojis from guild name
            const nameNoEmojis = this.stripEmojis(guild.name);
            const name =
                nameNoEmojis.length > 20 ? `${nameNoEmojis.slice(0, 20)}...` : nameNoEmojis;
            const x = backgroundImage.getWidth() / 2 - Jimp.measureText(font, name) / 2;
            let finalImage = backgroundImage.print(font, x, 565, name);
            const guildIconUrl = guild.iconURL({ size: 1024, extension: 'png' });
            if (guildIconUrl) {
                const iconImage = await Jimp.read(guildIconUrl);
                const newIconImage = iconImage.resize(344, 344).circle().background(0x00000000);
                const iconX = finalImage.getWidth() / 2 - newIconImage.getWidth() / 2;
                finalImage = finalImage.composite(newIconImage, iconX, 91);
            }
            const fileName = `./${guild.id}.png`;
            await finalImage.writeAsync(fileName);
            return fileName;
        } catch (err) {
            throw new Error(`Error building a guild banner(jimp):\n${err}`);
        }
    }

    private static stripEmojis(name: string): string {
        return name.replace(
            /([\u2700-\u27BF]|[\uE000-\uF8FF]|\uD83C[\uDC00-\uDFFF]|\uD83D[\uDC00-\uDFFF]|[\u2011-\u26FF]|\uD83E[\uDD10-\uDDFF])/g,
            ''
        );
    }

    private static async saveBanner(options: SaveBannerOptions): Promise<string> {
        const file = await fs.readFile(options.filePath);
        const { filePath } = options;
        const { error: uploadError } = await supabase.storage
            .from(`banners`)
            .upload(filePath, file);
        if (uploadError) throw new Error(uploadError.message);
        const {
            data: { publicUrl },
        } = supabase.storage.from(`banners`).getPublicUrl(filePath);

        return publicUrl;
    }
}
