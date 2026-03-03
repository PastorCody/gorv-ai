/**
 * IoT Mock Service
 * In production, this would send MQTT/HTTP commands to Shelly/Tuya devices.
 * For MVP, it logs commands and updates the database.
 */

import { createServiceClient } from "@/lib/supabase/server";

export type IoTAction = "activate" | "deactivate";
export type DeviceType = "water" | "electric" | "both";

export async function sendIoTCommand(
  pedestalId: string,
  sessionId: string | null,
  action: IoTAction,
  deviceType: DeviceType = "both"
): Promise<{ success: boolean; message: string }> {
  const supabase = createServiceClient();

  // Log the command
  await supabase.from("gorv_iot_commands").insert({
    pedestal_id: pedestalId,
    session_id: sessionId,
    command: action,
    device_type: deviceType,
    status: "confirmed", // Mock: always succeeds
    response: {
      mock: true,
      timestamp: new Date().toISOString(),
      message: `[MOCK IoT] ${action} ${deviceType} for pedestal ${pedestalId}`,
    },
  });

  // Update pedestal status
  const isOn = action === "activate";
  const updates: Record<string, unknown> = {};

  if (deviceType === "water" || deviceType === "both") {
    updates.water_on = isOn;
  }
  if (deviceType === "electric" || deviceType === "both") {
    updates.electric_on = isOn;
  }

  // Update session utility states
  if (sessionId) {
    await supabase
      .from("gorv_sessions")
      .update(updates)
      .eq("id", sessionId);
  }

  // Update pedestal status
  await supabase
    .from("gorv_pedestals")
    .update({ status: isOn ? "occupied" : "available" })
    .eq("id", pedestalId);

  console.log(`[IoT ${action.toUpperCase()}] Pedestal ${pedestalId} - ${deviceType} - ${isOn ? "ON" : "OFF"}`);

  return {
    success: true,
    message: `[MOCK] ${action} ${deviceType} successful for pedestal ${pedestalId}`,
  };
}
