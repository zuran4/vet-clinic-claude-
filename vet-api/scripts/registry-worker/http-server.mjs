// vet-api/scripts/registry-worker/http-server.mjs

/**
 * Μικρός HTTP server που “τυλίγει” το Playwright page.
 */
export function startHttpServer({
  http,
  getSharedPage,
  computeSessionStatus,
  logSessionOncePerChange,
  logStatusOncePerChange,
  PET_BOOKLET_BASE_URL,
  autoLoginIfNeeded,
  runMicrochipLookupFlow,
  runMedicalEventsFlow,
  BOOKLET_WIDGET_IDS,
  extractBookletData,
}) {
  const IS_RENDER = !!process.env.RENDER;
  const PORT = IS_RENDER
    ? Number(process.env.PORT) || 5051
    : Number(process.env.REGISTRY_WORKER_PORT) || 5051;

  const DEBUG = process.env.REGISTRY_WORKER_DEBUG === "1";

  console.log("[Registry worker] HTTP server configuration:", {
    IS_RENDER,
    PORT,
    env_PORT: process.env.PORT,
    REGISTRY_WORKER_PORT: process.env.REGISTRY_WORKER_PORT,
    DEBUG,
  });

  // Concurrency guard: ένα lookup τη φορά (sharedPage είναι single-session)
  let lookupInFlight = false;

  const server = http.createServer(async (req, res) => {
    const requestId = Math.random().toString(16).slice(2);

    const sendJson = (code, payload) => {
      res.statusCode = code;
      res.setHeader("Content-Type", "application/json; charset=utf-8");
      res.end(JSON.stringify({ requestId, ...payload }));
    };

    const sendError = (code, message, extra = {}) =>
      sendJson(code, { ok: false, error: message, ...extra });

    // Parse URL μία φορά
    let urlObj;
    try {
      urlObj = new URL(req.url, "http://localhost");
    } catch {
      return sendError(400, "Bad URL");
    }
    const path = urlObj.pathname;

    // GET /status
    if (req.method === "GET" && path === "/status") {
      const sharedPage = getSharedPage();
      const hasPage = !!sharedPage;

      let url = null;
      if (hasPage) {
        try {
          url = sharedPage.url();
        } catch {
          url = null;
        }
      }

      logStatusOncePerChange({ hasPage, url });

      // “ok” εδώ σημαίνει: υπάρχει page και μπορούμε να πάρουμε url.
      return sendJson(200, {
        ok: hasPage && !!url,
        hasPage,
        url,
      });
    }

    // GET /session
    if (req.method === "GET" && path === "/session") {
      const sharedPage = getSharedPage();
      if (!sharedPage) {
        // Worker up αλλά δεν έχει ακόμη page
        return sendJson(503, {
          ok: false,
          status: "NO_PAGE",
          url: null,
        });
      }

      let s;
      try {
        s = await computeSessionStatus(sharedPage);
      } catch (e) {
        return sendJson(500, {
          ok: false,
          status: "STATUS_ERROR",
          url: null,
          details: DEBUG ? e?.message : undefined,
        });
      }

      logSessionOncePerChange({ status: s.status, url: s.url });

      return sendJson(200, {
        ok: s.ok,
        status: s.status,
        url: s.url,
      });
    }

    // GET /lookup?microchip=...
if (req.method === "GET" && path === "/lookup") {
  const sharedPage = getSharedPage();

  if (!sharedPage) {
    return sendError(503, "Worker not ready (no active page)");
  }

  if (lookupInFlight) {
    return sendError(429, "Worker busy (lookup already in progress)");
  }

  const microchip = (urlObj.searchParams.get("microchip") || "").trim();

  if (!microchip) {
    return sendError(400, "Missing query param ?microchip=...");
  }

  // Basic validation: digits only, typical length 15
  if (!/^\d+$/.test(microchip)) {
    return sendError(400, "Invalid microchip: must be digits only");
  }
  if (microchip.length !== 15) {
    return sendError(400, "Invalid microchip: must be 15 digits");
  }

  lookupInFlight = true;
  try {
    // 0) Βεβαιώσου ότι η session είναι ok
    let s = await computeSessionStatus(sharedPage);
    if (s.status !== "LOGGED_IN") {
      await autoLoginIfNeeded(sharedPage);
      s = await computeSessionStatus(sharedPage);
    }

    // 1) Reset πριν από κάθε lookup
    await sharedPage.goto(PET_BOOKLET_BASE_URL, { waitUntil: "domcontentloaded" });
    await sharedPage.waitForTimeout(600);

    // 2) Run flow (new commercial contract)
    const flowResult = await runMicrochipLookupFlow(sharedPage, microchip);

    // 3) URL + snippets (only if DEBUG)
    const finalUrl = sharedPage.url();

    let textSnippet = null;
    let htmlSnippet = null;

    if (DEBUG) {
      const bodyText =
        (await sharedPage.textContent("body").catch(() => "")) || "";
      const html = await sharedPage.content().catch(() => "");
      textSnippet = bodyText.slice(0, 500);
      htmlSnippet = html ? html.slice(0, 2000) : null;
    }

    // 4) Optional fallback: αν ο flow δεν βρήκε pet, μπορείς να δοκιμάσεις ZK extract
    // Μόνο όταν θες να υποστηρίξεις “flow failed αλλά booklet ανοιχτό”.
    // Αν το contract του flow είναι σωστό, συνήθως ΔΕΝ χρειάζεται.
    let bookletData = flowResult?.pet ?? null;

    if (!bookletData && flowResult?.found === true) {
      // flow είπε “found”, αλλά δεν έφερε pet. Προσπάθεια fallback.
      try {
        await sharedPage.waitForFunction(
          (ids) => {
            if (!window.zk || !zk.Widget) return false;
            const hasChip = ids.chipDate && zk.Widget.$("$" + ids.chipDate);
            const hasName = ids.petName && zk.Widget.$("$" + ids.petName);
            return !!(hasChip || hasName);
          },
          BOOKLET_WIDGET_IDS,
          { timeout: 8000 }
        );
      } catch {
        // ignore
      }

      await sharedPage.waitForTimeout(600);
      bookletData = await extractBookletData(sharedPage);
    }

    return sendJson(200, {
      ok: flowResult?.ok === true,
      found: flowResult?.found === true,
      reason: flowResult?.reason || "UNKNOWN",
      microchip: flowResult?.microchip || microchip,
      url: finalUrl,
      bookletData,
      owner: flowResult?.owner ?? null,
      sterilization: flowResult?.sterilization ?? null,
      vaccination: flowResult?.vaccination ?? null,
      textSnippet,
      htmlSnippet,
    });
  } catch (error) {
    console.error("❌ Worker /lookup error:", error);
    return sendJson(500, {
      ok: false,
      error: "Failed to perform lookup in registry",
      details: DEBUG ? error?.message : undefined,
    });
  } finally {
    lookupInFlight = false;
  }
}


    // GET /medical-events?microchip=...
    if (req.method === "GET" && path === "/medical-events") {
      const sharedPage = getSharedPage();

      if (!sharedPage) return sendError(503, "Worker not ready (no active page)");
      if (lookupInFlight) return sendError(429, "Worker busy (lookup already in progress)");

      const microchip = (urlObj.searchParams.get("microchip") || "").trim();
      if (!microchip) return sendError(400, "Missing query param ?microchip=...");
      if (!/^\d+$/.test(microchip)) return sendError(400, "Invalid microchip: must be digits only");
      if (microchip.length !== 15) return sendError(400, "Invalid microchip: must be 15 digits");

      lookupInFlight = true;
      try {
        let s = await computeSessionStatus(sharedPage);
        if (s.status !== "LOGGED_IN") {
          await autoLoginIfNeeded(sharedPage);
          s = await computeSessionStatus(sharedPage);
        }

        await sharedPage.goto(PET_BOOKLET_BASE_URL, { waitUntil: "domcontentloaded" });
        await sharedPage.waitForTimeout(600);

        const flowResult = await runMedicalEventsFlow(sharedPage, microchip);

        return sendJson(200, {
          ok: flowResult?.ok === true,
          found: flowResult?.found === true,
          reason: flowResult?.reason || "UNKNOWN",
          microchip,
          data: flowResult?.data ?? {},
        });
      } catch (error) {
        console.error("❌ Worker /medical-events error:", error);
        return sendJson(500, {
          ok: false,
          error: "Failed to fetch medical events",
          details: DEBUG ? error?.message : undefined,
        });
      } finally {
        lookupInFlight = false;
      }
    }

    // GET /debug/html
    if (req.method === "GET" && path === "/debug/html") {
      const sharedPage = getSharedPage();
      if (!sharedPage) {
        return sendError(503, "Worker not ready (no active page)");
      }

      try {
        const html = await sharedPage.content();
        return sendJson(200, {
          ok: true,
          length: html.length,
          htmlSnippet: html.slice(0, 2000),
        });
      } catch {
        return sendError(500, "Failed to read page HTML");
      }
    }

    // GET /debug/widgets
    if (req.method === "GET" && path === "/debug/widgets") {
      const sharedPage = getSharedPage();
      if (!sharedPage) {
        return sendError(503, "Worker not ready (no active page)");
      }

      try {
        const info = await sharedPage.evaluate(() => {
          const result = { ok: false, widgets: [], note: "" };

          try {
            if (!window.zk || !zk.Widget) {
              result.note = "ZK or zk.Widget not available on page";
              return result;
            }

            let all = [];
            try {
              const rootWidgets = zk.Widget.$(document.body, null, { all: true });
              if (Array.isArray(rootWidgets)) all = rootWidgets;
              else if (rootWidgets) all = [rootWidgets];
            } catch (e) {
              result.note =
                "Error while calling zk.Widget.$(document.body,...): " + e.message;
              return result;
            }

            result.ok = true;
            result.widgets = all.slice(0, 100).map((w) => {
              let label = null;
              let value = null;

              try {
                if (typeof w.getLabel === "function") label = w.getLabel();
              } catch {}

              try {
                if (typeof w.getValue === "function") value = w.getValue();
              } catch {}

              return {
                id: w.id || null,
                uuid: w.uuid || null,
                className: w.className || null,
                label,
                value,
              };
            });

            return result;
          } catch (e) {
            result.note = "Unexpected error in debug widgets: " + e.message;
            return result;
          }
        });

        return sendJson(200, info);
      } catch (error) {
        console.error("❌ Worker /debug/widgets error:", error);
        return sendError(500, "Failed to evaluate widgets on page");
      }
    }

    return sendError(404, "Not found");
  });

  server.listen(PORT, "0.0.0.0", () => {
    console.log(`🌐 Registry worker HTTP server listening on port ${PORT}`);
    console.log("   Endpoints: GET /status, GET /session, GET /lookup, GET /debug/html, GET /debug/widgets");
  });

  return server;
}
