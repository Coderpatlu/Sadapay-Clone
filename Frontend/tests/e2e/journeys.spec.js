import { account, expect, recipient, test } from "./fixtures.js";

test("signup creates an account and routes to login", async ({ page }) => {
  await page.goto("/register");

  await page.getByTestId("signup-full-name").fill(account.fullName);
  await page.getByTestId("signup-phone").fill(account.phone);
  await page.getByTestId("signup-email").fill(account.email);
  await page.getByTestId("signup-password").fill("secure-pass-123");
  await page.getByTestId("signup-submit").click();

  await expect(page).toHaveURL("/login");
  await expect(page.getByTestId("login-form")).toBeVisible();
});

test("signup validates an invalid mobile number", async ({ page }) => {
  await page.goto("/register");

  await page.getByTestId("signup-full-name").fill(account.fullName);
  await page.getByTestId("signup-phone").fill("123");
  await page.getByTestId("signup-email").fill(account.email);
  await page.getByTestId("signup-password").fill("secure-pass-123");
  await page.getByTestId("signup-submit").click();

  await expect(page.getByTestId("signup-error")).toHaveText(
    "Enter a valid Pakistani mobile number.",
  );
  await expect(page).toHaveURL("/register");
});

test("signup keeps the form and displays duplicate-account errors", async ({
  page,
  api,
}) => {
  api.setFailure("registration", "An account already exists.");
  await page.goto("/register");

  await page.getByTestId("signup-full-name").fill(account.fullName);
  await page.getByTestId("signup-phone").fill(account.phone);
  await page.getByTestId("signup-email").fill(account.email);
  await page.getByTestId("signup-password").fill("secure-pass-123");
  await page.getByTestId("signup-submit").click();

  await expect(page.getByTestId("signup-error")).toHaveText(
    "An account already exists.",
  );
  await expect(page.getByTestId("signup-form")).toBeVisible();
});

test("login shows invalid credentials, then opens the dashboard", async ({
  page,
}) => {
  await page.goto("/login");
  await page.getByTestId("login-phone").fill(account.phone);
  await page.getByTestId("login-mpin").fill("0000");
  await page.getByTestId("login-submit").click();
  await expect(page.getByTestId("login-error")).toHaveText(
    "Invalid phone number or MPIN.",
  );

  await page.getByTestId("login-mpin").fill("1234");
  await page.getByTestId("login-submit").click();
  await expect(page.getByTestId("dashboard")).toBeVisible();
  await expect(page.getByTestId("dashboard-balance")).toContainText("12,500");
});

test("dashboard balance and load-money details are available", async ({
  authenticatedPage: page,
}) => {
  await expect(page.getByTestId("dashboard-balance")).toContainText("12,500");
  await expect(page.getByRole("heading", { name: "Transactions History" })).toBeVisible();

  await page.getByTestId("dashboard-load-money").click();
  await expect(page.getByTestId("wallet-page")).toBeVisible();
  await expect(page.getByTestId("wallet-balance")).toBeVisible();
  await expect(page.getByTestId("wallet-active")).toContainText("Wallet active");
});

test("payment completes recipient lookup, authorization, and receipt", async ({
  authenticatedPage: page,
}) => {
  await page.getByTestId("dashboard-send-money").click();

  await page.getByTestId("send-recipient").fill(account.phone);
  await page.getByTestId("send-amount").fill("250");
  await page.getByTestId("send-description").fill("Lunch");
  await page.getByTestId("send-submit").click();

  await expect(page.getByTestId("transfer-review")).toBeVisible();
  await expect(page.getByTestId("transfer-review")).toContainText(
    recipient.fullName,
  );
  await expect(page.getByTestId("transfer-review")).toContainText("Lunch");
  await page.getByTestId("transfer-confirm").check();
  await page.getByTestId("transfer-mpin").fill("1234");
  await page.getByTestId("transfer-submit").click();

  await expect(page).toHaveURL("/receipt/txn-1001");
  await expect(page.getByTestId("receipt")).toBeVisible();
  await expect(page.getByTestId("receipt-id")).toHaveText("receipt-1001");
  await expect(page.getByTestId("receipt-status")).toHaveText("Completed");
});

test("payment handles unknown recipients and insufficient balance", async ({
  authenticatedPage: page,
  api,
}) => {
  api.setFailure("transfer", "Insufficient wallet balance.");
  await page.getByTestId("dashboard-send-money").click();
  await page.getByTestId("send-recipient").fill("03111111111");
  await page.getByTestId("send-amount").fill("250");
  await page.getByTestId("send-submit").click();
  await expect(page.getByTestId("send-error")).toHaveText(
    "Recipient account was not found.",
  );

  await page.getByTestId("send-recipient").fill(account.phone);
  await page.getByTestId("send-submit").click();
  await page.getByTestId("transfer-confirm").check();
  await page.getByTestId("transfer-mpin").fill("1234");
  await page.getByTestId("transfer-submit").click();
  await expect(page.getByTestId("transfer-error")).toHaveText(
    "Insufficient wallet balance.",
  );
  await expect(page).toHaveURL("/review");
});

test("logout ends the session and protects the dashboard", async ({
  authenticatedPage: page,
}) => {
  await page.getByTestId("logout-button").click();
  await expect(page.getByTestId("login-form")).toBeVisible();

  await page.goto("/");
  await expect(page.getByTestId("login-form")).toBeVisible();
});

test("logout failure keeps the signed-in session available", async ({
  authenticatedPage: page,
  api,
}) => {
  api.setFailure("logout", "Unable to log out. Try again.");
  await page.getByTestId("logout-button").click();
  await expect(page.getByText("Unable to log out. Try again.")).toBeVisible();
  await expect(page.getByTestId("dashboard")).toBeVisible();
});
