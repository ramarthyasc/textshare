import type { Request, Response, NextFunction } from "express";
import {
    healthCheckQuery,
    pastesPostQuery,
    checkPasteQuery,
}
    from "../model/api.queries";
import { nanoid } from 'nanoid';
import DOMPurify from "isomorphic-dompurify";


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
    let now: Date;
    if (Number(process.env.TEST_MODE) === 1) {
        const headerMs = req.get('x-test-now-ms');
        if (headerMs) {
            now = new Date(Number(headerMs));
        } else {
            now = new Date();
        }
    } else {
        now = new Date();
    }

    let pasterows: IPasteGet[] | undefined;
    if (typeof id === "string") {
        pasterows = await checkPasteQuery(id, now);
    }

    if (!pasterows) {
        return next(new Error("Database transaction error"));
    } else if (!pasterows[0]) {
        return res.status(404).json({ error: "Not found", message: "Paste not found" });
    } else {

        // If expired
        if (pasterows[0].expires_at && (pasterows[0].expires_at < now)) {
            return res.status(404).json({ error: "Not found", message: "Paste expired" });
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



export async function apipasteHtmlGet(req: Request, res: Response, next: NextFunction) {

    const id = req.params.id;

    let now: Date;
    if (Number(process.env.TEST_MODE) === 1) {
        const headerMs = req.get('x-test-now-ms');
        if (headerMs) {
            now = new Date(Number(headerMs));
        } else {
            now = new Date();
        }
    } else {
        now = new Date();
    }


    let pasterows: IPasteGet[] | undefined;
    if (typeof id === "string") {
        pasterows = await checkPasteQuery(id, now);
    }

    if (!pasterows) {
        return next(new Error("Database transaction error"));
    } else if (!pasterows[0]) {
        const html = `
<!doctype html>
<html lang="en">
<head>
  <meta charset="utf-8" />
  <title>Paste not found</title>
  <meta name="robots" content="noindex" />
  <style>
    body { font-family: system-ui; padding: 3rem; }
  </style>
</head>
<body>
  <h1>404 – Paste not found</h1>
</body>
</html>
        `
        return res.status(404)
            .set("Content-Type", "text/html; charset=utf-8")
            .send(html);
    } else {

        // If expired
        if (pasterows[0].expires_at && (pasterows[0].expires_at < now)) {
            const htmlExpiry = `
<!doctype html>
<html lang="en">
<head>
  <meta charset="utf-8" />
  <title>Paste not found</title>
  <meta name="robots" content="noindex" />
  <style>
    body { font-family: system-ui; padding: 3rem; }
  </style>
</head>
<body>
  <h1>404 – Paste not found</h1>
  <div>Paste is expired</div>
</body>
</html>
        `
            return res.status(404)
                .set("Content-Type", "text/html; charset=utf-8")
                .send(htmlExpiry);
        }

        // for decrementing views
        const safeContent = DOMPurify.sanitize(pasterows[0].content);

        const html = `<!DOCTYPE html>
<html>
  <head>
    <meta charset="utf-8" />
    <title>Paste</title>
  </head>
  <body style="
    margin: 0;
    padding: 0;
    background-color: #0d0d0d;
    color: #eaeaea;
    font-family: ui-monospace, SFMono-Regular, Menlo, Monaco, Consolas, 'Liberation Mono', monospace;
    display: flex;
    align-items: center;
    justify-content: center;
    min-height: 100vh;
  ">
    <div style="
      width: 90%;
      max-width: 900px;
    ">
      <textarea
        readonly
        spellcheck="false"
        style="
          width: 100%;
          height: 70vh;
          background-color: #111;
          color: #f5f5f5;
          border: 1px solid #2a2a2a;
          border-radius: 8px;
          padding: 16px;
          font-size: 14px;
          line-height: 1.6;
          resize: none;
          outline: none;
          box-shadow: 0 0 0 1px rgba(255,255,255,0.02),
                      0 10px 30px rgba(0,0,0,0.6);
        "
      >${safeContent}</textarea>
    </div>
  </body>
</html>`;

        return res.status(200)
            .set("Content-Type", "text/html; charset=utf-8")
            .send(html);
    }
}
