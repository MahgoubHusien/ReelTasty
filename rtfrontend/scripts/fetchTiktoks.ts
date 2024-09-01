import TikAPI from 'tikapi';
import AWS from 'aws-sdk';
import fs from 'fs';
import path from 'path';
import pg from 'pg';
import 'dotenv/config';

const { Pool } = pg;

const s3 = new AWS.S3({
    accessKeyId: process.env.AWS_ACCESS_KEY_ID,
    secretAccessKey: process.env.AWS_SECRET_ACCESS_KEY,
    region: process.env.AWS_REGION,
});

const api = TikAPI(process.env.TIKAPI_KEY);
const pool = new Pool({
    connectionString: process.env.DATABASE_URL,
});

const hashtags = [
    'Recipe', 'Cooking', 'FoodRecipe', 'EasyRecipes', 'QuickMeals', 
    'HealthyRecipes', 'DinnerIdeas', 'VeganRecipes', 'MealPrep', 'HomeCooking',
    'Baking', 'VegetarianRecipes', 'SimpleRecipes', 'FamilyRecipes', 
    'Dessert', 'Pasta', 'Breakfast', 'ComfortFood', 
    'Grilling', 'TrendingRecipes', 'ViralRecipes', 'TiktokFood', 
    'FoodHacks', 'TikTokRecipes', 'NewRecipes'
];

const excludedKeywords = ['pork', 'bacon', 'ham', 'alcohol', 'wine', 'beer', 'whiskey', 'vodka'];

(async function fetchTikToks() {
    if (!process.env.S3_BUCKET_NAME) {
        throw new Error('S3_BUCKET_NAME is not defined in the environment variables.');
    }

    for (const hashtag of hashtags) {
        try {
            let response = await api.public.hashtag({ name: hashtag });

            let hashtagId = response.json?.challengeInfo?.challenge?.id;

            if (hashtagId) {
                response = await api.public.hashtag({ id: hashtagId });
                console.log(response?.json);

                while (response) {
                    const cursor = response?.json?.cursor;
                    console.log("Getting next items ", cursor);

                    const items = response?.json?.itemList;
                    if (items) {
                        for (const item of items) {
                            const description = item.desc.toLowerCase();
                            const containsExcludedKeyword = excludedKeywords.some(keyword => description.includes(keyword));

                            // Skip the item if it contains excluded keywords
                            if (containsExcludedKeyword) {
                                console.log(`Skipping video ${item.id} due to excluded content.`);
                                continue;
                            }

                            const videoId = item.id;
                            const downloadAddr = item.video.downloadAddr;
                            const fileName = `${videoId}.mp4`;
                            const filePath = path.join('/tmp', fileName);

                            // Download the video file using saveVideo method if it exists
                            if (response.saveVideo) {
                                await response.saveVideo(downloadAddr, filePath);

                                // Upload to S3
                                const fileContent = fs.readFileSync(filePath);
                                const s3Params: AWS.S3.PutObjectRequest = {
                                    Bucket: process.env.S3_BUCKET_NAME as string,
                                    Key: fileName,
                                    Body: fileContent,
                                };
                                await s3.upload(s3Params).promise();

                                // Save metadata to PostgreSQL
                                const query = `
                                    INSERT INTO tiktok_videos (video_id, author, description, hashtags, s3_url, avatar_large_url, avatar_medium_url, author_digg_count, author_follower_count, author_following_count, author_friend_count, author_heart_count, author_video_count, collect_count, comment_count, digg_count, play_count, share_count, create_time)
                                    VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9, $10, $11, $12, $13, $14, $15, $16, $17, $18, $19)
                                `;
                                const values = [
                                    videoId,
                                    item.author.nickname,
                                    item.desc,
                                    hashtag,
                                    `https://${process.env.S3_BUCKET_NAME}.s3.amazonaws.com/${fileName}`,
                                    item.author.avatarLarger,
                                    item.author.avatarMedium,
                                    item.authorStats.diggCount,
                                    item.authorStats.followerCount,
                                    item.authorStats.followingCount,
                                    item.authorStats.friendCount,
                                    item.authorStats.heartCount,
                                    item.authorStats.videoCount,
                                    item.stats.collectCount,
                                    item.stats.commentCount,
                                    item.stats.diggCount,
                                    item.stats.playCount,
                                    item.stats.shareCount,
                                    new Date(item.createTime * 1000).toISOString()
                                ];
                                await pool.query(query, values);

                                // Clean up local file
                                fs.unlinkSync(filePath);
                            } else {
                                console.warn("saveVideo method is undefined");
                            }
                        }
                    }

                    if (response.nextItems) {
                        response = await Promise.resolve(response.nextItems());
                    } else {
                        console.warn("nextItems method is undefined");
                        break;
                    }
                }
            } else {
                console.warn(`Could not retrieve hashtag ID for ${hashtag}`);
            }
        } catch (err) {
            console.error(`Error processing hashtag ${hashtag}:`, err);
        }
    }
})();
