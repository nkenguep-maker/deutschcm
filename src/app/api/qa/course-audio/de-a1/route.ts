import { existsSync } from "node:fs";
import { resolve } from "node:path";
import { NextResponse } from "next/server";
import { A1_V2_UNITS, MONDE_A1_V2_MANIFEST } from "@/content/monde-a1-v2";
import { buildA1V2NativeAudioInventory } from "@/content/monde-a1-v2/native-audio";

export const dynamic = "force-dynamic";

function csvCell(value: string | number | undefined) {
  const text = value === undefined ? "" : String(value);
  return `"${text.replace(/"/g, '""')}"`;
}

export async function GET(request: Request) {
  if (process.env.VERCEL_ENV === "production") {
    return NextResponse.json({ ok: false, error: "NOT_FOUND" }, { status: 404 });
  }

  const inventory = buildA1V2NativeAudioInventory();
  const repoRoot = process.cwd();
  const assets = inventory.map((asset) => {
    const relative = asset.publicPath.replace(/^\//, "");
    const present = existsSync(resolve(repoRoot, "public", relative));
    return { ...asset, present };
  });

  const missing = assets.filter((asset) => !asset.present);
  const present = assets.length - missing.length;
  const byKind = Object.fromEntries(
    ["dialogue", "exercise", "shadowing", "card", "mock-exam"].map((kind) => {
      const scoped = assets.filter((asset) => asset.kind === kind);
      return [
        kind,
        {
          required: scoped.length,
          present: scoped.filter((asset) => asset.present).length,
          missing: scoped.filter((asset) => !asset.present).length,
        },
      ];
    }),
  );
  const byUnit = Object.fromEntries(
    A1_V2_UNITS.map((unit) => {
      const scoped = assets.filter((asset) => asset.unitId === unit.id);
      return [
        unit.id,
        {
          required: scoped.length,
          present: scoped.filter((asset) => asset.present).length,
          missing: scoped.filter((asset) => !asset.present).length,
        },
      ];
    }),
  );

  const complete = inventory.length > 0 && missing.length === 0;
  const format = new URL(request.url).searchParams.get("format");

  if (format === "csv") {
    const rows = [
      ["ref", "kind", "unitId", "lessonId", "text", "publicPath", "present"],
      ...assets.map((asset) => [
        asset.ref,
        asset.kind,
        asset.unitId,
        asset.lessonId ?? "",
        asset.text,
        asset.publicPath,
        asset.present ? "yes" : "no",
      ]),
    ];
    const csv = rows.map((row) => row.map((cell) => csvCell(cell)).join(",")).join("\n");
    return new Response(csv, {
      status: 200,
      headers: {
        "content-type": "text/csv; charset=utf-8",
        "content-disposition": 'attachment; filename="yema-a1-native-audio-pack.csv"',
        "cache-control": "no-store",
      },
    });
  }

  return NextResponse.json({
    ok: true,
    source: "MONDE_A1_V2",
    courseId: MONDE_A1_V2_MANIFEST.courseId,
    manifestStatus: MONDE_A1_V2_MANIFEST.status,
    unitCount: A1_V2_UNITS.length,
    lessonCount: A1_V2_UNITS.reduce((sum, unit) => sum + unit.lessons.length, 0),
    nativeAudio: {
      complete,
      gateOpen: MONDE_A1_V2_MANIFEST.readiness.criticalNativeAudioReady,
      required: assets.length,
      present,
      missing: missing.length,
      byKind,
      byUnit,
      missingAssets: missing.map(({ ref, kind, unitId, lessonId, publicPath, text }) => ({
        ref,
        kind,
        unitId,
        lessonId,
        publicPath,
        text,
      })),
    },
  });
}
