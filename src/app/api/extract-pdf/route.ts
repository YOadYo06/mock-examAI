import { NextRequest, NextResponse } from "next/server";
import { extractPdfInfoFromOcr } from "@/lib/gemini-api";

export async function POST(req: NextRequest) {
  try {
    const { ocrText } = await req.json();

    if (!ocrText) {
      return NextResponse.json(
        { error: "OCR text is required" },
        { status: 400 }
      );
    }

    const extractedInfo = await extractPdfInfoFromOcr(ocrText);

    return NextResponse.json({
      success: true,
      data: extractedInfo,
    });
  } catch (error) {
    console.error("Error extracting PDF info:", error);
    return NextResponse.json(
      { error: "Failed to extract information from PDF" },
      { status: 500 }
    );
  }
}
