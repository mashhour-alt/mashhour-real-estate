import {
  checkPassword,
  dbErrorMessage,
  isSetupNeeded,
  setPassword,
} from "@/lib/admin-auth";

export async function GET() {
  try {
    return Response.json({ setupNeeded: await isSetupNeeded(), ready: true });
  } catch (error) {
    return Response.json({ ready: false, error: dbErrorMessage(error) }, { status: 500 });
  }
}

export async function POST(request: Request) {
  try {
    const body = (await request.json()) as { password?: string; setup?: boolean };
    const password = (body.password || "").trim();

    if (password.length < 8) {
      return Response.json({ error: "Password must be at least 8 characters" }, { status: 400 });
    }

    if (body.setup) {
      // Only allowed while no password exists, so it cannot be used to take over.
      if (!(await isSetupNeeded())) {
        return Response.json({ error: "A password is already set" }, { status: 409 });
      }
      await setPassword(password);
      return Response.json({ ok: true, created: true });
    }

    if (!(await checkPassword(password))) {
      return Response.json({ error: "Wrong password" }, { status: 401 });
    }
    return Response.json({ ok: true });
  } catch (error) {
    return Response.json({ error: dbErrorMessage(error) }, { status: 500 });
  }
}
