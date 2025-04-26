"use server"

const accessToken = process.env.INSTA_ACCESS_TOKEN

import { InstaChild } from "~/components/PhotoGrid"

export async function fetchChildrenMedia(children: { mediaId: string; children: Array<{id:string}>; }){
    const childrenInstaItems : InstaChild[] = [];
    const filteredChildren = children.children.filter( (e) => e.id !== "18073671322666337")

    for(let i = 0; i<filteredChildren.length; i++){

    const id = filteredChildren[i].id;
    const mediaUrl = `https://graph.instagram.com/${id}?access_token=${accessToken}&fields=media_url,permalink`

    const res = await fetch(mediaUrl);
    const json = (await res.json());
    const image = json.media_url.includes('jpg');
    
    const instaChild: InstaChild = {
        mediaUrl: json.media_url,
        parentId: children.mediaId,
        isImage: image
    }
    childrenInstaItems.push(instaChild)
    }


    return childrenInstaItems
}