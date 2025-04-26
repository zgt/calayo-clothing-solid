"use server"
const accessToken = process.env.INSTA_ACCESS_TOKEN

export async function fetchChildrenIds(id:string) {
    const childrenURL = `https://graph.instagram.com/${id}/children?access_token=${accessToken}`

    const res = await fetch(childrenURL);
    const json = (await res.json()).data;


    const children = {
        mediaId: id,
        children: json
    }

    return children

}