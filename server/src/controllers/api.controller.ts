import type { Request, Response, NextFunction } from "express";
import {
    healthCheckQuery,
    pastesPostQuery,
    checkPasteQuery,
}
    from "../model/api.queries";
import { nanoid } from 'nanoid';


export async function apihealthGet(req: Request, res: Response) {

    try {
        await healthCheckQuery();
        return res.status(200).json({ ok: true });
    } catch (err) {
        console.log("Health check failed", err);
        return res.status(500).json({ ok: false });
    }
}




interface IPastes {
    content: string;
    ttl_seconds?: number;
    max_views?: number;
}

export async function apipastesPost(req: Request, res: Response, next: NextFunction) {
    const pastes: IPastes = req.body;
    console.log(pastes);

    // Error responses
    if (!pastes.content || (typeof pastes.content !== "string") || (pastes.content === "")) {
        return res.status(400).json({ error: "Bad request", message: "content must be a non-empty string" });
    }
    if (
        (pastes.ttl_seconds !== undefined) && (
            !Number.isInteger(pastes.ttl_seconds) ||
            (pastes.ttl_seconds < 1)
        )
    ) {
        return res.status(400).json({ error: "Bad request", message: "ttl_seconds must be >= 1" });
    }
    if (
        (pastes.max_views !== undefined) && (
            !Number.isInteger(pastes.max_views) ||
            (pastes.max_views < 1)
        )
    ) {
        return res.status(400).json({ error: "Bad request", message: "max_views must be >= 1" });
    }


    // store in db

    let expires_at: Date | null;
    if (pastes.ttl_seconds !== undefined) {
        expires_at = new Date(Date.now() + Number(pastes.ttl_seconds * 1000));
    } else {
        expires_at = null;
    }

    let max_views: number | null;
    if (pastes.max_views !== undefined) {
        max_views = pastes.max_views;
    } else {
        max_views = null;
    }

    const id = nanoid(8);

    let rows;
    try {
        rows = await pastesPostQuery(id, pastes.content, expires_at, max_views);
    } catch (err) {
        console.log("Server error");
        next(err);
    }


    // reverse proxy forwarding can cause protocols to change to localhost. So always use request headers to get
    // original request details
    //
    // Good responses
    const protocol = req.headers['x-forwarded-proto'] || req.protocol;
    const host = req.headers['x-forwarded-host'] || req.get('host');

    return res.status(200).json({
        id: rows?.[0].id,
        url: `${protocol}://${host}/p/${rows?.[0].id}`
    })

}


interface IPasteGet {
    content: string;
    remaining_views: number | null;
    expires_at: Date | null;
}

export async function apipasteGet(req: Request, res: Response, next: NextFunction) {
    const id = req.params.id;

    let pasterows: IPasteGet[] | undefined;
    if (typeof id === "string") {
        pasterows = await checkPasteQuery(id);
    }

    if (!pasterows) {
        return next(new Error("Database transaction error"));
    } else if (!pasterows[0]) {
        return res.status(404).json({ error: "Not found", message: "Paste not found" });
    } else {

        // If expired
        if (pasterows[0].expires_at && (pasterows[0].expires_at < new Date())) {
            return res.status(404).json({ error: "Not found", message: "Paste not found" });
        }

        // for decrementing views
        let response: IPasteGet;
        if (pasterows[0].remaining_views === null) {
            response = {
                content: pasterows[0].content,
                remaining_views: pasterows[0].remaining_views,
                expires_at: pasterows[0].expires_at
            }
            return res.status(200).json(response);
        } else {
            response = {
                content: pasterows[0].content,
                remaining_views: pasterows[0].remaining_views - 1,
                expires_at: pasterows[0].expires_at
            }
            return res.status(200).json(response);
        }
    }

}
