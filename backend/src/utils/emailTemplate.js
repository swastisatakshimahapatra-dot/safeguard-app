export const emergencyEmailTemplate = ({
  userName,
  location,
  latitude,
  longitude,
  mapsLink,
  time,
  alertType,
}) => {
  return `
<!DOCTYPE html>
<html>
<head>
  <meta charset="UTF-8">
  <meta name="viewport" content="width=device-width, initial-scale=1.0">
</head>
<body style="font-family: Arial, sans-serif; margin: 0; padding: 0; background: #f8f9fa;">

  <!-- Header -->
  <div style="background: linear-gradient(135deg, #1A1A2E 0%, #E91E8C 100%); padding: 30px 20px; text-align: center;">
    <div style="font-size: 50px; margin-bottom: 10px;">🛡️</div>
    <h1 style="color: white; margin: 0; font-size: 26px; font-weight: 800;">SafeGuard</h1>
    <p style="color: rgba(255,255,255,0.8); margin: 5px 0 0; font-size: 13px;">Emergency Alert System</p>
  </div>

  <!-- Alert Banner -->
  <div style="background: #dc3545; padding: 18px; text-align: center;">
    <p style="color: white; margin: 0; font-size: 22px; font-weight: 800; letter-spacing: 3px;">
      🆘 EMERGENCY ALERT
    </p>
    <p style="color: rgba(255,255,255,0.9); margin: 5px 0 0; font-size: 14px;">
      ${alertType || "Panic Button Activated"}
    </p>
  </div>

  <!-- Content -->
  <div style="max-width: 600px; margin: 0 auto; padding: 25px 15px;">

    <!-- Main Message -->
    <div style="background: white; border-radius: 16px; padding: 25px; margin-bottom: 20px; box-shadow: 0 2px 10px rgba(0,0,0,0.08); border-left: 5px solid #E91E8C;">
      <h2 style="color: #1A1A2E; margin: 0 0 12px; font-size: 20px;">
        ⚠️ ${userName} needs immediate help!
      </h2>
      <p style="color: #555; margin: 0; font-size: 15px; line-height: 1.6;">
        This is an automated emergency alert from <strong>SafeGuard</strong>.
        Please respond immediately or call emergency services.
      </p>
    </div>

    <!-- Location Card -->
    <div style="background: white; border-radius: 16px; padding: 25px; margin-bottom: 20px; box-shadow: 0 2px 10px rgba(0,0,0,0.08);">
      <h3 style="color: #1A1A2E; margin: 0 0 18px; font-size: 16px; border-bottom: 2px solid #f0f0f0; padding-bottom: 10px;">
        📍 Location Details
      </h3>

      <!-- Place Name -->
      <div style="background: #fff3f8; border-radius: 10px; padding: 15px; margin-bottom: 15px; border: 1px solid #ffd6e8;">
        <p style="color: #999; font-size: 11px; margin: 0 0 4px; text-transform: uppercase; letter-spacing: 1px;">
          📍 Place
        </p>
        <p style="color: #1A1A2E; font-size: 14px; font-weight: 600; margin: 0; line-height: 1.4;">
          ${location}
        </p>
      </div>

      <!-- Coordinates -->
      <div style="background: #f8f9fa; border-radius: 10px; padding: 15px; margin-bottom: 15px;">
        <p style="color: #999; font-size: 11px; margin: 0 0 8px; text-transform: uppercase; letter-spacing: 1px;">
          🎯 GPS Coordinates
        </p>
        <div style="display: flex; gap: 20px;">
          <div>
            <p style="color: #999; font-size: 11px; margin: 0 0 2px;">Latitude</p>
            <p style="color: #1A1A2E; font-weight: 700; font-family: monospace; font-size: 14px; margin: 0;">
              ${latitude ? latitude.toFixed(6) + "°" : "N/A"}
            </p>
          </div>
          <div style="border-left: 1px solid #ddd; padding-left: 20px;">
            <p style="color: #999; font-size: 11px; margin: 0 0 2px;">Longitude</p>
            <p style="color: #1A1A2E; font-weight: 700; font-family: monospace; font-size: 14px; margin: 0;">
              ${longitude ? longitude.toFixed(6) + "°" : "N/A"}
            </p>
          </div>
        </div>
      </div>

      <!-- Time -->
      <div style="background: #f8f9fa; border-radius: 10px; padding: 15px;">
        <p style="color: #999; font-size: 11px; margin: 0 0 4px; text-transform: uppercase; letter-spacing: 1px;">
          🕐 Alert Time
        </p>
        <p style="color: #1A1A2E; font-size: 14px; font-weight: 600; margin: 0;">
          ${time}
        </p>
      </div>
    </div>

    <!-- Action Buttons -->
    <div style="text-align: center; margin-bottom: 20px;">
      <a href="${mapsLink}"
        style="display: inline-block; background: linear-gradient(135deg, #E91E8C, #ff4b91); color: white; text-decoration: none; padding: 14px 30px; border-radius: 50px; font-weight: 700; font-size: 15px; margin: 6px; box-shadow: 0 4px 15px rgba(233,30,140,0.4);">
        📍 Open in Google Maps
      </a>
      <br>
      <a href="tel:112"
        style="display: inline-block; background: linear-gradient(135deg, #dc3545, #c82333); color: white; text-decoration: none; padding: 14px 30px; border-radius: 50px; font-weight: 700; font-size: 15px; margin: 6px; box-shadow: 0 4px 15px rgba(220,53,69,0.4);">
        📞 Call Emergency 112
      </a>
    </div>

    <!-- Warning -->
    <div style="background: #fff8e1; border: 1px solid #ffc107; border-radius: 12px; padding: 18px; margin-bottom: 20px;">
      <p style="color: #856404; margin: 0; font-size: 13px; font-weight: 600;">
        ⚠️ This is a REAL emergency alert from SafeGuard Safety System.
        Please respond immediately. If false alarm, contact ${userName} directly.
      </p>
    </div>

  </div>

  <!-- Footer -->
  <div style="background: #1A1A2E; padding: 25px; text-align: center;">
    <p style="color: rgba(255,255,255,0.5); margin: 0; font-size: 12px;">
      SafeGuard Emergency System — Protecting Women & Children 24/7
    </p>
    <p style="color: rgba(255,255,255,0.3); margin: 8px 0 0; font-size: 11px;">
      © 2024 SafeGuard. All rights reserved.
    </p>
  </div>

</body>
</html>
  `;
};
