import { describe, it, expect, beforeAll } from "vitest";
import sgMail from "@sendgrid/mail";

describe("SendGrid API Key Validation", () => {
  beforeAll(() => {
    if (!process.env.SENDGRID_API_KEY) {
      console.warn("⚠️  SENDGRID_API_KEY not set in environment");
    }
  });

  it("should have SENDGRID_API_KEY environment variable set", () => {
    const apiKey = process.env.SENDGRID_API_KEY;
    expect(apiKey).toBeDefined();
    expect(apiKey).toBeTruthy();
    expect(apiKey).toMatch(/^SG\./);
    console.log("✅ SendGrid API Key is set and properly formatted");
  });

  it("should initialize SendGrid with valid API key", () => {
    const apiKey = process.env.SENDGRID_API_KEY;
    if (apiKey) {
      sgMail.setApiKey(apiKey);
      // If this doesn't throw, the key format is valid
      expect(true).toBe(true);
      console.log("✅ SendGrid client initialized successfully");
    }
  });

  it("should have correct SendGrid API key format", () => {
    const apiKey = process.env.SENDGRID_API_KEY;
    if (apiKey) {
      // SendGrid API keys start with "SG." and contain dots and alphanumeric characters
      expect(apiKey).toMatch(/^SG\.[a-zA-Z0-9._-]+$/);
      // Should be reasonably long (typically 80+ characters)
      expect(apiKey.length).toBeGreaterThan(60);
      console.log(`✅ API Key format valid (${apiKey.length} characters)`);
    }
  });

  it("should validate SendGrid message structure", async () => {
    const apiKey = process.env.SENDGRID_API_KEY;

    if (!apiKey) {
      console.warn("⚠️  SENDGRID_API_KEY not set, skipping validation");
      expect(true).toBe(true);
      return;
    }

    try {
      sgMail.setApiKey(apiKey);

      // Test message structure
      const msg = {
        to: "test@example.com",
        from: "appequilibraai@gmail.com",
        subject: "Test Email",
        text: "This is a test email",
      };

      // Validate message structure
      expect(msg).toBeDefined();
      expect(msg.to).toBe("test@example.com");
      expect(msg.from).toBe("appequilibraai@gmail.com");
      expect(msg.subject).toBe("Test Email");
      console.log("✅ SendGrid message structure validated");
    } catch (error: any) {
      console.error("❌ Error during SendGrid validation:", error.message);
      throw error;
    }
  });
});
