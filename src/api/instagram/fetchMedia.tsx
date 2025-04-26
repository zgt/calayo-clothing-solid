"use server"

import { InstaItem } from '~/components/PhotoGrid'

const accessToken = process.env.INSTA_ACCESS_TOKEN

export async function fetchMedia(id:string){
    const mediaUrl = `https://graph.instagram.com/${id}?access_token=${accessToken}&fields=media_url,permalink`

    const res = await fetch(mediaUrl);
    const json = (await res.json());

    const instaItem: InstaItem = {
        permalink: json.permalink,
        mediaUrl: json.media_url,
        parentId: json.id,
        children: []
    }
    return instaItem
}