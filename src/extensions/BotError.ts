type BotErrorOptions = {
    message: string;
    reply?: string;
};

export class BotError extends Error {
    private reply?: string;
    constructor(options: BotErrorOptions) {
        const { message, reply } = options;
        super(message);
        this.reply = reply;
    }

    public getReply(): string | undefined {
        return this.reply;
    }
}
