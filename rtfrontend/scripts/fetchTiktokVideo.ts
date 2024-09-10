import TikAPI from 'tikapi';
import AWS from 'aws-sdk';
import fs from 'fs';
import path from 'path';
import pg from 'pg';
import 'dotenv/config';

interface TikTokHashtagInfo {
    id: string;
    title: string;
}

interface TikTokAuthorStats {
    diggCount?: number;
    followerCount?: number;
    followingCount?: number;
    friendCount?: number;
    heartCount?: number;
    videoCount?: number;
}

interface TikTokVideoItem {
    id: string;
    desc: string;
    video: {
        downloadAddr: string;
    };
    author: {
        nickname: string;
        avatarLarger: string;
        avatarMedium: string;
        authorStats?: TikTokAuthorStats;  
    };
    challenges?: Array<{ title: string }>;
    stats: {
        collectCount: number;
        commentCount: number;
        diggCount: number;
        playCount: number;
        shareCount: number;
    };
    createTime: number;
}

const { Pool } = pg;

const s3 = new AWS.S3({
    accessKeyId: process.env.ACCESS_KEY_ID as string,
    secretAccessKey: process.env.SECRET_ACCESS_KEY as string,
    region: process.env.REGION as string,
});

const api = TikAPI(process.env.TIKAPI_KEY as string);
const pool = new Pool({
    connectionString: process.env.DATABASE_URL as string,
});

const excludedKeywords = ['pork', 'bacon', 'ham', 'alcohol', 'wine', 'beer', 'whiskey', 'vodka'];

const hashtags = [ "food", "cooking", "foodtok", "recipesoftiktok", "baking", "healthyfood", "tiktokfood"];

async function uploadToS3(filePath: string, fileName: string): Promise<string> {
    const fileContent = fs.readFileSync(filePath);
    const s3Params: AWS.S3.PutObjectRequest = {
        Bucket: process.env.S3_BUCKET_NAME as string,
        Key: fileName,
        Body: fileContent,
    };
    await s3.upload(s3Params).promise();
    return `https://${process.env.S3_BUCKET_NAME}.s3.amazonaws.com/${fileName}`;
}

async function insertVideoMetadata(item: TikTokVideoItem, s3Url: string) {
    const checkQuery = 'SELECT video_id FROM tiktok_videos WHERE video_id = $1';
    const checkResult = await pool.query(checkQuery, [item.id]);

    if (checkResult.rowCount ?? 0 > 0) {
        console.log(`Video with ID ${item.id} already exists, skipping insert.`);
        return;
    }

    const authorStats = item.author.authorStats || {
        diggCount: 0,
        followerCount: 0,
        followingCount: 0,
        friendCount: 0,
        heartCount: 0,
        videoCount: 0,
    };

    const query = `
        INSERT INTO tiktok_videos (
            video_id, author, description, hashtags, s3_url, avatar_large_url, avatar_medium_url, 
            author_digg_count, author_follower_count, author_following_count, author_friend_count, 
            author_heart_count, author_video_count, collect_count, comment_count, digg_count, 
            play_count, share_count, create_time
        )
        VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9, $10, $11, $12, $13, $14, $15, $16, $17, $18, $19)
    `;
    const values = [
        item.id,
        item.author.nickname,
        item.desc,
        item.challenges?.map(challenge => challenge.title).join(', ') || '',
        s3Url,
        item.author.avatarLarger,
        item.author.avatarMedium,
        authorStats.diggCount,
        authorStats.followerCount,
        authorStats.followingCount,
        authorStats.friendCount,
        authorStats.heartCount,
        authorStats.videoCount,
        item.stats.collectCount,
        item.stats.commentCount,
        item.stats.diggCount,
        item.stats.playCount,
        item.stats.shareCount,
        new Date(item.createTime * 1000).toISOString(),
    ];
    await pool.query(query, values);
    console.log(`Inserted video metadata for video ID: ${item.id}`);
}


async function fetchVideosByHashtag(hashtagName: string) {
    if (!process.env.S3_BUCKET_NAME) {
        throw new Error('S3_BUCKET_NAME is not defined in the environment variables.');
    }

    try {
        const hashtagResponse = await api.public.hashtag({ name: hashtagName });
        const hashtagInfo: TikTokHashtagInfo | undefined = hashtagResponse.json?.challengeInfo?.challenge;

        if (!hashtagInfo) {
            console.error(`No hashtag found for name: ${hashtagName}`);
            return;
        }

        console.log(`Hashtag ID for ${hashtagName}: ${hashtagInfo.id}`);

        let cursor: string | undefined;
        let hasMore = true;

        while (hasMore) {
            const response = await api.public.hashtag({
                id: hashtagInfo.id,
                count: 30,
                cursor: cursor,
            });

            console.log(`Response structure for ${hashtagName}:`, JSON.stringify(response.json, null, 2));

            const items = response.json?.itemList || response.json?.itemStruct || []; 

            if (items.length === 0) {
                console.log(`No items found for this hashtag: ${hashtagName}.`);
                break;
            }

            for (const item of items) {
                const description = item.desc.toLowerCase();
                const containsExcludedKeyword = excludedKeywords.some(keyword => description.includes(keyword));

                if (containsExcludedKeyword) {
                    console.log(`Skipping video ${item.id} due to excluded content.`);
                    continue;
                }

                const downloadAddr = item.video?.playAddr;

                if (!downloadAddr) {
                    console.log(`Skipping video ${item.id} due to missing download address.`);
                    continue;
                }

                console.log(`Downloading video from ${downloadAddr}`);

                const fileName = `${item.id}.mp4`;
                const filePath = path.join('/tmp', fileName);

                if (response.saveVideo) {
                    await response.saveVideo(downloadAddr, filePath);

                    const s3Url = await uploadToS3(filePath, fileName);

                    await insertVideoMetadata(item, s3Url);

                    fs.unlinkSync(filePath);
                    console.log(`Successfully processed and saved video ${item.id}`);
                } else {
                    console.warn("saveVideo method is undefined");
                }
            }

            cursor = response.json?.cursor;
            hasMore = response.json?.hasMore || false;
        }
    } catch (err) {
        if (err instanceof Error) {
            console.error(`Error processing hashtag "${hashtagName}": ${err.message}`);
            if ((err as any)?.json) {
                console.error('Error details:', (err as any).json);
            }
        } else {
            console.error("An unexpected error occurred:", err);
        }
    }
}



(async () => {
    for (const hashtag of hashtags) {
        console.log(`Processing hashtag: ${hashtag}`);
        await fetchVideosByHashtag(hashtag);
    }
})();
