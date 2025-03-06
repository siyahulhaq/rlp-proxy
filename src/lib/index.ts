import { MetaResult } from '../types';
import axios, { AxiosRequestConfig } from 'axios';
import { getLinkPreview } from "link-preview-js";

const TWITTER_API_URL = 'https://api.twitter.com/2';

const twApi = axios.create({
  headers: {
    Authorization: `Bearer ${process.env.TW_BEARER_TOKEN}`,
  },
  baseURL: TWITTER_API_URL,
});

const config: AxiosRequestConfig = {
  headers: {
    'Accept-Encoding': 'gzip,deflate,br',
  },
};

export const getMetadata = async (url: string): Promise<MetaResult | null> => {
  try {
    const data: any = await getLinkPreview(url, {
      followRedirects: "follow",
    });
    const result: MetaResult = {
      images: data.images,
      meta: {
        title: data.title,
        description: data.description
      },
      og: {
        title: data.title,
        description: data.description,
        image: data.images[0],
        images: data.images.map((image: string) => ({src: image})),
        site_name: data.siteName,
        type: data.mediaType,
        url: data.url,
        videos: data.videos.map((video: string) => ({src: video})),
      },
    };
    return result;
  } catch (err) {
    console.log(err);
    return null;
  }
};

const getAuthor = async (id: string) => {
  try {
    const result = await twApi.get(`/users/${id}`, {
      params: {
        'user.fields': 'name',
      },
    });
    return result.data.data.name;
  } catch (err) {
    console.log(err);
    return null;
  }
};

interface TweetMetadata {
  text: string;
  author: string;
}

export const getTweetDetails = async (
  url: string
): Promise<TweetMetadata | null> => {
  try {
    const ungrouped = url.split('/');
    let tweetId = ungrouped[ungrouped.length - 1];
    tweetId = tweetId.split('?')[0];
    const result = await twApi.get(`/tweets/${tweetId}`, {
      params: {
        'tweet.fields': 'attachments,text,author_id',
        'media.fields': 'preview_image_url,url',
      },
    });
    const { author_id, text } = result.data.data;

    const author = await getAuthor(author_id);

    const output = {
      author,
      text,
    };

    return output;
  } catch (err) {
    console.log(err);
    return null;
  }
};
