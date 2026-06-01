import { NextResponse } from "next/server";
import mongoose from "mongoose";

import { getCurrentUser } from "@/lib/session";
import { hasRole } from "@/lib/auth";
import { connectDB } from "@/lib/db";
import Ledger from "@/models/Ledger";

export async function GET(
  request: Request,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id } = await params;

    await connectDB();

    const ledger = await Ledger.findById(id).populate("group");

    if (!ledger) {
      return NextResponse.json(
        { error: "Ledger not found" },
        { status: 404 }
      );
    }

    return NextResponse.json({ ledger });
  } catch (error: any) {
    return NextResponse.json(
      { error: error.message },
      { status: 500 }
    );
  }
}

export async function PATCH(
  request: Request,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const current = await getCurrentUser();

    if (!current || !hasRole(current, "admin")) {
      return NextResponse.json(
        { error: "Unauthorized" },
        { status: 403 }
      );
    }

    const { id } = await params;

    const body = await request.json();

    await connectDB();

    const ledger = await Ledger.findById(id);

    if (!ledger) {
      return NextResponse.json(
        { error: "Ledger not found" },
        { status: 404 }
      );
    }

    if (body.name !== undefined) ledger.name = body.name;
    if (body.group !== undefined) ledger.group = body.group;
    if (body.openingBalance !== undefined)
      ledger.openingBalance = body.openingBalance;
    if (body.balanceType !== undefined)
      ledger.balanceType = body.balanceType;

    await ledger.save();

    return NextResponse.json({
      success: true,
      ledger,
    });
  } catch (error: any) {
    return NextResponse.json(
      { error: error.message },
      { status: 500 }
    );
  }
}

export async function DELETE(
  request: Request,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const current = await getCurrentUser();

    if (!current || !hasRole(current, "admin")) {
      return NextResponse.json(
        { error: "Unauthorized" },
        { status: 403 }
      );
    }

    const { id } = await params;

    await connectDB();

    console.log("DELETE ID:", id);

    if (!mongoose.Types.ObjectId.isValid(id)) {
      return NextResponse.json(
        { error: "Invalid ledger id" },
        { status: 400 }
      );
    }

    const deleted = await Ledger.findOneAndDelete({
      _id: new mongoose.Types.ObjectId(id),
    });

    console.log("DELETE RESULT:", deleted);

    if (!deleted) {
      return NextResponse.json(
        { error: "Ledger not found" },
        { status: 404 }
      );
    }

    return NextResponse.json({
      success: true,
      message: "Ledger deleted successfully",
      deletedId: id,
    });
  } catch (error: any) {
    console.error("DELETE ERROR:", error);

    return NextResponse.json(
      {
        error: error.message,
      },
      { status: 500 }
    );
  }
}