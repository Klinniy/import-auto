import { execFile } from "child_process";
import { promisify } from "util";

const execFileAsync = promisify(execFile);

export async function GET(request: Request) {
  const { searchParams } = new URL(request.url);
  const url = searchParams.get("url");

  if (!url || !url.startsWith("https://7.tru.ru/imgs/")) {
    return new Response("Bad image url", { status: 400 });
  }

  try {
    const { stdout } = await execFileAsync(
      "curl",
      [
        "-L",
        "-s",
        "--max-time",
        "12",
        "-A",
        "Mozilla/5.0",
        "-e",
        "https://auc.mosaicauto.ru/",
        url,
      ],
      {
        encoding: "buffer",
        maxBuffer: 10 * 1024 * 1024,
      }
    );

    return new Response(stdout, {
      headers: {
        "Content-Type": "image/gif",
        "Cache-Control": "public, max-age=86400",
      },
    });
  } catch {
    return new Response("Image load error", { status: 500 });
  }
}
