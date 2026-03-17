export async function POST(req: Request) {
  try {
    const formData = await req.formData();

    const res = await fetch("http://65.0.182.39:8000/analyze", {
      method: "POST",
      body: formData,
      cache: "no-store",
    });

    let data;
    const contentType = res.headers.get("content-type");
    if (contentType && contentType.includes("application/json")) {
      data = await res.json();
    } else {
      data = { detail: await res.text() };
    }

    return new Response(JSON.stringify(data), {
      status: res.status,
      headers: { "Content-Type": "application/json" },
    });
  } catch (err: any) {
    return new Response(JSON.stringify({ detail: err.message || "Proxy failed" }), {
      status: 500,
      headers: { "Content-Type": "application/json" },
    });
  }
}
