import { expect, test as base } from "@playwright/test";

export const account = {
  fullName: "Alex Test",
  email: "alex@example.com",
  phone: "03001234567",
  _id: "user-1",
  mpinSet: true,
  onboardingCompleted: true,
  homeTourCompleted: true,
};

export const recipient = {
  fullName: "Sam Recipient",
  accountNumber: "PK00TEST000000000001",
};

export const test = base.extend({
  api: [
    async ({ page }, provide) => {
    let authenticated = false;
    const failures = {};

    await page.route("**/api/**", async (route) => {
      const request = route.request();
      const { pathname } = new URL(request.url());
      const body = request.postDataJSON?.() || {};
      const respond = (status, data) =>
        route.fulfill({
          status,
          contentType: "application/json",
          body: JSON.stringify(data),
        });

      if (pathname === "/api/user/me" && request.method() === "GET") {
        return respond(200, {
          success: true,
          user: authenticated ? account : null,
        });
      }

      if (pathname === "/api/user/register" && request.method() === "POST") {
        if (failures.registration) {
          return respond(409, { message: failures.registration });
        }
        return respond(201, { success: true, message: "Account created." });
      }

      if (pathname === "/api/user/login" && request.method() === "POST") {
        if (failures.login || body.mpin !== "1234") {
          return respond(401, {
            message: failures.login || "Invalid phone number or MPIN.",
          });
        }
        authenticated = true;
        return respond(200, {
          success: true,
          message: "Login successful.",
          user: account,
        });
      }

      if (pathname === "/api/user/logout" && request.method() === "POST") {
        if (failures.logout) {
          return respond(500, { message: failures.logout });
        }
        authenticated = false;
        return respond(200, { success: true, message: "Logged out." });
      }

      if (pathname === "/api/wallet/balance" && request.method() === "GET") {
        return respond(200, { success: true, wallet: { balance: 12500 } });
      }

      if (pathname === "/api/wallet/getwallet" && request.method() === "GET") {
        return respond(200, {
          success: true,
          wallet: {
            balance: 12500,
            accountNumber: "1234567890",
            iban: "PK00TEST000000000001",
          },
        });
      }

      if (
        pathname === "/api/transaction/transactions" &&
        request.method() === "GET"
      ) {
        return respond(200, { success: true, transactions: [] });
      }

      if (
        pathname === "/api/transaction/recipient/lookup" &&
        request.method() === "POST"
      ) {
        if (body.receiverAccount === "03111111111") {
          return respond(404, { message: "Recipient account was not found." });
        }
        return respond(200, { success: true, recipient });
      }

      if (
        pathname === "/api/transaction/send" &&
        request.method() === "POST"
      ) {
        if (failures.transfer) {
          return respond(400, { message: failures.transfer });
        }
        return respond(201, {
          success: true,
          transaction: { transactionId: "txn-1001" },
        });
      }

      if (
        pathname === "/api/transaction/receipt/txn-1001" &&
        request.method() === "GET"
      ) {
        return respond(200, {
          success: true,
          receipt: {
            receiptId: "receipt-1001",
            transactionId: "txn-1001",
            amount: 250,
            status: "Completed",
            sender: { name: account.fullName, phone: account.phone },
            receiver: { name: recipient.fullName },
            date: "2026-10-21T10:00:00.000Z",
            currency: "PKR",
            description: "Lunch",
          },
        });
      }

      return respond(501, { message: `No E2E mock for ${pathname}` });
    });

      await provide({
        authenticate() {
          authenticated = true;
        },
        setFailure(name, message) {
          failures[name] = message;
        },
      });
    },
    { auto: true },
  ],
  authenticatedPage: async ({ page, api }, provide) => {
    api.authenticate();
    await page.goto("/");
    await expect(page.getByTestId("dashboard")).toBeVisible();
    await provide(page);
  },
});

export { expect };
